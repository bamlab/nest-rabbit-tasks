import { OnModuleInit, Module, DynamicModule } from '@nestjs/common';

import { NestRabbitTasksModuleOptions, NestRabbitTasksModuleAsyncOptions } from './nest-rabbit-tasks.interfaces';

@Module({})
export class NestRabbitTasksModule implements OnModuleInit {
  public static registerSync(options: NestRabbitTasksModuleOptions | NestRabbitTasksModuleOptions[]): DynamicModule {
    console.log(options);
    return {
      module: NestRabbitTasksModule,
    };
  }

  public static registerAsync(options: NestRabbitTasksModuleAsyncOptions | NestRabbitTasksModuleAsyncOptions[]): DynamicModule {
    console.log(options);
    return {
      module: NestRabbitTasksModule,
    };
  }

  public onModuleInit() {
    console.log('OnModuleInit NestRabbitTasksModule');
  }
}
