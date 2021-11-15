import {System, Market} from '.';
import {AccountData} from '../account';
import TypedBigNumber, {BigNumberType} from '../libs/TypedBigNumber';
import {getNowSeconds} from '../libs/utils';
import {Asset, AssetType} from '../libs/types';
import {INTERNAL_TOKEN_PRECISION, ETHER_CURRENCY_ID} from '../config/constants';
import NTokenValue from './NTokenValue';

const useHaircut = true;
const noHaircut = false;
const useInternal = true;
const ETH = ETHER_CURRENCY_ID;

export default class FreeCollateral {
  /**
   * Returns components of the free collateral figure
   * @param account
   * @param blockTime
   * @returns
   *  - netETHCollateralWithHaircut: aggregate amount of collateral converted to ETH with haircuts applied
   *  - netETHCollateral: aggregate amount of collateral converted to ETH without haircuts
   *  - netETHDebt: aggregate amount of debt converted to ETH without buffers applied
   *  - netETHDebtWithBuffer: aggregate amount of debt converted to ETH with buffers applied
   *  - netUnderlyingAvailable: net amount of debt or collateral in each currency without haircuts or buffers applied
   */
  public static getFreeCollateral(account: AccountData, blockTime = getNowSeconds()) {
    const netUnderlyingAvailable = new Map<number, TypedBigNumber>();
    let netETHCollateralWithHaircut = TypedBigNumber.getZeroUnderlying(ETH);
    let netETHCollateral = TypedBigNumber.getZeroUnderlying(ETH);
    let netETHDebt = TypedBigNumber.getZeroUnderlying(ETH);
    let netETHDebtWithBuffer = TypedBigNumber.getZeroUnderlying(ETH);

    account.accountBalances.forEach((b) => {
      const {nTokenValue, liquidityTokenUnderlyingPV, fCashUnderlyingPV} = FreeCollateral.getCurrencyComponents(
        b.currencyId,
        b.cashBalance,
        b.nTokenBalance,
        account.portfolio,
        blockTime,
      );

      // calculates the net value underlying
      const value = b.cashBalance.toUnderlying()
        .add(nTokenValue)
        .add(liquidityTokenUnderlyingPV)
        .add(fCashUnderlyingPV);

      netUnderlyingAvailable.set(b.currencyId, value);

      if (value.isNegative()) {
        netETHDebt = netETHDebt.add(value.toETH(noHaircut).abs());
        netETHDebtWithBuffer = netETHDebtWithBuffer.add(value.toETH(useHaircut).abs());
      } else {
        netETHCollateralWithHaircut = netETHCollateralWithHaircut.add(value.toETH(useHaircut));
        netETHCollateral = netETHCollateral.add(value.toETH(noHaircut));
      }
    });

    return {
      netETHDebt,
      netETHDebtWithBuffer,
      netETHCollateralWithHaircut,
      netETHCollateral,
      netUnderlyingAvailable,
    };
  }

  /**
   * Returns components of the currency available in a single currency
   * @param currencyId
   * @param assetCashBalanceInternal
   * @param nTokenBalance
   * @param portfolio
   * @param blockTime
   * @returns
   *  - nTokenValue: nToken present value
   *  - liquidityTokenUnderlyingPV: present value of the liquidity token
   *  - fCashUnderlyingPV: present value of the underlying fcash
   */
  public static getCurrencyComponents(
    currencyId: number,
    assetCashBalanceInternal: TypedBigNumber,
    nTokenBalance: TypedBigNumber | undefined,
    portfolio: Asset[],
    blockTime = getNowSeconds(),
  ) {
    const system = System.getSystem();
    const nTokenSymbol = system.getNToken(currencyId)?.symbol;
    const {symbol} = system.getCurrencyById(currencyId);
    const underlyingSymbol = system.getUnderlyingSymbol(currencyId);

    assetCashBalanceInternal.check(BigNumberType.InternalAsset, symbol);
    nTokenBalance?.check(BigNumberType.nToken, nTokenSymbol);
    const {liquidityTokenUnderlyingPV, fCashUnderlyingPV} = FreeCollateral.getCashGroupValue(
      currencyId,
      portfolio,
      blockTime,
    );

    let nTokenValue = TypedBigNumber.from(0, BigNumberType.InternalUnderlying, underlyingSymbol);
    if (nTokenBalance && nTokenBalance.isPositive()) {
      const nToken = system.getNToken(currencyId)!;
      nTokenValue = nTokenBalance
        .toAssetCash(useInternal).scale(nToken.pvHaircutPercentage, 100)
        .toUnderlying(useInternal);
    }

    return {
      nTokenValue,
      liquidityTokenUnderlyingPV,
      fCashUnderlyingPV,
    };
  }

