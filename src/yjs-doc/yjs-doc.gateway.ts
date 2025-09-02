// import { OnModuleInit } from '@nestjs/common';
// import {
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   SubscribeMessage,
//   WebSocketGateway,
// } from '@nestjs/websockets';

// @WebSocketGateway({
//   path: 'yjs-doc'
// })
// export class DocYjsGateway
//   implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
// {
//   handleConnection(client: any, ...args: any[]) {
//     throw new Error('Method not implemented.');
//   }
//   handleDisconnect(client: any) {
//     throw new Error('Method not implemented.');
//   }
//   onModuleInit() {

//   }
//   @SubscribeMessage('message')
//   handleMessage(client: any, payload: any): string {
//     return 'Hello world!';
//   }
// }

// src/docroom/docroom.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { createServer } from 'http';
import { WebSocketServer as WSServer, Websocket, Server } from 'ws';
import { Doc } from 'yjs';
import { v4 as uuidv4 } from 'uuid';

@WebSocketGateway({ path: 'doc-yjs/:docId', cors: true, transport: 'ws' })
export class DocroomGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private wss: WSServer; // Yjs WebSocket 服务器
  private docs = new Map<string, Doc>(); // 存储文档实例

  handleConnection(client: Websocket, request: Request) {
    console.log('Client connected:', client.id);
    console.log(request.url);
    const url = new URL(request.url, 'http://localhost');
    // const did = url.search
  }

  handleDisconnect(client: Websocket) {
    console.log('Client disconnected:', client.id);
  }
}
