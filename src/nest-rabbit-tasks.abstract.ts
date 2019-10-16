import { HaredoMessage } from 'haredo';

export abstract class RabbitWorker<T> {
  public abstract async handleMessage(data: T, message: HaredoMessage<T>): Promise<void>;
}
