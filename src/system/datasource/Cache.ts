import { BigNumber } from 'ethers';
import EventEmitter from 'eventemitter3';
import { fetch as crossFetch } from 'cross-fetch';
import fetchRetry from 'fetch-retry';
import { DataSource } from '.';
import TypedBigNumber from '../../libs/TypedBigNumber';
import System, { SystemEvents } from '../System';
import CashGroup from '../CashGroup';
import { NOTE_CURRENCY_ID } from '../../config/constants';
import NoteETHRateProvider from '../NoteETHRateProvider';

export default class Cache extends DataSource {
  private cacheURL: string | null;

  private retry: any;

  constructor(
    chainId: number,
    protected cashGroups: Map<number, CashGroup>,
    protected eventEmitter: EventEmitter,
    public refreshIntervalMS: number,
    skipFetchSetup = false
  ) {
    super(eventEmitter, refreshIntervalMS);
    switch (chainId) {
      case 1:
        this.cacheURL = 'https://api.notional.finance/v1/system';
        break;
      case 5:
        this.cacheURL = 'https://goerli.api.notional.finance/v1/system';
        break;
      case 42:
        this.cacheURL = 'https://kovan.api.notional.finance/v1/system';
        break;
      case 9999:
        // This is used to bypass the error during mocks
        this.cacheURL = null;
        break;
      default:
        throw Error('Unknown cache url');
    }

    if (skipFetchSetup) {
      this.retry = fetchRetry(fetch);
    } else {
      this.retry = fetchRetry(crossFetch);
    }
  }

  private parseMap(_: any, value: any) {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
    }

