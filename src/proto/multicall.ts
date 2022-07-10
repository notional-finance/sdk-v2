import { Contract, providers, utils } from 'ethers';
import { Result } from 'ethers/lib/utils';
import { Multicall2 } from '../typechain/Multicall2';
const Multicall2ABI = require('../abi/Multicall2.json');

const MULTICALL2 = {
  mainnet: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  kovan: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  rinkeby: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  gorli: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
  ropsten: '0x5ba1e12693dc8f9c48aad8770482f4739beed696',
};

export interface AggregateCall {
  // Contract to target in the call
  target: Contract;
  // Function fragment to get the corresponding interface
  method: string | utils.FunctionFragment;
  // Arguments to call the method with
  args: any[];
  // Key to lookup the result from the aggregate
  key: string;
  // Transform to apply to decoded result
  transform?: (result: Result) => any;
}

export async function aggregate(calls: AggregateCall[], provider: providers.Provider, multicall?: Multicall2) {
  if (!multicall) {
    const network = await provider.getNetwork();
    const networkName = network.name === 'homestead' ? 'mainnet' : network.name;
    multicall = new Contract(MULTICALL2[networkName], Multicall2ABI, provider) as Multicall2;
  }

  const aggregateCall = calls.map((c) => {
    return {
      target: c.target.address,
      callData: c.target.interface.encodeFunctionData(c.method, c.args),
    };
  });

  const { blockNumber, returnData } = await multicall.callStatic.aggregate(aggregateCall);
  const results = returnData.reduce((obj, r, i) => {
    const { key, method, target, transform } = calls[i];
    const decoded = target.interface.decodeFunctionResult(method, r);
    obj[key] = transform ? transform(decoded) : decoded;
    return obj;
  }, {});

  return { blockNumber, results };
}
