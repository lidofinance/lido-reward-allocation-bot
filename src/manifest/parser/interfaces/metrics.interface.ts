import { Counter, Gauge } from 'prom-client';
import { MetricRequest, MetricRawRequest } from './request.interface';

/* Prom metric */

export type PromBaseMetricTypes = 'gauge' | 'counter';

export type PromMetricSupported = Gauge<MetricLabels> | Counter<MetricLabels>;

export interface PromBaseMetric<
  T extends PromBaseMetricTypes = PromBaseMetricTypes,
> {
  name: string;
  help?: string;
  type: T;
}

/* Raw Metrics */

export type RawMetric = RawGaugeMetric | RawCounterMetric;

export interface RawBaseMetric<T extends PromBaseMetricTypes>
  extends PromBaseMetric<T> {
  request: MetricRawRequest;
}

/* Parsed Metrics */

export type Metric = GaugeMetric | CounterMetric;

export type MetricLabels = 'name';
export type MetricValues = GaugeMetricType | CounterMetricType;

/* Gauge Metric */
export interface RawGaugeMetric extends RawBaseMetric<'gauge'> {}

export type GaugeMetricType = number;
export interface GaugeMetric {
  name: string;
  type: 'gauge';
  promMetric: Gauge<MetricLabels>;
  request: MetricRequest<GaugeMetricType>;
}

/* Counter Metric */
export interface RawCounterMetric extends RawBaseMetric<'counter'> {}

export type CounterMetricType = void;
export interface CounterMetric {
  name: string;
  type: 'counter';
  promMetric: Counter<MetricLabels>;
  request: MetricRequest<CounterMetricType>;
}
