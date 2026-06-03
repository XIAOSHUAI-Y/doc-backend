// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { WsAdapter } from '@nestjs/platform-ws';

// async function bootstrap() {
//   const app = await NestFactory.create(AppModule);
//   app.useWebSocketAdapter(new WsAdapter(app))
//   await app.listen(process.env.PORT ?? 3000);
// }
// bootstrap();

// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { createYjsWSServer } from './yjs-ws-server';
import { disconnectPrisma } from './yjs-persistence';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // 允许跨域
  app.useWebSocketAdapter(new WsAdapter(app))
  await app.listen(3000); // 主服务端口 3000

  // 启动 Yjs WebSocket 服务器（端口 3001）
  createYjsWSServer(3001);

  // 优雅关闭：断开 Prisma 连接
  process.on('SIGINT', async () => {
    console.log('正在关闭服务...');
    await disconnectPrisma();
    process.exit(0);
  });
}
bootstrap();