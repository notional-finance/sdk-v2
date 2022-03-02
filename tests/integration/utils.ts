import hre, {ethers} from 'hardhat';

require('dotenv').config();

export const getAccount = async (account: string) => {
  await hre.network.provider.request({method: 'hardhat_impersonateAccount', params: [account]});
  return ethers.getSigner(account);
};

export const getMostRecentForkableBlock = async (
  jsonRpcUrl: string = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
) => {
  const rpcProvider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
  if (jsonRpcUrl.includes('eth')) {
    return (await rpcProvider.getBlockNumber()) - 10;
  }
  if (jsonRpcUrl.includes('arbitrum')) {
    return (await rpcProvider.getBlockNumber()) - 30;
  }
  return (await rpcProvider.getBlockNumber()) - 10;
};

export const setChainState = async (
  block: number,
  jsonRpcUrl: string = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
) => {
  if (!block) {
    return hre.network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl,
            blockNumber: await getMostRecentForkableBlock(jsonRpcUrl),
          },
        },
      ],
    });
  }
  if (block === 0) {
    return hre.network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl,
          },
        },
      ],
    });
  }
  return hre.network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: {
          jsonRpcUrl,
          blockNumber: block,
        },
      },
    ],
  });
};
