import { HaredoMessage } from 'haredo';

import { RabbitWorkerInterface } from './nest-rabbit-tasks.interfaces';

export abstract class RabbitWorker<T> implements RabbitWorkerInterface<T> {
  public abstract async handleMessage(data: T, message: HaredoMessage<T>): Promise<void>;
}
