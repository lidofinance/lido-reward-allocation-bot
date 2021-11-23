import { CallOverrides } from 'ethereum/provider';

export type MetricRawRequest = ContractMethodCall;
export type AutomationRequest = ContractMethodCall;

export interface ContractMethodCall {
  type: 'contractMethodCall';
  address: string;
  method: string;
  args?: any[];
}

export type MetricRequest = (payload?: MetricRequestPayload) => unknown;

export interface MetricRequestPayload {
  overrides?: CallOverrides;
}
