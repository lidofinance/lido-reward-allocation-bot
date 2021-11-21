import { FormatTypes, Interface } from '@ethersproject/abi';
import { Contract } from '@ethersproject/contracts';
import { Provider } from '@ethersproject/providers';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { METRICS_PREFIX } from 'common/prometheus';
import { snakeCase } from 'lodash';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ProviderService, CallOverrides } from 'provider';
import { RawMetric, ContractMethodCall, MetricRawRequest } from './interfaces';
import { Gauge } from 'prom-client';

@Injectable()
export class ParserService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private providerService: ProviderService,
  ) {}

  public parseJSON(content: string) {
    try {
      const parsed = JSON.parse(content);
      const { name, version, metrics, automation } = parsed;

      this.logger.log('File parsed', {
        name,
        version,
        metrics: metrics.length,
        automation: automation.length,
      });

      return {
        name,
        version,
        metrics: this.parseRawMetrics(parsed.metrics),
        automation: [],
      };
    } catch (error) {
      this.logger.error(error);
      process.exit(1);
    }
  }

  public parseRawMetrics(rawMetrics: RawMetric[]) {
    const batchProvider = this.providerService.getNewBatchProviderInstance();

    return rawMetrics.map((rawMetric) => {
      const { name, type } = rawMetric;
      const promMetric = this.getPromMetric(rawMetric);
      const request = this.getRequestHandler(rawMetric.request, batchProvider);

      return { name, type, promMetric, request };
    });
  }

  public getPromMetric(rawMetric: RawMetric) {
    if (rawMetric.type === 'gauge') {
      return new Gauge({
        name: `${METRICS_PREFIX}${snakeCase(rawMetric.name)}`,
        help: rawMetric.help,
        labelNames: ['name'],
      });
    }

    this.logger.error('Metric is not supported', { rawMetric });
    process.exit(1);
  }

  public getRequestHandler(request: MetricRawRequest, provider: Provider) {
    if (request.type === 'contractMethodCall') {
      return this.getContractMethodCall(request, provider);
    }

    this.logger.error('Metric request is not supported', { request });
    process.exit(1);
  }

  public getContractMethodCall(
    request: ContractMethodCall,
    provider: Provider,
  ) {
    const { address, method, args = [] } = request;

    const iface = new Interface([method]);
    const abi = iface.format(FormatTypes.json);
    const methodName = iface.fragments[0].name;

    const contract = new Contract(address, abi, provider);

    return async (overrides?: CallOverrides) => {
      return await contract[methodName](...args, overrides);
    };
  }
}
