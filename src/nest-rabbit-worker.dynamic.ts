import { DynamicModule, Provider } from '@nestjs/common';
import _ from 'lodash';

import {
  NestRabbitTasksModuleSyncOptions,
  NestRabbitTasksModuleAsyncOptions,
  NestRabbitTasksQueueOptions,
} from './nest-rabbit-tasks.interfaces';
import { NestRabbitWorkerToken } from './nest-rabbit-worker.token';
import { NestRabbitTasksRabbitClient } from './nest-rabbit-tasks.rabbitClient';

type Dynamics = Omit<DynamicModule, 'module'>;

export class NestRabbitWorkerDynamic {
  public static getSyncDynamics(options: NestRabbitTasksModuleSyncOptions | NestRabbitTasksModuleSyncOptions[]): Dynamics {
    const normalizedOptions = _.flatten([options]);
    const rabbitQueueProviders = NestRabbitWorkerDynamic.createQueueConnectionProvider(normalizedOptions);
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
    console.log(normalizedOptions);
    return { imports: [], providers: [], exports: [] };
  }

  // TODO: inject logger
  private static otherProviders: Provider[] = [];

  private static createQueueConnectionProvider(normalizedOptions: NestRabbitTasksModuleSyncOptions[]): Provider[] {
    return _(normalizedOptions)
      .filter(option => option.entityType === 'queue')
      .map((filteredOption: NestRabbitTasksModuleSyncOptions) => ({
        provide: NestRabbitWorkerToken.getTokenForQueueConnection(filteredOption.reference),
        useFactory: (opt: NestRabbitTasksQueueOptions) => NestRabbitTasksRabbitClient.buildQueueConnection(opt),
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
