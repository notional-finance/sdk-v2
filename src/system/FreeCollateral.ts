import {System} from '.';
import {AccountData} from '../account';
import TypedBigNumber, {BigNumberType} from '../libs/TypedBigNumber';
import {getNowSeconds} from '../libs/utils';
import {Asset, AssetType} from '../libs/types';
import {INTERNAL_TOKEN_PRECISION, ETHER_CURRENCY_ID} from '../config/constants';

const useHaircut = true;
const noHaircut = false;
const useInternal = true;
const ETH = ETHER_CURRENCY_ID;

export default class FreeCollateral {
  private static getZeroUnderlying(currencyId: number) {
    const system = System.getSystem();
    const underlyingSymbol = system.getUnderlyingSymbol(currencyId);
    return TypedBigNumber.from(0, BigNumberType.InternalUnderlying, underlyingSymbol);
  }

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
    let netETHCollateralWithHaircut = FreeCollateral.getZeroUnderlying(ETH);
    let netETHCollateral = FreeCollateral.getZeroUnderlying(ETH);
    let netETHDebt = FreeCollateral.getZeroUnderlying(ETH);
    let netETHDebtWithBuffer = FreeCollateral.getZeroUnderlying(ETH);

    account.accountBalances.forEach((b) => {
      const value = FreeCollateral.netCurrencyAvailable(
        b.currencyId,
        b.cashBalance,
        b.nTokenBalance,
        account.portfolio,
        blockTime,
      );
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

  private static netCurrencyAvailable(
    currencyId: number,
    assetCashBalanceInternal: TypedBigNumber,
    nTokenBalance: TypedBigNumber | undefined,
    portfolio: Asset[],
    blockTime = getNowSeconds(),
  ): TypedBigNumber {
    const {nTokenValue, liquidityTokenUnderlyingPV, fCashUnderlyingPV} = FreeCollateral.getCurrencyComponents(
      currencyId,
      assetCashBalanceInternal,
      nTokenBalance,
      portfolio,
      blockTime,
    );

    // TypedBigNumber will ensure these are all in internal underlying
    return assetCashBalanceInternal
      .toUnderlying()
      .add(nTokenValue)
      .add(liquidityTokenUnderlyingPV)
      .add(fCashUnderlyingPV);
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
    // This makes a copy of the array so we can net off fCash
    const {liquidityTokenUnderlyingPV, fCashUnderlyingPV} = FreeCollateral.getCashGroupValue(
      currencyId,
      portfolio,
      blockTime,
    );

    let nTokenValue = TypedBigNumber.from(0, BigNumberType.InternalUnderlying, underlyingSymbol);
    if (nTokenBalance && nTokenBalance.isPositive()) {
      nTokenValue = nTokenBalance.toUnderlying(useInternal);
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
   * @returns
   *  - liquidityTokenUnderlyingPV: present value of the liquidity token
   *  - fCashUnderlyingPV: present value of the underlying fcash
   */
  public static getCashGroupValue(currencyId: number, portfolio: Asset[], blockTime = getNowSeconds()) {
    const system = System.getSystem();
    // This creates a copy of the assets so that we can modify it in memory
    const currencyAssets = portfolio.filter((a) => a.currencyId === currencyId).slice();
    let liquidityTokenUnderlyingPV = FreeCollateral.getZeroUnderlying(currencyId);
    let fCashUnderlyingPV = FreeCollateral.getZeroUnderlying(currencyId);

    if (currencyAssets.length > 0) {
      const cashGroup = system.getCashGroup(currencyId);

      // Filters and reduces for liquidity token value
      liquidityTokenUnderlyingPV = currencyAssets
        .filter((a) => a.assetType !== AssetType.fCash)
        .reduce((underlyingPV, lt) => {
          // eslint-disable-next-line prefer-const
          let {assetCashClaim, fCashClaim} = cashGroup.getLiquidityTokenValue(lt.assetType, lt.notional, true);
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
            true,
            blockTime,
          );
          return underlyingPV.add(fCashHaircutPV).add(assetCashClaim.toUnderlying());
        }, liquidityTokenUnderlyingPV);

      // Filters and reduces for liquidity token value
      fCashUnderlyingPV = currencyAssets
        .filter((a) => a.assetType === AssetType.fCash)
        .reduce((underlyingPV, a) => underlyingPV.add(
          cashGroup.getfCashPresentValueUnderlyingInternal(a.maturity, a.notional, true, blockTime),
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
      || FreeCollateral.getZeroUnderlying(collateralCurrencyId)
    );

    const {minCollateral, targetCollateral}  =FreeCollateral.calculateTargetCollateral(
      netETHCollateralWithHaircut,
      netETHDebtWithBuffer,
      collateralCurrencyId,
      collateralNetAvailable,
      bufferedRatio,
    );

    const minCollateralCopy = AccountData.copyAccountData(accountData);
    minCollateralCopy.updateBalance(collateralCurrencyId, minCollateral.toAssetCash(true));
    const minFC = FreeCollateral.getFreeCollateral(minCollateralCopy, blockTime)
    
    const targetCollateralCopy = AccountData.copyAccountData(accountData);
    targetCollateralCopy.updateBalance(collateralCurrencyId, targetCollateral.toAssetCash(true))
    const targetFC = FreeCollateral.getFreeCollateral(targetCollateralCopy, blockTime)

    return {
      minCollateral,
      targetCollateral,
      minCollateralRatio: FreeCollateral.calculateCollateralRatio(minFC.netETHCollateral, minFC.netETHDebt),
      minBufferedRatio: FreeCollateral.calculateCollateralRatio(minFC.netETHCollateralWithHaircut, minFC.netETHDebtWithBuffer),
      targetCollateralRatio: FreeCollateral.calculateCollateralRatio(targetFC.netETHCollateral, targetFC.netETHDebt),
      targetBufferedRatio: FreeCollateral.calculateCollateralRatio(targetFC.netETHCollateralWithHaircut, targetFC.netETHDebtWithBuffer),
    }
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
      ? FreeCollateral.getZeroUnderlying(ETH)
      : netETHDebtWithBuffer.sub(netETHCollateralWithHaircut);

    // Scale the netETHDebt with buffer to the buffered ratio and remove any existing collateral we have
    let targetEthRequired = netETHDebtWithBuffer.scale(bufferedRatio, 100).sub(netETHCollateralWithHaircut);

    // Cannot require negative ETH
    if (targetEthRequired.isNegative()) {
      targetEthRequired = FreeCollateral.getZeroUnderlying(ETH);
    }

    if (minEthRequired.isZero() && targetEthRequired.isZero()) {
      // If this is the case then the account is sufficiently collateralized
      return {
        minCollateral: FreeCollateral.getZeroUnderlying(collateralCurrencyId),
        targetCollateral: FreeCollateral.getZeroUnderlying(collateralCurrencyId),
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
      return FreeCollateral.getZeroUnderlying(collateralCurrencyId)
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
   * Calculates a collateral ratio as a percentage
   *
   * @param netETHCollateralWithHaircut
   * @param netETHDebt
   * @returns collateral ratio scaled by 100 as a number
   */
  public static calculateCollateralRatio(netETHCollateralWithHaircut: TypedBigNumber, netETHDebt: TypedBigNumber) {
    if (netETHDebt.isZero()) return null;
    netETHCollateralWithHaircut.check(BigNumberType.InternalUnderlying, 'ETH');
    netETHDebt.check(BigNumberType.InternalUnderlying, 'ETH');

    const collateralRatioNumber = netETHCollateralWithHaircut.scale(INTERNAL_TOKEN_PRECISION, netETHDebt.n).toNumber();
    return (collateralRatioNumber / INTERNAL_TOKEN_PRECISION) * 100;
  }
}
