import { APP_NAME } from 'app.constants';

export const METRICS_URL = 'metrics';
export const METRICS_PREFIX = `${APP_NAME.replace(/-|\ /g, '_')}_`;

export const METRIC_RPC_REQUEST_DURATION = `${METRICS_PREFIX}rpc_requests_duration_seconds`;
export const METRIC_RPC_REQUEST_ERRORS = `${METRICS_PREFIX}rpc_requests_errors_total`;

export const METRIC_ACCOUNT_BALANCE = `${METRICS_PREFIX}account_balance`;
