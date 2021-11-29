import { ConfigService as ConfigServiceSource } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

export class ConfigService extends ConfigServiceSource<EnvironmentVariables> {
  /**
   * List of env variables that should be hidden
   */
  public get secrets() {
    return [
      this.get('RPC_URL', { infer: true }),
      this.get('SENTRY_DSN', { infer: true }),
    ];
  }
}
