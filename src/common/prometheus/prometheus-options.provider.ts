import { Injectable } from '@nestjs/common';
import {
  PrometheusOptions,
  PrometheusOptionsFactory,
} from '@willsoto/nestjs-prometheus';
import { ProviderService } from 'ethereum/provider';
import { METRICS_PREFIX, METRICS_URL } from './prometheus.constants';
import { PrometheusController } from './prometheus.controller';

@Injectable()
export class PrometheusOptionsProvider implements PrometheusOptionsFactory {
  constructor(protected providerService: ProviderService) {}

  async createPrometheusOptions(): Promise<PrometheusOptions> {
    const network = await this.providerService.getNetworkName();

    return {
      controller: PrometheusController,
      path: METRICS_URL,
      defaultMetrics: {
        enabled: true,
        config: { prefix: METRICS_PREFIX },
      },
      defaultLabels: {
        network,
      },
    };
  }
}
