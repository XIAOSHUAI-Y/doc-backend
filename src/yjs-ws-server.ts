import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import * as Y from 'yjs';
import * as syncProtocol from 'y-protocols/sync';
import * as awarenessProtocol from 'y-protocols/awareness';
import * as encoding from 'lib0/encoding';
import * as decoding from 'lib0/decoding';
import { saveUpdate, loadDocument } from './yjs-persistence';

const messageSync = 0;
const messageAwareness = 1;

interface DocRoom {
  doc: Y.Doc;
  conns: Set<WebSocket>;
  awareness: awarenessProtocol.Awareness;
  connClientIDs: Map<WebSocket, Set<number>>; // 每个 ws 连接对应的前端 clientID
}

const docs = new Map<string, DocRoom>();

async function getDocRoom(docId: string): Promise<DocRoom> {
  if (!docs.has(docId)) {
    const doc = new Y.Doc();
    const awareness = new awarenessProtocol.Awareness(doc);
    const room: DocRoom = { doc, conns: new Set(), awareness, connClientIDs: new Map() };
    docs.set(docId, room);

    // 从数据库加载历史 updates
    try {
      const count = await loadDocument(docId, doc);
      if (count > 0) {
        console.log(`[${docId}] 从数据库恢复了 ${count} 条 updates`);
      }
    } catch (err) {
      console.error(`[${docId}] 加载历史 updates 失败:`, err);
    }

    // 文档更新时广播给所有连接的客户端，并持久化
    doc.on('update', (update: Uint8Array, origin: any) => {
      // 持久化到数据库（所有更新都保存，包括来自 sync 协议的）
      saveUpdate(docId, update).catch((err) => {
        console.error(`[${docId}] 持久化 update 失败:`, err);
      });

      // 广播给所有连接的客户端（跳过来自 sync 协议的更新，因为 sync 协议已在回复中携带）
      if (origin !== 'server') {
        const encoder = encoding.createEncoder();
        encoding.writeVarUint(encoder, messageSync);
        syncProtocol.writeUpdate(encoder, update);
        const message = encoding.toUint8Array(encoder);
        room.conns.forEach((conn) => {
          if (conn.readyState === WebSocket.OPEN) {
            conn.send(message);
          }
        });
      }
    });

    // awareness 更新时广播
    awareness.on('update', (_changes: any, origin: any) => {
      if (origin === 'server') return;
      const changedClients = _changes.added.concat(_changes.updated).concat(_changes.removed);
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients));
      const message = encoding.toUint8Array(encoder);
      room.conns.forEach((conn) => {
        if (conn.readyState === WebSocket.OPEN) {
          conn.send(message);
        }
      });
    });
  }
  return docs.get(docId)!;
}

function sendSyncStep1(conn: WebSocket, doc: Y.Doc) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  conn.send(encoding.toUint8Array(encoder));
}

function sendSyncStep2(conn: WebSocket, doc: Y.Doc) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep2(encoder, doc);
  conn.send(encoding.toUint8Array(encoder));
}

export function createYjsWSServer(port: number) {
  const wss = new WebSocketServer({ port });

  wss.on('connection', async (conn: WebSocket, req: IncomingMessage) => {
    // 从 URL 提取 docId，如 /collab/my-doc-id
    const url = new URL(req.url || '/', 'http://localhost');
    const docId = url.pathname.replace('/collab/', '').replace('/collab', '') || 'default';

    const room = await getDocRoom(docId);
    room.conns.add(conn);

    // 发送 sync step 1 给客户端（服务端先发起）
    sendSyncStep1(conn, room.doc);

    conn.on('message', (message: Buffer) => {
      try {
        const decoder = decoding.createDecoder(new Uint8Array(message));
        const messageType = decoding.readVarUint(decoder);

        if (messageType === messageSync) {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          const syncMessageType = syncProtocol.readSyncMessage(
            decoder,
            encoder,
            room.doc,
            'server'
          );

          // 如果收到 sync step 1，回复 sync step 2 + sync step 1
          if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
            syncProtocol.writeSyncStep1(encoder, room.doc);
          }

          const reply = encoding.toUint8Array(encoder);
          if (reply.length > 1) {
            conn.send(reply);
          }

          // 收到 sync step 2 后，广播 awareness 状态给新客户端
          if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
            const awarenessEncoder = encoding.createEncoder();
            encoding.writeVarUint(awarenessEncoder, messageAwareness);
            encoding.writeVarUint8Array(
              awarenessEncoder,
              awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(room.awareness.getStates().keys()))
            );
            conn.send(encoding.toUint8Array(awarenessEncoder));
          }
        } else if (messageType === messageAwareness) {
          const awarenessUpdate = decoding.readVarUint8Array(decoder);

          // 解析 awareness update 提取 clientID，建立 ws -> clientID 映射
          try {
            const awarenessDecoder = decoding.createDecoder(awarenessUpdate);
            const len = decoding.readVarUint(awarenessDecoder);
            for (let i = 0; i < len; i++) {
              const clientID = decoding.readVarUint(awarenessDecoder);
              // 跳过状态数据（JSON 字符串）
              decoding.readVarUint8Array(awarenessDecoder);
              if (!room.connClientIDs.has(conn)) {
                room.connClientIDs.set(conn, new Set());
              }
              room.connClientIDs.get(conn)!.add(clientID);
            }
          } catch (_) {
            // 解析失败不影响正常处理
          }

          awarenessProtocol.applyAwarenessUpdate(
            room.awareness,
            awarenessUpdate,
            conn
          );
        }
      } catch (err) {
        console.error('处理 Yjs WebSocket 消息出错:', err);
      }
    });

    conn.on('close', () => {
      room.conns.delete(conn);

      // 移除该连接对应的所有 awareness 状态
      const clientIDs = room.connClientIDs.get(conn);
      if (clientIDs && clientIDs.size > 0) {
        awarenessProtocol.removeAwarenessStates(room.awareness, Array.from(clientIDs), conn);
      }
      room.connClientIDs.delete(conn);

      // 清理空房间
      if (room.conns.size === 0) {
        room.awareness.destroy();
        room.doc.destroy();
        docs.delete(docId);
      }
    });

    conn.on('error', (err) => {
      console.error('Yjs WebSocket 连接错误:', err);
    });
  });

  console.log(`Yjs WebSocket 服务器已启动: ws://localhost:${port}/collab`);
  return wss;
}
