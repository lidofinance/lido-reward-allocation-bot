import { SimpleFallbackJsonRpcBatchProvider } from '@lido-nestjs/execution';


export abstract class RpcProvider extends SimpleFallbackJsonRpcBatchProvider {
    clone(): RpcProvider {
        throw new Error('Method is not implemented');
    }
}

export abstract class RpcBatchProvider extends SimpleFallbackJsonRpcBatchProvider {
    clone(): RpcBatchProvider {
        throw new Error('Method is not implemented');
    }
}