  /**
   * Returns components of portfolio assets in a cash group
   * @param currencyId
   * @param portfolio
   * @param blockTime
   * @param marketOverrides can be used to simulate different markets
   * @param haircut can be set to false to simulate ntoken portfolio
   * @returns
   *  - liquidityTokenUnderlyingPV: present value of the liquidity token
   *  - fCashUnderlyingPV: present value of the underlying fcash
   */
  public static getCashGroupValue(
    currencyId: number,
    portfolio: Asset[],
    blockTime = getNowSeconds(),
    marketOverrides?: Market[],
    haircut = useHaircut,
  ) {
    const system = System.getSystem();
    // This creates a copy of the assets so that we can modify it in memory
    const currencyAssets = portfolio.filter((a) => a.currencyId === currencyId).slice();
    let liquidityTokenUnderlyingPV = TypedBigNumber.getZeroUnderlying(currencyId);
    let fCashUnderlyingPV = TypedBigNumber.getZeroUnderlying(currencyId);

    if (currencyAssets.length > 0) {
      const cashGroup = system.getCashGroup(currencyId);

      // Filters and reduces for liquidity token value
      liquidityTokenUnderlyingPV = currencyAssets
        .filter((a) => a.assetType !== AssetType.fCash)
        .reduce((underlyingPV, lt) => {
          // eslint-disable-next-line prefer-const
          let {assetCashClaim, fCashClaim} = cashGroup.getLiquidityTokenValue(
            lt.assetType,
            lt.notional,
            haircut,
            marketOverrides,
          );

          const index = currencyAssets.findIndex((a) => a.assetType === AssetType.fCash && lt.maturity === a.maturity);
          if (index > -1) {
            // net off fCash if it exists
            fCashClaim = fCashClaim.add(currencyAssets[index].notional);
            currencyAssets[index].notional = TypedBigNumber.from(
              0,
              currencyAssets[index].notional.type,
              currencyAssets[index].notional.symbol,
            );
          }

          const fCashHaircutPV = cashGroup.getfCashPresentValueUnderlyingInternal(
            lt.maturity,
            fCashClaim,
            haircut,
            blockTime,
            marketOverrides,
          );
          return underlyingPV.add(fCashHaircutPV).add(assetCashClaim.toUnderlying());
        }, liquidityTokenUnderlyingPV);

      // Filters and reduces for liquidity token value
      fCashUnderlyingPV = currencyAssets
        .filter((a) => a.assetType === AssetType.fCash)
        .reduce((underlyingPV, a) => underlyingPV.add(
          cashGroup.getfCashPresentValueUnderlyingInternal(a.maturity, a.notional, haircut, blockTime),
        ), fCashUnderlyingPV);
    }

    return {liquidityTokenUnderlyingPV, fCashUnderlyingPV};
  }

