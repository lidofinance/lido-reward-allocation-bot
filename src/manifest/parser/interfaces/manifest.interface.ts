import { MetricRaw, MetricParsed } from './metrics.interface';

export interface ManifestRaw {
  name: string;
  version: string;
  metrics: MetricRaw[];
  automation: MetricRaw[];
}

export interface ManifestParsed {
  name: string;
  version: string;
  metrics: MetricParsed[];
  automation: MetricParsed[];
}
