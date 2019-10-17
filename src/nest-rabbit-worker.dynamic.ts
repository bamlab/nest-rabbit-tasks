import { DynamicModule, Provider, Logger } from '@nestjs/common';
import _ from 'lodash';

import {
  NestRabbitTasksModuleSyncOptions,
  NestRabbitTasksModuleAsyncOptions,
  NestRabbitTasksQueueOptions,
  NestRabbitTasksModuleAsyncQueueOptions,
} from './nest-rabbit-tasks.interfaces';
import { NestRabbitWorkerToken } from './nest-rabbit-worker.token';
import { NestRabbitTasksRabbitClient } from './nest-rabbit-tasks.rabbitClient';
import { NestRabbitTasksExplorer } from './nest-rabbit-tasks.explorer';

type Dynamics = Omit<DynamicModule, 'module'>;

const logger = new Logger('AMQPRabbitTaskModule');

export class NestRabbitWorkerDynamic {
  public static getSyncDynamics(options: NestRabbitTasksModuleSyncOptions | NestRabbitTasksModuleSyncOptions[]): Dynamics {
    const normalizedOptions = _.flatten([options]);
    const rabbitQueueProviders = NestRabbitWorkerDynamic.createQueueConnectionSyncProvider(normalizedOptions, logger);
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
    const rabbitQueueProviders = NestRabbitWorkerDynamic.createQueueConnectionAsyncProvider(normalizedOptions, logger);
    return {
      imports:
        normalizedOptions
          .map(option => option.imports || [])
          .reduce((acc, i) => {
            return acc.concat(i || []);
          }, [])
          .filter((v, i, a) => a.indexOf(v) === i) || [],
      providers: [
        ...rabbitQueueProviders,
        ...NestRabbitWorkerDynamic.createQueueConnectionOptionsAsyncProvider(normalizedOptions),
        ...NestRabbitWorkerDynamic.otherProviders,
      ],
      exports: [...rabbitQueueProviders],
    };
  }

  private static otherProviders: Provider[] = [NestRabbitTasksExplorer, { provide: Logger, useValue: logger }];

  private static createQueueConnectionSyncProvider(
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

  private static createQueueConnectionAsyncProvider(
    normalizedOptions: NestRabbitTasksModuleAsyncOptions[],
    logger: Logger
  ): Provider[] {
    return _(normalizedOptions)
      .filter(option => option.entityType === 'queue')
      .map(filteredOption => {
        return {
          provide: NestRabbitWorkerToken.getTokenForQueueConnection(filteredOption.reference),
          useFactory: (opt: NestRabbitTasksQueueOptions) =>
            NestRabbitTasksRabbitClient.buildQueueConnection(
              { reference: filteredOption.reference, entityType: 'queue', ...opt },
              logger
            ),
          inject: [NestRabbitWorkerToken.getTokenForQueueConnectionOptions(filteredOption.reference)],
        };
      })
      .value();
  }

  private static createQueueConnectionOptionsSyncProvider(normalizedOptions: NestRabbitTasksModuleSyncOptions[]): Provider[] {
    return _(normalizedOptions)
      .filter(option => option.entityType === 'queue')
      .map((filteredOption: NestRabbitTasksModuleSyncOptions) => ({
        provide: NestRabbitWorkerToken.getTokenForQueueConnectionOptions(filteredOption.reference),
        useValue: filteredOption as NestRabbitTasksQueueOptions,
      }))
      .value();
  }

  private static createQueueConnectionOptionsAsyncProvider(normalizedOptions: NestRabbitTasksModuleAsyncOptions[]): Provider[] {
    return _(normalizedOptions)
      .filter((option): option is NestRabbitTasksModuleAsyncQueueOptions => option.entityType === 'queue')
      .map(filteredOption => {
        const additionalInjects = filteredOption.inject || [];
        return {
          provide: NestRabbitWorkerToken.getTokenForQueueConnectionOptions(filteredOption.reference),
          useFactory: async (...args: any[]): Promise<NestRabbitTasksQueueOptions> => {
            console.log(args);
            const partialDynamicOptions = await filteredOption.useFactory(...args);
            return {
              reference: filteredOption.reference,
              entityType: 'queue',
              worker: filteredOption.worker,
              ...partialDynamicOptions,
            };
          },
          inject: [...additionalInjects],
        };
      })
      .value();
  }
}
