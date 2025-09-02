// import { Module } from '@nestjs/common';

// import { DocYjsGateway } from './yjs-doc.gateway';

// @Module({
//   imports: [],
//   providers: [DocYjsGateway],
//   exports: [],
// })
// export class DocYjsModule {}

// src/docroom/docroom.module.ts
import { Module } from '@nestjs/common';
import { DocroomGateway } from './yjs-doc.gateway';

@Module({
  providers: [DocroomGateway]
})
export class DocroomModule {}
