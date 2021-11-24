import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleInit,
} from '@nestjs/common';
import { OneAtTime } from 'common/decorators';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoaderService } from 'manifest/loader';
import { Manifest } from 'manifest/parser';
import { ProviderService } from 'ethereum/provider';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private loaderService: LoaderService,
    private providerService: ProviderService,
  ) {}

  /**
   * Handles the appearance of a new block in the network
   */
  @OneAtTime()
  async handleNewBlock(programs: Manifest[]) {
    try {
      const blockTag = await this.providerService.getBlockTag();
      const payload = { overrides: { blockTag } };

      const data = await Promise.all(
        programs.map(async (program) => {
          const collectedData = await Promise.all(
            program.metrics.map(async (metric) => {
              const value = await metric.request(payload);

              metric.promMetric.labels({ name: program.name }).set(value);

              return [metric.name, value];
            }),
          );

          return Object.fromEntries(collectedData);
        }),
      );

      this.logger.log('Collected metrics', data);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async onModuleInit() {
    const programs = await this.loaderService.loadManifests();

    this.providerService.provider.on('block', () => {
      this.handleNewBlock(programs);
    });
  }
}
