# Nest Rabbit Worker

![rabbit](https://images.unsplash.com/photo-1480554840075-72cbdabbf689?ixlib=rb-1.2.1&auto=format&fit=crop&w=3300&q=80)

`nest-rabit-worker` is a `TaskQueue` based upon `RabbitMQ` for `NestJS`.

## Motivation

By working hard on abstracting `NestJS` injection and `RabbitMQ` connection, we want to make it easy to do background task in Nest.
`nest-bull` is a reference, which is `bull` and `redis` to provide the work queue. `nest-bull` and `bull` are the state of art about
how complexity can be hidden and abstracted so building a queue is actually fun.

However, complex system may need other technology that `redis`: `RabbitMQ` provides more feature with exchange.

We needed it on a project, so here it is available for you.

## Disclaimer

This is _alpha quality_ software. We juste started it so it has probably a few bugs.

We will actively work on it so it may break without notice.

:warning: **Use with caution** :warning:

## Get Started

Declare the module:

```ts
import { Module } from '@nestjs/common';
import { NestRabbitTasksModule } from 'nest-rabbit-tasks';

// import the worker
import { EmailWorker } from './worker/email.worker';
// and some services
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
- [ ] improve the doc (`registerAsync`)
- [ ] prevent `Haredo` deps to leak
- [ ] implement an `Exchange` class (so users can publish to exchange using this)
