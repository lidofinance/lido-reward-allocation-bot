import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleInit,
} from '@nestjs/common';
import { Block } from '@ethersproject/abstract-provider';
import * as jsonLogic from 'json-logic-js';
import { OneAtTime } from 'common/decorators';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoaderService } from 'manifest/loader';
import { Manifest, MetricValues } from 'manifest/parser';
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
  async handleNewBlock(manifests: Manifest[]) {
    try {
      const block = await this.providerService.getBlock();

      await Promise.all(
        manifests.map((program) => {
          return this.processManifest(program, block);
        }),
      );
    } catch (error) {
      this.logger.error(error);
    }
  }

  async processManifest(manifest: Manifest, block: Block) {
    try {
      const collectedMetrics = await this.collectManifestMetrics(
        manifest,
        block,
      );

      this.setManifestPromMetrics(manifest, collectedMetrics);
      await this.runManifestAutomation(manifest, collectedMetrics, block);
    } catch (error) {
      this.logger.error(error);
    }
  }

  async collectManifestMetrics(
    manifest: Manifest,
    block: Block,
  ): Promise<Record<string, MetricValues>> {
    const blockTag = { blockHash: block.hash };
    const payload = { overrides: { blockTag } };

    const collectedMetrics = Object.fromEntries(
      await Promise.all(
        manifest.metrics.map(async (metric) => {
          const metricValue = await metric.request(payload);
          return [metric.name, metricValue];
        }),
      ),
    );

    this.logger.log('Collected metrics', {
      manifest: manifest.name,
      metrics: collectedMetrics,
    });

    return collectedMetrics;
  }

  setManifestPromMetrics(
    manifest: Manifest,
    collectedMetrics: Record<string, MetricValues>,
  ): void {
    manifest.metrics.forEach(async (metric) => {
      const metricValue = collectedMetrics[metric.name];
      const metricLabels = { name: manifest.name };

      if (metric.type === 'gauge') {
        metric.promMetric.labels(metricLabels).set(metricValue as number);
      }
    });
  }

  async runManifestAutomation(
    manifest: Manifest,
    collectedMetrics: Record<string, MetricValues>,
    block: Block,
  ): Promise<void> {
    await Promise.all(
      manifest.automation.map(async (automation) => {
        const { rules, promMetric, request } = automation;
        const data = { ...collectedMetrics, block };
        const isConditionSatisfied = jsonLogic.apply(rules, data);

        if (isConditionSatisfied) {
          this.logger.log('Automation condition is satisfied', {
            manifestName: manifest.name,
            automationName: automation.name,
          });

          try {
            await request();
            promMetric.labels({ name: manifest.name, result: 'success' }).inc();
          } catch (error) {
            promMetric.labels({ name: manifest.name, result: 'fail' }).inc();
            this.logger.error(error);
          }
        }
      }),
    );
  }

  async onModuleInit() {
    const programs = await this.loaderService.loadManifests();

    this.providerService.provider.on('block', () => {
      this.handleNewBlock(programs);
    });
  }
}
