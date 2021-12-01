import { APP_NAME } from 'app/app.constants';

export const METRICS_URL = 'metrics';
export const METRICS_PREFIX = `${APP_NAME.replace(/-|\ /g, '_')}_`;

export const METRIC_BUILD_INFO = `${METRICS_PREFIX}build_info`;

export const METRIC_RPC_REQUEST_DURATION = `${METRICS_PREFIX}rpc_requests_duration_seconds`;
export const METRIC_RPC_REQUEST_ERRORS = `${METRICS_PREFIX}rpc_requests_errors_total`;

export const METRIC_ACCOUNT_BALANCE = `${METRICS_PREFIX}account_balance`;

export const METRIC_MANIFEST_REQUEST_DURATION = `${METRICS_PREFIX}manifest_requests_duration_seconds`;
export const METRIC_MANIFEST_REQUEST_RESULT = `${METRICS_PREFIX}manifest_requests_result`;
export const METRIC_MANIFEST_REQUEST_COUNTER = `${METRICS_PREFIX}manifest_requests_total`;

export const METRIC_TRANSACTION_COUNTER = `${METRICS_PREFIX}transaction_total`;
