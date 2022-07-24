import { RATE_PRECISION } from '../config/constants';
import TypedBigNumber from '../libs/TypedBigNumber';

export default class TradeHandler {
  private static _checkAmount(amount: TypedBigNumber) {
    if (!amount.isExternalPrecision()) throw Error('Trading amounts must be external precision');
    if (!amount.isUnderlying()) throw Error('Trading amounts must be underlying');
  }

  public static getIdealOutGivenIn(outCurrencyId: number, amountIn: TypedBigNumber) {
    this._checkAmount(amountIn);
    if (outCurrencyId === amountIn.currencyId) throw Error('Matching currencies');
    return amountIn.toETH(false).fromETH(outCurrencyId, false).toExternalPrecision();
  }

  public static getIdealInGivenOut(inCurrencyId: number, amountOut: TypedBigNumber) {
    this._checkAmount(amountOut);
    if (inCurrencyId === amountOut.currencyId) throw Error('Matching currencies');
    return amountOut.toETH(false).fromETH(inCurrencyId, false).toExternalPrecision();
  }

  public static getOutGivenIn(outCurrencyId: number, amountIn: TypedBigNumber, slippageBPS = 0) {
    this._checkAmount(amountIn);
    if (outCurrencyId === amountIn.currencyId) throw Error('Matching currencies');
    const amountOut = amountIn.toETH(false).fromETH(outCurrencyId, false).toExternalPrecision();

    return {
      amountOut,
      minPurchaseAmount: this.applySlippage(amountOut, -slippageBPS),
      dexId: 1,
      exchangeData: '',
    };
  }

  public static getInGivenOut(inCurrencyId: number, amountOut: TypedBigNumber, slippageBPS = 0) {
    this._checkAmount(amountOut);
    if (inCurrencyId === amountOut.currencyId) throw Error('Matching currencies');
    const amountIn = amountOut.toETH(false).fromETH(inCurrencyId, false).toExternalPrecision();

    return {
      amountIn,
      requiredAmountIn: this.applySlippage(amountIn, slippageBPS),
      dexId: 1,
      exchangeData: '',
    };
  }

  public static applySlippage(amount: TypedBigNumber, slippageBPS: number) {
    this._checkAmount(amount);
    return amount.add(amount.scale(Math.floor(slippageBPS * RATE_PRECISION), RATE_PRECISION));
  }
}
