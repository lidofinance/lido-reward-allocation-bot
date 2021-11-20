import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ConfigService } from 'common/config';
import { AppModule } from 'app.module';
import { APP_NAME, APP_VERSION } from 'app.constants';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );

  // config
  const configService: ConfigService = app.get(ConfigService);
  const options = { infer: true };
  const environment = configService.get('NODE_ENV', options);
  const appPort = configService.get('PORT', options);
  const sentryDsn = configService.get('SENTRY_DSN', options);

  // versions
  app.enableVersioning({ type: VersioningType.URI });

  // logger
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  // sentry
  const release = `${APP_NAME}@${APP_VERSION}`;
  Sentry.init({ dsn: sentryDsn, release, environment });

  // app
  await app.listen(appPort, '0.0.0.0');
}
bootstrap();
