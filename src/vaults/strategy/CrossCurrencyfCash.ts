import { BigNumber } from 'ethers';
import TypedBigNumber, { BigNumberType } from '../../libs/TypedBigNumber';
import BaseVault from '../BaseVault';
import VaultAccount from '../VaultAccount';
import { CashGroup, Market, System } from '../../system';
import { getNowSeconds } from '../../libs/utils';
import TradeHandler from '../../trading/TradeHandler';
import { RATE_PRECISION } from '../../config/constants';

interface DepositParams {
  minPurchaseAmount: BigNumber;
  minLendRate: number;
  dexId: number;
  exchangeData: string;
}

interface RedeemParams {
  minPurchaseAmount: BigNumber;
  maxBorrowRate: number;
  dexId: number;
  exchangeData: string;
}

export default class CrossCurrencyfCash extends BaseVault<DepositParams, RedeemParams> {
  constructor(vaultAddress: string, private _lendCurrencyId: number) {
    super(vaultAddress);
  }

  public get lendCurrencyId() {
    return this._lendCurrencyId;
  }

  public setLendCurrency(lendCurrencyId: number) {
    // TODO: this needs to get embedded into the cache
    this._lendCurrencyId = lendCurrencyId;
  }

  public getLendMarket(maturity: number) {
    const marketIndex = CashGroup.getMarketIndexForMaturity(maturity);
    return System.getSystem().getCashGroup(this.lendCurrencyId).getMarket(marketIndex);
  }

  private strategyTokensTofCash(strategyTokens: TypedBigNumber) {
    const symbol = System.getSystem().getUnderlyingSymbol(this.lendCurrencyId);
    return TypedBigNumber.fromBalance(strategyTokens.n, symbol, true);
  }

  private fCashToStrategyTokens(fCash: TypedBigNumber, maturity: number) {
    if (!fCash.isInternalPrecision()) throw Error('Must be internal precision');
    if (fCash.isNegative()) throw Error('Must be positive');
    return TypedBigNumber.from(fCash.n, BigNumberType.StrategyToken, this.getVaultSymbol(maturity));
  }

  public getStrategyTokenValue(vaultAccount: VaultAccount, blockTime = getNowSeconds()) {
    const vault = this.getVault();
    const { strategyTokens } = vaultAccount.getPoolShare();
    const strategyTokensAsfCash = this.strategyTokensTofCash(strategyTokens);
    const fCashPV = System.getSystem()
      .getCashGroup(this.lendCurrencyId)
      .getfCashPresentValueUnderlyingInternal(vaultAccount.maturity, strategyTokensAsfCash, true, blockTime);

    return fCashPV.toETH(false).fromETH(vault.primaryBorrowCurrency, false);
  }

  private _getDepositParameters(
    maturity: number,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime = getNowSeconds()
  ) {
    const { amountOut, minPurchaseAmount, dexId, exchangeData } = TradeHandler.getOutGivenIn(
      this.lendCurrencyId,
      depositAmount.toUnderlying(false),
      slippageBuffer
    );
    // get lendRate based on optimalPurchaseAmount, apply slippage buffer
    const lendfCash = this.getLendMarket(maturity).getfCashAmountGivenCashAmount(
      amountOut.toInternalPrecision().neg(),
      blockTime
    );

    const { annualizedRate: minLendRate } = Market.getSlippageRate(
      lendfCash,
      amountOut.toInternalPrecision(),
      maturity,
      -slippageBuffer * RATE_PRECISION,
      blockTime
    );
    // TODO: is this simpler if we just calculate min strategy tokens?

    return {
      depositParams: {
        minPurchaseAmount: minPurchaseAmount.n,
        minLendRate,
        dexId,
        exchangeData,
      },
      amountOut,
    };
  }

  public getDepositParameters(
    maturity: number,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime = getNowSeconds()
  ) {
    const { depositParams } = this._getDepositParameters(maturity, depositAmount, slippageBuffer, blockTime);
    return depositParams;
  }

  private _getRedeemParameters(
    maturity: number,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime = getNowSeconds()
  ) {
    const market = this.getLendMarket(maturity);
    const lendfCash = this.strategyTokensTofCash(strategyTokens);
    const { netCashToAccount } = market.getCashAmountGivenfCashAmount(lendfCash.neg(), blockTime);
    const { amountOut, minPurchaseAmount, dexId, exchangeData } = TradeHandler.getOutGivenIn(
      this.getVault().primaryBorrowCurrency,
      netCashToAccount.toUnderlying(false),
      slippageBuffer
    );

    const { annualizedRate: maxBorrowRate } = Market.getSlippageRate(
      lendfCash,
      netCashToAccount,
      market.maturity,
      slippageBuffer * RATE_PRECISION,
      blockTime
    );

    return {
      redeemParams: {
        minPurchaseAmount: minPurchaseAmount.n,
        maxBorrowRate,
        dexId,
        exchangeData,
      },
      amountOut,
    };
  }

  public getRedeemParameters(
    maturity: number,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime = getNowSeconds()
  ) {
    const { redeemParams } = this._getRedeemParameters(maturity, strategyTokens, slippageBuffer, blockTime);
    return redeemParams;
  }

