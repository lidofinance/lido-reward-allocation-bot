import * as jsonLogic from 'json-logic-js';
import { Block } from '@ethersproject/abstract-provider';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { BigNumber } from '@ethersproject/bignumber';
import { ManifestParsed, MetricRequestResult } from 'manifest/parser';

@Injectable()
export class ProcessorService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private logger: LoggerService,
  ) {}

  /**
   * Processes manifest data
   * @param manifest parsed manifest object
   * @param block current block info
   */
  public async processManifest(
    manifest: ManifestParsed,
    block: Block,
  ): Promise<void> {
    try {
      const collectedMetrics = await this.collectMetrics(manifest, block);
      await this.runAutomation(manifest, block, collectedMetrics);
    } catch (error) {
      this.logger.error(error);
    }
  }

  /**
   * Collects manifest metrics
   * @param manifest parsed manifest object
   * @param block current block info
   * @returns collected metrics
   */
  public async collectMetrics(
    manifest: ManifestParsed,
    block: Block,
  ): Promise<Record<string, MetricRequestResult>> {
    const blockTag = { blockHash: block.hash };
    const payload = { overrides: { blockTag } };

    const collectedMetrics = Object.fromEntries(
      await Promise.all(
        manifest.metrics.map(async (metric) => {
          const isConditionSatisfied = this.checkCondition(block, metric.rules);
          if (!isConditionSatisfied) return [metric.name, undefined];

          const metricValue = await metric.request(payload);
          const formattedValue = this.formatCollectedMetric(metricValue);
          return [metric.name, formattedValue];
        }),
      ),
    );

    this.logger.log('Collected metrics', {
      manifest: manifest.name,
      metrics: collectedMetrics,
    });

    return collectedMetrics;
  }

  /**
   * Formats metric value
   * @param value raw metric value
   * @returns formatted value
   */
  public formatCollectedMetric(value: unknown) {
    if (BigNumber.isBigNumber(value)) {
      return value.toHexString();
    }

    return value;
  }

  /**
   * Runs manifest automation
   * @param manifest parsed manifest object
   * @param block current block info
   * @param metrics collected metrics
   */
  public async runAutomation(
    manifest: ManifestParsed,
    block: Block,
    metrics: Record<string, MetricRequestResult>,
  ): Promise<void> {
    await Promise.all(
      manifest.automation.map(async (automation) => {
        const { rules, request } = automation;
        const isConditionSatisfied = this.checkCondition(block, rules, metrics);

        const meta = {
          manifestName: manifest.name,
          automationName: automation.name,
        };

        if (isConditionSatisfied) {
          this.logger.debug('Automation condition is satisfied', meta);

          try {
            await request();
          } catch (error) {
            this.logger.error(error);
          }
        } else {
          this.logger.debug('Automation condition is not satisfied', meta);
        }
      }),
    );
  }

  /**
   * Check metric condition
   * @param block current block info
   * @param rules json logic rules
   * @param metrics collected metrics
   */
  public checkCondition(
    block: Block,
    rules?: jsonLogic.RulesLogic,
    metrics?: Record<string, MetricRequestResult>,
  ): boolean {
    if (!rules) return true;

    const data = { ...metrics, block };
    const isConditionSatisfied = jsonLogic.apply(rules, data);

    return isConditionSatisfied;
  }
}
