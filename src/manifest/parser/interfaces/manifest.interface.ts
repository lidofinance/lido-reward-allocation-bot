import { RawAutomation, Automation } from './automation.interface';
import { RawMetric, Metric } from './metrics.interface';

export interface RawManifest {
  name: string;
  version: string;
  metrics: RawMetric[];
  automation: RawAutomation[];
}

export interface Manifest {
  name: string;
  version: string;
  metrics: Metric[];
  automation: Automation[];
}
