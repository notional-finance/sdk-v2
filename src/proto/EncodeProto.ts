import { BigNumber, ethers } from 'ethers';
import { fetch as crossFetch } from 'cross-fetch';
import { SystemData } from '.';
import TypedBigNumber from '../libs/TypedBigNumber';
import GraphClient from '../GraphClient';
import { Contracts } from '../libs/types';
import { ConfigKeys, getBlockchainData } from './BlockchainCalls';
import getUSDPriceData from './ExchangeRateCalls';
import { getSystemConfig } from './SubgraphCalls';
import { decodeSystemData, encodeSystemData, SystemData as _SystemData } from './SystemProto';

import IAggregatorABI from '../abi/IAggregator.json';
import AssetRateAggregatorABI from '../abi/AssetRateAggregator.json';
import ERC20ABI from '../abi/ERC20.json';
import nTokenERC20ABI from '../abi/nTokenERC20.json';

export async function fetchAndEncodeSystem(
  graphClient: GraphClient,
  provider: ethers.providers.JsonRpcBatchProvider,
  contracts: Contracts,
  skipFetchSetup: boolean
) {
  const config = await getSystemConfig(graphClient);
  const { blockNumber, results } = await getBlockchainData(provider, contracts, config);
  const network = await provider.getNetwork();
  const block = await provider.getBlock(blockNumber.toNumber());
  const usdExchangeRates = await getUSDPriceData(skipFetchSetup);

  const systemObject: _SystemData = {
    network: network.name === 'homestead' ? 'mainnet' : network.name,
    lastUpdateBlockNumber: block.number,
    lastUpdateTimestamp: block.timestamp,
    USDExchangeRates: usdExchangeRates,
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
    currencies: config.reduce((obj, c) => {
      const ret = obj;
      ret[c.id] = c;
      return ret;
    }, {}),
    ethRateData: config.reduce((obj, c) => {
      const ret = obj;
      ret[c.id] = {
        ...c.ethExchangeRate,
        latestRate: c.id === 1 ? ethers.constants.WeiPerEther.toJSON() : results[ConfigKeys.ETH_EXCHANGE_RATE(c.id)],
      };
      return ret;
    }, {}),
    assetRateData: config.reduce((obj, c) => {
      const ret = obj;
      ret[c.id] = {
        ...c.assetExchangeRate,
        latestRate: results[ConfigKeys.ASSET_EXCHANGE_RATE(c.id)],
        annualSupplyRate: results[ConfigKeys.ASSET_ANNUAL_SUPPLY_RATE(c.id)],
      };
      return ret;
    }, {}),
    nTokenData: config.reduce((obj, c) => {
      const ret = obj;
      ret[c.id] = {
        ...c.nToken,
        ...results[ConfigKeys.NTOKEN_ACCOUNT(c.id)],
        ...results[ConfigKeys.NTOKEN_PORTFOLIO(c.id)],
        assetCashPV: results[ConfigKeys.NTOKEN_PRESENT_VALUE(c.id)],
      };
      return ret;
    }, {}),
    cashGroups: config.reduce((obj, c) => {
      const ret = obj;
      ret[c.id] = {
        ...c.cashGroup,
        markets: results[ConfigKeys.MARKETS(c.id)],
      };
      return ret;
    }, {}),
  };

  const binary = encodeSystemData(systemObject);
  const json = JSON.stringify(decodeSystemData(binary));
  return { binary, json };
}

function _getABI(name: string) {
  switch (name) {
    case 'ERC20':
      return ERC20ABI;
    case 'nTokenERC20':
      return nTokenERC20ABI;
    case 'IAggregator':
      return IAggregatorABI;
    case 'AssetRateAggregator':
      return AssetRateAggregatorABI;
    default:
      throw Error(`Unknown abi ${name}`);
  }
}

function _decodeValue(val: any, provider: ethers.providers.Provider) {
  if (typeof val !== 'object') {
    return val;
  }
  if (Object.prototype.hasOwnProperty.call(val, '_isBigNumber') && val._isBigNumber) {
    return BigNumber.from(val);
  }
  if (Object.prototype.hasOwnProperty.call(val, '_isTypedBigNumber') && val._isTypedBigNumber) {
    return TypedBigNumber.fromObject(val);
  }
  if (Object.prototype.hasOwnProperty.call(val, '_isSerializedContract') && val._isSerializedContract) {
    return new ethers.Contract(val._address, _getABI(val._abiName), provider);
  }
  if (Array.isArray(val)) {
    return val.map((v) => _decodeValue(v, provider));
  }

  // This is an object, recurse through it to decode nested properties
  const newVal = val;
  Object.keys(newVal).forEach((key) => {
    newVal[key] = _decodeValue(newVal[key], provider);
  });
  return newVal;
}

function _encodeMap(decoded: any) {
  // Coverts records to maps so that we can use .get on them and get type checking
  const mapped = decoded;
  mapped.USDExchangeRates = new Map(Object.entries(decoded.USDExchangeRates));
  mapped.currencies = new Map(Object.entries(decoded.currencies).map(([k, v]) => [Number(k), v]));
  mapped.ethRateData = new Map(Object.entries(decoded.ethRateData).map(([k, v]) => [Number(k), v]));
  mapped.assetRateData = new Map(Object.entries(decoded.assetRateData).map(([k, v]) => [Number(k), v]));
  mapped.nTokenData = new Map(Object.entries(decoded.nTokenData).map(([k, v]) => [Number(k), v]));
  mapped.cashGroups = new Map(Object.entries(decoded.cashGroups).map(([k, v]) => [Number(k), v]));
  return mapped;
}

export function decodeJSON(json: any, provider: ethers.providers.Provider): SystemData {
  return _encodeMap(_decodeValue(json, provider));
}

export function decodeBinary(binary: Uint8Array, provider: ethers.providers.Provider): SystemData {
  return decodeJSON(decodeSystemData(binary), provider);
}

export async function fetchAndDecodeSystem(
  cacheUrl: string,
  provider: ethers.providers.Provider,
  skipFetchSetup: boolean
) {
  const _fetch = skipFetchSetup ? fetch : crossFetch;
  const resp = await _fetch(cacheUrl);
  const reader = resp.body?.getReader();
  if (reader) {
    const { value } = await reader.read();
    if (value) return decodeBinary(value, provider);
  }

  throw Error('Could not fetch system');
}
