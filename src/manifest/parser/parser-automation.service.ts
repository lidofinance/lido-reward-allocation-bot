import { Injectable } from '@nestjs/common';
import { Automation, RawAutomation } from 'manifest/parser';
import { ParserMetricsService } from './parser-metric.service';

@Injectable()
export class ParserAutomationService {
  constructor(private parserMetricsService: ParserMetricsService) {}

  /**
   * Parses automation object from manifest
   * @param rawAutomations array of automations
   * @returns array of parsed automation objects
   */
  public parseRawAutomation(rawAutomations: RawAutomation[]): Automation[] {
    return rawAutomations.map((rawAutomation) => {
      const type = 'counter';
      const { name, rules } = rawAutomation;
      const rawMetric = { ...rawAutomation, type } as const;

      const promMetric = this.parserMetricsService.getPromMetric(rawMetric, [
        'name',
        'result',
      ]);

      const request = this.parserMetricsService.getRequestByType(rawMetric);

      return { name, type, promMetric, rules, request };
    });
  }
}
