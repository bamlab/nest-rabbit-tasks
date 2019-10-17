import { OnModuleInit, Module as ModuleDecorator, DynamicModule } from '@nestjs/common';
import { ModuleRef, ModulesContainer } from '@nestjs/core';
// import { MetadataScanner } from '@nestjs/core/metadata-scanner';
// import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';

// import { HaredoChain, MessageCallback } from 'haredo';
import _ from 'lodash';

import { NestRabbitTasksModuleSyncOptions, NestRabbitTasksModuleAsyncOptions } from './nest-rabbit-tasks.interfaces';
import { NestRabbitWorkerDynamic } from './nest-rabbit-worker.dynamic';
import { Module } from '@nestjs/core/injector/module';
import { Injectable, Provider } from '@nestjs/common/interfaces';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
// import { NEST_RABBIT_TASKS_WORKER, WorkerDecoratorOptions } from './nest-rabbit-tasks.decorator';
// import { NestRabbitWorkerToken } from './nest-rabbit-worker.token';

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
    readonly moduleRef: ModuleRef // private readonly reflector: Reflector
  ) {}

  public onModuleInit() {
    this.scanAndBindRabbitTasksWorkerToQueueConnection();
  }

  private scanAndBindRabbitTasksWorkerToQueueConnection() {
    const allInjectedModules: Module[] = [...this.modulesContainer.values()];

    let providers: Provider[] = [];

    for (let [_, container] of this.modulesContainer) {
      for (let [_, module] of container.providers.values()) {
        providers.push(module);
      }
    }
    allInjectedModules.map(module => {
      console.log(typeof module);
    });

    // _(allInjectedModules)
    //   .flatMap(module => {
    //     console.log(Object.keys(module));
    //     return [...module.providers.values()];
    //   })
    //   .filter(
    //     instanceWrapper => instanceWrapper.metatype && !!this.reflector.get(NEST_RABBIT_TASKS_WORKER, instanceWrapper.metatype)
    //   )
    //   .map(({ instance, metatype }: InstanceWrapper<RabbitWorkerInterface<any>>) => {
    //     const metadata = this.reflector.get<WorkerDecoratorOptions>(NEST_RABBIT_TASKS_WORKER, metatype);
    //     let queueConnection: HaredoChain;
    //     try {
    //       queueConnection = this.moduleRef.get<HaredoChain>(NestRabbitWorkerToken.getTokenForQueueConnection(metadata.reference));
    //     } catch (err) {
    //       // TODO: log error
    //       // no queue found with name
    //       throw err;
    //     }
    //     return { worker: instance, queueConnection };
    //   })
    //   .map(({ worker, queueConnection }: { worker: RabbitWorkerInterface<any>; queueConnection: HaredoChain }) => {
    //     return new MetadataScanner().scanFromPrototype(worker, Object.getPrototypeOf(worker), name => {
    //       if (name === 'handleMessage') {
    //         queueConnection.subscribe(worker.handleMessage as MessageCallback<any>).catch(() => {
    //           // TODO: log errors
    //         });
    //       }
    //       Promise.resolve(true);
    //     });
    //   })
    //   .value();
  }
}
