import { PrometheusModule as PrometheusModuleSource } from '@willsoto/nestjs-prometheus';
import {
  PrometheusBuildInfoGaugeProvider,
  PrometheusRPCErrorsCounterProvider,
  PrometheusRPCRequestsHistogramProvider,
  PrometheusAccountBalanceGaugeProvider,
  PrometheusManifestRequestsHistogramProvider,
  PrometheusManifestRequestsResultGaugeProvider,
  PrometheusManifestRequestsCounterProvider,
  PrometheusTransactionGaugeProvider,
} from './prometheus.provider';
import { PrometheusOptionsProvider } from './prometheus-options.provider';
import { PrometheusController } from './prometheus.controller';

export const PrometheusModule = PrometheusModuleSource.registerAsync({
  useClass: PrometheusOptionsProvider,
  inject: [PrometheusOptionsProvider],
  controller: PrometheusController,
});

const metricsProviders = [
  PrometheusBuildInfoGaugeProvider,
  PrometheusRPCRequestsHistogramProvider,
  PrometheusRPCErrorsCounterProvider,
  PrometheusAccountBalanceGaugeProvider,
  PrometheusManifestRequestsHistogramProvider,
  PrometheusManifestRequestsResultGaugeProvider,
  PrometheusManifestRequestsCounterProvider,
  PrometheusTransactionGaugeProvider,
];

PrometheusModule.global = true;
PrometheusModule.providers = [
  ...(PrometheusModule.providers || []),
  ...metricsProviders,
];
PrometheusModule.exports = PrometheusModule.providers;