  public getSlippageFromDepositParameters(
    maturity: number,
    depositAmount: TypedBigNumber,
    params: DepositParams,
    blockTime = getNowSeconds()
  ) {
    const market = this.getLendMarket(maturity);

    // No Slippage Value:
    //   getCashFutureValue(fx(cashFromBorrow => lendCurrency) @ oracleRate)
    const idealTrade = TradeHandler.getIdealOutGivenIn(this.lendCurrencyId, depositAmount.toExternalPrecision());
    const idealfCash = Market.fCashFromExchangeRate(
      market.marketExchangeRate(blockTime),
      idealTrade.toInternalPrecision()
    );

    // Worse Case Value:
    //   getCashFutureValue(minPurchaseAmount @ minLendRate)
    const worstCasefCash = Market.fCashFromExchangeRate(
      Market.interestToExchangeRate(params.minLendRate, blockTime, maturity),
      idealTrade.copy(params.minPurchaseAmount).toInternalPrecision()
    );

    // End to End Slippage = (noSlippage - worstCase) / noSlippage
    return idealfCash.sub(worstCasefCash).scale(RATE_PRECISION, idealfCash).toNumber();
  }

  public getSlippageFromRedeemParameters(
    maturity: number,
    strategyTokens: TypedBigNumber,
    params: RedeemParams,
    blockTime = getNowSeconds()
  ) {
    const vault = this.getVault();
    const market = this.getLendMarket(maturity);
    const lendfCash = this.strategyTokensTofCash(strategyTokens);

    // No Slippage Value:
    //   fx(getPV(strategyTokens @ oracleRate) => primaryBorrow)
    const idealCash = Market.cashFromExchangeRate(market.marketExchangeRate(blockTime), lendfCash);
    const idealTrade = TradeHandler.getIdealOutGivenIn(vault.primaryBorrowCurrency, idealCash.toExternalPrecision());

    // Worse Case Value:
    //   minPurchaseAmount

    // End to End Slippage = (noSlippage - worstCase) / noSlippage
    const minPurchaseAmount = idealTrade.copy(params.minPurchaseAmount);
    return idealTrade.sub(minPurchaseAmount).scale(RATE_PRECISION, idealTrade).toNumber();
  }

  public getStrategyTokensGivenDeposit(
    vaultAccount: VaultAccount,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ) {
    const { amountOut, depositParams } = this._getDepositParameters(
      vaultAccount.maturity,
      depositAmount,
      slippageBuffer,
      blockTime
    );
    const lendfCash = this.getLendMarket(vaultAccount.maturity).getfCashAmountGivenCashAmount(
      amountOut.toInternalPrecision().neg(),
      blockTime
    );

    return {
      strategyTokens: this.fCashToStrategyTokens(lendfCash, vaultAccount.maturity),
      secondaryfCashBorrowed: undefined,
      depositParams,
    };
  }

  public getRedeemGivenStrategyTokens(
    vaultAccount: VaultAccount,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ) {
    const { amountOut, redeemParams } = this._getRedeemParameters(
      vaultAccount.maturity,
      strategyTokens,
      slippageBuffer,
      blockTime
    );

    return {
      amountRedeemed: amountOut,
      secondaryfCashRepaid: undefined,
      redeemParams,
    };
  }

  public getDepositGivenStrategyTokens(
    vaultAccount: VaultAccount,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime = getNowSeconds()
  ) {
    const market = this.getLendMarket(vaultAccount.maturity);
    const fCash = this.strategyTokensTofCash(strategyTokens);
    const { netCashToAccount } = market.getCashAmountGivenfCashAmount(fCash, blockTime);

    const { annualizedRate: minLendRate } = Market.getSlippageRate(
      fCash,
      netCashToAccount.neg(),
      market.maturity,
      -slippageBuffer * RATE_PRECISION,
      blockTime
    );

    const {
      amountIn: requiredDeposit,
      dexId,
      exchangeData,
    } = TradeHandler.getInGivenOut(this.getVault().primaryBorrowCurrency, netCashToAccount.toExternalPrecision().neg());
    const minPurchaseAmount = TradeHandler.applySlippage(
      netCashToAccount.toExternalPrecision().neg(),
      -slippageBuffer
    ).n;

    return {
      requiredDeposit: requiredDeposit.toInternalPrecision(),
      secondaryfCashBorrowed: undefined,
      depositParams: {
        minLendRate,
        minPurchaseAmount,
        dexId,
        exchangeData,
      },
    };
  }

  public getStrategyTokensGivenRedeem(
    vaultAccount: VaultAccount,
    redeemAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ) {
    const market = this.getLendMarket(vaultAccount.maturity);
    const { amountIn, dexId, exchangeData } = TradeHandler.getInGivenOut(
      this.lendCurrencyId,
      redeemAmount.toExternalPrecision()
    );
    const lendfCash = market.getfCashAmountGivenCashAmount(amountIn.toInternalPrecision(), blockTime);
    const { annualizedRate: maxBorrowRate } = Market.getSlippageRate(
      lendfCash,
      amountIn.toInternalPrecision(),
      vaultAccount.maturity,
      slippageBuffer * RATE_PRECISION,
      blockTime
    );

    const minPurchaseAmount = TradeHandler.applySlippage(redeemAmount.toExternalPrecision(), -slippageBuffer).n;
    return {
      strategyTokens: this.fCashToStrategyTokens(lendfCash.neg(), vaultAccount.maturity),
      secondaryfCashRepaid: undefined,
      redeemParams: {
        minPurchaseAmount,
        maxBorrowRate,
        dexId,
        exchangeData,
      },
    };
  }
}
