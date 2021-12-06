import {gql} from '@apollo/client/core';
import {BigNumber, Contract, ethers} from 'ethers';
import {clearInterval} from 'timers';
import EventEmitter from 'eventemitter3';
import {
  Asset,
  AssetRate,
  AssetType,
  Currency,
  EthRate,
  nToken,
  SettlementMarket,
  TokenType,
} from '../libs/types';
import {getNowSeconds} from '../libs/utils';
import {
  DEFAULT_CONFIGURATION_REFRESH_INTERVAL,
  RATE_PRECISION,
  NOTE_CURRENCY_ID,
  DEFAULT_DATA_REFRESH_INTERVAL,
} from '../config/constants';

import {IAggregator} from '../typechain/IAggregator';
import {AssetRateAggregator} from '../typechain/AssetRateAggregator';
import {NTokenERC20} from '../typechain/NTokenERC20';
import {Notional as NotionalProxy} from '../typechain/Notional';
import {ERC20} from '../typechain/ERC20';
import GraphClient from '../GraphClient';
import {Market, CashGroup} from '.';
import TypedBigNumber, {BigNumberType} from '../libs/TypedBigNumber';
import NoteETHRateProvider from './NoteETHRateProvider';
import {DataSource, DataSourceType} from './datasource';
import Blockchain from './datasource/Blockchain';
import Cache from './datasource/Cache';

const ERC20ABI = require('../abi/ERC20.json');
const IAggregatorABI = require('../abi/IAggregator.json');
const AssetRateAggregatorABI = require('../abi/AssetRateAggregator.json');
const NTokenERC20ABI = require('../abi/nTokenERC20.json');

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

const systemConfigurationQuery = gql`
  {
    currencies {
      id
      tokenAddress
      tokenType
      decimals
      name
      symbol
      underlyingName
      underlyingSymbol
      underlyingDecimals
      underlyingTokenAddress
      hasTransferFee
      ethExchangeRate {
        rateOracle
        rateDecimalPlaces
        mustInvert
        buffer
        haircut
      }
      assetExchangeRate {
        rateAdapterAddress
        underlyingDecimalPlaces
      }
      cashGroup {
        maxMarketIndex
        rateOracleTimeWindowSeconds
        totalFeeBasisPoints
        reserveFeeSharePercent
        debtBufferBasisPoints
        fCashHaircutBasisPoints
        liquidityTokenHaircutsPercent
        rateScalars
      }
      nToken {
        tokenAddress
        name
        symbol
        decimals
        depositShares
        leverageThresholds
        incentiveEmissionRate
        pvHaircutPercentage
      }
    }
  }
`;

interface SystemQueryResult {
  currencies: {
    id: string;
    tokenAddress: string;
    tokenType: string;
    decimals: string;
    name: string;
    symbol: string;
    underlyingName: string | null;
    underlyingSymbol: string | null;
    underlyingDecimals: string | null;
    underlyingTokenAddress: string | null;
    hasTransferFee: boolean;
    ethExchangeRate: {
      rateOracle: string;
      rateDecimalPlaces: number;
      mustInvert: boolean;
      buffer: number;
      haircut: number;
    };
    assetExchangeRate: {
      rateAdapterAddress: string;
      underlyingDecimalPlaces: number;
    } | null;
    cashGroup: {
      maxMarketIndex: number;
      rateOracleTimeWindowSeconds: number;
      totalFeeBasisPoints: number;
      reserveFeeSharePercent: number;
      debtBufferBasisPoints: number;
      fCashHaircutBasisPoints: number;
      liquidityTokenHaircutsPercent: number[];
      rateScalars: number[];
    } | null;
    nToken: {
      tokenAddress: string;
      name: string;
      symbol: string;
      decimals: string;
      depositShares: number[] | null;
      leverageThresholds: number[] | null;
      incentiveEmissionRate: string | null;
      pvHaircutPercentage: number | null;
    } | null;
  }[];
}

