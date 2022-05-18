import {BigNumber} from 'ethers';
import {gql} from '@apollo/client/core';
import {System, Market} from '../system';
import {convertBigNumber, xirr} from '../libs/xirr';
// prettier-ignore
import {
  Asset, AssetType, TradeHistory, TradeType, Currency, TransactionHistory,
} from '../libs/types';
import {getNowSeconds} from '../libs/utils';
import AccountData from './AccountData';
import GraphClient from '../GraphClient';
import TypedBigNumber, {BigNumberType} from '../libs/TypedBigNumber';

interface TradeHistoryQueryResult {
  trades: {
    id: string;
    blockNumber: number;
    transactionHash: string;
    timestamp: number;
    currency: {
      id: string;
    };
    market: {
      marketIndex: number;
      maturity: number;
      settlementDate: number;
      marketMaturityLengthSeconds: number;
    } | null;
    tradeType: string;
    netAssetCash: string;
    netUnderlyingCash: string;
    netfCash: string;
    netLiquidityTokens: string | null;
    maturity: string;
  }[];
}

export default class AssetSummary {
  public maturity: number;
  public currencyId: number;
  private currency: Currency;

  public get hasMatured() {
    return this.maturity < getNowSeconds();
  }

  public get underlyingSymbol() {
    return this.currency.underlyingSymbol;
  }

  public get symbol() {
    return this.currency.symbol;
  }

  public internalRateOfReturnString(locale = 'en-US', precision = 3) {
    return `${this.irr.toLocaleString(locale, {
      maximumFractionDigits: precision,
      minimumFractionDigits: precision,
    })}%`;
  }

  public mostRecentTradedRate() {
    if (this.history.length === 0) return undefined;
    return this.history[this.history.length - 1].tradedInterestRate;
  }

  constructor(
    public assetKey: string,
    public underlyingInternalPV: TypedBigNumber,
    public fCashValue: TypedBigNumber,
    public underlyingInternalProfitLoss: TypedBigNumber,
    public irr: number,
    public history: TradeHistory[],
    public fCash?: Asset,
    public liquidityToken?: Asset,
  ) {
    if (!fCash && !liquidityToken) throw new Error('Invalid asset summary input');
    this.maturity = (fCash?.maturity || liquidityToken?.maturity) as number;
    this.currencyId = (fCash?.currencyId || liquidityToken?.currencyId) as number;
    this.currency = System.getSystem().getCurrencyById(this.currencyId);
  }

  private static tradeHistoryQuery(address: string) {
    return gql`{
      trades (
        where: {account: "${address.toLowerCase()}"},
        orderBy:blockNumber,
        orderDirection: asc
      ) {
        id
        blockNumber
        transactionHash
        timestamp
        currency {
          id
        }
        market {
          marketIndex
          maturity
          settlementDate
          marketMaturityLengthSeconds
        }
        tradeType
        netAssetCash
        netUnderlyingCash
        netfCash
        netLiquidityTokens
        maturity
      }
    }`;
  }

  public static async fetchTradeHistory(
    address: string,
    graphClient: GraphClient,
  ): Promise<TradeHistory[]> {
    const queryResult = await graphClient.queryOrThrow<TradeHistoryQueryResult>(
      AssetSummary.tradeHistoryQuery(address),
    );

    return queryResult.trades.map((t) => {
      const currencyId = Number(t.currency.id);
      const maturity = BigNumber.from(t.maturity);
      const currency = System.getSystem().getCurrencyById(currencyId);
      const underlyingSymbol = currency.underlyingSymbol || currency.symbol;
      const assetSymbol = currency.symbol;
      const netUnderlyingCash = TypedBigNumber.from(
        t.netUnderlyingCash,
        BigNumberType.InternalUnderlying,
        underlyingSymbol,
      );
      const netfCash = TypedBigNumber.from(t.netfCash, BigNumberType.InternalUnderlying, underlyingSymbol);

      const tradedInterestRate = Market.exchangeToInterestRate(
        Market.exchangeRate(netfCash, netUnderlyingCash),
        t.timestamp,
        maturity.toNumber(),
      );

      return {
        id: t.id,
        blockNumber: t.blockNumber,
        transactionHash: t.transactionHash,
        blockTime: new Date(t.timestamp * 1000),
        currencyId: Number(t.currency.id),
        tradeType: t.tradeType as TradeType,
        settlementDate: t.market ? BigNumber.from(t.market.settlementDate) : null,
        maturityLength: t.market ? t.market.marketMaturityLengthSeconds : null,
        maturity: BigNumber.from(t.maturity),
        netAssetCash: TypedBigNumber.from(t.netAssetCash, BigNumberType.InternalAsset, assetSymbol),
        netfCash,
        netUnderlyingCash,
        netLiquidityTokens: t.netLiquidityTokens
          ? TypedBigNumber.from(t.netLiquidityTokens, BigNumberType.LiquidityToken, assetSymbol)
          : null,
        tradedInterestRate,
      };
    });
  }

