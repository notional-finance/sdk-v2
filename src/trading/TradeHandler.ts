import { RATE_PRECISION } from '../config/constants';
import TypedBigNumber from '../libs/TypedBigNumber';

export default class TradeHandler {
  private static _checkAmount(amount: TypedBigNumber) {
    if (!amount.isExternalPrecision()) throw Error('Trading amounts must be external precision');
    if (!amount.isUnderlying()) throw Error('Trading amounts must be underlying');
  }

  public static getIdealOutGivenIn(outCurrencyId: number, amountIn: TypedBigNumber) {
    this._checkAmount(amountIn);
    if (outCurrencyId == amountIn.currencyId) throw Error('Matching currencies');
    return amountIn.toInternalPrecision().toETH(false).fromETH(outCurrencyId, false).toExternalPrecision();
  }

  public static getIdealInGivenOut(inCurrencyId: number, amountOut: TypedBigNumber) {
    this._checkAmount(amountOut);
    if (inCurrencyId == amountOut.currencyId) throw Error('Matching currencies');
    return amountOut.toInternalPrecision().toETH(false).fromETH(inCurrencyId, false).toExternalPrecision(),
  }

  public static getOutGivenIn(outCurrencyId: number, amountIn: TypedBigNumber) {
    this._checkAmount(amountIn);
    if (outCurrencyId == amountIn.currencyId) throw Error('Matching currencies');

    return {
      amountOut: amountIn.toInternalPrecision().toETH(false).fromETH(outCurrencyId, false).toExternalPrecision(),
      dexId: 1,
      exchangeData: '',
    };
  }

  public static getInGivenOut(inCurrencyId: number, amountOut: TypedBigNumber) {
    this._checkAmount(amountOut);
    if (inCurrencyId == amountOut.currencyId) throw Error('Matching currencies');

    return {
      amountIn: amountOut.toInternalPrecision().toETH(false).fromETH(inCurrencyId, false).toExternalPrecision(),
      dexId: 1,
      exchangeData: '',
    };
  }

  public static applySlippage(amount: TypedBigNumber, slippageBPS: number) {
    this._checkAmount(amount);
    return amount.scale(Math.floor(slippageBPS * RATE_PRECISION), RATE_PRECISION);
  }
}
