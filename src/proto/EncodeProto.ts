import { BigNumber, ethers } from 'ethers';
import { SystemData } from '.';
import { Contracts, TypedBigNumber } from '..';
import GraphClient from '../GraphClient';
import { ConfigKeys, getBlockchainData } from './BlockchainCalls';
import { getUSDPriceData } from './ExchangeRateCalls';
import { getSystemConfig } from './SubgraphCalls';
import { decodeSystemData, encodeSystemData, SystemData as _SystemData } from './SystemProto';
import { fetch as crossFetch } from 'cross-fetch';

import IAggregatorABI from '../abi/IAggregator.json';
import AssetRateAggregatorABI from '../abi/AssetRateAggregator.json';
import ERC20ABI from '../abi/ERC20.json';
import nTokenERC20ABI from '../abi/nTokenERC20.json';

export async function fetchAndEncodeSystem(
  graphClient: GraphClient,
  provider: ethers.providers.JsonRpcBatchProvider,
  contracts: Contracts
) {
  const config = await getSystemConfig(graphClient);
  const { blockNumber, results } = await getBlockchainData(provider, contracts, config);
  const network = await provider.getNetwork();
  const block = await provider.getBlock(blockNumber.toNumber());
  const usdExchangeRates = await getUSDPriceData();

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
      obj[c.currencyId] = c;
      return obj;
    }, {}),
    ethRateData: config.reduce((obj, c) => {
      obj[c.currencyId] = {
        ...c.ethExchangeRate,
        latestRate: results[ConfigKeys.ETH_EXCHANGE_RATE(c.currencyId)],
      };
      return obj;
    }, {}),
    assetRateData: config.reduce((obj, c) => {
      obj[c.currencyId] = {
        ...c.assetExchangeRate,
        latestRate: results[ConfigKeys.ASSET_EXCHANGE_RATE(c.currencyId)],
        annualSupplyRate: results[ConfigKeys.ASSET_ANNUAL_SUPPLY_RATE(c.currencyId)],
      };
      return obj;
    }, {}),
    nTokenData: config.reduce((obj, c) => {
      obj[c.currencyId] = {
        ...c.nToken,
        ...results[ConfigKeys.NTOKEN_ACCOUNT(c.currencyId)],
        ...results[ConfigKeys.NTOKEN_PORTFOLIO(c.currencyId)],
        assetCashPV: results[ConfigKeys.NTOKEN_PRESENT_VALUE(c.currencyId)],
      };
      return obj;
    }, {}),
    cashGroups: config.reduce((obj, c) => {
      obj[c.currencyId] = {
        ...c.cashGroup,
        markets: results[ConfigKeys.MARKETS(c.currencyId)],
      };
      return obj;
    }, {}),
  };

  return encodeSystemData(systemObject);
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
    if (value) return decode(value, provider);
  }

  throw Error('Could not fetch system');
}

export function decode(binary: Uint8Array, provider: ethers.providers.Provider): SystemData {
  return _decodeValue(decodeSystemData(binary), provider);
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
  } else if (val.hasOwnProperty('_isBigNumber') && val._isBigNumber) {
    return BigNumber.from(val);
  } else if (val.hasOwnProperty('_isTypedBigNumber') && val._isTypedBigNumber) {
    return TypedBigNumber.fromObject(val);
  } else if (val.hasOwnProperty('_isSerializedContract') && val._isSerializedContract) {
    return new ethers.Contract(val._address, _getABI(val._abiName), provider);
  } else if (Array.isArray(val)) {
    return val.map((v) => _decodeValue(v, provider));
  } else {
    // This is an object, recurse through it to decode nested properties
    for (const key in val) {
      val[key] = _decodeValue(val[key], provider);
    }
    return val;
  }
}
