import { gql } from '@apollo/client/core';
import { BigNumber, ethers } from 'ethers';
import EventEmitter from 'eventemitter3';
import {
  Asset,
  AssetRate,
  AssetType,
  Contracts,
  Currency,
  EthRate,
  IncentiveMigration,
  nToken,
  SettlementMarket,
  StakedNoteParameters,
} from '../libs/types';
import { getNowSeconds } from '../libs/utils';
import { DEFAULT_DATA_REFRESH_INTERVAL } from '../config/constants';

import { ERC20 } from '../typechain/ERC20';
import GraphClient from '../GraphClient';
import CashGroup from './CashGroup';
import Market from './Market';
import TypedBigNumber, { BigNumberType } from '../libs/TypedBigNumber';
import NoteETHRateProvider from './NoteETHRateProvider';
import { fetchAndDecodeSystem } from '../proto/EncodeProto';
import { SystemDataExport } from '../proto/SystemProto';

export enum SystemEvents {
  CONFIGURATION_UPDATE = 'CONFIGURATION_UPDATE',
  DATA_REFRESH = 'DATA_REFRESH',
  MARKET_UPDATE = 'MARKET_UPDATE',
  NTOKEN_PV_UPDATE = 'NTOKEN_PV_UPDATE',
  NTOKEN_SUPPLY_UPDATE = 'NTOKEN_SUPPLY_UPDATE',
  NTOKEN_ACCOUNT_UPDATE = 'NTOKEN_ACCOUNT_UPDATE',
  ASSET_RATE_UPDATE = 'ASSET_RATE_UPDATE',
  BLOCK_SUPPLY_RATE_UPDATE = 'BLOCK_SUPPLY_RATE_UPDATE',
  ETH_RATE_UPDATE = 'ETH_RATE_UPDATE',
  NOTE_PRICE_UPDATE = 'NOTE_PRICE_UPDATE',
}

const settlementMarketsQuery = gql`
  query getMarketsAt($currencyId: String!, $settlementDate: Int!) {
    markets(where: { currency: $currencyId, settlementDate: $settlementDate }) {
      id
      maturity
      totalfCash
      totalAssetCash
      totalLiquidity
    }
  }
`;

interface SettlementMarketsQueryResponse {
  markets: {
    id: string;
    maturity: number;
    totalfCash: string;
    totalAssetCash: string;
    totalLiquidity: string;
  }[];
}

const settlementRateQuery = gql`
  query getSettlementRate($currencyId: String!, $maturity: Int!) {
    settlementRates(where: { maturity: $maturity, currency: $currencyId }) {
      id
      assetExchangeRate {
        id
      }
      maturity
      rate
    }
  }
`;

interface SettlementRateQueryResponse {
  settlementRates: {
    id: string;
    assetExchangeRate: {
      id: string;
    } | null;
    maturity: string;
    rate: string;
  }[];
}

interface IAssetRateProvider {
  getAssetRate(): BigNumber;
}

interface IMarketProvider {
  getMarket(): Market;
}

interface IETHRateProvider {
  getETHRate(): { ethRateConfig: EthRate; ethRate: BigNumber };
}

interface INTokenAssetCashPVProvider {
  getNTokenAssetCashPV(): TypedBigNumber;
}

export default class System {
  public eventEmitter = new EventEmitter();

  // eslint-disable-next-line no-use-before-define
  private static _systemInstance?: System;

  private data: SystemDataExport;

  public get lastUpdateBlockNumber() {
    return this.data.lastUpdateBlockNumber;
  }

  public get lastUpdateTimestamp() {
    return this.data.lastUpdateTimestamp;
  }

  public static getSystem() {
    if (!this._systemInstance) throw Error('System not initialized');
    return this._systemInstance;
  }

  public static overrideSystem(system: System) {
    // NOTE: this should only be used for testing
    this._systemInstance = system;
  }

  protected symbolToCurrencyId = new Map<string, number>();

  protected settlementRates = new Map<string, BigNumber>();

  protected settlementMarkets = new Map<string, SettlementMarket>();

