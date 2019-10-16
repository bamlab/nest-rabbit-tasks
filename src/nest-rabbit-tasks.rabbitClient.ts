import { NestRabbitTasksQueueOptions } from './nest-rabbit-tasks.interfaces';
import { Haredo, Queue, HaredoChain } from 'haredo';

export class NestRabbitTasksRabbitClient {
  public static async buildQueueConnection(option: NestRabbitTasksQueueOptions): Promise<HaredoChain> {
    // TODO: if imutableStructure, prevent queue creation
    // check that queue exist or throw
    const queue = new Queue(option.entity.queueName);
    return new Haredo({ connection: option.amqpOptions.connectionUrl })
      .queue(queue)
      .autoAck(false)
      .reestablish(true)
      .prefetch(option.globalOptions.prefetchSize || 1);
  }
}
