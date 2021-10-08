import {BigNumber} from 'ethers';
import {System, Market, CashGroup} from '.';
import TypedBigNumber, {BigNumberType} from '../libs/TypedBigNumber';
import {getNowSeconds} from '../libs/utils';
import {INTERNAL_TOKEN_PRECISION, PERCENTAGE_BASIS, SECONDS_IN_YEAR} from '../config/constants';
import {Asset, NTokenStatus} from '../libs/types';

export default class NTokenValue {
  public static getNTokenFactors(currencyId: number) {
    const system = System.getSystem();
    const nToken = system.getNToken(currencyId);
    const totalSupply = system.getNTokenTotalSupply(currencyId);
    const nTokenPV = system.getNTokenAssetCashPV(currencyId);
    const {symbol: assetSymbol} = system.getCurrencyById(currencyId);

    if (!nToken) throw new Error(`nToken ${currencyId} not found`);
    if (!totalSupply) throw new Error(`Total nToken supply for ${currencyId} not found`);
    if (!nTokenPV) throw new Error(`Total nToken PV for ${currencyId} not found`);

    return {
      nToken,
      totalSupply,
      nTokenPV,
      assetSymbol,
    };
  }

  public static getNTokenPortfolio(currencyId: number) {
    const system = System.getSystem();
    const {cashBalance, liquidityTokens, fCash} = system.getNTokenPortfolio(currencyId);
    const cashGroup = system.getCashGroup(currencyId);

    if (!cashGroup) throw new Error(`Cash group for ${currencyId} not found`);
    if (!cashBalance || !liquidityTokens || !fCash) throw new Error(`Missing asset data for nToken at ${currencyId}`);

    return {
      cashBalance, liquidityTokens, fCash, cashGroup,
    };
  }

  /**
   * Converts an ntoken balance to internal asset denomination
   *
   * @param currencyId
   * @param nTokenBalance
   * @param useHaircut
   * @returns
   */
  public static convertNTokenToInternalAsset(currencyId: number, nTokenBalance: TypedBigNumber, useHaircut: boolean) {
    const {
      nToken, totalSupply, nTokenPV, assetSymbol,
    } = NTokenValue.getNTokenFactors(currencyId);

    if (totalSupply.isZero()) return TypedBigNumber.from(0, BigNumberType.InternalAsset, assetSymbol);
    nTokenBalance.check(BigNumberType.nToken, nToken.symbol);
    const nTokenHaircut = useHaircut ? nToken.pvHaircutPercentage : PERCENTAGE_BASIS;

    // Balance * PV * Haircut / (totalSupply * BASIS)
    const internalAsset = nTokenBalance.n.mul(nTokenPV.n).mul(nTokenHaircut).div(PERCENTAGE_BASIS).div(totalSupply.n);
    return TypedBigNumber.from(internalAsset, BigNumberType.InternalAsset, assetSymbol);
  }

  /**
   * Returns the amount of nTokens that will be minted as a result of deposited the amount of asset cash
   *
   * @param currencyId
   * @param assetCashAmountInternal
   * @returns
   */
  public static getNTokensToMint(currencyId: number, assetCashAmountInternal: TypedBigNumber) {
    const {
      nToken, totalSupply, nTokenPV, assetSymbol,
    } = NTokenValue.getNTokenFactors(currencyId);

    assetCashAmountInternal.check(BigNumberType.InternalAsset, assetSymbol);
    const nTokenAmount = nTokenPV.isZero()
      ? assetCashAmountInternal.n
      : assetCashAmountInternal.n.mul(totalSupply.n).div(nTokenPV.n);

    return TypedBigNumber.from(nTokenAmount, BigNumberType.nToken, nToken.symbol);
  }

  /**
   * Returns the amount of asset cash required to mint an nToken balance
   *
   * @param currencyId
   * @param nTokenBalance
   * @returns amount of asset cash required to mint the nToken balance
   */
  public static getAssetRequiredToMintNToken(currencyId: number, nTokenBalance: TypedBigNumber) {
    const {
      nToken, totalSupply, nTokenPV, assetSymbol,
    } = NTokenValue.getNTokenFactors(currencyId);

    nTokenBalance.check(BigNumberType.nToken, nToken.symbol);
    const assetCash = nTokenPV.isZero()
      ? nTokenBalance.n
      : nTokenBalance.scale(nTokenPV.n, totalSupply.n);

    return TypedBigNumber.from(assetCash, BigNumberType.InternalAsset, assetSymbol);
  }

