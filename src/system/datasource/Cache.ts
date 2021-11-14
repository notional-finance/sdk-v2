import {BigNumber} from 'ethers';
import EventEmitter from 'eventemitter3';
import fetch from 'cross-fetch';
import {DataSource} from '.';
import TypedBigNumber from '../../libs/TypedBigNumber';
import {SystemEvents} from '../System';
import CashGroup from '../CashGroup';

export default class Cache extends DataSource {
  private cacheURL: string;

  constructor(
    chainId: number,
    protected cashGroups: Map<number, CashGroup>,
    protected eventEmitter: EventEmitter,
    public refreshIntervalMS: number,
  ) {
    super(eventEmitter, refreshIntervalMS);
    switch (chainId) {
      case 1:
        this.cacheURL = 'https://api.notional.finance/v1/system';
        break;
      case 42:
        this.cacheURL = 'https://kovan.api.notional.finance/v1/system';
        break;
      case 9999:
        // This is used to bypass the error during mocks
        this.cacheURL = '';
        break;
      default:
        throw Error('Unknown cache url');
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
    const result = await fetch(this.cacheURL);
    if (result.status >= 400) throw Error(`Error from cache server ${this.cacheURL}`);
    return result.text();
  }

  async refreshData() {
    const parsedObject = JSON.parse(await this.getCacheData(), this.parseMap);

    parsedObject.cashGroups.forEach((value: any, key: number) => {
      const currentCashGroup = this.cashGroups.get(key);
      if (!currentCashGroup) throw Error(`Configuration mismatch during refresh for cash group ${key}`);
      /* eslint-disable no-underscore-dangle */
      const newBlockSupplyRate = BigNumber.from(value._blockSupplyRate);

      if (currentCashGroup.blockSupplyRate !== newBlockSupplyRate.toNumber()) {
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

    parsedObject.ethRateData.forEach((value: any, key: number) => {
      this.ethRateData.set(key, BigNumber.from(value));
      this.eventEmitter.emit(SystemEvents.ETH_RATE_UPDATE, key);
    });

    parsedObject.assetRateData.forEach((value: any, key: number) => {
      this.assetRateData.set(key, BigNumber.from(value));
      this.eventEmitter.emit(SystemEvents.ASSET_RATE_UPDATE, key);
    });

    parsedObject.nTokenAssetCashPV.forEach((value: any, key: number) => {
      this.nTokenAssetCashPV.set(key, TypedBigNumber.fromObject(value));
      this.eventEmitter.emit(SystemEvents.NTOKEN_PV_UPDATE, key);
    });

    parsedObject.nTokenTotalSupply.forEach((value: any, key: number) => {
      this.nTokenTotalSupply.set(key, TypedBigNumber.fromObject(value));
      this.eventEmitter.emit(SystemEvents.NTOKEN_SUPPLY_UPDATE, key);
    });

    parsedObject.nTokenIncentiveFactors.forEach((value: any, key: number) => {
      this.nTokenIncentiveFactors.set(key, {
        integralTotalSupply: BigNumber.from(value.integralTotalSupply),
        lastSupplyChangeTime: BigNumber.from(value.lastSupplyChangeTime),
      });
    });

    parsedObject.nTokenCashBalance.forEach((value: any, key: number) => {
      this.nTokenCashBalance.set(key, TypedBigNumber.fromObject(value));
      this.eventEmitter.emit(SystemEvents.NTOKEN_ACCOUNT_UPDATE, key);
    });

    parsedObject.nTokenLiquidityTokens.forEach((value: any, key: number) => {
      const newValues = value.map((v: any) => {
        const newValue = v;
        newValue.notional = TypedBigNumber.fromObject(v.notional);
        return newValue;
      });
      this.nTokenLiquidityTokens.set(key, newValues);
      this.eventEmitter.emit(SystemEvents.NTOKEN_ACCOUNT_UPDATE, key);
    });

    parsedObject.nTokenfCash.forEach((value: any, key: number) => {
      const newValues = value.map((v: any) => {
        const newValue = v;
        newValue.notional = TypedBigNumber.fromObject(v.notional);
        return newValue;
      });
      this.nTokenfCash.set(key, newValues);
      this.eventEmitter.emit(SystemEvents.NTOKEN_ACCOUNT_UPDATE, key);
    });

    this.lastUpdateBlockNumber = parsedObject.lastUpdateBlockNumber;
    this.lastUpdateTimestamp = parsedObject.lastUpdateTimestamp;
    this.eventEmitter.emit(SystemEvents.DATA_REFRESH);
  }
}