  /**
   * Calculates borrow requirements for a given amount of fCash and a target collateral ratio
   *
   * @param collateralCurrencyId currency to collateralize this asset by
   * @param bufferedRatio the target post haircut / buffer collateral ratio
   * @param accountData account data object with borrow amounts applied
   * @param mintNTokenCollateral true if collateral should be minted as nTokens
   * @param blockTime
   * @returns
   *   - minCollateral: minimum amount of collateral required for the borrow
   *   - targetCollateral: amount of collateral to reach the bufferedRatio
   *   - minCollateralRatio: minimum buffered/haircut collateral ratio
   *   - targetCollateralRatio: target buffered/haircut collateral ratio
   */
  public static calculateBorrowRequirement(
    collateralCurrencyId: number,
    _bufferedRatio: number,
    accountData: AccountData,
    mintNTokenCollateral = false,
    blockTime = getNowSeconds(),
  ): {
      minCollateral: TypedBigNumber;
      targetCollateral: TypedBigNumber;
      minCollateralRatio: number | null;
      minBufferedRatio: number | null;
      targetCollateralRatio: number | null;
      targetBufferedRatio: number | null;
    } {
    const bufferedRatio = Math.trunc(_bufferedRatio);
    if (bufferedRatio < 100) throw new RangeError('Buffered ratio must be more than 100');

    // prettier-ignore
    const {
      netETHCollateralWithHaircut,
      netETHDebtWithBuffer,
      netUnderlyingAvailable,
    } = FreeCollateral.getFreeCollateral(
      accountData,
      blockTime,
    );

    const collateralNetAvailable = (
      netUnderlyingAvailable.get(collateralCurrencyId)
      || TypedBigNumber.getZeroUnderlying(collateralCurrencyId)
    );

    let {minCollateral, targetCollateral} = FreeCollateral.calculateTargetCollateral(
      netETHCollateralWithHaircut,
      netETHDebtWithBuffer,
      collateralCurrencyId,
      collateralNetAvailable,
      bufferedRatio,
    );

    const minCollateralCopy = AccountData.copyAccountData(accountData);
    const targetCollateralCopy = AccountData.copyAccountData(accountData);
    if (mintNTokenCollateral) {
      const nToken = System.getSystem().getNToken(collateralCurrencyId);
      if (!nToken) throw Error(`nToken not found for ${collateralCurrencyId}`);
      const minAssetCash = minCollateral.toAssetCash(useInternal).scale(100, nToken.pvHaircutPercentage);
      const targetAssetCash = targetCollateral.toAssetCash(useInternal).scale(100, nToken.pvHaircutPercentage);
      minCollateral = NTokenValue.getNTokensToMint(collateralCurrencyId, minAssetCash);
      targetCollateral = NTokenValue.getNTokensToMint(collateralCurrencyId, targetAssetCash);

      minCollateralCopy.updateBalance(
        collateralCurrencyId,
        TypedBigNumber.getZeroUnderlying(collateralCurrencyId).toAssetCash(useInternal),
        minCollateral,
      );

      targetCollateralCopy.updateBalance(
        collateralCurrencyId,
        TypedBigNumber.getZeroUnderlying(collateralCurrencyId).toAssetCash(useInternal),
        targetCollateral,
      );
    } else {
      minCollateralCopy.updateBalance(collateralCurrencyId, minCollateral.toAssetCash(useInternal));
      targetCollateralCopy.updateBalance(collateralCurrencyId, targetCollateral.toAssetCash(useInternal));
    }

    const minFC = FreeCollateral.getFreeCollateral(minCollateralCopy, blockTime);
    const targetFC = FreeCollateral.getFreeCollateral(targetCollateralCopy, blockTime);
    return {
      minCollateral,
      targetCollateral,
      minCollateralRatio: FreeCollateral.calculateCollateralRatio(
        minFC.netETHCollateral, minFC.netETHDebt,
      ),
      minBufferedRatio: FreeCollateral.calculateCollateralRatio(
        minFC.netETHCollateralWithHaircut, minFC.netETHDebtWithBuffer,
      ),
      targetCollateralRatio: FreeCollateral.calculateCollateralRatio(
        targetFC.netETHCollateral, targetFC.netETHDebt,
      ),
      targetBufferedRatio: FreeCollateral.calculateCollateralRatio(
        targetFC.netETHCollateralWithHaircut, targetFC.netETHDebtWithBuffer,
      ),
    };
  }

  /**
   * Returns the amount of target collateral required to achieve the given buffered ratio
   *
   * @param netETHCollateralWithHaircut
   * @param netETHDebt
   * @param netETHDebtWithBuffer
   * @param collateralCurrencyId
   * @param collateralNetAvailable
   * @param bufferedRatio
   * @returns minCollateral and targetCollateral in collateral currency asset cash denomination
   */
  public static calculateTargetCollateral(
    netETHCollateralWithHaircut: TypedBigNumber,
    netETHDebtWithBuffer: TypedBigNumber,
    collateralCurrencyId: number,
    collateralNetAvailable: TypedBigNumber,
    bufferedRatio: number,
  ): {
      minCollateral: TypedBigNumber;
      targetCollateral: TypedBigNumber;
    } {
    // Minimum required ratio has multiplier of 1
    const minEthRequired = netETHCollateralWithHaircut.gte(netETHDebtWithBuffer)
      ? TypedBigNumber.getZeroUnderlying(ETH)
      : netETHDebtWithBuffer.sub(netETHCollateralWithHaircut);

    // Scale the netETHDebt with buffer to the buffered ratio and remove any existing collateral we have
    let targetEthRequired = netETHDebtWithBuffer.scale(bufferedRatio, 100).sub(netETHCollateralWithHaircut);

    // Cannot require negative ETH
    if (targetEthRequired.isNegative()) {
      targetEthRequired = TypedBigNumber.getZeroUnderlying(ETH);
    }

    if (minEthRequired.isZero() && targetEthRequired.isZero()) {
      // If this is the case then the account is sufficiently collateralized
      return {
        minCollateral: TypedBigNumber.getZeroUnderlying(collateralCurrencyId),
        targetCollateral: TypedBigNumber.getZeroUnderlying(collateralCurrencyId),
      };
    }

    if (collateralNetAvailable.n.gte(0)) {
      // If account does not have collateral debt then convert the target amounts back to the collateral
      // currency (this will account for majority of cases)
      return {
        minCollateral: minEthRequired.fromETH(collateralCurrencyId, useHaircut),
        targetCollateral: targetEthRequired.fromETH(collateralCurrencyId, useHaircut),
      };
    }

    // More complex scenario where there is collateral debt and we have to net it off first.
    const collateralDebtETHBuffer = collateralNetAvailable.toETH(useHaircut).abs();
    const collateralDebtETH = collateralNetAvailable.toETH(noHaircut).abs();

    const minCollateral = FreeCollateral.getRequiredCollateral(
      netETHCollateralWithHaircut,
      netETHDebtWithBuffer,
      collateralDebtETHBuffer,
      collateralDebtETH,
      100, // min buffered ratio is 1-1
      collateralCurrencyId,
    );

    const targetCollateral = FreeCollateral.getRequiredCollateral(
      netETHCollateralWithHaircut,
      netETHDebtWithBuffer,
      collateralDebtETHBuffer,
      collateralDebtETH,
      bufferedRatio,
      collateralCurrencyId,
    );

    return {
      minCollateral,
      targetCollateral,
    };
  }

