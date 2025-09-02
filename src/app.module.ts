// import { Module } from '@nestjs/common';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { DocYjsGateway } from './yjs-doc/yjs-doc.gateway';

// @Module({
//   imports: [],
//   controllers: [AppController],
//   providers: [AppService, DocYjsGateway],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { DocroomModule } from './yjs-doc/yjs-doc.module';

@Module({
  imports: [DocroomModule],
})
export class AppModule {}