  /**
   * Returns the amount of nTokens required to withdraw some amount of cash
   *
   * @param currencyId
   * @param assetCashAmountInternal amount of asset cash to be generated
   * @param precision amount of precision tolerance for the estimation in asset cash
   * @returns an nToken amount
   */
  public static getNTokenRedeemFromAsset(
    currencyId: number,
    assetCashAmountInternal: TypedBigNumber,
    precision = BigNumber.from(1e4),
  ) {
    const {totalSupply, nTokenPV} = NTokenValue.getNTokenFactors(currencyId);

    // The first guess is that the redeem amount is just a straight percentage of the total
    // supply, this is going to be pretty accurate is most cases
    let nTokenRedeem = totalSupply.scale(assetCashAmountInternal.n, nTokenPV.n);
    let redeemValue = NTokenValue.getAssetFromRedeemNToken(currencyId, nTokenRedeem);
    // We always want to redeem value slightly less than the specified amount, if we were to
    // redeem slightly more then it could result in a free collateral failure. We continue to
    // loop while assetCash - redeemValue < 0 or assetCash - redeemValue > precision
    let diff = assetCashAmountInternal.sub(redeemValue);
    let totalLoops = 0;
    while (diff.isNegative() || diff.n.gt(precision)) {
      // If the nToken redeem value is too high (diff < 0), we reduce the nTokenRedeem amount by
      // the proportion of the total supply. If the nToken redeem value is too low (diff > 0), increase
      // the nTokenRedeem amount by the proportion of the total supply
      nTokenRedeem = nTokenRedeem.add(totalSupply.scale(diff.n, nTokenPV.n));
      redeemValue = NTokenValue.getAssetFromRedeemNToken(currencyId, nTokenRedeem);
      diff = assetCashAmountInternal.sub(redeemValue);
      totalLoops += 1;
      if (totalLoops > 250) throw Error('Unable to converge on nTokenRedeem');
    }

    return nTokenRedeem;
  }

  public static getNTokenStatus(currencyId: number) {
    const {liquidityTokens, fCash} = NTokenValue.getNTokenPortfolio(currencyId);

    // If there are no liquidity tokens then the markets have not been initialized for the first time,
    // but mint and redeem are still possible.
    if (liquidityTokens.length > 0 && liquidityTokens[0].hasMatured) return NTokenStatus.MarketsNotInitialized;
    if (fCash.filter((f) => !liquidityTokens.find((lt) => lt.maturity === f.maturity)).length) {
      // If residual fCash is in the nToken account this calculation will not work. nTokens can still
      // be redeemed but will have residual fCash assets.
      return NTokenStatus.nTokenHasResidual;
    }

    return NTokenStatus.Ok;
  }

  /**
   * Returns the amount of asset cash the account will receive from redeeming nTokens
   *
   * @param currencyId
   * @param nTokenBalance amount of nTokens to redeem
   * @returns a TypedBigNumber in internal asset denomination
   */
  public static getAssetFromRedeemNToken(currencyId: number, nTokenBalance: TypedBigNumber) {
    const {nToken, totalSupply} = NTokenValue.getNTokenFactors(currencyId);
    const {
      cashBalance, liquidityTokens, fCash, cashGroup,
    } = NTokenValue.getNTokenPortfolio(currencyId);
    nTokenBalance.check(BigNumberType.nToken, nToken.symbol);

    const status = NTokenValue.getNTokenStatus(currencyId);
    if (status !== NTokenStatus.Ok) throw Error(status);

    // This is the redeemer's share of the cash balance
    const cashBalanceShare = cashBalance.scale(nTokenBalance.n, totalSupply.n);

    // At this point we know there is no residual fCash
    return liquidityTokens.reduce((totalAssetCash, lt) => {
      const {fCashClaim, assetCashClaim} = cashGroup.getLiquidityTokenValue(lt.assetType, lt.notional, false);
      const netfCash = fCashClaim.add(fCash.find((f) => f.maturity === lt.maturity)?.notional || fCashClaim.copy(0));

      // Get the redeemer's share of the liquidity tokens and fCash
      const netfCashShare = netfCash.scale(nTokenBalance.n, totalSupply.n);
      const assetCashShare = assetCashClaim.scale(nTokenBalance.n, totalSupply.n);

      if (!netfCashShare.isZero()) {
        // Simulates cash generated by trading off the fCash position
        const market = cashGroup.getMarket(CashGroup.getMarketIndexForMaturity(lt.maturity));
        const {netCashToAccount} = market.getCashAmountGivenfCashAmount(netfCash.neg());
        const netAssetCash = netCashToAccount.toAssetCash();
        return totalAssetCash.add(assetCashShare).add(netAssetCash);
      }
      return totalAssetCash.add(assetCashShare);
    }, cashBalanceShare);
  }

