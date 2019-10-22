import { Test, TestingModule } from '@nestjs/testing';
import { Type, Logger } from '@nestjs/common';

import { HaredoChain } from 'haredo';
import { ConnectionManager } from 'haredo/dist/connection-manager';

import { NestRabbitTasksModule, RabbitWorkerInterface, RabbitTasksWorker } from '../src';
import { NestRabbitTasksQueueOptions } from '../src/nest-rabbit-tasks.interfaces';

const subscribeMock = jest.fn().mockReturnValue(Promise.resolve(true));

jest.mock('../src/nest-rabbit-tasks.rabbitClient', () => ({
  NestRabbitTasksRabbitClient: class NestRabbitTasksRabbitClient {
    public static async buildQueueConnection(option: NestRabbitTasksQueueOptions): Promise<HaredoChain | null> {
      // @ts-ignore
      const chain = new HaredoChain((jest.fn() as unknown) as ConnectionManager, { queue: { name: option.entity.queueName } });
      chain.subscribe = subscribeMock;
      return chain;
    }
  },
}));

class TestLogger extends Logger {
  public static logDebugFn = jest.fn();
  public debug = TestLogger.logDebugFn;

  public static logLogFn = jest.fn();
  public log = TestLogger.logLogFn;

  public static logErrorFn = jest.fn();
  public error = TestLogger.logErrorFn;

  public static logWarnFn = jest.fn();
  public warn = TestLogger.logWarnFn;

  public static logVerboseFn = jest.fn();
  public verbose = TestLogger.logVerboseFn;
}

describe('NestRabbitTasksModule', () => {
  let module: TestingModule;
  describe('explore with there is a matching queue', () => {
    @RabbitTasksWorker({ reference: 'test-queue' })
    class TestWorker {
      public static handleMessageFn = jest.fn();
      public handleMessage = TestWorker.handleMessageFn;
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
        providers: [TestWorker],
      }).compile();
      module.useLogger(new TestLogger());
      module.init();
    });
    it('should find the corresponding worker', async () => {
      expect(subscribeMock).toBeCalledWith(TestWorker.handleMessageFn);

      expect(TestLogger.logErrorFn).not.toBeCalled();
    });
  });

  describe("explore with there isn't a matching queue", () => {
    @RabbitTasksWorker({ reference: 'test-queue' })
    class TestWorker {
      public static handleMessageFn = jest.fn();
      public handleMessage = TestWorker.handleMessageFn;
    }

    beforeAll(async () => {
      subscribeMock.mockReset();

      module = await Test.createTestingModule({
        imports: [
          NestRabbitTasksModule.registerSync({
            reference: 'not-test-queue',
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
        providers: [TestWorker],
      }).compile();
      module.useLogger(new TestLogger());
      module.init();
    });
    it('should find the corresponding worker', async () => {
      expect(subscribeMock).not.toBeCalledWith(TestWorker.handleMessageFn);

      expect(TestLogger.logErrorFn).toBeCalledWith(
        'No QueueEntity was found with the given name (NestRabbitWorkerQueueTest-queue). Check your configuration.',
        '',
        'AMQPRabbitTaskModule'
      );
    });
  });
});
