import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Websocket, Server } from 'ws';
export declare class DocroomGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private wss;
    private docs;
    handleConnection(client: Websocket, request: Request): void;
    handleDisconnect(client: Websocket): void;
}
