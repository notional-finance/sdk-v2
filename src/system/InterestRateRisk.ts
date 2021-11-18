import {BigNumber} from 'ethers';
import {
  FreeCollateral, Market, System, NTokenValue,
} from '.';
import {AccountData} from '../account';
import {
  BASIS_POINT, MAX_INTEREST_RATE, MIN_INTEREST_RATE, PERCENTAGE_BASIS,
} from '../config/constants';
import TypedBigNumber from '../libs/TypedBigNumber';
import {Asset, AssetType} from '../libs/types';
import {getNowSeconds} from '../libs/utils';

export default class InterestRateRisk {
  public static calculateInterestRateRisk(
    accountData: AccountData,
    blockTime = getNowSeconds(),
  ) {
    const currencies = InterestRateRisk.getRiskyCurrencies(accountData);
    const {
      netETHDebtWithBuffer,
      netETHCollateralWithHaircut,
      netUnderlyingAvailable,
    } = FreeCollateral.getFreeCollateral(accountData, blockTime);
    const aggregateFC = netETHCollateralWithHaircut.sub(netETHDebtWithBuffer);

    return currencies.reduce((map, id) => {
      const currentWeightedAvgInterestRate = InterestRateRisk.getWeightedAvgInterestRate(id, blockTime);
      const netUnderlying = netUnderlyingAvailable.get(id) || TypedBigNumber.getZeroUnderlying(id);
      const minLocalCollateral = InterestRateRisk.getMinLocalCurrencyCollateral(
        id,
        aggregateFC,
        netUnderlying,
      );

      const upperLiquidationInterestRate = InterestRateRisk.findLiquidationRate(
        id, accountData, minLocalCollateral, true,
      );

      const lowerLiquidationInterestRate = InterestRateRisk.findLiquidationRate(
        id, accountData, minLocalCollateral, false,
      );

      if (upperLiquidationInterestRate !== null || lowerLiquidationInterestRate !== null) {
        map.set(id, {
          currentWeightedAvgInterestRate,
          upperLiquidationInterestRate,
          lowerLiquidationInterestRate,
        });
      }

      return map;
    }, new Map<number, {
      currentWeightedAvgInterestRate: number,
      upperLiquidationInterestRate: number | null,
      lowerLiquidationInterestRate: number | null
    }>());
  }

  /**
   * Returns a weighted average interest rate from the current markets as a point of
   * comparison with the simulated liquidation interest rate
   *
   * @param currencyId
   * @param blockTime
   * @returns current weighted average interest rate
   */
  public static getWeightedAvgInterestRate(
    currencyId: number,
    blockTime = getNowSeconds(),
  ) {
    const cashGroup = System.getSystem().getCashGroup(currencyId);
    /* eslint-disable @typescript-eslint/no-shadow */
    const {
      numerator,
      totalLiquidity,
    } = cashGroup.markets.reduce(({numerator, totalLiquidity}, m) => {
      const oracleRate = cashGroup.getOracleRate(m.maturity, blockTime);
      return {
        numerator: numerator.add(m.market.totalLiquidity.n.mul(oracleRate)),
        totalLiquidity: totalLiquidity.add(m.market.totalLiquidity.n),
      };
    }, {
      numerator: BigNumber.from(0),
      totalLiquidity: BigNumber.from(0),
    });
    /* eslint-enable @typescript-eslint/no-shadow */

    return numerator.div(totalLiquidity).toNumber();
  }

  /**
   * Returns the currency ids the account has interest rate risk in
   * @param accountData
   */
  public static getRiskyCurrencies(accountData: AccountData) {
    const debtCurrencies = new Set<number>();
    const riskyCollateralCurrencies = new Set<number>();

    accountData.portfolio.forEach((a) => {
      if (a.assetType === AssetType.fCash && a.notional.isNegative()) {
        debtCurrencies.add(a.currencyId);
      } else {
        // Liquidity tokens and positive fCash are subject to interest rate risk
        riskyCollateralCurrencies.add(a.currencyId);
      }
    });

    accountData.accountBalances.forEach((b) => {
      if (b.nTokenBalance?.isPositive()) {
        riskyCollateralCurrencies.add(b.currencyId);
      } else if (b.cashBalance.isNegative()) {
        debtCurrencies.add(b.currencyId);
      } else if (b.cashBalance.isPositive() && debtCurrencies.has(b.currencyId)) {
        // In this case, the account is holding a cash balance against an fCash
        // debt and it may be that interest rates move such that the cash is insufficient
        // to collateralize the PV of the fCash debt
        riskyCollateralCurrencies.add(b.currencyId);
      }
    });

    // Returns the intersection between debt currencies and risky collateral currencies
    return Array.from(
      new Set([...debtCurrencies].filter((d) => riskyCollateralCurrencies.has(d))),
    ).sort();
  }

  /**
   * Returns the minimum amount of local currency gain or loss for FC to equal zero
   *
   * @param currencyId
   * @param aggregateFC
   * @param netLocalUnderlying
   * @returns
   */
  public static getMinLocalCurrencyCollateral(
    currencyId: number,
    aggregateFC: TypedBigNumber,
    netLocalUnderlying: TypedBigNumber,
  ) {
    // This is the local currency gain or loss to get to free collateral equal to zero, we
    // use this to calculate the liquidation point. If FC is already negative than interest
    // rates may be above or below this point already. It's possible that this currency is
    // not liquidatable but some other currency has caused FC to decrease.
    const necessaryLocalCurrencyGainOrLoss = aggregateFC.fromETH(currencyId, true);
    return netLocalUnderlying.sub(necessaryLocalCurrencyGainOrLoss);
  }

