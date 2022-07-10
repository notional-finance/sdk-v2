import { BigNumber, ethers } from 'ethers';
import { Contracts, TypedBigNumber } from '..';
import GraphClient from '../GraphClient';
import { ConfigKeys, getBlockchainData } from './BlockchainCalls';
import { getSystemConfig } from './SubgraphCalls';
import { decodeSystem, encodeSystem, System } from './SystemProto';

export async function fetchAndEncodeSystem(
  graphClient: GraphClient,
  provider: ethers.providers.JsonRpcBatchProvider,
  contracts: Contracts
) {
  const config = await getSystemConfig(graphClient);
  const { blockNumber, results } = await getBlockchainData(provider, contracts, config);
  const network = await provider.getNetwork();
  const block = await provider.getBlock(blockNumber.toNumber());

  const systemObject: System = {
    network: network.name === 'homestead' ? 'mainnet' : network.name,
    lastUpdateBlockNumber: block.number,
    lastUpdateTimestamp: block.timestamp,
    USDExchangeRates: {},
    StakedNoteParameters: {
      poolId: results[ConfigKeys.sNOTE.POOL_ID],
      coolDownTimeInSeconds: results[ConfigKeys.sNOTE.COOL_DOWN_TIME_SECS],
      redeemWindowSeconds: results[ConfigKeys.sNOTE.REDEEM_WINDOW_SECONDS],
      ethBalance: results[ConfigKeys.sNOTE.POOL_TOKEN_BALANCES].ethBalance,
      noteBalance: results[ConfigKeys.sNOTE.POOL_TOKEN_BALANCES].noteBalance,
      balancerPoolTotalSupply: results[ConfigKeys.sNOTE.POOL_TOTAL_SUPPLY],
      sNOTEBptBalance: results[ConfigKeys.sNOTE.POOL_TOKEN_SHARE],
      swapFee: results[ConfigKeys.sNOTE.POOL_SWAP_FEE],
      sNOTETotalSupply: results[ConfigKeys.sNOTE.TOTAL_SUPPLY],
    },
    currencies: {},
    ethRateData: {},
    assetRateData: {},
    nTokenData: {},
    cashGroups: {},
  };

  return encodeSystem(systemObject);
}

export function decode(binary: Uint8Array) {
  return _decodeValue(decodeSystem(binary));
}

function _decodeValue(val: any) {
  if (typeof val !== 'object') {
    return val;
  } else if (val.hasOwnProperty('_isBigNumber') && val._isBigNumber) {
    return BigNumber.from(val);
  } else if (val.hasOwnProperty('_isTypedBigNumber') && val._isTypedBigNumber) {
    return TypedBigNumber.fromObject(val);
  } else if (Array.isArray(val)) {
    return val.map(_decodeValue);
  } else {
    // This is an object, recurse through it to decode nested properties
    for (const key in val) {
      val[key] = _decodeValue(val[key]);
    }
    return val;
  }
}
