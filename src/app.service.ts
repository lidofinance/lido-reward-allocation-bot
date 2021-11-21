import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleInit,
} from '@nestjs/common';
import { OneAtTime } from 'common/decorators';
import { LoaderService } from 'loader';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Manifest } from 'parser';
import { ProviderService } from 'provider';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private logger: LoggerService,

    private loaderService: LoaderService,
    private providerService: ProviderService,
  ) {}

  programs?: Manifest[];

  @OneAtTime()
  async handleNewBlock() {
    const block = await this.providerService.getBlock();
    const blockTag = { blockHash: block.hash };

    try {
      const data = await Promise.all(
        this.programs.map(async (program) => {
          const collectedData = await Promise.all(
            program.metrics.map(async (metric) => {
              const value = await metric.request({ blockTag });

              metric.promMetric
                .labels({ name: program.name })
                .set(Number(value));

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
    this.programs = await this.loaderService.loadManifests();
    this.providerService.provider.on('block', () => this.handleNewBlock());
  }
}