interface IETHRateProvider {
  getETHRate(): {ethRateConfig: EthRate, ethRate: BigNumber};
}

interface INTokenAssetCashPVProvider {
  getNTokenAssetCashPV(): TypedBigNumber;
}

export default class System {
  public eventEmitter = new EventEmitter();
  private static _systemInstance?: System;
  protected symbolToCurrencyId = new Map<string, number>();
  protected currencies = new Map<number, Currency>();
  protected ethRates = new Map<number, EthRate>();
  protected assetRate = new Map<number, AssetRate>();
  protected cashGroups = new Map<number, CashGroup>();
  protected nTokens = new Map<number, nToken>();
  public dataSource: DataSource;

  public get lastUpdateBlockNumber() {
    return this.dataSource.lastUpdateBlockNumber;
  }

  public get lastUpdateTimestamp() {
    return this.dataSource.lastUpdateTimestamp;
  }

  public static getSystem() {
    if (!this._systemInstance) throw Error('System not initialized');
    return this._systemInstance;
  }

  public static overrideSystem(system: System) {
    // NOTE: this should only be used for testing
    this._systemInstance = system;
  }

  protected settlementRates = new Map<string, BigNumber>();
  protected settlementMarkets = new Map<string, SettlementMarket>();

  private dataRefreshInterval?: NodeJS.Timeout;
  private configurationRefreshInterval?: NodeJS.Timeout;
  private ethRateProviders = new Map<number, IETHRateProvider>();
  private nTokenAssetCashPVProviders = new Map<number, INTokenAssetCashPVProvider>();

  constructor(
    data: SystemQueryResult,
    chainId: number,
    private graphClient: GraphClient,
    private notionalProxy: NotionalProxy,
    private batchProvider: ethers.providers.JsonRpcBatchProvider,
    public dataSourceType: DataSourceType,
    public refreshIntervalMS: number,
    public refreshConfigurationDataIntervalMs?: number,
  ) {
    // eslint-disable-next-line no-underscore-dangle
    System._systemInstance = this;
    this.parseQueryResult(data);
    if (dataSourceType === DataSourceType.Blockchain) {
      this.dataSource = new Blockchain(
        notionalProxy,
        batchProvider,
        this.currencies,
        this.ethRates,
        this.assetRate,
        this.cashGroups,
        this.nTokens,
        this.eventEmitter,
        refreshIntervalMS,
      );
      // This will fetch the NOTE price via CoinGecko
      this.ethRateProviders.set(NOTE_CURRENCY_ID, new NoteETHRateProvider(
        undefined,
        {
          notePriceRefreshIntervalMS: refreshConfigurationDataIntervalMs!,
          eventEmitter: this.eventEmitter,
        },
      ));
    } else {
      this.dataSource = new Cache(
        chainId,
        this.cashGroups,
        this.eventEmitter,
        refreshIntervalMS,
      );
    }

    this.dataRefreshInterval = this.dataSource.startRefresh();

    if (refreshConfigurationDataIntervalMs) {
      this.configurationRefreshInterval = setInterval(async () => {
        const result = await this.graphClient.queryOrThrow<SystemQueryResult>(systemConfigurationQuery);
        this.parseQueryResult(result);
      }, refreshConfigurationDataIntervalMs);
    }
  }

  public destroy() {
    if (this.dataRefreshInterval) clearInterval(this.dataRefreshInterval);
    if (this.configurationRefreshInterval) clearInterval(this.configurationRefreshInterval);
  }

  public static async load(
    graphClient: GraphClient,
    notionalProxy: NotionalProxy,
    batchProvider: ethers.providers.JsonRpcBatchProvider,
    chainId: number,
    refreshDataSource,
    refreshIntervalMS = DEFAULT_DATA_REFRESH_INTERVAL,
    refreshConfigurationDataIntervalMs = DEFAULT_CONFIGURATION_REFRESH_INTERVAL,
  ) {
    const data = await graphClient.queryOrThrow<SystemQueryResult>(systemConfigurationQuery);
    return new System(
      data,
      chainId,
      graphClient,
      notionalProxy,
      batchProvider,
      refreshDataSource,
      refreshIntervalMS,
      refreshConfigurationDataIntervalMs,
    );
  }

