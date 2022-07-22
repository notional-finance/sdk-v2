import TypedBigNumber, { BigNumberType } from '../../libs/TypedBigNumber';
import { VaultConfig, VaultState } from '../../data';
import { VaultImplementation } from '../BaseVault';
import VaultAccount from '../VaultAccount';
import { CashGroup, Market, System } from '../../system';
import { BigNumber } from 'ethers';
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

export default class CrossCurrencyfCash implements VaultImplementation<DepositParams, RedeemParams> {
  private _lendCurrencyId: number = 0;

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

  private fCashToStrategyTokens(fCash: TypedBigNumber, vaultAddress: string, maturity: number) {
    return TypedBigNumber.from(fCash.n, BigNumberType.StrategyToken, `${vaultAddress}:${maturity}`);
  }

  // getLiquidationPrices: (
  //   vault: VaultConfig,
  //   vaultState: VaultState,
  //   vaultAccount: VaultAccount
  // ) => Record<string, TypedBigNumber>;

  public getStrategyTokenValue(
    vault: VaultConfig,
    _: VaultState,
    vaultAccount: VaultAccount,
    blockTime = getNowSeconds()
  ) {
    const { strategyTokens } = vaultAccount.getPoolShare();
    const strategyTokensAsfCash = this.strategyTokensTofCash(strategyTokens);
    const fCashPV = System.getSystem()
      .getCashGroup(this.lendCurrencyId)
      .getfCashPresentValueUnderlyingInternal(vaultAccount.maturity, strategyTokensAsfCash, true, blockTime);

    return fCashPV.toETH(false).fromETH(vault.primaryBorrowCurrency, false);
  }

  private _getDepositParameters(
    vaultState: VaultState,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime = getNowSeconds()
  ) {
    const { amountOut, dexId, exchangeData } = TradeHandler.getOutGivenIn(
      this.lendCurrencyId,
      depositAmount.toUnderlying(false)
    );
    // get minPurchaseAmount based on depositAmount, apply slippage buffer
    const minPurchaseAmount = TradeHandler.applySlippage(amountOut, slippageBuffer);
    // get lendRate based on optimalPurchaseAmount, apply slippage buffer
    const market = this.getLendMarket(vaultState.maturity);
    const lendfCash = market.getfCashAmountGivenCashAmount(amountOut.toInternalPrecision(), blockTime);

    const { annualizedRate: minLendRate } = Market.getSlippageRate(
      lendfCash,
      amountOut,
      market.maturity,
      slippageBuffer,
      blockTime
    );

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
    _: VaultConfig,
    vaultState: VaultState,
    depositAmount: TypedBigNumber,
    slippageBuffer: number = 0.05,
    blockTime = getNowSeconds()
  ) {
    const { depositParams } = this._getDepositParameters(vaultState, depositAmount, slippageBuffer, blockTime);
    return depositParams;
  }

  private _getRedeemParameters(
    vault: VaultConfig,
    vaultState: VaultState,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime = getNowSeconds()
  ) {
    const market = this.getLendMarket(vaultState.maturity);
    const lendfCash = this.strategyTokensTofCash(strategyTokens);
    const { netCashToAccount } = market.getCashAmountGivenfCashAmount(lendfCash, blockTime);
    const { amountOut, dexId, exchangeData } = TradeHandler.getOutGivenIn(
      vault.primaryBorrowCurrency,
      netCashToAccount.toUnderlying(false)
    );
    const minPurchaseAmount = TradeHandler.applySlippage(amountOut, slippageBuffer);

    const { annualizedRate: maxBorrowRate } = Market.getSlippageRate(
      lendfCash,
      netCashToAccount,
      market.maturity,
      slippageBuffer,
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
    vault: VaultConfig,
    vaultState: VaultState,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime = getNowSeconds()
  ) {
    const { redeemParams } = this._getRedeemParameters(vault, vaultState, strategyTokens, slippageBuffer, blockTime);
    return redeemParams;
  }

  public getSlippageFromDepositParameters(
    _: VaultConfig,
    vaultState: VaultState,
    depositAmount: TypedBigNumber,
    params: DepositParams,
    blockTime = getNowSeconds()
  ) {
    const market = this.getLendMarket(vaultState.maturity);

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
      Market.interestToExchangeRate(params.minLendRate, blockTime, vaultState.maturity),
      idealTrade.copy(params.minPurchaseAmount).toInternalPrecision()
    );

    // End to End Slippage = (noSlippage - worstCase) / noSlippage
    return idealfCash.sub(worstCasefCash).scale(RATE_PRECISION, idealfCash).toNumber();
  }

  public getSlippageFromRedeemParameters(
    vault: VaultConfig,
    vaultState: VaultState,
    strategyTokens: TypedBigNumber,
    params: RedeemParams,
    blockTime = getNowSeconds()
  ) {
    const market = this.getLendMarket(vaultState.maturity);
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
    vault: VaultConfig,
    _: VaultState,
    vaultAccount: VaultAccount,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ) {
    const market = this.getLendMarket(vaultAccount.maturity);
    const { amountOut, depositParams } = this._getDepositParameters(_, depositAmount, slippageBuffer, blockTime);
    const lendfCash = market.getfCashAmountGivenCashAmount(amountOut.neg(), blockTime);

    return {
      strategyTokens: this.fCashToStrategyTokens(lendfCash, vault.vaultAddress, vaultAccount.maturity),
      secondaryfCashBorrowed: undefined,
      depositParams,
    };
  }

  public getRedeemGivenStrategyTokens(
    vault: VaultConfig,
    _: VaultState,
    __: VaultAccount,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ) {
    const { amountOut, redeemParams } = this._getRedeemParameters(vault, _, strategyTokens, slippageBuffer, blockTime);

    return {
      amountRedeemed: amountOut,
      secondaryfCashRepaid: undefined,
      redeemParams,
    };
  }

  public getDepositGivenStrategyTokens(
    vault: VaultConfig,
    _: VaultState,
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
      netCashToAccount,
      market.maturity,
      slippageBuffer,
      blockTime
    );

    const {
      amountIn: requiredDeposit,
      dexId,
      exchangeData,
    } = TradeHandler.getInGivenOut(vault.primaryBorrowCurrency, netCashToAccount.neg());
    const minPurchaseAmount = TradeHandler.applySlippage(requiredDeposit, slippageBuffer).n;

    return {
      requiredDeposit,
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
    vault: VaultConfig,
    __: VaultState,
    vaultAccount: VaultAccount,
    redeemAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ) {
    const market = this.getLendMarket(vaultAccount.maturity);
    const { amountIn, dexId, exchangeData } = TradeHandler.getInGivenOut(this.lendCurrencyId, redeemAmount);
    const lendfCash = market.getfCashAmountGivenCashAmount(amountIn, blockTime);

    const { annualizedRate: maxBorrowRate } = Market.getSlippageRate(
      lendfCash,
      amountIn,
      vaultAccount.maturity,
      slippageBuffer,
      blockTime
    );

    const minPurchaseAmount = TradeHandler.applySlippage(amountIn, slippageBuffer).n;
    return {
      strategyTokens: this.fCashToStrategyTokens(lendfCash.neg(), vault.vaultAddress, vaultAccount.maturity),
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
