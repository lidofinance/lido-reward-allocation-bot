import { ModuleRef } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { FallbackProviderModule } from '@lido-nestjs/execution';
import { ExecutionService } from './execution.service';
import { LoggerModule } from 'common/logger';
import { ConfigService } from 'common/config';
import { Counter, Histogram } from 'prom-client';
import { getToken } from '@willsoto/nestjs-prometheus';
import {
  METRIC_RPC_REQUEST_ERRORS,
  METRIC_RPC_REQUEST_DURATION,
} from 'common/prometheus';

@Module({
    imports: [
        LoggerModule,
        FallbackProviderModule.forRootAsync({
            // Здесь ругается на сигнатуру
            // (...args: any[]) => Promise<FallbackProviderModuleSyncOptions> | FallbackProviderModuleSyncOptions;
            async useFactory(configService: ConfigService, moduleRef: ModuleRef) {
                
                const requestsHistogram: Histogram<string> = moduleRef.get(
                    getToken(METRIC_RPC_REQUEST_DURATION),
                    { strict: false },
                );
                
                const errorsCounter: Counter<string> = moduleRef.get(
                    getToken(METRIC_RPC_REQUEST_ERRORS),
                    { strict: false },
                );

                return {
                    urls: configService.get('EL_API_URLS'), // Тут не понятно, что оставить
                    network: configService.get('CHAIN_ID'),
                    fetchMiddlewares: [
                        async (next) => {
                            const endTimer = requestsHistogram.startTimer();
              
                            try {
                              return await next();
                            } catch (error) {
                              errorsCounter.inc();
                              throw error;
                            } finally {
                              endTimer();
                            }
                          },
                    ],
                };
            },
            inject: [ConfigService, ModuleRef],
        }),
    ],
    providers: [ExecutionService],
    exports: [ExecutionService],
})
export class ExecutionModule { }