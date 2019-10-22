import { Logger } from '@nestjs/common';
import { Haredo, HaredoChain } from 'haredo';

import { NestRabbitTasksQueueOptions } from './nest-rabbit-tasks.interfaces';

let debugMessageCounter = 0;

export class NestRabbitTasksRabbitClient {
  public static async buildQueueConnection(option: NestRabbitTasksQueueOptions, logger: Logger): Promise<HaredoChain | null> {
    console.log(option.amqpOptions);
    const connection = new Haredo({ connection: option.amqpOptions.connectionUrl });

    if (option.globalOptions.immutableInfrastructure) {
      const channel = await connection.connectionManager.getChannel();
      try {
        await channel.checkQueue(option.entity.queueName);
      } catch (err) {
        if (err.code === 404) {
          const msg = `You have activated "globalOptions.immutableInfrastructure".
          This prevents nest-rabbit-tasks to create non-existent queue.
          The queue ${option.entity.queueName} does not exist.
          Please create it in RabbitMQ interface.`;
          logger.error(msg);
          return null;
        }
        throw err;
      }
    }

    let chain = connection.queue(option.entity.queueName, option.entity.queueOptions);
    if (option.globalOptions.immutableInfrastructure) {
      chain = chain.skipSetup();
    }
    return (
      chain
        // we do not want to auto acknowledge the messages
        .autoAck(false)
        .reestablish(true)
        // we do want to set the content-type to JSON
        .json(true)
        .prefetch(option.globalOptions.prefetchSize || 1)
        .use(async (_, next) => {
          const counter = debugMessageCounter++;
          const timeStart = process.hrtime();

          logger.debug(`Start Handling message ${counter}`);
          await next();
          const processTime = process.hrtime(timeStart);
          logger.debug(`Done Handling message ${counter} in ${processTime[0]}s and ${processTime[1] / 1000000}ms`);
        })
    );
  }
}
