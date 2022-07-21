import TypedBigNumber, { BigNumberType } from '../../libs/TypedBigNumber';
import { VaultConfig, VaultState } from '../../data';
import { VaultImplementation } from '../BaseVault';
import VaultAccount from '../VaultAccount';
import { CashGroup, Market, System } from '../../system';
import { BigNumber, Contract } from 'ethers';
import { getNowSeconds } from '../../libs/utils';

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

  public async loadImplementationParameters(vault: VaultConfig) {
    const contract = new Contract(vault.vaultAddress, interface, System.getSystem().batchProvider);
    this._lendCurrencyId = await contract.LEND_CURRENCY_ID().toNumber();
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

  public getDepositParameters(
    vault: VaultConfig,
    vaultState: VaultState,
    depositAmount: TypedBigNumber,
    slippageBuffer: number
  ) {
    // get minPurchaseAmount based on depositAmount, apply slippage buffer
    // get lendRate based on optimalPurchaseAmount, apply slippage buffer
  }

  public getRedeemParameters(
    vault: VaultConfig,
    vaultState: VaultState,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number
  ) {}

  public getSlippageFromDepositParameters(
    vault: VaultConfig,
    vaultState: VaultState,
    depositAmount: TypedBigNumber,
    params: DepositParams
  ) {
    // input = Cash amount in primary borrow
    // No Slippage Value:
    //   getCashFutureValue(fx(cashFromBorrow => lendCurrency) @ oracleRate)
    // Worse Case Value:
    //   getCashFutureValue(minPurchaseAmount @ minLendRate)
    // End to End Slippage = (noSlippage - worstCase) / noSlippage
  }

  public getSlippageFromRedeemParameters(
    vault: VaultConfig,
    vaultState: VaultState,
    strategyTokens: TypedBigNumber,
    params: RedeemParams
  ) {
    // input = strategyTokens to redeem
    // No Slippage Value:
    //   fx(getPV(strategyTokens @ oracleRate) => primaryBorrow)
    // Worse Case Value:
    //   minPurchaseAmount
    // End to End Slippage = (noSlippage - worstCase) / noSlippage
  }

  public getDepositGivenStrategyTokens(
    vault: VaultConfig,
    _: VaultState,
    vaultAccount: VaultAccount,
    strategyTokens: TypedBigNumber,
    totalSlippage: number,
    blockTime = getNowSeconds()
  ) {
    const market = this.getLendMarket(vaultAccount.maturity);
    const fCash = this.strategyTokensTofCash(strategyTokens);
    // TODO: apply splippage buffer
    const { netCashToAccount } = market.getCashAmountGivenfCashAmount(fCash, blockTime);
    const { annualizedRate: minLendRate } = Market.getSlippageRate(
      fCash,
      netCashToAccount,
      vaultAccount.maturity,
      totalSlippage,
      blockTime
    );

    const {
      amountIn: requiredDeposit,
      dexId,
      exchangeData,
    } = TradeHandler.getInGivenOut(vault.primaryBorrowCurrency, netCashToAccount.neg());

    const depositParams = {
      minPurchaseAmount: BigNumber.from(purchaseAmount * 0.95),
      minLendRate,
      dexId,
      exchangeData,
    };

    return {
      requiredDeposit,
      secondaryfCashBorrowed: undefined,
      depositParams,
    };
  }

  public getStrategyTokensGivenDeposit(
    vault: VaultConfig,
    _: VaultState,
    vaultAccount: VaultAccount,
    depositAmount: TypedBigNumber,
    totalSlippage: number,
    blockTime?: number
  ) {
    const market = this.getLendMarket(vaultAccount.maturity);
    const { amountOut, dexId, exchangeData } = TradeHandler.getOutGivenIn(this.lendCurrencyId, depositAmount);
    const lendfCash = market.getfCashAmountGivenCashAmount(amountOut.neg(), blockTime);

    const { annualizedRate: minLendRate } = Market.getSlippageRate(
      lendfCash,
      amountOut,
      vaultAccount.maturity,
      totalSlippage,
      blockTime
    );

    const depositParams = {
      minPurchaseAmount: BigNumber.from(amountOut * 0.95),
      minLendRate,
      dexId,
      exchangeData,
    };

    return {
      strategyTokens: this.fCashToStrategyTokens(lendfCash, vault.vaultAddress, vaultAccount.maturity),
      secondaryfCashBorrowed: undefined,
      depositParams,
    };
  }

  public getRedeemGivenStrategyTokens(
    vault: VaultConfig,
    _: VaultState,
    vaultAccount: VaultAccount,
    strategyTokens: TypedBigNumber,
    totalSlippage: number,
    blockTime?: number
  ) {
    const market = this.getLendMarket(vaultAccount.maturity);
    const lendfCash = this.strategyTokensTofCash(strategyTokens);
    const { netCashToAccount } = market.getCashAmountGivenfCashAmount(lendfCash, blockTime);
    const { amountOut, dexId, exchangeData } = TradeHandler.getOutGivenIn(
      vault.primaryBorrowCurrency,
      netCashToAccount
    );

    const { annualizedRate: maxBorrowRate } = Market.getSlippageRate(
      lendfCash,
      netCashToAccount,
      vaultAccount.maturity,
      totalSlippage,
      blockTime
    );

    const redeemParams = {
      minPurchaseAmount: BigNumber.from(amountOut * 0.95),
      maxBorrowRate,
      dexId,
      exchangeData,
    };

    return {
      amountRedeemed: amountOut,
      secondaryfCashRepaid: undefined,
      redeemParams,
    };
  }

  public getStrategyTokensGivenRedeem(
    vault: VaultConfig,
    __: VaultState,
    vaultAccount: VaultAccount,
    redeemAmount: TypedBigNumber,
    totalSlippage: number,
    blockTime?: number
  ) {
    const market = this.getLendMarket(vaultAccount.maturity);
    const { amountIn, dexId, exchangeData } = TradeHandler.getInGivenOut(this.lendCurrencyId, redeemAmount);
    const lendfCash = market.getfCashAmountGivenCashAmount(amountIn, blockTime);

    const { annualizedRate: maxBorrowRate } = Market.getSlippageRate(
      lendfCash,
      amountIn,
      vaultAccount.maturity,
      totalSlippage,
      blockTime
    );

    const redeemParams = {
      minPurchaseAmount: BigNumber.from(amountIn * 0.95),
      maxBorrowRate,
      dexId,
      exchangeData,
    };

    return {
      strategyTokens: this.fCashToStrategyTokens(lendfCash.neg(), vault.vaultAddress, vaultAccount.maturity),
      secondaryfCashRepaid: undefined,
      redeemParams,
    };
  }
}
