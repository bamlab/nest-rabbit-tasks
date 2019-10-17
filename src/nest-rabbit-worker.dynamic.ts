import { DynamicModule, Provider, Logger } from '@nestjs/common';
import _ from 'lodash';

import {
  NestRabbitTasksModuleSyncOptions,
  NestRabbitTasksModuleAsyncOptions,
  NestRabbitTasksQueueOptions,
} from './nest-rabbit-tasks.interfaces';
import { NestRabbitWorkerToken } from './nest-rabbit-worker.token';
import { NestRabbitTasksRabbitClient } from './nest-rabbit-tasks.rabbitClient';
import { NestRabbitTasksExplorer } from './nest-rabbit-tasks.explorer';

type Dynamics = Omit<DynamicModule, 'module'>;

const logger = new Logger('AMQPRabbitTaskModule');

export class NestRabbitWorkerDynamic {
  public static getSyncDynamics(options: NestRabbitTasksModuleSyncOptions | NestRabbitTasksModuleSyncOptions[]): Dynamics {
    const normalizedOptions = _.flatten([options]);
    const rabbitQueueProviders = NestRabbitWorkerDynamic.createQueueConnectionProvider(normalizedOptions, logger);
    return {
      providers: [
        ...rabbitQueueProviders,
        ...NestRabbitWorkerDynamic.createQueueConnectionOptionsSyncProvider(normalizedOptions),
        ...NestRabbitWorkerDynamic.otherProviders,
      ],
      exports: [...rabbitQueueProviders],
    };
  }

  public static getAsyncDynamics(options: NestRabbitTasksModuleAsyncOptions | NestRabbitTasksModuleAsyncOptions[]): Dynamics {
    const normalizedOptions = _.flatten([options]);
    console.log(normalizedOptions, logger);
    return { imports: [], providers: [], exports: [] };
  }

  private static otherProviders: Provider[] = [NestRabbitTasksExplorer, { provide: Logger, useValue: logger }];

  private static createQueueConnectionProvider(
    normalizedOptions: NestRabbitTasksModuleSyncOptions[],
    logger: Logger
  ): Provider[] {
    return _(normalizedOptions)
      .filter(option => option.entityType === 'queue')
      .map((filteredOption: NestRabbitTasksModuleSyncOptions) => ({
        provide: NestRabbitWorkerToken.getTokenForQueueConnection(filteredOption.reference),
        useFactory: (opt: NestRabbitTasksQueueOptions) => NestRabbitTasksRabbitClient.buildQueueConnection(opt, logger),
        inject: [NestRabbitWorkerToken.getTokenForQueueConnectionOptions(filteredOption.reference)],
      }))
      .value();
  }

  private static createQueueConnectionOptionsSyncProvider(normalizedOptions: NestRabbitTasksModuleSyncOptions[]): Provider[] {
    return _(normalizedOptions)
      .filter(option => option.entityType === 'queue')
      .map((filteredOption: NestRabbitTasksModuleSyncOptions) => ({
        provide: NestRabbitWorkerToken.getTokenForQueueConnectionOptions(filteredOption.reference),
        useValue: filteredOption,
      }))
      .value();
  }
}
