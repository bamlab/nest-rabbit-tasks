import { Test, TestingModule } from '@nestjs/testing';
import { Type, Module, Injectable } from '@nestjs/common';

import { HaredoChain } from 'haredo';

import { NestRabbitTasksModule, RabbitWorkerInterface } from '../src';
import { NestRabbitWorkerToken } from '../src/nest-rabbit-worker.token';
import { ConnectionManager } from 'haredo/dist/connection-manager';

jest.mock('../src/nest-rabbit-tasks.rabbitClient', () => ({
  NestRabbitTasksRabbitClient: class NestRabbitTasksRabbitClient {
    public static async buildQueueConnection(): Promise<HaredoChain | null> {
      return new HaredoChain((jest.fn() as unknown) as ConnectionManager, {});
    }
  },
}));

describe('NestRabbitTasksModule', () => {
  let module: TestingModule;
  describe('register', () => {
    describe('single configuration', () => {
      class TestWorker {
        handleMessage = jest.fn();
      }

      beforeAll(async () => {
        module = await Test.createTestingModule({
          imports: [
            NestRabbitTasksModule.registerSync({
              reference: 'test-queue',
              entityType: 'queue',
              amqpOptions: { connectionUrl: 'amqp://localhost:5672' },
              globalOptions: {
                immutableInfrastructure: true,
                prefetchSize: 1,
              },
              entity: { queueName: 'worker.queue.1', queueOptions: {} },
              worker: (TestWorker as unknown) as Type<RabbitWorkerInterface<any>>,
            }),
          ],
        }).compile();
      });
      it('should inject the queue with the given name', () => {
        const queue: HaredoChain = module.get<HaredoChain>(NestRabbitWorkerToken.getTokenForQueueConnection('test-queue'));
        expect(queue).toBeDefined();
      });
    });
    describe('multiple configuration', () => {
      class TestWorker {
        handleMessage = jest.fn();
      }

      beforeAll(async () => {
        module = await Test.createTestingModule({
          imports: [
            NestRabbitTasksModule.registerSync([
              {
                reference: 'test-queue-1',
                entityType: 'queue',
                amqpOptions: { connectionUrl: 'amqp://localhost:5672' },
                globalOptions: {
                  immutableInfrastructure: true,
                  prefetchSize: 1,
                },
                entity: { queueName: 'worker.queue.1', queueOptions: {} },
                worker: (TestWorker as unknown) as Type<RabbitWorkerInterface<any>>,
              },
              {
                reference: 'test-queue-2',
                entityType: 'queue',
                amqpOptions: { connectionUrl: 'amqp://localhost:5672' },
                globalOptions: {
                  immutableInfrastructure: true,
                  prefetchSize: 1,
                },
                entity: { queueName: 'worker.queue.2', queueOptions: {} },
                worker: (TestWorker as unknown) as Type<RabbitWorkerInterface<any>>,
              },
            ]),
          ],
        }).compile();
      });
      it('should inject the queue with name "test-queue-1"', () => {
        const queue: HaredoChain = module.get<HaredoChain>(NestRabbitWorkerToken.getTokenForQueueConnection('test-queue-1'));
        expect(queue).toBeDefined();
      });
      it('should inject the queue with name "test-queue-1"', () => {
        const queue: HaredoChain = module.get<HaredoChain>(NestRabbitWorkerToken.getTokenForQueueConnection('test-queue-2'));
        expect(queue).toBeDefined();
      });
    });
  });
  describe('registerAsync', () => {
    describe('single configuration without Config Service', () => {
      describe('useFactory', () => {
        class TestWorker {
          handleMessage = jest.fn();
        }

        beforeAll(async () => {
          module = await Test.createTestingModule({
            imports: [
              NestRabbitTasksModule.registerAsync({
                reference: 'test-queue-1',
                entityType: 'queue',
                worker: TestWorker,
                useFactory: async () => {
                  const queueName = 'test.q1';
                  return {
                    entity: { queueName },
                    amqpOptions: { connectionUrl: 'amqp://localhost:5672' },
                    globalOptions: { immutableInfrastructure: true, prefetchSize: 1 },
                  };
                },
              }),
            ],
          }).compile();
        });
        it('should inject the queue with the given name', () => {
          const queue: HaredoChain = module.get<HaredoChain>(NestRabbitWorkerToken.getTokenForQueueConnection('test-queue-1'));
          expect(queue).toBeDefined();
        });
      });
    });
    describe('single configuration with Config Service', () => {
      describe('useFactory', () => {
        class TestWorker {
          handleMessage = jest.fn();
        }
        @Injectable()
        class ConfigService {
          getQueueName = jest.fn().mockReturnValue('worker.queue.2');
        }
        @Module({ providers: [ConfigService], exports: [ConfigService] })
        class ConfigModule {}

        beforeAll(async () => {
          module = await Test.createTestingModule({
            imports: [
              NestRabbitTasksModule.registerAsync({
                reference: 'test-queue-1',
                entityType: 'queue',
                worker: TestWorker,
                useFactory: async (configService: ConfigService) => {
                  const queueName = await configService.getQueueName();
                  return {
                    entity: { queueName },
                    amqpOptions: { connectionUrl: 'amqp://localhost:5672' },
                    globalOptions: { immutableInfrastructure: true, prefetchSize: 1 },
                  };
                },

                imports: [ConfigModule],
                inject: [ConfigService],
              }),
            ],
          }).compile();
        });
        it('should inject the queue with the given name', () => {
          const queue: HaredoChain = module.get<HaredoChain>(NestRabbitWorkerToken.getTokenForQueueConnection('test-queue-1'));
          expect(queue).toBeDefined();
        });
      });
    });
    describe('multiple configuration with Config Service', () => {
      describe('useFactory', () => {
        class TestWorker {
          handleMessage = jest.fn();
        }
        @Injectable()
        class ConfigService {
          getQueueName1 = jest.fn().mockReturnValue('worker.queue.1');
          getQueueName2 = jest.fn().mockReturnValue('worker.queue.1');
        }
        @Module({ providers: [ConfigService], exports: [ConfigService] })
        class ConfigModule {}

        beforeAll(async () => {
          module = await Test.createTestingModule({
            imports: [
              NestRabbitTasksModule.registerAsync([
                {
                  reference: 'test-queue-1',
                  entityType: 'queue',
                  worker: TestWorker,
                  useFactory: async (configService: ConfigService) => {
                    const queueName = await configService.getQueueName1();
                    return {
                      entity: { queueName },
                      amqpOptions: { connectionUrl: 'amqp://localhost:5672' },
                      globalOptions: { immutableInfrastructure: true, prefetchSize: 1 },
                    };
                  },

                  imports: [ConfigModule],
                  inject: [ConfigService],
                },
                {
                  reference: 'test-queue-2',
                  entityType: 'queue',
                  worker: TestWorker,
                  useFactory: async (configService: ConfigService) => {
                    const queueName = await configService.getQueueName2();
                    return {
                      entity: { queueName },
                      amqpOptions: { connectionUrl: 'amqp://localhost:5672' },
                      globalOptions: { immutableInfrastructure: true, prefetchSize: 1 },
                    };
                  },

                  imports: [ConfigModule],
                  inject: [ConfigService],
                },
              ]),
            ],
          }).compile();
        });
        it('should inject the queue with the given name', () => {
          const queue: HaredoChain = module.get<HaredoChain>(NestRabbitWorkerToken.getTokenForQueueConnection('test-queue-1'));
          expect(queue).toBeDefined();
        });
        it('should inject the queue with the given name', () => {
          const queue: HaredoChain = module.get<HaredoChain>(NestRabbitWorkerToken.getTokenForQueueConnection('test-queue-2'));
          expect(queue).toBeDefined();
        });
      });
    });
  });
});
