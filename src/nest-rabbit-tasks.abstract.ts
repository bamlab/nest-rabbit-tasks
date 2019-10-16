import { HaredoMessage } from 'haredo';

export interface RabbitWorkerInterface<T> {
  handleMessage(data: T, message: HaredoMessage<T>): Promise<void>;
}

export abstract class RabbitWorker<T> implements RabbitWorkerInterface<T> {
  public abstract async handleMessage(data: T, message: HaredoMessage<T>): Promise<void>;
}
