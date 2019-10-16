import { SetMetadata } from '@nestjs/common';

interface WorkerDecoratorOptions {
  reference: string;
}
export const NEST_RABBIT_TASKS_WORKER = '__nest_rabbit_tasks_worker';
export const RabbitTasksWorker = (decoratorOptions: WorkerDecoratorOptions): ClassDecorator =>
  SetMetadata(NEST_RABBIT_TASKS_WORKER, decoratorOptions);
