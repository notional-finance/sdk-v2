import hre, { ethers } from 'hardhat';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
require('dotenv').config();

export const getAccount = async (account: string) => {
  await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: [account] });
  return await ethers.getSigner(account);
};

export const getMostRecentForkableBlock = async (
  jsonRpcUrl: string = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
) => {
  const rpcProvider = new ethers.providers.JsonRpcProvider(jsonRpcUrl);
  if (jsonRpcUrl.includes('eth')) {
    return (await rpcProvider.getBlockNumber()) - 10;
  } else if (jsonRpcUrl.includes('arbitrum')) {
    return (await rpcProvider.getBlockNumber()) - 30;
  } else {
    return (await rpcProvider.getBlockNumber()) - 10;
  }
};

export const setChainState = async (
  hre: HardhatRuntimeEnvironment,
  block: number,
  jsonRpcUrl: string = `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`,
) => {
  if (!block) {
    return await hre.network.provider.request({
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
  } else if (block === 0) {
    return await hre.network.provider.request({
      method: 'hardhat_reset',
      params: [
        {
          forking: {
            jsonRpcUrl,
          },
        },
      ],
    });
  } else {
    return await hre.network.provider.request({
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
  }
};