  /**
   * Returns the blended interest rate for an nToken as described here:
   * https://app.gitbook.com/@notional-finance/s/notional-v2/technical-topics/ntoken-blended-interest-rate
   *
   * @param currencyId
   * @returns a number that represents the blended annual interest rate
   */
  public static getNTokenBlendedYield(currencyId: number) {
    const {
      cashBalance, liquidityTokens, fCash, cashGroup,
    } = NTokenValue.getNTokenPortfolio(currencyId);

    return NTokenValue.calculateNTokenBlendedYieldAtBlock(currencyId, cashBalance, liquidityTokens, fCash, cashGroup);
  }

  protected static calculateNTokenBlendedYieldAtBlock(
    currencyId: number,
    cashBalance: TypedBigNumber,
    liquidityTokens: Asset[],
    fCash: Asset[],
    cashGroup: CashGroup,
    blockTime = getNowSeconds(),
    marketOverrides?: Market[],
    assetRateOverride?: BigNumber,
  ) {
    let totalAssetCash = cashBalance;
    const supplyRate = cashGroup.blockSupplyRate;
    // Check null or undefined because zero is valid supply rate
    if (supplyRate === null || supplyRate === undefined) throw new Error(`Supply rate for ${currencyId} not found`);

    const fCashInterestRates = fCash.map((f) => {
      let {notional: fCashNotional} = f;

      // Get the total asset cash and the netfCash notional from the liquidity tokens
      liquidityTokens
        .filter((l) => l.maturity === f.maturity)
        .forEach((lt, index) => {
          if (index > 0) throw Error('Found multiple liquidity tokens for single maturity');

          const {fCashClaim, assetCashClaim} = cashGroup.getLiquidityTokenValue(lt.assetType, lt.notional, false);
          totalAssetCash = totalAssetCash.add(assetCashClaim);
          fCashNotional = fCashNotional.add(fCashClaim);
        });

      // The blended interest rate will be weighted average of the interest rates and their associated present values
      return {
        rate: cashGroup.getOracleRate(f.maturity, blockTime, marketOverrides, supplyRate),
        weight: cashGroup.getfCashPresentValueUnderlyingInternal(
          f.maturity,
          fCashNotional,
          false,
          blockTime,
          marketOverrides,
          supplyRate,
        ),
      };
    });

    const totalCashUnderlying = totalAssetCash.toUnderlying(true, assetRateOverride);
    // The denominator is the total amount of underlying that the nToken account holds
    const totalUnderlying = fCashInterestRates.reduce((t, {weight}) => t.add(weight), totalCashUnderlying);
    // The numerator is the present value multiplied by its associated interest rate
    const numerator = fCashInterestRates.reduce(
      (num, {rate, weight}) => num.add(weight.scale(rate, 1)),
      totalCashUnderlying.scale(supplyRate, 1),
    );

    return totalUnderlying.isZero() ? 0 : numerator.n.div(totalUnderlying.n).toNumber();
  }

  public static getClaimableIncentives(
    currencyId: number,
    nTokenBalance: TypedBigNumber,
    lastClaimTime: number,
    lastClaimIntegralSupply: BigNumber,
    currentTime = getNowSeconds(),
  ): TypedBigNumber {
    const {nToken, totalSupply} = NTokenValue.getNTokenFactors(currencyId);
    const incentiveFactors = System.getSystem().getNTokenIncentiveFactors(currencyId);
    if (!incentiveFactors) throw new Error('Incentive emission factors not found');

    nTokenBalance.check(BigNumberType.nToken, nToken.symbol);

    const timeSinceLastClaim = currentTime - lastClaimTime;
    if (timeSinceLastClaim < 0) return TypedBigNumber.from(0, BigNumberType.NOTE, 'NOTE');

    const integralTotalSupply = incentiveFactors.integralTotalSupply.add(
      totalSupply.n.mul(currentTime - incentiveFactors.lastSupplyChangeTime.toNumber()),
    );
    /// incentivesToClaim = (tokenBalance / totalSupply) * emissionRatePerYear * proRataYears
    ///   where proRataYears is (timeSinceLastClaim / YEAR) * INTERNAL_TOKEN_PRECISION
    const avgTotalSupply = integralTotalSupply.sub(lastClaimIntegralSupply).div(timeSinceLastClaim);
    if (avgTotalSupply.isZero()) return TypedBigNumber.from(0, BigNumberType.NOTE, 'NOTE');

    const proRataYears = BigNumber.from(Math.trunc((timeSinceLastClaim / SECONDS_IN_YEAR) * INTERNAL_TOKEN_PRECISION));

    const incentives = nTokenBalance.n
      .mul(nToken.incentiveEmissionRate)
      .mul(proRataYears)
      .div(avgTotalSupply)
      .div(INTERNAL_TOKEN_PRECISION);

    return TypedBigNumber.from(incentives, BigNumberType.NOTE, 'NOTE');
  }
}
