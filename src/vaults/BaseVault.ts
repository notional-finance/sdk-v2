import { RATE_PRECISION, SECONDS_IN_YEAR } from '../config/constants';
import { SecondaryBorrowArray, VaultConfig, VaultState } from '../data';
import TypedBigNumber from '../libs/TypedBigNumber';
import { getNowSeconds } from '../libs/utils';
import { System, CashGroup } from '../system';
import VaultAccount from './VaultAccount';

export default abstract class BaseVault<D, R> {
  constructor(public vaultAddress: string) {}

  // public abstract getLiquidationPrices(
  //   vault: VaultConfig,
  //   vaultState: VaultState,
  //   vaultAccount: VaultAccount
  // ): Record<string, TypedBigNumber>;

  public abstract getStrategyTokenValue(
    vault: VaultConfig,
    vaultState: VaultState,
    vaultAccount: VaultAccount
  ): TypedBigNumber;

  public abstract getDepositParameters(
    vault: VaultConfig,
    vaultState: VaultState,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ): D;

  public abstract getSlippageFromDepositParameters(
    vault: VaultConfig,
    vaultState: VaultState,
    depositAmount: TypedBigNumber,
    params: D,
    blockTime?: number
  ): number;

  public abstract getRedeemParameters(
    vault: VaultConfig,
    vaultState: VaultState,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ): R;

  public abstract getSlippageFromRedeemParameters(
    vault: VaultConfig,
    vaultState: VaultState,
    strategyTokens: TypedBigNumber,
    params: R,
    blockTime?: number
  ): number;

  public abstract getDepositGivenStrategyTokens(
    vault: VaultConfig,
    vaultState: VaultState,
    vaultAccount: VaultAccount,
    strategyTokens: TypedBigNumber,
    totalSlippage: number,
    blockTime?: number
  ): {
    requiredDeposit: TypedBigNumber;
    secondaryfCashBorrowed: SecondaryBorrowArray;
    depositParams: D;
  };

  public abstract getStrategyTokensGivenDeposit(
    vault: VaultConfig,
    vaultState: VaultState,
    vaultAccount: VaultAccount,
    depositAmount: TypedBigNumber,
    totalSlippage: number,
    blockTime?: number
  ): {
    strategyTokens: TypedBigNumber;
    secondaryfCashBorrowed: SecondaryBorrowArray;
    depositParams: D;
  };

  public abstract getRedeemGivenStrategyTokens(
    vault: VaultConfig,
    vaultState: VaultState,
    vaultAccount: VaultAccount,
    strategyTokens: TypedBigNumber,
    totalSlippage: number,
    blockTime?: number
  ): {
    amountRedeemed: TypedBigNumber;
    secondaryfCashRepaid: SecondaryBorrowArray;
    redeemParams: R;
  };

  public abstract getStrategyTokensGivenRedeem(
    vault: VaultConfig,
    vaultState: VaultState,
    vaultAccount: VaultAccount,
    redeemAmount: TypedBigNumber,
    totalSlippage: number,
    blockTime?: number
  ): {
    strategyTokens: TypedBigNumber;
    secondaryfCashRepaid: SecondaryBorrowArray;
    redeemParams: R;
  };

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

  public getCashValueOfShares(vaultAccount: VaultAccount) {
    const { assetCash } = vaultAccount.getPoolShare();
    const underlyingStrategyTokenValue = this.getStrategyTokenValue(
      this.getVault(),
      this.getVaultState(vaultAccount.maturity),
      vaultAccount
    );

    return assetCash.add(underlyingStrategyTokenValue.toAssetCash());
  }

  // Operations
  public assessVaultFees(maturity: number, cashBorrowed: TypedBigNumber, blockTime = getNowSeconds()) {
    const annualizedFeeRate = this.getVault().feeRateBasisPoints;
    const feeRate = Math.floor(annualizedFeeRate * ((maturity - blockTime) / SECONDS_IN_YEAR));
    return cashBorrowed.scale(feeRate, RATE_PRECISION);
  }

