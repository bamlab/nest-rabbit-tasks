# nest-rabbit-tasks

`nest-rabbit-tasks` is a `TaskQueue` based upon `RabbitMQ` for `NestJS`.

![NPM](https://img.shields.io/npm/l/nest-rabbit-tasks?style=for-the-badge)

![David](https://img.shields.io/david/bamlab/nest-rabbit-tasks?style=for-the-badge) ![npm bundle size](https://img.shields.io/bundlephobia/minzip/nest-rabbit-tasks?style=for-the-badge)

![CircleCI](https://img.shields.io/circleci/build/github/bamlab/nest-rabbit-tasks/master?style=for-the-badge&token=87ce85715999b1f7547ed34c569cb60d339f9894)

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=bamlab_nest-rabbit-tasks&metric=alert_status)](https://sonarcloud.io/dashboard?id=bamlab_nest-rabbit-tasks) [![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=bamlab_nest-rabbit-tasks&metric=sqale_rating)](https://sonarcloud.io/dashboard?id=bamlab_nest-rabbit-tasks) [![Reliability Rating](https://sonarcloud.io/api/project_badges/measure?project=bamlab_nest-rabbit-tasks&metric=reliability_rating)](https://sonarcloud.io/dashboard?id=bamlab_nest-rabbit-tasks) [![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=bamlab_nest-rabbit-tasks&metric=security_rating)](https://sonarcloud.io/dashboard?id=bamlab_nest-rabbit-tasks)

![rabbit](https://images.unsplash.com/photo-1480554840075-72cbdabbf689?ixlib=rb-1.2.1&auto=format&fit=crop&w=3300&q=80)

## Motivation

By working hard on abstracting `NestJS` injection and `RabbitMQ` connection, we wanted to make it easy to do background tasks in `NestJS`.

`nest-bull` is a reference in this domain: it use `bull` and `redis` to provide the task queue. Moreover `nest-bull` and `bull` are the state of art about
how TaskQueue complexity can be hidden and abstracted. With them, building a queue is actually fun.

However, complex system may need other technologies than `redis`: `RabbitMQ` provides more features, such as exchange (to allow task routing).

We needed it on a project, so here it is made available for you.

## Disclaimer

This is _beta quality_ software. We just started it so it has probably a few bugs.

We are actively working on it so it may break without notice / API may change.

:warning: **Use with caution**, be ready to pin a version and make some modification on the code :warning:

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://twitter.com/TychoTa"><img src="https://avatars2.githubusercontent.com/u/13785185?v=4" width="100px;" alt="Tycho Tatitscheff"/><br /><sub><b>Tycho Tatitscheff</b></sub></a><br /><a href="https://github.com/bamlab/nest-rabbit-tasks/commits?author=tychota" title="Code">💻</a> <a href="https://github.com/bamlab/nest-rabbit-tasks/commits?author=tychota" title="Documentation">📖</a> <a href="#ideas-tychota" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-tychota" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/MattAgn"><img src="https://avatars3.githubusercontent.com/u/32499425?v=4" width="100px;" alt="MattAgn"/><br /><sub><b>MattAgn</b></sub></a><br /><a href="https://github.com/bamlab/nest-rabbit-tasks/commits?author=MattAgn" title="Code">💻</a> <a href="https://github.com/bamlab/nest-rabbit-tasks/commits?author=MattAgn" title="Documentation">📖</a> <a href="#ideas-MattAgn" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification.
Contributions of any kind welcome!

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
    // that allows the parameters to depend on an injected configService.
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
      // Module option that dictate the worker behavior
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
  // Here you should import the worker (EmailWorker)
  // and other service you need
  providers: [EmailWorker, SMTPService],
})
export class AppModule {}

// ---

// in main.js
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
  // Start the module like always
  const app = await NestFactory.create(AppModule);
  // And launch it.
  // Having an HTTP port is useful to configure an health-check route
  await app.listen(3000);
}
```

and create a worker:

```ts
import { AbstractRabbitTasksWorker, RabbitTasksWorker, RabbitWorkerMessage } from 'nest-rabbit-tasks';

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
export class EmailWorker extends AbstractRabbitTasksWorker<Event> {
  // Please do dependency injection
  // and inject what need for the worker to work
  public constructor(private readonly smtpService: SMTPService) {
    this.handleMessage = this.handleMessage.bind(this);
  }

  // This method is mandatory
  public async handleMessage(data: Event, message: RabbitTasksWorker<Event, void>) {
    if (data.name === 'send-mail') {
      await this.smtpService.sendEmail(data.recipient, data.cc, data.bcc, data.content);
      // Acknowledge the message to remove it from the queue
      message.ack();
    } else {
      log.error('unknown event');
      if (message.getHeader('x-retries') < 3) {
        // Non acknowledge the message but with retry
        // to requeue it and process it later
        message.nack(true);
      } else {
        // Non acknowledge the message without retry
        // to remove it from the queue
        message.nack(false);
      }
    }
  }
}
```

## Advanced usage

### Async configuration

Why: your configuration may be dynamic, depends on env variable or API calls.

```ts
@Module({
  imports: [
    NestRabbitTasksModule.registerAsync({
      // The reference must be static and unique
      reference: 'toto',
      // Same for the entity type
      entityType: 'queue',
      // The handler is static too
      // (but that is not a mandatory constraint in the code, let me know if you have usages that)
      // (... requires it to be dynamic. I just found it made more sense like this in my use cases.)
      worker: TestWorker,
      // The rest of the options are dynamic
      // (We only provide `useFactory` for now but `useExisting` and `useClass` can be easily implemented)
      useFactory: async (configService: ConfigService) => {
        const queueName = await configService.getQueueName();
        return {
          entity: { queueName },
          amqpOptions: { connectionUrl: 'amqp://localhost:5672' },
          globalOptions: { immutableInfrastructure: true, prefetchSize: 1 },
        };
      },
      // For it to work you have to import a module, eg. a config module
      // that export a service, eg. a config service
      // and inject the configService, so `useFactory` can resolve it
      imports: [ConfigModule],
      inject: [ConfigService],
    }),
  ],
  providers: [TestWorker],
})
export class AppModule {}
```

## Road-map

- [x] implement the `immutableInfrastructure` mode
- [x] connect Rabbit logger to nest Logger and improve debug logs
- [x] properly check that config is correct and report error if not
- [x] implement async configuration (`registerAsync`)
- [x] prevent `Haredo` deps to leak
- [ ] implement `@OnEvent(rabbitEventName: string)` to decorate a method of the `Worker` that will be call when rabbitEventName is emitted in the queue
- [ ] work on quality (unit tests, E2E tests)
- [ ] improve the doc (`registerAsync`)

- [ ] implement an `Exchange` class (so users can publish to exchange using this)