  private parseQueryResult(data: SystemQueryResult) {
    data.currencies
      .slice()
      .sort((a, b) => Number(a.id) - Number(b.id))
      .forEach((c) => {
        const currencyId = Number(c.id);
        const currency: Currency = {
          id: currencyId,
          name: c.name,
          symbol: c.symbol,
          decimals: BigNumber.from(c.decimals),
          decimalPlaces: Math.log10(Number(c.decimals)),
          contract: new Contract(c.tokenAddress, ERC20ABI, this.batchProvider) as ERC20,
          tokenType: c.tokenType as TokenType,
          nTokenSymbol: c.nToken?.symbol,
          hasTransferFee: c.hasTransferFee,
        };

        if (c.underlyingName && c.underlyingSymbol) {
          currency.underlyingName = c.underlyingName;
          currency.underlyingSymbol = c.underlyingSymbol;
          currency.underlyingDecimals = BigNumber.from(c.underlyingDecimals);
          currency.underlyingDecimalPlaces = Math.log10(Number(c.underlyingDecimals));

          if (c.underlyingTokenAddress) {
            currency.underlyingContract = new Contract(c.underlyingTokenAddress, ERC20ABI, this.batchProvider) as ERC20;
          }
        }

        this.currencies.set(currencyId, currency);
        this.symbolToCurrencyId.set(c.symbol, Number(c.id));
        if (c.underlyingSymbol) this.symbolToCurrencyId.set(c.underlyingSymbol, Number(c.id));

        this.ethRates.set(currencyId, {
          rateOracle: new Contract(c.ethExchangeRate.rateOracle, IAggregatorABI, this.batchProvider) as IAggregator,
          rateDecimalPlaces: c.ethExchangeRate.rateDecimalPlaces,
          mustInvert: c.ethExchangeRate.mustInvert,
          buffer: c.ethExchangeRate.buffer,
          haircut: c.ethExchangeRate.haircut,
        });

        if (c.assetExchangeRate) {
          this.assetRate.set(currencyId, {
            rateAdapter: new Contract(
              c.assetExchangeRate.rateAdapterAddress,
              AssetRateAggregatorABI,
              this.batchProvider,
            ) as AssetRateAggregator,
            underlyingDecimalPlaces: c.assetExchangeRate.underlyingDecimalPlaces,
          });
        }

        // Initialize market array without any data
        if (c.cashGroup) {
          const markets = new Array<Market>();
          for (let i = 1; i <= c.cashGroup.maxMarketIndex; i += 1) {
            markets.push(
              new Market(
                currencyId,
                i,
                CashGroup.getMaturityForMarketIndex(i),
                c.cashGroup!.rateScalars[i - 1] * RATE_PRECISION,
                c.cashGroup!.totalFeeBasisPoints,
                c.cashGroup!.reserveFeeSharePercent,
                c.cashGroup!.rateOracleTimeWindowSeconds,
                c.symbol,
                c.underlyingSymbol || c.symbol,
              ),
            );
          }

          this.cashGroups.set(
            currencyId,
            new CashGroup(
              c.cashGroup.maxMarketIndex,
              c.cashGroup.rateOracleTimeWindowSeconds,
              c.cashGroup.totalFeeBasisPoints,
              c.cashGroup.reserveFeeSharePercent,
              c.cashGroup.debtBufferBasisPoints,
              c.cashGroup.fCashHaircutBasisPoints,
              c.cashGroup.liquidityTokenHaircutsPercent,
              c.cashGroup.rateScalars.map((s) => s * RATE_PRECISION),
              markets,
            ),
          );
        }

        if (c.nToken) {
          const depositShares = (c.nToken.depositShares || []).map((v) => BigNumber.from(v));
          const leverageThresholds = (c.nToken.leverageThresholds || []).map((v) => BigNumber.from(v));
          this.symbolToCurrencyId.set(c.nToken.symbol, Number(c.id));

          this.nTokens.set(currencyId, {
            name: c.nToken.name,
            symbol: c.nToken.symbol,
            incentiveEmissionRate: BigNumber.from(c.nToken.incentiveEmissionRate || 0),
            pvHaircutPercentage: c.nToken.pvHaircutPercentage || 0,
            depositShares,
            leverageThresholds,
            contract: new Contract(c.nToken.tokenAddress, NTokenERC20ABI, this.batchProvider) as NTokenERC20,
          });
        }
      });

    this.eventEmitter.emit(SystemEvents.CONFIGURATION_UPDATE);
    if (this.dataSource) this.dataSource.refreshData();
  }

