import { RATE_PRECISION, SECONDS_IN_YEAR } from '../config/constants';
import { SecondaryBorrowArray, VaultConfig, VaultState } from '../data';
import TypedBigNumber from '../libs/TypedBigNumber';
import { getNowSeconds } from '../libs/utils';
import { System, CashGroup } from '../system';
import VaultAccount from './VaultAccount';

export interface VaultImplementation<D, R> {
  getLiquidationPrices: (
    vault: VaultConfig,
    vaultState: VaultState,
    vaultAccount: VaultAccount
  ) => Record<string, TypedBigNumber>;
  getStrategyTokenValue: (vault: VaultConfig, vaultState: VaultState, vaultAccount: VaultAccount) => TypedBigNumber;

  getDepositParameters: (vault: VaultConfig, vaultState: VaultState, totalSlippage: number) => D;
  getSlippageFromDepositParameters: (vault: VaultConfig, vaultState: VaultState, params: D) => number;
  getRedeemParameters: (vault: VaultConfig, vaultState: VaultState, totalSlippage: number) => R;
  getSlippageFromRedeemParameters: (vault: VaultConfig, vaultState: VaultState, params: R) => number;

  getDepositGivenStrategyTokens: (
    vault: VaultConfig,
    vaultState: VaultState,
    vaultAccount: VaultAccount,
    strategyTokens: TypedBigNumber,
    totalSlippage: number,
    params?: D,
    blockTime?: number
  ) => {
    requiredDeposit: TypedBigNumber;
    secondaryfCashBorrowed: SecondaryBorrowArray;
    depositParams: D;
  };
  getStrategyTokensGivenDeposit: (
    vault: VaultConfig,
    vaultState: VaultState,
    vaultAccount: VaultAccount,
    depositAmount: TypedBigNumber,
    totalSlippage: number,
    params?: D,
    blockTime?: number
  ) => {
    strategyTokens: TypedBigNumber;
    secondaryfCashBorrowed: SecondaryBorrowArray;
    depositParams: D;
  };

  getRedeemGivenStrategyTokens: (
    vault: VaultConfig,
    vaultState: VaultState,
    vaultAccount: VaultAccount,
    strategyTokens: TypedBigNumber,
    totalSlippage: number,
    params?: R,
    blockTime?: number
  ) => {
    amountRedeemed: TypedBigNumber;
    secondaryfCashRepaid: SecondaryBorrowArray;
    redeemParams: R;
  };

  getStrategyTokensGivenRedeem: (
    vault: VaultConfig,
    vaultState: VaultState,
    vaultAccount: VaultAccount,
    redeemAmount: TypedBigNumber,
    totalSlippage: number,
    params?: R,
    blockTime?: number
  ) => {
    strategyTokens: TypedBigNumber;
    secondaryfCashRepaid: SecondaryBorrowArray;
    redeemParams: R;
  };
}

export default abstract class BaseVault<D, R> {
  constructor(public vaultAddress: string, public implementation: VaultImplementation<D, R>) {}

  public getVaultState(maturity: number) {
    return System.getSystem().getVaultState(this.vaultAddress, maturity);
  }

  public getVault() {
    return System.getSystem().getVault(this.vaultAddress);
  }

  public getVaultMarket(maturity: number) {
    const vault = this.getVault();
    const marketIndex = CashGroup.getMarketIndexForMaturity(maturity);
    if (marketIndex > vault.maxBorrowMarketIndex) throw Error(`Invalid maturity for vault ${vault.name}`);
    return System.getSystem().getCashGroup(vault.primaryBorrowCurrency).getMarket(marketIndex);
  }

  public getPoolShare(maturity: number, vaultShares: TypedBigNumber) {
    const vaultState = this.getVaultState(maturity);
    if (vaultState.totalVaultShares.isZero()) {
      return {
        assetCash: vaultState.totalAssetCash.copy(0),
        strategyTokens: vaultState.totalStrategyTokens.copy(0),
      };
    }

    return {
      assetCash: vaultState.totalAssetCash.scale(vaultShares, vaultState.totalVaultShares),
      strategyTokens: vaultState.totalStrategyTokens.scale(vaultShares, vaultState.totalVaultShares),
    };
  }

