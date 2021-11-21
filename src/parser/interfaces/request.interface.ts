import { CallOverrides } from 'provider';

export type MetricRawRequest = ContractMethodCall;
export type AutomationRequest = ContractMethodCall;

export interface ContractMethodCall {
  type: 'contractMethodCall';
  address: string;
  method: string;
  args?: any[];
}

export type MetricRequest = (overrides?: CallOverrides) => any;
