# Nest Rabbit Worker

![rabbit](./docs/images/rabbit.jpeg)

Nest Rabbit Worker is a TaskQueue based upon RabbitMQ.

## Disclaimer

This is alpha quality software.

Use with caution

## Get Started

Declare the module:

```ts
import { Module, OnModuleInit } from '@nestjs/common';
import { NestRabbitTasksModule } from 'nest-rabbit-tasks';

import { TestWorker } from './worker/test.worker';
import { ModuleRef, ModulesContainer, Reflector } from '@nestjs/core';

@Module({
  imports: [
    // Note that there is also a registerAsync method
    // that allow que parameters here to depend
    // on an injected configservice
    // you can have a look at the interface to see what options it takess
    NestRabbitTasksModule.registerSync({
      // that is not the name of rabbit mq queue
      // but a reference that identify the queue and the worker
      // and allow us to link
      reference: 'worker-email-queue',
      // queue or exchang but exchange are not implemented
      entityType: 'queue',
      amqpOptions: { connectionUrl: 'amqp://localhost:5672' },
      globalOptions: {
        // by default RabbitMQ create queue that doesn't exist
        // { immutableInfrastructure: true } will throw if the queue does not exist
        // that is not yet implemented but will be pretty soon
        immutableInfrastructure: true,
        // how many message the worker should take
        // increasing it increase the throughput but decrease the consistency
        prefetchSize: 1,
      },
      // definition of the queue
      entity: { queueName: 'worker.queue.1', queueOptions: {} },
      // worker used to handle the message
      worker: EmailWorker,
    }),
  ],
  // Here youy should import the worker (EmailWorker)
  // and other service you need
  providers: [EmailWorker, SMTPService],
})
export class AppModule {}

// ---

import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
```

and create a worker:

```ts
import { RabbitWorker, RabbitTasksWorker } from 'nest-rabbit-tasks';

interface Event {
  name: string;
  recipient: string[];
  cc?: string[];
  bcc?: string[];
  content: string;
}

@RabbitTasksWorker({ reference: 'matthieu' })
export class EmailWorker extends RabbitWorker<Event> {
  // please do dependency injection
  public constructor(private readonly smtpService: SMTPService) {}

  // this method is mandatory
  public async handleMessage(data: Event, message: HaredoMessage<Event, void>) {
    if (data.name === 'send-mail') {
      await this.smtpService.sendEmail(data.recipient, datat.cc, data.bcc, data.content);
      // acknowledge the message
      message.ack();
    } else {
      log.error('unknown event');
      if (message.getHeader('x-retries') < 3) {
        // please retry
        message.nack(true);
      } else {
        // no more retry
        message.nack(false);
      }
    }
  }
}
```

## Next steps

- [ ] implement the `immutableInfrastructure` mode
- [ ] work on quality (unit test, E2E test)
- [ ] implement an `Exchange` class (so users can publish to exchange using this)