  public getNotionalProxy() {
    return this.notionalProxy;
  }

  public getAllCurrencies(): Currency[] {
    return Array.from(this.currencies.values()).sort((a, b) => a.symbol.localeCompare(b.symbol));
  }

  public getTradableCurrencies(): Currency[] {
    return this.getAllCurrencies().filter((c) => this.cashGroups.has(c.id));
  }

  public getCurrencyBySymbol(symbol: string): Currency {
    const currencyId = this.symbolToCurrencyId.get(symbol);
    if (!currencyId) throw new Error(`Currency ${symbol} not found`);
    return this.getCurrencyById(currencyId);
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

  public getCashGroup(currencyId: number): CashGroup {
    const cashGroup = this.cashGroups.get(currencyId);
    if (!cashGroup) throw new Error(`Cash group ${currencyId} not found`);
    return cashGroup;
  }

  public getMarkets(currencyId: number): Market[] {
    const cashGroup = this.getCashGroup(currencyId);
    return cashGroup.markets;
  }

  public getNToken(currencyId: number): nToken | undefined {
    return this.nTokens.get(currencyId);
  }

  public getAssetRate(currencyId: number) {
    const underlyingDecimalPlaces = this.assetRate.get(currencyId)?.underlyingDecimalPlaces;
    const assetRate = this.dataSource.assetRateData.get(currencyId);
    return {underlyingDecimalPlaces, assetRate};
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
    return {ethRateConfig, ethRate};
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

    return {cashBalance, liquidityTokens, fCash};
  }

  public getNTokenIncentiveFactors(currencyId: number) {
    return this.dataSource.nTokenIncentiveFactors.get(currencyId);
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

    const settlementRate = await this.notionalProxy.getSettlementRate(currencyId, maturity);
    if (settlementRate.underlyingDecimals.isZero()) {
      // This means the rate is not set and we get the current asset rate, don't set the rate here
      // will refetch on the next call.
      const assetRate = this.dataSource.assetRateData.get(currencyId);
      const underlyingDecimalPlaces = this.assetRate.get(currencyId)?.underlyingDecimalPlaces;
      if (!assetRate || !underlyingDecimalPlaces) throw new Error(`Asset rate data for ${currencyId} is not found`);

      return assetRate;
    }

    this.settlementRates.set(key, settlementRate.rate);
    return settlementRate.rate;
  }

  private async getSettlementMarket(currencyId: number, maturity: number, settlementDate: number) {
    const key = `${currencyId}:${settlementDate}:${maturity}`;
    if (this.settlementMarkets.has(key)) {
      return this.settlementMarkets.get(key)!;
    }

    const settlementMarkets = await this.notionalProxy.getActiveMarketsAtBlockTime(currencyId, settlementDate);
    settlementMarkets.forEach((m) => {
      const k = `${currencyId}:${settlementDate}:${m.maturity.toNumber()}`;
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