  // Account Descriptive Factors
  public getCollateralRatio(vaultAccount: VaultAccount) {
    if (vaultAccount.primaryBorrowfCash.isZero()) return null;

    const debtOutstanding = vaultAccount.primaryBorrowfCash.toAssetCash();
    const netAssetValue = this.getCashValueOfShares(vaultAccount).sub(debtOutstanding);
    return netAssetValue.scale(RATE_PRECISION, debtOutstanding.n).toNumber();
  }

  public getLeverageRatio(vaultAccount: VaultAccount) {
    if (vaultAccount.primaryBorrowfCash.isZero()) return null;

    const debtOutstanding = vaultAccount.primaryBorrowfCash.toAssetCash();
    const netAssetValue = this.getCashValueOfShares(vaultAccount).sub(debtOutstanding);
    return debtOutstanding.scale(RATE_PRECISION, netAssetValue.n).toNumber();
  }

  public getAccountPoolShare(vaultAccount: VaultAccount) {
    return this.getPoolShare(vaultAccount.maturity, vaultAccount.vaultShares);
  }

  public getCashValueOfShares(vaultAccount: VaultAccount) {
    const { assetCash } = this.getAccountPoolShare(vaultAccount);
    const underlyingStrategyTokenValue = this.implementation.getStrategyTokenValue(
      this.getVault(),
      this.getVaultState(vaultAccount.maturity),
      vaultAccount
    );

    return assetCash.add(underlyingStrategyTokenValue.toAssetCash());
  }

  // Operations
  public assessVaultFees(maturity: number, fCashToBorrow: TypedBigNumber, blockTime = getNowSeconds()) {
    const annualizedFeeRate = this.getVault().feeRateBasisPoints;
    const feeRate = Math.floor(annualizedFeeRate * ((maturity - blockTime) / SECONDS_IN_YEAR));
    return fCashToBorrow.scale(feeRate, RATE_PRECISION).toAssetCash();
  }

  public checkBorrowCapacity(fCashToBorrow: TypedBigNumber) {
    const fCashCurrency = System.getSystem().getCurrencyBySymbol(fCashToBorrow.symbol);
    const vault = this.getVault();
    if (fCashCurrency.id === vault.primaryBorrowCurrency) {
      return vault.totalUsedPrimaryBorrowCapacity.add(fCashToBorrow).lte(vault.maxPrimaryBorrowCapacity);
    } else if (vault.secondaryBorrowCurrencies) {
      if (vault.secondaryBorrowCurrencies[0] === fCashCurrency.id) {
        return vault
          .totalUsedSecondaryBorrowCapacity![0]!.add(fCashToBorrow)
          .lte(vault.maxSecondaryBorrowCapacity![0]!);
      } else if (vault.secondaryBorrowCurrencies[1] === fCashCurrency.id) {
        return vault
          .totalUsedSecondaryBorrowCapacity![1]!.add(fCashToBorrow)
          .lte(vault.maxSecondaryBorrowCapacity![1]!);
      }
    }

    throw Error(`${fCashToBorrow.symbol} is not valid currency for vault ${vault.name}`);
  }

