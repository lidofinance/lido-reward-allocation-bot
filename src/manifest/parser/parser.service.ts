import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { ManifestParsed, ManifestRaw } from './interfaces';
import { ParserMetricsService } from './parser-metric.service';

@Injectable()
export class ParserService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private parserMetricService: ParserMetricsService,
  ) {}

  /**
   * Returns parsed manifest
   * @param content manifest file content
   * @returns parsed manifest
   */
  public parseJSON(content: string, network?: string): ManifestParsed {
    try {
      const manifestRaw = JSON.parse(content) as ManifestRaw;
      const { name, version, metrics, automation } = manifestRaw;

      this.logger.log('File parsed', {
        name,
        version,
        metrics: metrics.length,
        automation: automation.length,
      });

      return {
        name,
        version,
        metrics: this.parserMetricService.parseRawMetrics(
          manifestRaw,
          manifestRaw.metrics,
          network,
        ),
        automation: this.parserMetricService.parseRawMetrics(
          manifestRaw,
          manifestRaw.automation,
          network,
        ),
      };
    } catch (error) {
      this.logger.error(error);
      process.exit(1);
    }
  }
}
