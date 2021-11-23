import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Manifest } from './interfaces';
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
  public parseJSON(content: string): Manifest {
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
        metrics: this.parserMetricService.parseRawMetrics(parsed.metrics),
        automation: [],
      };
    } catch (error) {
      this.logger.error(error);
      process.exit(1);
    }
  }
}