  private static getRequiredCollateral(
    netETHCollateralWithHaircut: TypedBigNumber,
    netETHDebtWithBuffer: TypedBigNumber,
    collateralDebtETHBuffer: TypedBigNumber,
    collateralDebtETH: TypedBigNumber,
    bufferedRatio: number,
    collateralCurrencyId: number,
  ) {
    // Paying off debts to increase the ratio has the formula:
    // ratio = netETHCollateralWithHaircut / (netETHDebtWithBuffer - collateralDebtPayment * buffer)
    // Solving for collateralDebtPayment:
    // netETHDebtWithBuffer - netETHCollateral / ratio = collateralDebtPayment * buffer
    // collateralDebtPayment = [netETHDebtWithBuffer - netETHCollateral / ratio] / buffer
    const system = System.getSystem();
    const collateralBuffer = system.getETHRate(collateralCurrencyId).ethRateConfig!.buffer;
    const collateralDebtPayment = netETHDebtWithBuffer
      .sub(netETHCollateralWithHaircut.scale(100, bufferedRatio))
      .scale(100, collateralBuffer);

    // It's possible that no collateral payment is required due to other collateral
    if (collateralDebtPayment.isNegative()) {
      return TypedBigNumber.getZeroUnderlying(collateralCurrencyId);
    }

    if (collateralDebtPayment.lt(collateralDebtETH)) {
      // Do not apply haircut to the debt repayment, the buffer has been included above.
      return collateralDebtPayment.fromETH(collateralCurrencyId, noHaircut);
    }

    // If we reach here, paying off the debt is insufficient to reach the target buffered ratio
    // ratio = (netETHCollateralWithHaircut + additionalCollateral * haircut)
    //            / (netETHDebtWithBuffer - collateralDebtETHBuffer)
    // additionalCollateral * haircut = ratio *
    //          [netETHDebtWithBuffer - collateralDebtETHBuffer] - netETHCollateralWithHaircut
    // additionalCollateral = [ratio * [netETHDebtWithBuffer - collateralDebtETHBuffer]
    //                            - netETHCollateralWithHaircut]/ haircut
    const postDebt = netETHDebtWithBuffer.sub(collateralDebtETHBuffer).scale(bufferedRatio, 100);
    const collateralHaircut = system.getETHRate(collateralCurrencyId).ethRateConfig!.haircut;
    const additionalCollateralETH = postDebt.sub(netETHCollateralWithHaircut).scale(100, collateralHaircut);
    const totalCollateralETH = additionalCollateralETH.add(collateralDebtETH);

    // Do not use haircut here, it is already applied in the calculation above
    return totalCollateralETH.fromETH(collateralCurrencyId, noHaircut);
  }

  /**
   * Calculates a collateral ratio as a percentage. Collateral ratios can be null if ETH debt is zero. If using
   * buffered and haircut values then collateral ratios are liquidatable when they are below 100. There is no
   * upper bound to a collateral ratio figure. Collateral ratios use net debt values.
   *
   * @param netETHCollateral
   * @param netETHDebt
   * @returns collateral ratio scaled by 100 as a number
   */
  public static calculateCollateralRatio(netETHCollateral: TypedBigNumber, netETHDebt: TypedBigNumber) {
    if (netETHDebt.isZero()) return null;
    netETHCollateral.check(BigNumberType.InternalUnderlying, 'ETH');
    netETHDebt.check(BigNumberType.InternalUnderlying, 'ETH');

    const collateralRatioNumber = netETHCollateral.scale(INTERNAL_TOKEN_PRECISION, netETHDebt.n).toNumber();
    return (collateralRatioNumber / INTERNAL_TOKEN_PRECISION) * 100;
  }
}
