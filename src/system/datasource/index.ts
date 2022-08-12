import { BigNumber } from 'ethers';
import EventEmitter from 'eventemitter3';
import TypedBigNumber from '../../libs/TypedBigNumber';
import { Asset, IncentiveFactors, StakedNoteParameters } from '../../libs/types';

export enum DataSourceType {
  Blockchain,
  Cache,
}

export type Newable<T> = { new (...args: any[]): T };

export abstract class DataSource {
  public ethRateData = new Map<number, BigNumber>();

  public assetRateData = new Map<number, BigNumber>();

  public nTokenAssetCashPV = new Map<number, TypedBigNumber>();

  public nTokenTotalSupply = new Map<number, TypedBigNumber>();

  public nTokenIncentiveFactors = new Map<number, IncentiveFactors>();

  public nTokenCashBalance = new Map<number, TypedBigNumber>();

  public nTokenLiquidityTokens = new Map<number, Asset[]>();

  public nTokenfCash = new Map<number, Asset[]>();

  public stakedNoteParameters = {} as StakedNoteParameters;

  public lastUpdateBlockNumber = 0;

  public lastUpdateTimestamp = new Date(0);

  constructor(protected eventEmitter: EventEmitter, public refreshIntervalMS: number) {}

  startRefresh() {
    // Kick off the initial refresh of data
    this.refreshData();
    if (this.refreshIntervalMS > 0) {
      return setInterval(async () => {
        await this.refreshData();
      }, this.refreshIntervalMS);
    }
    return undefined;
  }

  abstract refreshData(): Promise<void>;
}
