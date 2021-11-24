import { BigNumber } from '@ethersproject/bignumber';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Counter, Gauge } from 'prom-client';
import { snakeCase } from 'lodash';
import { METRICS_PREFIX } from 'common/prometheus';
import {
  Metric,
  PromBaseMetric,
  PromMetricSupported,
  RawMetric,
} from 'manifest/parser';
import { ParserRequestService } from './parser-request.service';

@Injectable()
export class ParserMetricsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private parserRequestService: ParserRequestService,
  ) {}

  cachedMetrics: Record<string, PromMetricSupported> = {};

  /**
   * Parses metric object from manifest
   * @param rawMetrics array of raw metrics
   * @returns array of parsed metric objects
   */
  public parseRawMetrics(rawMetrics: RawMetric[]): Metric[] {
    return rawMetrics.map((rawMetric) => {
      const { name, type } = rawMetric;
      const promMetric = this.getPromMetric(rawMetric, ['name']);
      const request = this.getRequestByType(rawMetric);

      return { name, type, promMetric, request } as Metric;
    });
  }

  /**
   * Returns request query with formatted result
   * @param rawMetric raw metric object
   * @returns request function
   */
  public getRequestByType(rawMetric: RawMetric) {
    const request = this.parserRequestService.parseRequest(rawMetric.request);

    if (rawMetric.type === 'gauge') {
      return async (...args: Parameters<typeof request>): Promise<number> => {
        const result = await request(...args);

        if (BigNumber.isBigNumber(result)) {
          // TODO: replace with BigInt
          // prom-client does not support BigInt yet
          // return result.toBigInt();

          return Number(result.toHexString());
        }

        if (typeof result === 'number') {
          return result;
        }

        if (typeof result === 'boolean') {
          return Number(result);
        }

        throw new Error('Result cannot be converted to Gauge metric');
      };
    }

    if (rawMetric.type === 'counter') {
      return async (...args: Parameters<typeof request>): Promise<void> => {
        await request(...args);
      };
    }

    this.logger.error('Metric is not supported', { rawMetric });
    process.exit(1);
  }

  /**
   * Returns metric name with global prefix
   * @param name base metric name
   * @returns metric name with prefix
   */
  public getPromMetricNameWithPrefix(name: string): string {
    return `${METRICS_PREFIX}${snakeCase(name)}`;
  }

  /**
   * Creates new metric object or returns cached
   * @param rawMetric raw metric object
   * @returns prometheus metric object
   */
  public getPromMetric(
    rawMetric: PromBaseMetric,
    labelNames: string[] = [],
  ): PromMetricSupported {
    const { name } = rawMetric;

    if (!this.cachedMetrics[name]) {
      this.cachedMetrics[name] = this.getPromMetricByType(
        rawMetric,
        labelNames,
      );
    }

    return this.cachedMetrics[name];
  }

  /**
   * Creates prometheus metric object based on type
   * @param rawMetric raw metric object
   * @returns prometheus metric object
   */
  public getPromMetricByType(
    rawMetric: PromBaseMetric,
    labelNames: string[] = [],
  ): PromMetricSupported {
    const { name, help } = rawMetric;
    const fullName = this.getPromMetricNameWithPrefix(name);

    if (rawMetric.type === 'gauge') {
      return new Gauge({ name: fullName, help, labelNames });
    }

    if (rawMetric.type === 'counter') {
      return new Counter({ name: fullName, help, labelNames });
    }

    this.logger.error('Metric is not supported', { rawMetric });
    process.exit(1);
  }
}
