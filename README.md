# nest-rabbit-tasks

`nest-rabbit-tasks` is a `TaskQueue` based upon `RabbitMQ` for `NestJS`.

![NPM](https://img.shields.io/npm/l/nest-rabbit-tasks?style=for-the-badge)

![David](https://img.shields.io/david/bamlab/nest-rabbit-tasks?style=for-the-badge) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/nest-rabbit-tasks?style=for-the-badge)

![Scrutinizer build (GitHub/Bitbucket)](https://img.shields.io/scrutinizer/build/g/bamlab/nest-rabbit-tasks?style=for-the-badge) ![Scrutinizer code quality (GitHub/Bitbucket)](https://img.shields.io/scrutinizer/quality/g/bamlab/nest-rabbit-tasks?style=for-the-badge)

![rabbit](https://images.unsplash.com/photo-1480554840075-72cbdabbf689?ixlib=rb-1.2.1&auto=format&fit=crop&w=3300&q=80)

## Motivation

By working hard on abstracting `NestJS` injection and `RabbitMQ` connection, we wanted to make it easy to do background tasks in `NestJS`.

`nest-bull` is a reference in this domain: it use `bull` and `redis` to provide the task queue. Moreover `nest-bull` and `bull` are the state of art about
how TaskQueue complexity can be hidden and abstracted. With them, building a queue is actually fun.

However, complex system may need other technologies than `redis`: `RabbitMQ` provides more features, such as exchange (to allow task routing).

We needed it on a project, so here it is made available for you.

## Disclaimer

This is _alpha quality_ software. We just started it so it has probably a few bugs.

We are actively working on it so it may break without notice / API may change.

:warning: **Use with caution**, be ready to pin a version and make some modification on the code :warning:

## Get Started

Declare the module:

```ts
import { Module } from '@nestjs/common';
import { NestRabbitTasksModule } from 'nest-rabbit-tasks';

// Import the worker.
import { EmailWorker } from './worker/email.worker';
// And import some services.
import { SMTPService } from './service/smtp.service';

@Module({
  imports: [
    // Note that there is also a `registerAsync` method
    // that allows the parameters to depend on an injected configservice.
    // You can have a look at the interface to see what options it takes.
    NestRabbitTasksModule.registerSync({
      // That is not the name of RabbitMQ queue
      // but an unique reference that identify the queue and the worker
      // and allow us to link the conf here and the worker implementation there
      reference: 'worker-email-queue',
      // Queue or exchange (but exchange are not implemented yet ^^).
      entityType: 'queue',
      // AMQP connection/channel wide options.
      amqpOptions: { connectionUrl: 'amqp://localhost:5672' },
      // Module option that dictate wthe worker behaviour
      globalOptions: {
        // By default RabbitMQ create queue if the queue doesn't exist
        // By setting `{ immutableInfrastructure: true }` will throw if the queue does not exist
        // Note that this is not yet implemented yet but will be pretty soon
        immutableInfrastructure: true,
        // How many messages the Worker should take.
        // Increasing it increase the throughput but decrease the consistency
        prefetchSize: 1,
      },
      // Definition of the queue and queue specific options
      // such as `single-active-consumer`
      entity: { queueName: 'worker.queue.1', queueOptions: {} },
      // Worker used to handle the AMQP message
      worker: EmailWorker,
    }),
  ],
  // Here youy should import the worker (EmailWorker)
  // and other service you need
  providers: [EmailWorker, SMTPService],
})
export class AppModule {}

// ---

// in main.js
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  // Start the module like alaways
  const app = await NestFactory.create(AppModule);
  // And launch it.
  // Having an HTTP port is useful to configure an healthcheck route
  await app.listen(3000);
}
```

and create a worker:

```ts
import { RabbitWorker, RabbitTasksWorker } from 'nest-rabbit-tasks';

// You can specify what the Event looks like.
// By default it is any.
interface Event {
  name: string;
  recipient: string[];
  cc?: string[];
  bcc?: string[];
  content: string;
}

@RabbitTasksWorker({ reference: 'worker-email-queue' })
export class EmailWorker extends RabbitWorker<Event> {
  // Please do dependency injection
  // and inject what need for the worker to work
  public constructor(private readonly smtpService: SMTPService) {}

  // This method is mandatory
  public async handleMessage(data: Event, message: HaredoMessage<Event, void>) {
    if (data.name === 'send-mail') {
      await this.smtpService.sendEmail(data.recipient, datat.cc, data.bcc, data.content);
      // Acknowledge the message to remove it from the queue
      message.ack();
    } else {
      log.error('unknown event');
      if (message.getHeader('x-retries') < 3) {
        // Nacknowledge the message but with retry
        // to requeue it and process it later
        message.nack(true);
      } else {
        // Nacknowledge the message without retry
        // to remove it from the queue
        message.nack(false);
      }
    }
  }
}
```

## Roadmap

- [ ] implement the `immutableInfrastructure` mode
- [ ] implement `@OnEvent(rabbitEventName: string)` to decorate a method of the `Worker` that will be call when rabbitEventName is emitted in the queue
- [ ] work on quality (unit tests, E2E tests)
- [ ] improve the doc (`registerAsync`)
- [ ] prevent `Haredo` deps to leak
- [ ] implement an `Exchange` class (so users can publish to exchange using this)
