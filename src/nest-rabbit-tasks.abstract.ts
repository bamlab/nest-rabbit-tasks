import { HaredoMessage } from 'haredo';

import { RabbitWorkerInterface } from './nest-rabbit-tasks.interfaces';

export type RabbitWorkerMessage<Data = unknown> = HaredoMessage<Data, void>;

export abstract class AbstractRabbitTasksWorker<T> implements RabbitWorkerInterface<T> {
  public abstract async handleMessage(data: T, message: RabbitWorkerMessage<T>): Promise<void>;
}
