import { MetricRequest, MetricRequestRaw } from './request.interface';
import { RulesLogic } from 'json-logic-js';

export interface MetricRaw {
  request: MetricRequestRaw;
  name: string;
  rules?: RulesLogic;
}

export type MetricLabels = 'name';
export interface MetricParsed extends Omit<MetricRaw, 'request'> {
  request: MetricRequest;
}
