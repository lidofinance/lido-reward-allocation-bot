import { ConfigService as ConfigServiceSource } from '@nestjs/config';
import { EnvironmentVariables } from './env.validation';

export class ConfigService extends ConfigServiceSource<EnvironmentVariables> {}
