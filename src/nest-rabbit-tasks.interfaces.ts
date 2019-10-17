import { ModuleMetadata, Type } from '@nestjs/common/interfaces';

import { QueueOptions, ExchangeOptions, HaredoMessage } from 'haredo';

/**
 * The `GlobalOptions` are the AMQP unspecific options such as
 * - `immutableInfrastructure` (boolean, default = true): forbids the creation of queues and exchange that don't exist yet
 * - `prefetchSize` (integer, default = 1): the number of messages to be prefetched
 */
export interface GlobalOptions {
  immutableInfrastructure?: boolean;
  prefetchSize?: number;
}

/**
 * The `AmqpOptions` are the AMQP specific options such as `connectionUrl`
 */
export interface AmqpOptions {
  connectionUrl: string;
}

/**
 * A `QueueEntity` is the name and options of a AMQP 0-9-1 `Queue`
 */
interface QueueEntity {
  queueName: string;
  queueOptions?: Partial<QueueOptions>;
}

interface NestRabbitTasksEntityOptions {
  reference: string;
  globalOptions: GlobalOptions;
  amqpOptions: AmqpOptions;
}

/**
 * `NestRabbitTasksQueueOptions` are the options requested to create / connect to an existing AMQP 0-9-1 `Queue`
 */
export interface NestRabbitTasksQueueOptions extends NestRabbitTasksEntityOptions {
  entityType: 'queue';
  entity: QueueEntity;
  worker: Type<RabbitWorkerInterface<any>>;
}

/**
 * A `ExchangeEntity` is the name and options of a AMQP 0-9-1 `Exchange`
 */
interface ExchangeEntity {
  exchangeName?: string;
  exchangeOptions: Partial<ExchangeOptions>;
}

/**
 * `NestRabbitTasksExchangeOptions` are the options requested to create / connect to an existing AMQP 0-9-1 `Queue`
 */
interface NestRabbitTasksExchangeOptions extends NestRabbitTasksEntityOptions {
  entityType: 'exchange';
  entity: ExchangeEntity;
}

export type NestRabbitTasksModuleSyncOptions = NestRabbitTasksQueueOptions | NestRabbitTasksExchangeOptions;

export type NestRabbitTasksModuleAsyncQueuePartialOptions = Omit<
  NestRabbitTasksQueueOptions,
  'entityType' | 'reference' | 'worker'
>;
export type NestRabbitTasksModuleAsyncExchangePartialOptions = Omit<NestRabbitTasksExchangeOptions, 'entityType' | 'reference'>;

interface NestRabbitTasksModuleBaseQueueAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  reference: string;
  entityType: 'queue';
  worker: Type<RabbitWorkerInterface<any>>;
}

interface NestRabbitTasksModuleFactoryAsyncQueueOptions {
  useFactory: (
    ...args: any[]
  ) => Promise<NestRabbitTasksModuleAsyncQueuePartialOptions> | NestRabbitTasksModuleAsyncQueuePartialOptions;
  inject?: any[];
}

export type NestRabbitTasksModuleAsyncQueueOptions = NestRabbitTasksModuleBaseQueueAsyncOptions &
  NestRabbitTasksModuleFactoryAsyncQueueOptions;

interface NestRabbitTasksModuleBaseExchangeAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  reference: string;
  entityType: 'exchange';
}

interface NestRabbitTasksModuleFactoryAsyncExchangeOptions {
  useFactory: (
    ...args: any[]
  ) => Promise<NestRabbitTasksModuleAsyncExchangePartialOptions> | NestRabbitTasksModuleAsyncExchangePartialOptions;
  inject?: any[];
}

export type NestRabbitTasksModuleAsyncExchangeOptions = NestRabbitTasksModuleBaseExchangeAsyncOptions &
  NestRabbitTasksModuleFactoryAsyncExchangeOptions;

export interface RabbitWorkerInterface<T> {
  handleMessage(data: T, message: HaredoMessage<T>): Promise<void>;
}

export type NestRabbitTasksModuleAsyncOptions =
  | NestRabbitTasksModuleAsyncQueueOptions
  | NestRabbitTasksModuleAsyncExchangeOptions;
