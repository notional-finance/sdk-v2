import { BigNumber } from 'ethers';
import EventEmitter from 'eventemitter3';
import {DataSource} from '.';
import TypedBigNumber from '../../libs/TypedBigNumber';

export default class Cache extends DataSource {
  constructor(
    protected eventEmitter: EventEmitter,
    public refreshIntervalMS: number,
  ) {
    super(eventEmitter, refreshIntervalMS);
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
    return {}
  }

  async refreshData() {
    const parsedObject = JSON.parse(await this.getCacheData(), this.parseMap)
    parsedObject.ethRateData.forEach((value: any, key: number) => {
      this.ethRateData.set(key, BigNumber.from(value))
    })
    parsedObject.assetRateData.forEach((value: any, key: number) => {
      this.assetRateData.set(key, BigNumber.from(value))
    })
    parsedObject.nTokenAssetCashPV.forEach((value: any, key: number) => {
      this.nTokenAssetCashPV.set(key, TypedBigNumber.fromObject(value))
    })
    parsedObject.nTokenTotalSupply.forEach((value: any, key: number) => {
      this.nTokenTotalSupply.set(key, TypedBigNumber.fromObject(value))
    })
    parsedObject.nTokenIncentiveFactors.forEach((value: any, key: number) => {
      this.nTokenIncentiveFactors.set(key, {
        integralTotalSupply: BigNumber.from(value.integralTotalSupply),
        lastSupplyChangeTime: BigNumber.from(value.lastSupplyChangeTime)
      })
    })
    parsedObject.nTokenCashBalance.forEach((value: any, key: number) => {
      this.nTokenCashBalance.set(key, TypedBigNumber.fromObject(value))
    })
    parsedObject.nTokenLiquidityTokens.forEach((value: any, key: number) => {
      const newValues = value.map((v: any) => {
        v.notional = TypedBigNumber.fromObject(v.notional)
        return v
      })
      this.nTokenLiquidityTokens.set(key, newValues)
    })
    parsedObject.nTokenfCash.forEach((value: any, key: number) => {
      const newValues = value.map((v: any) => {
        v.notional = TypedBigNumber.fromObject(v.notional)
        return v
      })
      this.nTokenfCash.set(key, newValues)
    })
    this.lastUpdateBlockNumber = parsedObject.lastUpdateBlockNumber
    this.lastUpdateTimestamp = parsedObject.lastUpdateTimestamp
  }
}
