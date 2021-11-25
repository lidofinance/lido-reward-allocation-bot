import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';
import {
  METRIC_RPC_REQUEST_ERRORS,
  METRIC_RPC_REQUEST_DURATION,
  METRIC_ACCOUNT_BALANCE,
  METRIC_MANIFEST_REQUEST_COUNTER,
  METRIC_MANIFEST_REQUEST_DURATION,
  METRIC_MANIFEST_REQUEST_RESULT,
} from './prometheus.constants';

export const PrometheusRPCRequestsHistogramProvider = makeHistogramProvider({
  name: METRIC_RPC_REQUEST_DURATION,
  help: 'RPC request duration',
  buckets: [0.1, 0.2, 0.3, 0.6, 1, 1.5, 2, 5],
});

export const PrometheusRPCErrorsCounterProvider = makeCounterProvider({
  name: METRIC_RPC_REQUEST_ERRORS,
  help: 'Number of RPC requests errors',
});

export const PrometheusAccountBalanceProvider = makeGaugeProvider({
  name: METRIC_ACCOUNT_BALANCE,
  help: 'Account balance',
});

export const PrometheusManifestRequestsHistogramProvider =
  makeHistogramProvider({
    name: METRIC_MANIFEST_REQUEST_DURATION,
    help: 'Metric request duration',
    buckets: [0.1, 0.2, 0.3, 0.6, 1, 1.5, 2, 5],
    labelNames: ['manifestName', 'manifestVersion', 'metric'],
  });

export const PrometheusManifestRequestsResultProvider = makeGaugeProvider({
  name: METRIC_MANIFEST_REQUEST_RESULT,
  help: 'Manifest metric values',
  labelNames: ['manifestName', 'manifestVersion', 'metric'],
});

export const PrometheusManifestRequestsCounterProvider = makeCounterProvider({
  name: METRIC_MANIFEST_REQUEST_COUNTER,
  help: 'Number of manifest metric requests',
  labelNames: ['manifestName', 'manifestVersion', 'metric', 'status'],
});
