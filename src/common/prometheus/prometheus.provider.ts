import { makeHistogramProvider } from '@willsoto/nestjs-prometheus';
import { METRIC_HTTP_REQUEST_DURATION } from './prometheus.constants';

export const PrometheusRequestsHistogramProvider = makeHistogramProvider({
  name: METRIC_HTTP_REQUEST_DURATION,
  help: 'Duration of http requests',
  buckets: [0.01, 0.1, 0.2, 0.5, 1, 1.5, 2, 5],
  labelNames: ['statusCode', 'method', 'pathname'] as const,
});
