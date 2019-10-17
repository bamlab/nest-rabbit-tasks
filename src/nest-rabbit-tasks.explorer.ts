import { ModulesContainer, ModuleRef, Reflector } from '@nestjs/core';
import { Injectable as InjectableDecorator, Logger } from '@nestjs/common';

import { Injectable } from '@nestjs/common/interfaces';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

import _ from 'lodash';
import { HaredoChain } from 'haredo';

import { NEST_RABBIT_TASKS_WORKER, WorkerDecoratorOptions } from './nest-rabbit-tasks.decorator';
import { NestRabbitWorkerToken } from './nest-rabbit-worker.token';

import { RabbitWorkerInterface } from './nest-rabbit-tasks.interfaces';

interface QueueConnectionAndWorkerBindParams {
  worker: RabbitWorkerInterface<any>;
  queueConnection: HaredoChain | null;
}

@InjectableDecorator()
export class NestRabbitTasksExplorer {
  public constructor(
    private readonly modulesContainer: ModulesContainer,
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector,
    private readonly logger: Logger
  ) {}
  public explore(): QueueConnectionAndWorkerBindParams[] {
    let allInstanceWrappers: InstanceWrapper<Injectable>[] = [];

    for (let [, container] of this.modulesContainer) {
      for (let module of container.providers.values()) {
        allInstanceWrappers.push(module);
      }
    }

    return _.filter(allInstanceWrappers, this.isRabbitWorker).map(
      ({ instance, metatype }: InstanceWrapper<RabbitWorkerInterface<any>>) => {
        const metadata = this.reflector.get<WorkerDecoratorOptions>(NEST_RABBIT_TASKS_WORKER, metatype);

        let queueConnectionReference = NestRabbitWorkerToken.getTokenForQueueConnection(metadata.reference);

        let queueConnection: HaredoChain | null = null;
        try {
          queueConnection = this.moduleRef.get<HaredoChain>(queueConnectionReference);
        } catch (err) {
          this.logger.error(
            `No QueueEntity was found with the given name (${queueConnectionReference}). Check your configuration.`
          );
        }
        return { worker: instance, queueConnection };
      }
    );
  }

  private isRabbitWorker = (instanceWrapper: InstanceWrapper): instanceWrapper is InstanceWrapper<RabbitWorkerInterface<any>> => {
    return instanceWrapper.metatype && !!this.reflector.get(NEST_RABBIT_TASKS_WORKER, instanceWrapper.metatype);
  };
}