  /**
   * Iterates over potential interest rate range to find the liquidation interest rates
   *
   * @param currencyId
   * @param accountData
   * @param minLocalCollateral threshold of collateral the account requires before liquidation
   * @param fromMaxRate start from the highest interest rate, otherwise start from the lowest
   * @param blockTime
   * @param precision minimum liquidation interest rate precision (default: 10 basis points)
   * @returns
   */
  public static findLiquidationRate(
    currencyId: number,
    accountData: AccountData,
    minLocalCollateral: TypedBigNumber,
    fromMaxRate: boolean,
    blockTime = getNowSeconds(),
    precision = 10 * BASIS_POINT,
  ) {
    const portfolio = accountData.portfolio.filter((a) => a.currencyId === currencyId);
    const cashBalance = accountData.cashBalance(currencyId) || TypedBigNumber.getZeroUnderlying(currencyId);
    const nTokenBalance = accountData.nTokenBalance(currencyId);

    let simulatedLocalCollateral: TypedBigNumber;
    const startingInterestRate = fromMaxRate ? MAX_INTEREST_RATE : MIN_INTEREST_RATE;
    let interestRate = startingInterestRate;
    // If starting from the max rate, we decrease the rate else we increase. Starting epsilon is
    // a single percentage point
    let epsilon = fromMaxRate ? -100 * BASIS_POINT : 100 * BASIS_POINT;
    while (true) {
      simulatedLocalCollateral = InterestRateRisk.simulateLocalCurrencyValue(
        currencyId,
        interestRate,
        cashBalance,
        portfolio,
        nTokenBalance,
        blockTime,
      );

      if (simulatedLocalCollateral.gt(minLocalCollateral) || simulatedLocalCollateral.isZero()) {
        // Found the liquidation rate at the specified precision
        if (Math.abs(epsilon) === precision) return interestRate;
        if (fromMaxRate) {
          // In here we set the interest rate back to where it was in the previous iteration
          // and then iterate down from there, this will get us closer to the actual value
          interestRate -= epsilon;
          epsilon /= 10;
        } else {
          epsilon /= -10;
        }
      }

      // Update the interest rate in the specified direction, binary search might not be
      // more efficient here because we are looking for interest rates at the boundaries
      interestRate += epsilon;

      // If we have escaped the boundaries than there is no liquidation rate
      if (interestRate < MIN_INTEREST_RATE || MAX_INTEREST_RATE < interestRate) {
        return null;
      }
    }
  }

  /**
   * Returns the net local currency value at the specified interest rate
   *
   * @param currencyId
   * @param interestRate
   * @param cashBalance
   * @param fCashAssets
   * @param liquidityTokens
   * @param nTokenBalance
   */
  public static simulateLocalCurrencyValue(
    currencyId: number,
    interestRate: number,
    cashBalance: TypedBigNumber,
    portfolio: Asset[],
    nTokenBalance?: TypedBigNumber,
    blockTime = getNowSeconds(),
  ) {
    const marketOverrides = System.getSystem()
      .getMarkets(currencyId)
      .map((m) => m.getSimulatedMarket(interestRate, blockTime));

    const {
      liquidityTokenUnderlyingPV: portfolioLTValue,
      fCashUnderlyingPV: portfoliofCashValue,
    } = FreeCollateral.getCashGroupValue(
      currencyId,
      portfolio,
      blockTime,
      marketOverrides,
    );

    let nTokenValue: TypedBigNumber;
    if (nTokenBalance) {
      nTokenValue = InterestRateRisk.getNTokenSimulatedValue(nTokenBalance, marketOverrides);
    } else {
      nTokenValue = TypedBigNumber.getZeroUnderlying(currencyId);
    }

    // Cash balance is unaffected by interest rates
    return cashBalance
      .toUnderlying()
      .add(nTokenValue)
      .add(portfolioLTValue)
      .add(portfoliofCashValue);
  }

  /**
   * Calculates the simulated nToken value given the market overrides
   *
   * @param nTokenBalance
   * @param marketOverrides
   * @param blockTime
   * @returns
   */
  public static getNTokenSimulatedValue(
    nTokenBalance: TypedBigNumber,
    marketOverrides: Market[] | undefined,
    blockTime = getNowSeconds(),
  ) {
    if (nTokenBalance.isZero()) return nTokenBalance.toUnderlying();
    const {
      cashBalance,
      liquidityTokens,
      fCash,
    } = NTokenValue.getNTokenPortfolio(nTokenBalance.currencyId);
    const {nToken, totalSupply} = NTokenValue.getNTokenFactors(nTokenBalance.currencyId);

    const {
      liquidityTokenUnderlyingPV,
      fCashUnderlyingPV,
    } = FreeCollateral.getCashGroupValue(
      nTokenBalance.currencyId,
      [...liquidityTokens].concat([...fCash]),
      blockTime,
      marketOverrides,
      false, // turn off haircuts when calculating nToken value
    );

    const nTokenPV = cashBalance.toUnderlying()
      .add(liquidityTokenUnderlyingPV)
      .add(fCashUnderlyingPV);

    // Calculate haircut account value
    return nTokenPV
      .scale(nToken.pvHaircutPercentage, PERCENTAGE_BASIS)
      .scale(nTokenBalance.n, totalSupply.n);
  }
}
