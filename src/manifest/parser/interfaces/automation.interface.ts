import { MetricRawRequest } from './request.interface';

export interface RawAutomation {
  rules: Record<string, unknown>;
  request: MetricRawRequest;
}

export interface Automation {}
