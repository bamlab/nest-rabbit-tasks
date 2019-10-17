import { OnModuleInit, Module as ModuleDecorator, DynamicModule, Logger } from '@nestjs/common';
import { ModuleRef, ModulesContainer, Reflector } from '@nestjs/core';
import { Injectable } from '@nestjs/common/interfaces';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { MetadataScanner } from '@nestjs/core/metadata-scanner';

import { HaredoChain, MessageCallback, setLoggers } from 'haredo';
import _ from 'lodash';

import {
  NestRabbitTasksModuleSyncOptions,
  NestRabbitTasksModuleAsyncOptions,
  RabbitWorkerInterface,
} from './nest-rabbit-tasks.interfaces';
import { NestRabbitWorkerDynamic } from './nest-rabbit-worker.dynamic';

import { NEST_RABBIT_TASKS_WORKER, WorkerDecoratorOptions } from './nest-rabbit-tasks.decorator';
import { NestRabbitWorkerToken } from './nest-rabbit-worker.token';

const logger = new Logger('AMQPRabbitTaskModule');

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

  public constructor(
    readonly modulesContainer: ModulesContainer,
    readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector
  ) {}

  public onModuleInit() {
    setLoggers({ error: logger.error.bind(logger), info: logger.log.bind(logger), debug: logger.debug.bind(logger) });
    this.scanAndBindRabbitTasksWorkerToQueueConnection();
  }

  private scanAndBindRabbitTasksWorkerToQueueConnection() {
    let allInstanceWrappers: InstanceWrapper<Injectable>[] = [];

    for (let [, container] of this.modulesContainer) {
      for (let module of container.providers.values()) {
        allInstanceWrappers.push(module);
      }
    }
    _(allInstanceWrappers)
      .filter(
        instanceWrapper => instanceWrapper.metatype && !!this.reflector.get(NEST_RABBIT_TASKS_WORKER, instanceWrapper.metatype)
      )
      .map(({ instance, metatype }: InstanceWrapper<RabbitWorkerInterface<any>>) => {
        const metadata = this.reflector.get<WorkerDecoratorOptions>(NEST_RABBIT_TASKS_WORKER, metatype);

        let queueConnectionReference = NestRabbitWorkerToken.getTokenForQueueConnection(metadata.reference);

        let queueConnection: HaredoChain;
        try {
          queueConnection = this.moduleRef.get<HaredoChain>(queueConnectionReference);
        } catch (err) {
          logger.error(`No QueueEntity was found with the given name (${queueConnectionReference}). Check your configuration.`);
          throw err;
        }
        return { worker: instance, queueConnection };
      })
      .map(({ worker, queueConnection }: { worker: RabbitWorkerInterface<any>; queueConnection: HaredoChain }) => {
        return new MetadataScanner().scanFromPrototype(worker, Object.getPrototypeOf(worker), name => {
          if (name === 'handleMessage') {
            queueConnection.subscribe(worker.handleMessage as MessageCallback<any>).catch((err: Error) => {
              logger.error(err.message, err.stack);
            });
          }
          Promise.resolve(true);
        });
      })
      .value();
  }
}
