import { ConfigService as ConfigServiceSource } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

export class ConfigService extends ConfigServiceSource<EnvironmentVariables> {
  get secrets() {
    return [
      this.get('RPC_URL', { infer: true }),
      this.get('SENTRY_DSN', { infer: true }),
    ];
  }
}
