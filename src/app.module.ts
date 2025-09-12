// import { Module } from '@nestjs/common';
// import { DocYjsGateway } from './yjs-doc/yjs-doc.gateway';

// @Module({
//   imports: [],
//   controllers: [AppController],
//   providers: [AppService, DocYjsGateway],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { DocroomModule } from './yjs-doc/yjs-doc.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  controllers: [AppController],
  providers: [AppService],
  imports: [DocroomModule],
})
export class AppModule {}