  public checkBorrowCapacity(fCashToBorrow: TypedBigNumber) {
    const fCashCurrency = System.getSystem().getCurrencyBySymbol(fCashToBorrow.symbol);
    const vault = this.getVault();
    if (fCashCurrency.id === vault.primaryBorrowCurrency) {
      return vault.totalUsedPrimaryBorrowCapacity.add(fCashToBorrow).lte(vault.maxPrimaryBorrowCapacity);
    }
    if (vault.secondaryBorrowCurrencies) {
      if (vault.secondaryBorrowCurrencies[0] === fCashCurrency.id) {
        return vault
          .totalUsedSecondaryBorrowCapacity![0]!.add(fCashToBorrow)
          .lte(vault.maxSecondaryBorrowCapacity![0]!);
      }
      if (vault.secondaryBorrowCurrencies[1] === fCashCurrency.id) {
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

    const { strategyTokens, secondaryfCashBorrowed, depositParams } = this.getStrategyTokensGivenDeposit(
      vault,
      vaultState,
      newVaultAccount,
      totalCashDeposit,
      totalSlippage,
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

  public simulateExitPostMaturity(vaultAccount: VaultAccount, totalSlippage: number, blockTime = getNowSeconds()) {
    const vault = this.getVault();
    const vaultState = this.getVaultState(vaultAccount.maturity);
    if (!vaultState.isSettled) throw Error('Cannot exit, not settled');
    const newVaultAccount = VaultAccount.copy(vaultAccount);

    const { assetCash, strategyTokens } = newVaultAccount.settleVaultAccount();
    const { amountRedeemed, redeemParams } = this.getRedeemGivenStrategyTokens(
      vault,
      vaultState,
      newVaultAccount,
      strategyTokens,
      totalSlippage,
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
    blockTime = getNowSeconds()
  ) {
    const vault = this.getVault();
    const vaultState = this.getVaultState(vaultAccount.maturity);
    if (vaultState.maturity <= blockTime || vaultState.isSettled) throw Error('Cannot Exit, in Settlement');
    const vaultMarket = this.getVaultMarket(vaultAccount.maturity);
    if (fCashToLend.add(vaultAccount.primaryBorrowfCash).isPositive()) throw Error('Cannot lend to positive balance');

    const newVaultAccount = VaultAccount.copy(vaultAccount);
    const { netCashToAccount: costToLend } = vaultMarket.getCashAmountGivenfCashAmount(fCashToLend, blockTime);
    const { strategyTokens, secondaryfCashRepaid, redeemParams } = this.getStrategyTokensGivenRedeem(
      vault,
      vaultState,
      newVaultAccount,
      costToLend,
      totalSlippage,
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
    blockTime = getNowSeconds()
  ) {
    const vault = this.getVault();
    const vaultState = this.getVaultState(vaultAccount.maturity);
    if (vaultState.maturity <= blockTime || vaultState.isSettled) throw Error('Cannot Roll, in Settlement');
    const vaultMarket = this.getVaultMarket(vaultAccount.maturity);
    const newVaultMarket = this.getVaultMarket(newMaturity);
    const newVaultAccount = VaultAccount.emptyVaultAccount(this.vaultAddress);
    newVaultAccount.updateMaturity(newMaturity);
    const { assetCash, strategyTokens } = vaultAccount.getPoolShare();
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
    const assessedFee = this.assessVaultFees(newMaturity, totalfCashToBorrow, blockTime);
    // TODO: need to have some default set of values here...
    let depositParams = this.getDepositParameters(
      vault,
      vaultState,
      TypedBigNumber.getZeroUnderlying(vault.primaryBorrowCurrency),
      totalSlippage
    );

    if (additionalCashToBorrow.isPositive()) {
      totalfCashToBorrow = totalfCashToBorrow.add(
        newVaultMarket.getfCashAmountGivenCashAmount(additionalCashToBorrow, blockTime)
      );

      const {
        strategyTokens,
        secondaryfCashBorrowed,
        depositParams: _depositParams,
      } = this.getStrategyTokensGivenDeposit(
        vault,
        vaultState,
        newVaultAccount,
        additionalCashToBorrow,
        totalSlippage,
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
