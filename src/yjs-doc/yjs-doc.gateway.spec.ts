import { Test, TestingModule } from '@nestjs/testing';
import { DocroomGateway } from './yjs-doc.gateway';

describe('DocroomGateway', () => {
  let gateway: DocroomGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DocroomGateway],
    }).compile();

    gateway = module.get<DocroomGateway>(DocroomGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
