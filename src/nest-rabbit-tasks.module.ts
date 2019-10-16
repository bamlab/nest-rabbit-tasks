import { OnModuleInit, Module } from '@nestjs/common';
import { NestRabbitTasksModuleOptions, NestRabbitTasksModuleAsyncOptions } from 'nest-rabbit-tasks.interfaces';

@Module({})
export class NestRabbitTasksModule implements OnModuleInit {
  public static registerSync(options: NestRabbitTasksModuleOptions | NestRabbitTasksModuleOptions[]) {}
  public static registerAsync(options: NestRabbitTasksModuleAsyncOptions | NestRabbitTasksModuleAsyncOptions[]) {}

  public onModuleInit() {}
}