  public getTransactionHistory(): TransactionHistory[] {
    return this.history.map((h) => ({
      txnType: h.tradeType,
      timestampMS: h.blockTime.getTime(),
      transactionHash: h.transactionHash,
      amount: h.netUnderlyingCash,
      rate: h.tradedInterestRate,
    }));
  }

  /**
   * Builds a summary of a portfolio given the current account portfolio and the trade history.
   * @param accountData
   * @param tradeHistory
   */
  public static build(
    accountData: AccountData,
    tradeHistory: TradeHistory[],
    currentTime = getNowSeconds(),
  ) {
    const system = System.getSystem();
    // Reduce portfolio to combine fCash and liquidity tokens at the same maturity, if liquidity tokens
    // exist. This makes it easier to reason about.
    const assetsReduced = accountData.portfolio.reduce(
      /* eslint-disable no-param-reassign */
      (obj, a) => {
        const assetKey = `${a.currencyId.toString()}:${a.maturity.toString()}`;
        if (!obj[assetKey]) {
          obj[assetKey] = {};
        }

        if (a.assetType === AssetType.fCash) {
          obj[assetKey].fCash = a;
        } else {
          obj[assetKey].liquidityToken = a;
        }

        return obj;
      },
      /* eslint-enable no-param-reassign */
      {} as {
        [assetKey: string]: {
          fCash?: Asset;
          liquidityToken?: Asset;
        };
      },
    );

    return Object.keys(assetsReduced)
      .map((assetKey) => {
        // Returns the trade history for each asset key
        const filteredHistory = tradeHistory
          .filter((t) => {
            const historyAssetKey = `${t.currencyId.toString()}:${t.maturity.toString()}`;
            return historyAssetKey === assetKey;
          })
          .sort((a, b) => a.blockNumber - b.blockNumber);

        // Add historical cash flows to the object
        const cashFlows = filteredHistory.map((h) => ({
          amount: convertBigNumber(h.netUnderlyingCash.n),
          date: h.blockTime,
        }));

        const {liquidityToken, fCash} = assetsReduced[assetKey];
        const currency = system.getCurrencyById(liquidityToken?.currencyId || (fCash?.currencyId as number));
        const underlyingSymbol = system.getUnderlyingSymbol(currency.id);
        const {underlyingInternalPV, fCashValue} = AssetSummary.getAssetValue(
          system,
          underlyingSymbol,
          liquidityToken,
          fCash,
        );

        // Add the current value of the asset as the final cash flow
        cashFlows.push({
          amount: convertBigNumber(underlyingInternalPV.n),
          date: new Date(currentTime * 1000),
        });

        let irr: number;
        try {
          irr = cashFlows.length > 1 ? xirr(cashFlows) : 0;
        } catch (e) {
          console.error(e);
          // If the xirr calculation fails then leave as a zero, this can happen when the time frame is too short
          irr = 0;
        }
        const underlyingInternalProfitLoss = filteredHistory
          .reduce(
            (s, h) => s.add(h.netUnderlyingCash),
            TypedBigNumber.from(0, BigNumberType.InternalUnderlying, underlyingSymbol),
          )
          .add(underlyingInternalPV);

        return new AssetSummary(
          assetKey,
          underlyingInternalPV,
          fCashValue,
          underlyingInternalProfitLoss,
          irr,
          filteredHistory,
          fCash,
          liquidityToken,
        );
      })
      .sort((a, b) => a.assetKey.localeCompare(b.assetKey, 'en'));
  }

  private static getAssetValue(system: System, underlyingSymbol: string, liquidityToken?: Asset, fCash?: Asset) {
    const currencyId = fCash?.currencyId || liquidityToken?.currencyId;
    if (!currencyId) throw new Error('Currency id not found when mapping assets');
    const cashGroup = system.getCashGroup(currencyId);

    // Get the underlying PV and fCash value of the asset
    let underlyingInternalPV = TypedBigNumber.from(0, BigNumberType.InternalUnderlying, underlyingSymbol);
    let fCashValue = TypedBigNumber.from(0, BigNumberType.InternalUnderlying, underlyingSymbol);
    if (liquidityToken) {
      const {fCashClaim, assetCashClaim} = cashGroup.getLiquidityTokenValue(
        liquidityToken.assetType,
        liquidityToken.notional,
        false,
      );

      fCashValue = fCashClaim;
      underlyingInternalPV = cashGroup
        .getfCashPresentValueUnderlyingInternal(liquidityToken.maturity, fCashClaim, false)
        .add(assetCashClaim.toUnderlying());
    }

    // Use a fall through here because liquidity tokens and fCash will sit on the same asset key
    if (fCash) {
      fCashValue = fCashValue.add(fCash.notional);
      underlyingInternalPV = underlyingInternalPV.add(
        cashGroup.getfCashPresentValueUnderlyingInternal(fCash.maturity, fCash.notional, false),
      );
    }

    return {underlyingInternalPV, fCashValue};
  }
}
