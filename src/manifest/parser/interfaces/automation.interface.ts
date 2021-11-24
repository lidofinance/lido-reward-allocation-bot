import { Counter } from 'prom-client';
import { PromBaseMetric, MetricValues } from './metrics.interface';
import { MetricRequest, MetricRawRequest } from './request.interface';

export type AutomationLabels = 'name' | 'result';

export interface RawAutomation extends PromBaseMetric<'counter'> {
  rules: Record<string, unknown>;
  request: MetricRawRequest;
}

export interface Automation {
  name: string;
  promMetric: Counter<AutomationLabels>;
  rules: Record<string, unknown>;
  request: MetricRequest<MetricValues>;
}
