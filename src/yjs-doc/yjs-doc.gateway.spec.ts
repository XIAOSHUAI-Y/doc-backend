import { Test, TestingModule } from '@nestjs/testing';
import { YjsDocGateway } from './yjs-doc.gateway';

describe('YjsDocGateway', () => {
  let gateway: YjsDocGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [YjsDocGateway],
    }).compile();

    gateway = module.get<YjsDocGateway>(YjsDocGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