  // Vault Operations
  public simulateEnter(
    vaultAccount: VaultAccount,
    maturity: number,
    cashToBorrow: TypedBigNumber,
    depositAmount: TypedBigNumber,
    totalSlippage: number,
    params?: D,
    blockTime = getNowSeconds()
  ) {
    const vault = this.getVault();
    const vaultState = this.getVaultState(maturity);
    if (vaultState.isSettled || vaultState.totalAssetCash.isPositive()) {
      throw Error('Cannot enter vault');
    }
    const market = this.getVaultMarket(maturity);
    const fCashToBorrow = market.getfCashAmountGivenCashAmount(cashToBorrow, blockTime);
    const assessedFee = this.assessVaultFees(maturity, fCashToBorrow, blockTime);
    let totalCashDeposit = cashToBorrow.add(depositAmount).sub(assessedFee);
    const newVaultAccount = VaultAccount.copy(vaultAccount);

    if (vaultAccount.canSettle()) {
      const { assetCash, strategyTokens } = newVaultAccount.settleVaultAccount();
      newVaultAccount.addStrategyTokens(strategyTokens);
      totalCashDeposit = totalCashDeposit.add(assetCash.toUnderlying());
      newVaultAccount.updateMaturity(maturity);
    }
    if (newVaultAccount.maturity !== maturity) throw Error('Cannot Enter, Invalid Maturity');

    const { strategyTokens, secondaryfCashBorrowed, depositParams } = this.implementation.getStrategyTokensGivenDeposit(
      vault,
      vaultState,
      newVaultAccount,
      totalCashDeposit,
      totalSlippage,
      params,
      blockTime
    );
    if (!this.checkBorrowCapacity(fCashToBorrow.neg())) throw Error('Exceeds max primary borrow capacity');

    if (secondaryfCashBorrowed) {
      if (secondaryfCashBorrowed[0] && !this.checkBorrowCapacity(secondaryfCashBorrowed[0]))
        throw Error('Exceeds max secondary borrow capacity');
      if (secondaryfCashBorrowed[1] && !this.checkBorrowCapacity(secondaryfCashBorrowed[1]))
        throw Error('Exceeds max secondary borrow capacity');
    }

    newVaultAccount.addStrategyTokens(strategyTokens);
    newVaultAccount.addSecondaryDebtShares(secondaryfCashBorrowed);

    return {
      fCashToBorrow,
      assessedFee,
      totalCashDeposit,
      newVaultAccount,
      depositParams,
    };
  }

  public simulateExitPostMaturity(
    vaultAccount: VaultAccount,
    totalSlippage: number,
    params?: R,
    blockTime = getNowSeconds()
  ) {
    const vault = this.getVault();
    const vaultState = this.getVaultState(vaultAccount.maturity);
    if (!vaultState.isSettled) throw Error('Cannot exit, not settled');
    const newVaultAccount = VaultAccount.copy(vaultAccount);

    const { assetCash, strategyTokens } = newVaultAccount.settleVaultAccount();
    const { amountRedeemed, redeemParams } = this.implementation.getRedeemGivenStrategyTokens(
      vault,
      vaultState,
      newVaultAccount,
      strategyTokens,
      totalSlippage,
      params,
      blockTime
    );

    return {
      amountRedeemed: amountRedeemed.add(assetCash),
      redeemParams,
    };
  }

  public simulateExitPreMaturity(
    vaultAccount: VaultAccount,
    fCashToLend: TypedBigNumber,
    totalSlippage: number,
    params?: R,
    blockTime = getNowSeconds()
  ) {
    const vault = this.getVault();
    const vaultState = this.getVaultState(vaultAccount.maturity);
    if (vaultState.maturity <= blockTime || vaultState.isSettled) throw Error('Cannot Exit, in Settlement');
    const vaultMarket = this.getVaultMarket(vaultAccount.maturity);
    if (fCashToLend.add(vaultAccount.primaryBorrowfCash).isPositive()) throw Error('Cannot lend to positive balance');

    const newVaultAccount = VaultAccount.copy(vaultAccount);
    const { netCashToAccount: costToLend } = vaultMarket.getCashAmountGivenfCashAmount(fCashToLend, blockTime);
    const { strategyTokens, secondaryfCashRepaid, redeemParams } = this.implementation.getStrategyTokensGivenRedeem(
      vault,
      vaultState,
      newVaultAccount,
      costToLend,
      totalSlippage,
      params,
      blockTime
    );

    const vaultSharesToRedeemAtCost = vaultState.totalVaultShares.scale(strategyTokens, vaultState.totalStrategyTokens);
    newVaultAccount.updateVaultShares(vaultSharesToRedeemAtCost.neg());
    newVaultAccount.updatePrimaryBorrowfCash(fCashToLend);
    newVaultAccount.addSecondaryDebtShares(secondaryfCashRepaid);

    return {
      costToLend,
      vaultSharesToRedeemAtCost,
      redeemParams,
      newVaultAccount,
    };
  }

