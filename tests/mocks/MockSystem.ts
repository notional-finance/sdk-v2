import {BigNumber, ethers} from 'ethers';
import {System} from '../../src/system';
import TypedBigNumber from '../../src/libs/TypedBigNumber';
import {Asset, Contracts, StakedNoteParameters} from '../../src/libs/types';
import GraphClient from '../../src/GraphClient';
import {DataSourceType} from '../../src/system/datasource';
import MockCache from './MockCache';

const systemQueryResult = {
  currencies: [
    {
      assetExchangeRate: {
        rateAdapterAddress: '0x00ae8bf5d7ff4f45568f4a6390cf9d0d6c6bdde0',
        underlyingDecimalPlaces: 18,
      },
      cashGroup: {
        debtBufferBasisPoints: 15000000,
        fCashHaircutBasisPoints: 15000000,
        liquidityTokenHaircutsPercent: [99, 98],
        maxMarketIndex: 2,
        rateOracleTimeWindowSeconds: 1200,
        rateScalars: [30, 25],
        reserveFeeSharePercent: 50,
        totalFeeBasisPoints: 3000000,
      },
      decimals: '100000000',
      ethExchangeRate: {
        buffer: 130,
        haircut: 70,
        mustInvert: false,
        rateDecimalPlaces: 18,
        rateOracle: '0x0000000000000000000000000000000000000000',
      },
      id: '1',
      nToken: {
        decimals: '100000000',
        depositShares: null,
        incentiveEmissionRate: null,
        leverageThresholds: null,
        name: 'nToken Ether',
        pvHaircutPercentage: 85,
        symbol: 'nETH',
        tokenAddress: '0x71b170fd23d4e6e68347acf98fe7f71209d25c90',
      },
      name: 'Compound Ether',
      symbol: 'cETH',
      tokenAddress: '0x47ecbdd7f2b670f9de48cc13ce57a25035a1e377',
      tokenType: 'cETH',
      underlyingDecimals: '1000000000000000000',
      underlyingName: 'Ether',
      underlyingSymbol: 'ETH',
      underlyingTokenAddress: null,
      hasTransferFee: false,
    },
    {
      assetExchangeRate: {
        rateAdapterAddress: '0xaa9ec6225fa44d69210f542c4812733f8de18695',
        underlyingDecimalPlaces: 18,
      },
      cashGroup: {
        debtBufferBasisPoints: 15000000,
        fCashHaircutBasisPoints: 15000000,
        liquidityTokenHaircutsPercent: [99, 98],
        maxMarketIndex: 2,
        rateOracleTimeWindowSeconds: 1200,
        rateScalars: [30, 25],
        reserveFeeSharePercent: 50,
        totalFeeBasisPoints: 3000000,
      },
      decimals: '100000000',
      ethExchangeRate: {
        buffer: 105,
        haircut: 95,
        mustInvert: false,
        rateDecimalPlaces: 18,
        rateOracle: '0x68893beb55fadacf9c273c4d42ef8b686af7b182',
      },
      id: '2',
      nToken: {
        decimals: '100000000',
        depositShares: [40000000, 60000000],
        incentiveEmissionRate: '10000000000000',
        leverageThresholds: [800000000, 800000000],
        name: 'nToken Dai Stablecoin',
        pvHaircutPercentage: 90,
        symbol: 'nDAI',
        tokenAddress: '0x0ca9a5ba75e1cf24f7a06a64268d47619f83640b',
      },
      name: 'Compound DAI',
      symbol: 'cDAI',
      tokenAddress: '0x3b52b060f010dd8ed2f7291e8c83299c7a081101',
      tokenType: 'cToken',
      underlyingDecimals: '1000000000000000000',
      underlyingName: 'Dai Stablecoin',
      underlyingSymbol: 'DAI',
      underlyingTokenAddress: '0x598c8e5a19eea26e00ce383f8150accfe90bb6c1',
      hasTransferFee: false,
    },
    {
      assetExchangeRate: {
        rateAdapterAddress: '0xa02809d4050b67dfb0960f6329b0e3549208e9d9',
        underlyingDecimalPlaces: 6,
      },
      cashGroup: {
        debtBufferBasisPoints: 15000000,
        fCashHaircutBasisPoints: 15000000,
        liquidityTokenHaircutsPercent: [99, 98],
        maxMarketIndex: 2,
        rateOracleTimeWindowSeconds: 1200,
        rateScalars: [30, 25],
        reserveFeeSharePercent: 50,
        totalFeeBasisPoints: 3000000,
      },
      decimals: '100000000',
      ethExchangeRate: {
        buffer: 105,
        haircut: 95,
        mustInvert: false,
        rateDecimalPlaces: 18,
        rateOracle: '0x72999963fb80043c42976dc9ae352e41a0f718af',
      },
      id: '3',
      nToken: {
        decimals: '100000000',
        depositShares: [40000000, 60000000],
        incentiveEmissionRate: '10000000000000',
        leverageThresholds: [800000000, 800000000],
        name: 'nToken USD Coin',
        pvHaircutPercentage: 90,
        symbol: 'nUSDC',
        tokenAddress: '0x3e4810480194cbd57c87645ea53fbe89840a526c',
      },
      name: 'Compound USDC',
      symbol: 'cUSDC',
      tokenAddress: '0xdbfabb36e540dabe3cc1e389dc81ac50806d56ea',
      tokenType: 'cToken',
      underlyingDecimals: '1000000',
      underlyingName: 'USD Coin',
      underlyingSymbol: 'USDC',
      underlyingTokenAddress: '0xe676fd207878cfa059a1a71fe95d7a5f0f3b19ae',
      hasTransferFee: false,
    },
    {
      assetExchangeRate: {
        rateAdapterAddress: '0x20d106840b5e2780e9d35f2a64d9f4afb535c14d',
        underlyingDecimalPlaces: 6,
      },
      cashGroup: {
        debtBufferBasisPoints: 15000000,
        fCashHaircutBasisPoints: 15000000,
        liquidityTokenHaircutsPercent: [99, 98],
        maxMarketIndex: 2,
        rateOracleTimeWindowSeconds: 1200,
        rateScalars: [30, 25],
        reserveFeeSharePercent: 50,
        totalFeeBasisPoints: 3000000,
      },
      decimals: '100000000',
      ethExchangeRate: {
        buffer: 105,
        haircut: 0,
        mustInvert: false,
        rateDecimalPlaces: 18,
        rateOracle: '0x9dc7b7d14138de328e67a82897fb3ad1a31b17ed',
      },
      id: '4',
      nToken: {
        decimals: '100000000',
        depositShares: [40000000, 60000000],
        incentiveEmissionRate: '10000000000000',
        leverageThresholds: [800000000, 800000000],
        name: 'nToken Tether USD',
        pvHaircutPercentage: 90,
        symbol: 'nUSDT',
        tokenAddress: '0xe82a73615c039c5e599305efd15fd215b057652b',
      },
      name: 'Compound USDT',
      symbol: 'cUSDT',
      tokenAddress: '0x784ee2fdca4b3551ef951119776a74d793f9746e',
      tokenType: 'cToken',
      underlyingDecimals: '1000000',
      underlyingName: 'Tether USD',
      underlyingSymbol: 'USDT',
      underlyingTokenAddress: '0x32fc770eae4736b2d806c8c7113c27c9fc218d7a',
      hasTransferFee: true,
    },
    {
      assetExchangeRate: {
        rateAdapterAddress: '0x20d106840b5e2780e9d35f2a64d9f4afb535c14d',
        underlyingDecimalPlaces: 8,
      },
      cashGroup: null,
      decimals: '100000000',
      ethExchangeRate: {
        buffer: 130,
        haircut: 70,
        mustInvert: false,
        rateDecimalPlaces: 18,
        rateOracle: '0x84d45253914348ee603b42b4f084708ae78b637c',
      },
      id: '5',
      nToken: null,
      name: 'Compound WBTC',
      symbol: 'cWBTC',
      tokenAddress: '0x1b0ee4c7930d1f67f42727b716ee6e56209fe886',
      tokenType: 'cToken',
      underlyingDecimals: '100000000',
      underlyingName: 'Wrapped Bitcoin',
      underlyingSymbol: 'WBTC',
      underlyingTokenAddress: '0x27f752da00343a42a7c93071d9284e529eaee040',
      hasTransferFee: false,
    },
    {
      assetExchangeRate: null,
      cashGroup: null,
      decimals: '1000000000000000000',
      ethExchangeRate: {
        buffer: 130,
        haircut: 70,
        mustInvert: false,
        rateDecimalPlaces: 18,
        rateOracle: '0x4715107b55351bb7baeb70f52b57e1c1f469cc7f',
      },
      id: '6',
      nToken: null,
      name: 'nonMintable',
      symbol: 'NOMINT',
      tokenAddress: '0x29732b3a2edca82d0a284a89c05a9ff9835fb761',
      tokenType: 'NonMintable',
      underlyingDecimals: null,
      underlyingName: null,
      underlyingSymbol: null,
      underlyingTokenAddress: null,
      hasTransferFee: false,
    },
  ],
};

