import { server } from 'ganache';
import { CHAINS } from '@lido-sdk/constants';

export const startServer = (startBlock: number) => {
  const rpcUrl = process.env.RPC_URL;
  const secretKey = process.env.WALLET_PRIVATE_KEY;

  return server({
    chainId: CHAINS.Mainnet,
    locked: false,
    fork: `${rpcUrl}@${startBlock}`,
    logger: { log: () => void 0 },
    accounts: [{ secretKey, balance: 1e18 }],
  });
};
