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

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // 允许跨域
  app.useWebSocketAdapter(new WsAdapter(app))
  await app.listen(3000); // 主服务端口 3000
}
bootstrap();