import { BigNumber } from 'ethers';
import { TradingEstimate } from '..';
import { INTERNAL_TOKEN_PRECISION, RATE_PRECISION } from '../config/constants';
import TypedBigNumber from '../libs/TypedBigNumber';
import { System } from '../system';

export default class TradeHandler {
  private static INTERNAL_TOKEN_SQUARED = BigNumber.from(INTERNAL_TOKEN_PRECISION).mul(INTERNAL_TOKEN_PRECISION);

  private static _checkAmount(amount: TypedBigNumber) {
    if (!amount.isExternalPrecision()) throw Error('Trading amounts must be external precision');
    if (!amount.isUnderlying()) throw Error('Trading amounts must be underlying');
  }

  public static getIdealOutGivenIn(outCurrencyId: number, amountIn: TypedBigNumber) {
    this._checkAmount(amountIn);
    if (outCurrencyId === amountIn.currencyId) throw Error('Matching currencies');
    return amountIn.toInternalPrecision().toETH(false).fromETH(outCurrencyId, false).toExternalPrecision();
  }

  public static getIdealInGivenOut(inCurrencyId: number, amountOut: TypedBigNumber) {
    this._checkAmount(amountOut);
    if (inCurrencyId === amountOut.currencyId) throw Error('Matching currencies');
    return amountOut.toInternalPrecision().toETH(false).fromETH(inCurrencyId, false).toExternalPrecision();
  }

  public static getSellEstimate(sellToken: string, requiredBuyAmount: TypedBigNumber, slippageBPS = 0) {
    const buyToken = requiredBuyAmount.symbol;
    if (sellToken === buyToken) throw Error('Matching currencies');
    const tradingEstimates = System.getSystem().getTradingEstimates(sellToken, buyToken);
    const expectedPrice = this._getExpectedPrice(tradingEstimates, requiredBuyAmount, 'buy');

    // sell = buy / price
    const sellEstimate = TypedBigNumber.fromBalance(
      requiredBuyAmount.scale(INTERNAL_TOKEN_PRECISION, expectedPrice).toInternalPrecision().n,
      sellToken,
      true
    ).toExternalPrecision();

    return {
      sellEstimate,
      minPurchaseAmount: this.applySlippage(sellEstimate, slippageBPS),
    };
  }

  public static getBuyEstimate(buyToken: string, requiredSellAmount: TypedBigNumber, slippageBPS = 0) {
    const sellToken = requiredSellAmount.symbol;
    if (sellToken === buyToken) throw Error('Matching currencies');
    const tradingEstimates = System.getSystem().getTradingEstimates(sellToken, buyToken);
    const expectedPrice = this._getExpectedPrice(tradingEstimates, requiredSellAmount, 'sell');

    // sell * price = buy
    const buyEstimate = TypedBigNumber.fromBalance(
      requiredSellAmount.scale(expectedPrice, INTERNAL_TOKEN_PRECISION).toInternalPrecision().n,
      buyToken,
      true
    ).toExternalPrecision();

    return {
      buyEstimate,
      minPurchaseAmount: this.applySlippage(buyEstimate, -slippageBPS),
      expectedPrice,
    };
  }

  private static _getExpectedPrice(
    tradingEstimates: TradingEstimate,
    requiredAmount: TypedBigNumber,
    buyOrSell: 'buy' | 'sell'
  ) {
    const upperEstimateIndex = tradingEstimates.estimates.findIndex(({ sellAmount, buyAmount }) => {
      const amount = buyOrSell === 'sell' ? sellAmount : buyAmount;
      return amount.gte(requiredAmount.toExternalPrecision());
    });

    if (upperEstimateIndex === -1) {
      // Overflowed the highest estimate that we have
      throw Error('Unable to estimate trade');
    } else if (upperEstimateIndex === 0) {
      // Assume no slippage below the first range
      return tradingEstimates.estimates[upperEstimateIndex].price;
    } else {
      // the expected purchase price is:
      // expectedPrice = slope * offset + lowerPrice
      // slope = (upperPrice - lowerPrice) / (upperSell - lowerSell)
      // offset = requiredSell - lowerSell
      const lowerEstimate = tradingEstimates.estimates[upperEstimateIndex - 1];
      const upperEstimate = tradingEstimates.estimates[upperEstimateIndex];
      const upperAmount = buyOrSell === 'sell' ? upperEstimate.sellAmount : upperEstimate.buyAmount;
      const lowerAmount = buyOrSell === 'sell' ? lowerEstimate.sellAmount : lowerEstimate.buyAmount;
      // Use double internal token precision (1e16) to ensure that we have enough decimal places to
      // capture the
      const slope = upperEstimate.price
        .sub(lowerEstimate.price)
        .mul(this.INTERNAL_TOKEN_SQUARED)
        .div(upperAmount.toInternalPrecision().sub(lowerAmount.toInternalPrecision()).n);
      const offset = requiredAmount.toInternalPrecision().sub(lowerAmount.toInternalPrecision()).n;

      return slope.mul(offset).div(this.INTERNAL_TOKEN_SQUARED).add(lowerEstimate.price);
    }
  }

  // public static getExactTrade(sellToken: string, buyToken: string, requiredSellAmount: BigNumber, slippageBPS = 0) {
  // }

  public static applySlippage(amount: TypedBigNumber, slippageBPS: number) {
    this._checkAmount(amount);
    return amount.add(amount.scale(Math.floor(slippageBPS * RATE_PRECISION), RATE_PRECISION));
  }
}
