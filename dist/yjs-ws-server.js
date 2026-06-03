"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createYjsWSServer = createYjsWSServer;
const ws_1 = require("ws");
const Y = __importStar(require("yjs"));
const syncProtocol = __importStar(require("y-protocols/sync"));
const awarenessProtocol = __importStar(require("y-protocols/awareness"));
const encoding = __importStar(require("lib0/encoding"));
const decoding = __importStar(require("lib0/decoding"));
const yjs_persistence_1 = require("./yjs-persistence");
const messageSync = 0;
const messageAwareness = 1;
const docs = new Map();
async function getDocRoom(docId) {
    if (!docs.has(docId)) {
        const doc = new Y.Doc();
        const awareness = new awarenessProtocol.Awareness(doc);
        const room = { doc, conns: new Set(), awareness, connClientIDs: new Map() };
        docs.set(docId, room);
        try {
            const count = await (0, yjs_persistence_1.loadDocument)(docId, doc);
            if (count > 0) {
                console.log(`[${docId}] 从数据库恢复了 ${count} 条 updates`);
            }
        }
        catch (err) {
            console.error(`[${docId}] 加载历史 updates 失败:`, err);
        }
        doc.on('update', (update, origin) => {
            (0, yjs_persistence_1.saveUpdate)(docId, update).catch((err) => {
                console.error(`[${docId}] 持久化 update 失败:`, err);
            });
            if (origin !== 'server') {
                const encoder = encoding.createEncoder();
                encoding.writeVarUint(encoder, messageSync);
                syncProtocol.writeUpdate(encoder, update);
                const message = encoding.toUint8Array(encoder);
                room.conns.forEach((conn) => {
                    if (conn.readyState === ws_1.WebSocket.OPEN) {
                        conn.send(message);
                    }
                });
            }
        });
        awareness.on('update', (_changes, origin) => {
            if (origin === 'server')
                return;
            const changedClients = _changes.added.concat(_changes.updated).concat(_changes.removed);
            const encoder = encoding.createEncoder();
            encoding.writeVarUint(encoder, messageAwareness);
            encoding.writeVarUint8Array(encoder, awarenessProtocol.encodeAwarenessUpdate(awareness, changedClients));
            const message = encoding.toUint8Array(encoder);
            room.conns.forEach((conn) => {
                if (conn.readyState === ws_1.WebSocket.OPEN) {
                    conn.send(message);
                }
            });
        });
    }
    return docs.get(docId);
}
function sendSyncStep1(conn, doc) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep1(encoder, doc);
    conn.send(encoding.toUint8Array(encoder));
}
function sendSyncStep2(conn, doc) {
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageSync);
    syncProtocol.writeSyncStep2(encoder, doc);
    conn.send(encoding.toUint8Array(encoder));
}
function createYjsWSServer(port) {
    const wss = new ws_1.WebSocketServer({ port });
    wss.on('connection', async (conn, req) => {
        const url = new URL(req.url || '/', 'http://localhost');
        const docId = url.pathname.replace('/collab/', '').replace('/collab', '') || 'default';
        const room = await getDocRoom(docId);
        room.conns.add(conn);
        sendSyncStep1(conn, room.doc);
        conn.on('message', (message) => {
            try {
                const decoder = decoding.createDecoder(new Uint8Array(message));
                const messageType = decoding.readVarUint(decoder);
                if (messageType === messageSync) {
                    const encoder = encoding.createEncoder();
                    encoding.writeVarUint(encoder, messageSync);
                    const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, room.doc, 'server');
                    if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
                        syncProtocol.writeSyncStep1(encoder, room.doc);
                    }
                    const reply = encoding.toUint8Array(encoder);
                    if (reply.length > 1) {
                        conn.send(reply);
                    }
                    if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
                        const awarenessEncoder = encoding.createEncoder();
                        encoding.writeVarUint(awarenessEncoder, messageAwareness);
                        encoding.writeVarUint8Array(awarenessEncoder, awarenessProtocol.encodeAwarenessUpdate(room.awareness, Array.from(room.awareness.getStates().keys())));
                        conn.send(encoding.toUint8Array(awarenessEncoder));
                    }
                }
                else if (messageType === messageAwareness) {
                    const awarenessUpdate = decoding.readVarUint8Array(decoder);
                    try {
                        const awarenessDecoder = decoding.createDecoder(awarenessUpdate);
                        const len = decoding.readVarUint(awarenessDecoder);
                        for (let i = 0; i < len; i++) {
                            const clientID = decoding.readVarUint(awarenessDecoder);
                            decoding.readVarUint8Array(awarenessDecoder);
                            if (!room.connClientIDs.has(conn)) {
                                room.connClientIDs.set(conn, new Set());
                            }
                            room.connClientIDs.get(conn).add(clientID);
                        }
                    }
                    catch (_) {
                    }
                    awarenessProtocol.applyAwarenessUpdate(room.awareness, awarenessUpdate, conn);
                }
            }
            catch (err) {
                console.error('处理 Yjs WebSocket 消息出错:', err);
            }
        });
        conn.on('close', () => {
            room.conns.delete(conn);
            const clientIDs = room.connClientIDs.get(conn);
            if (clientIDs && clientIDs.size > 0) {
                awarenessProtocol.removeAwarenessStates(room.awareness, Array.from(clientIDs), conn);
            }
            room.connClientIDs.delete(conn);
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
//# sourceMappingURL=yjs-ws-server.js.map