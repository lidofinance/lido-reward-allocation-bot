import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigService, LogFormat } from 'common/config';
import * as winston from 'winston';
import { ProviderService } from 'ethereum/provider';
import { ModuleRef } from '@nestjs/core';
import { json, simple } from './logger.format';

export const LoggerModule = WinstonModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService, ModuleRef],
  useFactory: async (configService: ConfigService, moduleRef: ModuleRef) => ({
    level: configService.get('LOG_LEVEL', { infer: true }),
    defaultMeta: {
      get block() {
        const providerService = moduleRef.get(ProviderService, {
          strict: false,
        });
        return providerService.provider.blockNumber;
      },
    },
    transports: [
      new winston.transports.Console({
        format:
          configService.get('LOG_FORMAT', { infer: true }) === LogFormat.json
            ? json(configService)
            : simple(configService),
      }),
    ],
  }),
});