    return value;
  }

  async getCacheData(): Promise<any> {
    if (this.cacheURL === null) return '{}';
    const result = await this.retry(this.cacheURL, {
      retries: 3,
      retryDelay: (attempt: number) => 2 ** attempt * 1000,
    });
    if (result.status >= 400) throw Error(`Error from cache server ${this.cacheURL}`);
    return result.text();
  }

  async refreshData() {
    if (this.cacheURL === null) return;
    const parsedObject = JSON.parse(await this.getCacheData(), this.parseMap);
    const sNOTEParams = parsedObject.dataSource.stakedNoteParameters;
    this.stakedNoteParameters = {
      poolId: sNOTEParams.poolId,
      coolDownTimeInSeconds: sNOTEParams.coolDownTimeInSeconds,
      redeemWindowSeconds: sNOTEParams.redeemWindowSeconds,
      ethBalance: TypedBigNumber.fromObject(sNOTEParams.ethBalance),
      noteBalance: TypedBigNumber.fromObject(sNOTEParams.noteBalance),
      balancerPoolTotalSupply: BigNumber.from(sNOTEParams.balancerPoolTotalSupply),
      sNOTEBptBalance: BigNumber.from(sNOTEParams.sNOTEBptBalance),
      swapFee: BigNumber.from(sNOTEParams.swapFee),
      sNOTETotalSupply: TypedBigNumber.fromObject(sNOTEParams.sNOTETotalSupply),
    };

    parsedObject.cashGroups.forEach((value: any, key: number) => {
      const currentCashGroup = this.cashGroups.get(key);
      if (!currentCashGroup) throw Error(`Configuration mismatch during refresh for cash group ${key}`);
      /* eslint-disable no-underscore-dangle */
      const newBlockSupplyRate = Number(value._blockSupplyRate);

      if (currentCashGroup.blockSupplyRate !== newBlockSupplyRate) {
        this.eventEmitter.emit(SystemEvents.BLOCK_SUPPLY_RATE_UPDATE, key);
        currentCashGroup.setBlockSupplyRate(newBlockSupplyRate);
      }

      value.markets.forEach((m, i) => {
        const marketValue = {
          totalfCash: BigNumber.from(m._market.totalfCash),
          totalAssetCash: BigNumber.from(m._market.totalAssetCash),
          totalLiquidity: BigNumber.from(m._market.totalLiquidity),
          lastImpliedRate: BigNumber.from(m._market.lastImpliedRate),
          oracleRate: BigNumber.from(m._market.oracleRate),
          previousTradeTime: BigNumber.from(m._market.previousTradeTime),
        };
        const hasChanged = currentCashGroup.markets[i].setMarket(marketValue);
        if (hasChanged) {
          this.eventEmitter.emit(SystemEvents.MARKET_UPDATE, currentCashGroup.markets[i].marketKey);
        }
        /* eslint-enable no-underscore-dangle */
      });
    });

    parsedObject.dataSource.ethRateData.forEach((value: any, key: number) => {
      this.ethRateData.set(key, BigNumber.from(value));
      this.eventEmitter.emit(SystemEvents.ETH_RATE_UPDATE, key);
    });

    parsedObject.dataSource.assetRateData.forEach((value: any, key: number) => {
      this.assetRateData.set(key, BigNumber.from(value));
      this.eventEmitter.emit(SystemEvents.ASSET_RATE_UPDATE, key);
    });

    parsedObject.dataSource.nTokenAssetCashPV.forEach((value: any, key: number) => {
      this.nTokenAssetCashPV.set(key, TypedBigNumber.fromObject(value));
      this.eventEmitter.emit(SystemEvents.NTOKEN_PV_UPDATE, key);
    });

    parsedObject.dataSource.nTokenTotalSupply.forEach((value: any, key: number) => {
      this.nTokenTotalSupply.set(key, TypedBigNumber.fromObject(value));
      this.eventEmitter.emit(SystemEvents.NTOKEN_SUPPLY_UPDATE, key);
    });

    parsedObject.dataSource.nTokenIncentiveFactors.forEach((value: any, key: number) => {
      this.nTokenIncentiveFactors.set(key, {
        accumulatedNOTEPerNToken: BigNumber.from(value.accumulatedNOTEPerNToken),
        lastAccumulatedTime: BigNumber.from(value.lastAccumulatedTime),
      });
    });

    parsedObject.dataSource.nTokenCashBalance.forEach((value: any, key: number) => {
      this.nTokenCashBalance.set(key, TypedBigNumber.fromObject(value));
      this.eventEmitter.emit(SystemEvents.NTOKEN_ACCOUNT_UPDATE, key);
    });

    parsedObject.dataSource.nTokenLiquidityTokens.forEach((value: any, key: number) => {
      const newValues = value.map((v: any) => {
        const newValue = v;
        newValue.notional = TypedBigNumber.fromObject(v.notional);
        return newValue;
      });
      this.nTokenLiquidityTokens.set(key, newValues);
      this.eventEmitter.emit(SystemEvents.NTOKEN_ACCOUNT_UPDATE, key);
    });

    parsedObject.dataSource.nTokenfCash.forEach((value: any, key: number) => {
      const newValues = value.map((v: any) => {
        const newValue = v;
        newValue.notional = TypedBigNumber.fromObject(v.notional);
        return newValue;
      });
      this.nTokenfCash.set(key, newValues);
      this.eventEmitter.emit(SystemEvents.NTOKEN_ACCOUNT_UPDATE, key);
    });

    const noteETHProvider = parsedObject.ethRateProviders.get(NOTE_CURRENCY_ID);
    // eslint-disable-next-line no-underscore-dangle
    const noteUSDPrice = BigNumber.from(noteETHProvider._noteUSDPrice);
    System.getSystem().setETHRateProvider(NOTE_CURRENCY_ID, new NoteETHRateProvider(noteUSDPrice));

    this.lastUpdateBlockNumber = parsedObject.lastUpdateBlockNumber;
    this.lastUpdateTimestamp = parsedObject.lastUpdateTimestamp;
    this.eventEmitter.emit(SystemEvents.DATA_REFRESH);
  }
}