  private dataRefreshInterval?: NodeJS.Timeout;

  private ethRateProviders = new Map<number, IETHRateProvider>();

  private assetRateProviders = new Map<number, IAssetRateProvider>();

  private nTokenAssetCashPVProviders = new Map<number, INTokenAssetCashPVProvider>();

  private marketProviders = new Map<string, IMarketProvider>();

  public static async load(
    cacheUrl: string,
    graphClient: GraphClient,
    contracts: Contracts,
    batchProvider: ethers.providers.JsonRpcBatchProvider,
    refreshIntervalMS = DEFAULT_DATA_REFRESH_INTERVAL
  ) {
    const initData = await fetchAndDecodeSystem(cacheUrl);
    return new System(cacheUrl, graphClient, contracts, batchProvider, refreshIntervalMS, initData);
  }

  constructor(
    public cacheUrl: string,
    public graphClient: GraphClient,
    private contracts: Contracts,
    public batchProvider: ethers.providers.JsonRpcBatchProvider,
    public refreshIntervalMS: number,
    initData: SystemDataExport
  ) {
    // eslint-disable-next-line no-underscore-dangle
    System._systemInstance = this;
    this.data = initData;
    // TODO: map symbol to currency id index
    this.dataRefreshInterval = setInterval(async () => {
      this.data = await fetchAndDecodeSystem(this.cacheUrl);
    }, this.refreshIntervalMS);
  }

  public destroy() {
    if (this.dataRefreshInterval) clearInterval(this.dataRefreshInterval);
    // eslint-disable-next-line no-underscore-dangle
    System._systemInstance = undefined;
  }

  /*** Contracts ***/

  public getNotionalProxy() {
    return this.contracts.notionalProxy;
  }

  public getNOTE() {
    return this.contracts.note;
  }

  public getStakedNote() {
    return this.contracts.sNOTE;
  }

  public getWETH() {
    return this.contracts.weth;
  }

  public getCOMP() {
    return this.contracts.comp;
  }

  public getTreasuryManager() {
    return this.contracts.treasury;
  }

  public getExchangeV3() {
    return this.contracts.exchangeV3;
  }

  /*** Staked NOTE ***/

  public getStakedNoteParameters(): StakedNoteParameters {
    this.data.StakedNoteParameters.ethBalance;
    this.data.network = 'asdf';
    throw Error('Staked NOTE Parameters not loaded');
  }

