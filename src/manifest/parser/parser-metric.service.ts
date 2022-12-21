import { BigNumber } from '@ethersproject/bignumber';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  METRIC_MANIFEST_REQUEST_COUNTER,
  METRIC_MANIFEST_REQUEST_DURATION,
  METRIC_MANIFEST_REQUEST_RESULT,
} from 'common/prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';
import { ParserRequestService } from './parser-request.service';
import {
  MetricRaw,
  MetricParsed,
  MetricRequest,
  MetricRequestResult,
  ManifestRaw,
} from './interfaces';
@Injectable()
export class ParserMetricsService {
  constructor(
    @InjectMetric(METRIC_MANIFEST_REQUEST_COUNTER)
    private metricCounter: Counter<string>,

    @InjectMetric(METRIC_MANIFEST_REQUEST_RESULT)
    private metricResult: Gauge<string>,

    @InjectMetric(METRIC_MANIFEST_REQUEST_DURATION)
    private metricHistogram: Histogram<string>,

    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private parserRequestService: ParserRequestService,
  ) {}

  /**
   * Parses array of metric objects from manifest
   * @param manifest raw manifest
   * @param metrics array of raw metrics
   * @returns array of parsed metric objects
   */
  public parseRawMetrics(
    manifest: ManifestRaw,
    metrics: MetricRaw[],
    network = 'unknown',
  ): MetricParsed[] {
    return metrics.map((metric) =>
      this.parseRawMetric(manifest, metric, network),
    );
  }

  /**
   * Parses metric object from manifest
   * @param manifest raw manifest
   * @param metric raw metric
   * @returns parsed metric object
   */
  public parseRawMetric(
    manifest: ManifestRaw,
    metric: MetricRaw,
    network: string,
  ): MetricParsed {
    const request = this.buildRequest(manifest, metric, network);
    return { ...metric, request };
  }

  /**
   * Builds request function with formatted result
   * @param manifest raw manifest
   * @param metric raw metric
   * @returns request function
   */
  public buildRequest(
    manifest: ManifestRaw,
    metric: MetricRaw,
    network: string,
  ) {
    const request = this.parserRequestService.parseRequest(metric.request);

    return async (...args: Parameters<typeof request>): Promise<unknown> => {
      const commonLabels = {
        network,
        manifestName: manifest.name,
        manifestVersion: manifest.version,
        metric: metric.name,
      };

      try {
        const wrappedRequest = this.wrapWithMetric(commonLabels, request);
        const result = await wrappedRequest(...args);

        this.setMetricResult(commonLabels, result);
        this.setMetricCounter(commonLabels, 'success');

        return result;
      } catch (error) {
        this.setMetricCounter(commonLabels, 'error');
        this.logger.error(error);
      }
    };
  }

  /**
   * Wraps request function with prometheus histogram metric
   * @param labels common labels object
   * @param request request function
   * @returns request function
   */
  public wrapWithMetric(
    labels: Record<string, string>,
    request: MetricRequest,
  ): MetricRequest {
    return async (...args) => {
      const endTimer = this.metricHistogram.labels(labels).startTimer();

      try {
        return await request(...args);
      } catch (error) {
        throw error;
      } finally {
        endTimer();
      }
    };
  }

  /**
   * Sets prometheus counter metric
   * @param labels common labels object
   * @param status request status
   */
  public setMetricCounter(
    labels: Record<string, string>,
    status: 'success' | 'error',
  ): void {
    this.metricCounter.labels({ ...labels, status }).inc();
  }

  /**
   * Sets prometheus result metric
   * @param labels common labels object
   * @param result result of request
   */
  public setMetricResult(
    labels: Record<string, string>,
    result: unknown,
  ): void {
    const formattedResult = this.formatRequestResult(result);

    if (typeof formattedResult === 'number') {
      this.metricResult.labels(labels).set(formattedResult);
    }
  }

  /**
   * Formats a request result for metric
   * @param tx contract transaction object
   */
  public formatRequestResult(result: unknown): MetricRequestResult {
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
  }
}
