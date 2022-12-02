import { APP_INTERCEPTOR } from '@nestjs/core';
import { Module } from '@nestjs/common';

import { PrometheusModule } from 'common/prometheus';
import { LoggerModule } from 'common/logger';
import { ConfigModule } from 'common/config';
import { SentryInterceptor } from 'common/sentry';
import { HealthModule } from 'common/health';
import { ProviderModule } from 'ethereum/provider';
import { WalletModule } from 'ethereum/wallet';
import { LoaderModule } from 'manifest/loader';
import { ProcessorModule } from 'manifest/processor';
import { AppService } from './app.service';
import { ExecutionModule } from 'ethereum/execution';

@Module({
  imports: [
    // ProviderModule.forRoot(),
    ExecutionModule,
    PrometheusModule,
    LoggerModule,
    ConfigModule,
    HealthModule,
    LoaderModule,
    ProcessorModule,
    WalletModule,
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: SentryInterceptor },
    AppService,
  ],
})
export class AppModule {}
