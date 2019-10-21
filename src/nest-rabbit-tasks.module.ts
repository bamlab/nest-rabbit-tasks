import { OnModuleInit, Module as ModuleDecorator, DynamicModule, Logger } from '@nestjs/common';

import { HaredoChain, MessageCallback, setLoggers } from 'haredo';
import _ from 'lodash';

import {
  NestRabbitTasksModuleSyncOptions,
  NestRabbitTasksModuleAsyncOptions,
  RabbitWorkerInterface,
} from './nest-rabbit-tasks.interfaces';
import { NestRabbitWorkerDynamic } from './nest-rabbit-worker.dynamic';
import { NestRabbitTasksExplorer } from './nest-rabbit-tasks.explorer';

interface QueueConnectionAndWorkerBindParams {
  worker: RabbitWorkerInterface<any>;
  queueConnection: HaredoChain | null;
}

@ModuleDecorator({})
export class NestRabbitTasksModule implements OnModuleInit {
  public static registerSync(options: NestRabbitTasksModuleSyncOptions | NestRabbitTasksModuleSyncOptions[]): DynamicModule {
    return {
      module: NestRabbitTasksModule,
      ...NestRabbitWorkerDynamic.getSyncDynamics(options),
    };
  }

  public static registerAsync(options: NestRabbitTasksModuleAsyncOptions | NestRabbitTasksModuleAsyncOptions[]): DynamicModule {
    return {
      module: NestRabbitTasksModule,
      ...NestRabbitWorkerDynamic.getAsyncDynamics(options),
    };
  }

  public constructor(private readonly explorer: NestRabbitTasksExplorer, private readonly logger: Logger) {}

  public onModuleInit() {
    setLoggers({
      error: this.logger.error.bind(this.logger),
      info: this.logger.log.bind(this.logger),
      debug: this.logger.debug.bind(this.logger),
    });
    this.bindMessageFromQueueToMessageHandlerInWorker();
  }

  private bindMessageFromQueueToMessageHandlerInWorker() {
    this.explorer.explore().forEach(({ worker, queueConnection }: QueueConnectionAndWorkerBindParams) => {
      if (!queueConnection) {
        // The error was already reported earlier
        return;
      }
      if (!worker.handleMessage) {
        this.logger.error(`The worker (${worker.constructor.name}) have no "handleMessage" function.`);
        return;
      }
      queueConnection
        .subscribe(worker.handleMessage as MessageCallback<any>)
        .then(() => {
          const queueName = queueConnection.state.queue!.name;
          const workerName = worker.constructor.name;
          const msg = `Successfully listening on ${workerName}.handleMessage for ${queueName}`;
          this.logger.log(msg);
        })
        .catch((err: Error) => {
          this.logger.error(err.message, err.stack);
        });
    });
  }
}
