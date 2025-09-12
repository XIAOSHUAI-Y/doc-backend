"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocroomGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const ws_1 = require("ws");
let DocroomGateway = class DocroomGateway {
    server;
    wss;
    docs = new Map();
    handleConnection(client, request) {
        console.log('Client connected:', client.id);
        console.log(request.url);
        const url = new URL(request.url, 'http://localhost');
    }
    handleDisconnect(client) {
        console.log('Client disconnected:', client.id);
    }
};
exports.DocroomGateway = DocroomGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_a = typeof ws_1.Server !== "undefined" && ws_1.Server) === "function" ? _a : Object)
], DocroomGateway.prototype, "server", void 0);
exports.DocroomGateway = DocroomGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({ path: 'doc-yjs/:docId', cors: true, transport: 'ws' })
], DocroomGateway);
//# sourceMappingURL=yjs-doc.gateway.js.map