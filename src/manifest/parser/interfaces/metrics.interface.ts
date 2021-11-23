import { Gauge } from 'prom-client';
import { MetricRequest, MetricRawRequest } from './request.interface';

/* Raw metrics */

export type RawMetric = RawGaugeMetric;

export interface RawBaseMetric {
  name: string;
  help?: string;
  request: MetricRawRequest;
}
export interface RawGaugeMetric extends RawBaseMetric {
  type: 'gauge';
}

/* Metrics */

export type Metric = GaugeMetric;

export type MetricLabels = 'name';

export type PromMetricSupported = Gauge<MetricLabels>;

export interface GaugeMetric {
  name: string;
  type: 'gauge';
  promMetric: PromMetricSupported;
  request: MetricRequest;
}
