"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const platform_ws_1 = require("@nestjs/platform-ws");
const yjs_ws_server_1 = require("./yjs-ws-server");
const yjs_persistence_1 = require("./yjs-persistence");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors();
    app.useWebSocketAdapter(new platform_ws_1.WsAdapter(app));
    await app.listen(3000);
    (0, yjs_ws_server_1.createYjsWSServer)(3001);
    process.on('SIGINT', async () => {
        console.log('正在关闭服务...');
        await (0, yjs_persistence_1.disconnectPrisma)();
        process.exit(0);
    });
}
bootstrap();
//# sourceMappingURL=main.js.map