export default class MockSystem extends System {
  constructor() {
    const provider = new ethers.providers.JsonRpcBatchProvider('http://localhost:8545');
    super(
      systemQueryResult,
      9999,
      ({} as unknown) as GraphClient,
      ({} as unknown) as Contracts,
      provider,
      DataSourceType.Cache,
      30000,
    );
    this.dataSource = new MockCache(
      ({} as unknown) as Contracts,
      provider,
      this.currencies,
      this.ethRates,
      this.assetRate,
      this.cashGroups,
      this.nTokens,
      this.eventEmitter,
      30000,
    );
    this.dataSource.refreshData();
  }

  public setNTokenPortfolio(
    currencyId: number,
    cashBalance: TypedBigNumber,
    pv: TypedBigNumber,
    totalSupply: TypedBigNumber,
    liquidityTokens: Asset[],
    fCash: Asset[],
  ) {
    this.dataSource.nTokenCashBalance.set(currencyId, cashBalance);
    this.dataSource.nTokenLiquidityTokens.set(currencyId, liquidityTokens);
    this.dataSource.nTokenfCash.set(currencyId, fCash);
    this.dataSource.nTokenAssetCashPV.set(currencyId, pv);
    this.dataSource.nTokenTotalSupply.set(currencyId, totalSupply);
  }

  public setSettlementRate(
    currencyId: number,
    maturity: number,
    rate: BigNumber,
  ) {
    const key = `${currencyId}:${maturity}`;
    this.settlementRates.set(key, rate);
  }

  public setSettlementMarket(
    currencyId: number,
    maturity: number,
    market: {
      settlementDate: number,
      totalfCash: TypedBigNumber,
      totalAssetCash: TypedBigNumber,
      totalLiquidity: TypedBigNumber
    },
  ) {
    const key = `${currencyId}:${market.settlementDate}:${maturity}`;
    this.settlementMarkets.set(key, market);
  }

  public setStakedNoteParameters(params: StakedNoteParameters) {
    this.dataSource.stakedNoteParameters = params;
  }
}
