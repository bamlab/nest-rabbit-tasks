import _ from 'lodash';

export class NestRabbitWorkerToken {
  public static getTokenForQueueConnection(reference: string): string {
    return `NestRabbitWorkerQueue${_.capitalize(reference)}`;
  }

  public static getTokenForQueueConnectionOptions(reference: string): string {
    return `NestRabbitWorkerQueue${_.capitalize(reference)}Options`;
  }
}