  /*** Currencies ***/
  public getAllCurrencies(): Currency[] {
    return Array.from(this.currencies.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  public getTradableCurrencies(): Currency[] {
    return this.getAllCurrencies().filter((c) => this.isTradable(c.id));
  }

  public getCurrencyBySymbol(symbol: string): Currency {
    const currencyId = this.symbolToCurrencyId.get(symbol);
    if (!currencyId) throw new Error(`Currency ${symbol} not found`);
    return this.getCurrencyById(currencyId);
  }

  public getTokenBySymbol(symbol: string): ERC20 {
    if (symbol === 'sNOTE') {
      return this.getStakedNote() as ERC20;
    }
    if (symbol === 'NOTE') {
      return this.getNOTE() as ERC20;
    }
    if (symbol === 'WETH') {
      return this.getWETH() as ERC20;
    }
    const currencyId = this.symbolToCurrencyId.get(symbol);
    if (!currencyId) throw new Error(`Currency ${symbol} not found`);
    const currency = this.getCurrencyById(currencyId);
    return currency.symbol === symbol ? currency.contract : currency.underlyingContract!;
  }

  public getCurrencyById(id: number): Currency {
    const currency = this.currencies.get(id);
    if (!currency) throw new Error(`Currency ${id} not found`);
    return currency;
  }

  public getUnderlyingSymbol(id: number): string {
    const currency = this.getCurrencyById(id);
    return currency.underlyingSymbol || currency.symbol;
  }

  public isTradable(currencyId: number): boolean {
    return this.cashGroups.has(currencyId);
  }

  /*** Cash Group and Market ***/

  public getCashGroup(currencyId: number): CashGroup {
    const cashGroup = this.cashGroups.get(currencyId);
    if (!cashGroup) throw new Error(`Cash group ${currencyId} not found`);

    const cashGroupCopy = CashGroup.copy(cashGroup);
    cashGroupCopy.markets = this.getMarkets(currencyId);
    return cashGroupCopy;
  }

  public getMarkets(currencyId: number): Market[] {
    const cashGroup = this.cashGroups.get(currencyId);
    if (!cashGroup) throw new Error(`Cash group ${currencyId} not found`);

    return cashGroup.markets.map((m) => this.marketProviders.get(m.marketKey)?.getMarket() ?? Market.copy(m));
  }

  /*** Exchange Rate Data ***/

  public getAssetRate(currencyId: number) {
    const underlyingDecimalPlaces = this.assetRate.get(currencyId)?.underlyingDecimalPlaces;
    const provider = this.assetRateProviders.get(currencyId);
    const assetRate = provider?.getAssetRate() ?? this.dataSource.assetRateData.get(currencyId);
    return { underlyingDecimalPlaces, assetRate };
  }

  public getETHProvider(currencyId: number) {
    return this.ethRateProviders.get(currencyId);
  }

  public getETHRate(currencyId: number) {
    const ethRateProvider = this.ethRateProviders.get(currencyId);
    if (ethRateProvider) {
      return ethRateProvider.getETHRate();
    }
    const ethRateConfig = this.ethRates.get(currencyId);
    const ethRate = this.dataSource.ethRateData.get(currencyId);
    return { ethRateConfig, ethRate };
  }

  /*** nToken Data ***/

  public getNToken(currencyId: number): nToken | undefined {
    return this.nTokens.get(currencyId);
  }

  public getNTokenAssetCashPV(currencyId: number) {
    const nTokenAssetCashPVProvider = this.nTokenAssetCashPVProviders.get(currencyId);
    if (nTokenAssetCashPVProvider) {
      return nTokenAssetCashPVProvider.getNTokenAssetCashPV();
    }
    return this.dataSource.nTokenAssetCashPV.get(currencyId);
  }

  public getNTokenTotalSupply(currencyId: number) {
    return this.dataSource.nTokenTotalSupply.get(currencyId);
  }

  public getNTokenPortfolio(currencyId: number) {
    const cashBalance = this.dataSource.nTokenCashBalance.get(currencyId);
    const liquidityTokens = this.dataSource.nTokenLiquidityTokens.get(currencyId);
    const fCash = this.dataSource.nTokenfCash.get(currencyId);

    return { cashBalance, liquidityTokens, fCash };
  }

  public getNTokenIncentiveFactors(currencyId: number) {
    return this.dataSource.nTokenIncentiveFactors.get(currencyId);
  }

  public getIncentiveMigration(currencyId: number): IncentiveMigration | undefined {
    if (this.data.nTokenData && this.data.nTokenData[currencyId]) {
    }
  }

  public clearMarketProviders() {
    this.marketProviders.clear();
  }

  public clearAssetRateProviders() {
    this.assetRateProviders.clear();
  }

  public clearETHRateProviders() {
    this.ethRateProviders.clear();
  }

  public setAssetRateProvider(currencyId: number, provider: IAssetRateProvider | null) {
    if (!provider) {
      this.assetRateProviders.delete(currencyId);
      return;
    }
    this.assetRateProviders.set(currencyId, provider);
  }

  public setMarketProvider(marketKey: string, provider: IMarketProvider | null) {
    if (!provider) {
      this.marketProviders.delete(marketKey);
      return;
    }
    this.marketProviders.set(marketKey, provider);
  }

  public setETHRateProvider(currencyId: number, provider: IETHRateProvider | null) {
    if (!provider) {
      this.ethRateProviders.delete(currencyId);
      return;
    }
    this.ethRateProviders.set(currencyId, provider);
  }

  public setNTokenAssetCashPVProvider(currencyId: number, provider: INTokenAssetCashPVProvider | null) {
    if (!provider) {
      this.nTokenAssetCashPVProviders.delete(currencyId);
      return;
    }
    this.nTokenAssetCashPVProviders.set(currencyId, provider);
  }

  // Fetch and set settlement rates
  public async settlePortfolioAsset(asset: Asset, currentTime = getNowSeconds()) {
    if (asset.settlementDate > currentTime) throw Error('Asset has not settled');

    if (asset.assetType === AssetType.fCash) {
      // If an asset is fCash then we settle to cash directly
      const rate = await this.getSettlementRate(asset.currencyId, asset.maturity);
      return {
        assetCash: asset.notional.toAssetCash(true, rate),
        fCashAsset: undefined,
      };
    }

    const settlementMarket = await this.getSettlementMarket(asset.currencyId, asset.maturity, asset.settlementDate);
    const fCashClaim = settlementMarket.totalfCash.scale(asset.notional.n, settlementMarket.totalLiquidity.n);
    const assetCashClaim = settlementMarket.totalAssetCash.scale(asset.notional.n, settlementMarket.totalLiquidity.n);
    if (asset.maturity <= currentTime) {
      // fCash asset has settled as well
      const rate = await this.getSettlementRate(asset.currencyId, asset.maturity);
      return {
        assetCash: assetCashClaim.add(fCashClaim.toAssetCash(true, rate)),
        fCashAsset: undefined,
      };
    }

    return {
      assetCash: assetCashClaim,
      fCashAsset: {
        currencyId: asset.currencyId,
        maturity: asset.maturity,
        assetType: AssetType.fCash,
        notional: fCashClaim,
        hasMatured: false,
        settlementDate: asset.maturity,
        isIdiosyncratic: CashGroup.isIdiosyncratic(asset.maturity, currentTime),
      },
    };
  }

  private async getSettlementRate(currencyId: number, maturity: number) {
    const key = `${currencyId}:${maturity}`;
    if (this.settlementRates.has(key)) {
      return this.settlementRates.get(key)!;
    }

    const settlementRateResponse = await this.graphClient.queryOrThrow<SettlementRateQueryResponse>(
      settlementRateQuery,
      { currencyId: currencyId.toString(), maturity }
    );

    // eslint-disable-next-line
    const isSettlementRateSet =
      settlementRateResponse.settlementRates.length > 0 && settlementRateResponse.settlementRates[0].assetExchangeRate;

    if (!isSettlementRateSet) {
      // This means the rate is not set and we get the current asset rate, don't set the rate here
      // will refetch on the next call.
      const { underlyingDecimalPlaces, assetRate } = this.getAssetRate(currencyId);
      if (!assetRate || !underlyingDecimalPlaces) throw new Error(`Asset rate data for ${currencyId} is not found`);

      return assetRate;
    }

    const settlementRate = settlementRateResponse.settlementRates[0];
    const rate = BigNumber.from(settlementRate.rate);
    this.settlementRates.set(key, rate);
    return rate;
  }

  private async getSettlementMarket(currencyId: number, maturity: number, settlementDate: number) {
    const key = `${currencyId}:${settlementDate}:${maturity}`;
    if (this.settlementMarkets.has(key)) {
      return this.settlementMarkets.get(key)!;
    }

    const settlementMarkets = await this.graphClient.queryOrThrow<SettlementMarketsQueryResponse>(
      settlementMarketsQuery,
      { currencyId: currencyId.toString(), settlementDate }
    );
    settlementMarkets.markets.forEach((m) => {
      const k = `${currencyId}:${settlementDate}:${m.maturity}`;
      const currency = this.getCurrencyById(currencyId);
      const underlyingSymbol = this.getUnderlyingSymbol(currencyId);
      this.settlementMarkets.set(k, {
        settlementDate,
        totalfCash: TypedBigNumber.from(m.totalfCash, BigNumberType.InternalUnderlying, underlyingSymbol),
        totalAssetCash: TypedBigNumber.from(m.totalAssetCash, BigNumberType.InternalAsset, currency.symbol),
        totalLiquidity: TypedBigNumber.from(m.totalLiquidity, BigNumberType.LiquidityToken, currency.symbol),
      });
    });

    return this.settlementMarkets.get(key)!;
  }
}