  public simulateRollPosition(
    vaultAccount: VaultAccount,
    newMaturity: number,
    totalSlippage: number,
    additionalCashToBorrow: TypedBigNumber,
    params?: D,
    blockTime = getNowSeconds()
  ) {
    const vault = this.getVault();
    const vaultState = this.getVaultState(vaultAccount.maturity);
    if (vaultState.maturity <= blockTime || vaultState.isSettled) throw Error('Cannot Roll, in Settlement');
    const vaultMarket = this.getVaultMarket(vaultAccount.maturity);
    const newVaultMarket = this.getVaultMarket(newMaturity);
    const newVaultAccount = VaultAccount.emptyVaultAccount(this.vaultAddress);
    newVaultAccount.updateMaturity(newMaturity);
    const { assetCash, strategyTokens } = this.getAccountPoolShare(vaultAccount);
    newVaultAccount.addStrategyTokens(strategyTokens);

    const { netCashToAccount } = vaultMarket.getCashAmountGivenfCashAmount(
      vaultAccount.primaryBorrowfCash.neg(),
      blockTime
    );
    const costToLend = netCashToAccount.sub(assetCash);

    // Calculate amount to borrow
    // TODO: buffer this slippage amount
    let totalfCashToBorrow = newVaultMarket.getfCashAmountGivenCashAmount(costToLend.neg(), blockTime);
    // TODO: switch this to assess on the cash amount...because it is included in cost to lend
    let assessedFee = this.assessVaultFees(newMaturity, totalfCashToBorrow, blockTime);
    // TODO: need to have some default set of values here...
    let depositParams = this.implementation.getDepositParameters(vault, vaultState, totalSlippage);

    if (additionalCashToBorrow.isPositive()) {
      totalfCashToBorrow = totalfCashToBorrow.add(
        newVaultMarket.getfCashAmountGivenCashAmount(additionalCashToBorrow, blockTime)
      );

      const {
        strategyTokens,
        secondaryfCashBorrowed,
        depositParams: _depositParams,
      } = this.implementation.getStrategyTokensGivenDeposit(
        vault,
        vaultState,
        newVaultAccount,
        additionalCashToBorrow,
        totalSlippage,
        params,
        blockTime
      );

      // TODO: does this always work?
      depositParams = _depositParams;
      newVaultAccount.addStrategyTokens(strategyTokens);
      newVaultAccount.addSecondaryDebtShares(secondaryfCashBorrowed);

      if (secondaryfCashBorrowed) {
        const [debtOwedOne, debtOwedTwo] = vaultAccount.getSecondaryDebtOwed();

        if (secondaryfCashBorrowed[0]) {
          const netSecondaryBorrowed = debtOwedOne
            ? secondaryfCashBorrowed[0].sub(debtOwedOne)
            : secondaryfCashBorrowed[0];

          if (!this.checkBorrowCapacity(netSecondaryBorrowed)) {
            throw Error('Exceeds max secondary borrow capacity');
          }
        }

        if (secondaryfCashBorrowed[1]) {
          const netSecondaryBorrowed = debtOwedTwo
            ? secondaryfCashBorrowed[1].sub(debtOwedTwo)
            : secondaryfCashBorrowed[1];

          if (!this.checkBorrowCapacity(netSecondaryBorrowed)) {
            throw Error('Exceeds max secondary borrow capacity');
          }
        }
      }
    }

    if (!this.checkBorrowCapacity(totalfCashToBorrow.sub(vaultAccount.primaryBorrowfCash).neg()))
      throw Error('Exceeds max primary borrow capacity');

    return {
      totalfCashToBorrow,
      assessedFee,
      newVaultAccount,
      depositParams,
    };
  }
}
