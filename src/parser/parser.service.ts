import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class ParserService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,
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

      return parsed;
    } catch (error) {
      this.logger.error(error);
    }
  }
}
