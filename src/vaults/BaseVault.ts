import { utils } from 'ethers';
import { BASIS_POINT, INTERNAL_TOKEN_PRECISION, RATE_PRECISION, SECONDS_IN_YEAR } from '../config/constants';
import { SecondaryBorrowArray } from '../data';
import TypedBigNumber, { BigNumberType } from '../libs/TypedBigNumber';
import { getNowSeconds, populateTxnAndGas } from '../libs/utils';
import { System, CashGroup } from '../system';
import VaultAccount from './VaultAccount';

export enum LiquidationThresholdType {
  exchangeRate,
  fCashInterestRate,
}

export interface LiquidationThreshold {
  name: string;
  type: LiquidationThresholdType;
  rate?: number;
  ethExchangeRate?: TypedBigNumber;
  debtCurrencyId?: number;
  collateralCurrencyId?: number;
}

export default abstract class BaseVault<D, R> {
  public static collateralToLeverageRatio(collateralRatio: number): number {
    return Math.floor((RATE_PRECISION / collateralRatio) * RATE_PRECISION) + RATE_PRECISION;
  }

  public static leverageToCollateralRatio(leverageRatio: number): number {
    return Math.floor((RATE_PRECISION / (leverageRatio - RATE_PRECISION)) * RATE_PRECISION);
  }

  abstract readonly depositTuple: string;

  abstract readonly redeemTuple: string;

  public encodeDepositParams(depositParams: D) {
    return utils.defaultAbiCoder.encode([this.depositTuple], [depositParams]);
  }

  public encodeRedeemParams(redeemParams: R) {
    return utils.defaultAbiCoder.encode([this.redeemTuple], [redeemParams]);
  }

  constructor(public vaultAddress: string) {}

  public abstract initializeVault(): Promise<void>;

  public abstract getLiquidationThresholds(vaultAccount: VaultAccount, blockTime: number): Array<LiquidationThreshold>;

  public abstract getStrategyTokenValue(vaultAccount: VaultAccount): TypedBigNumber;

  public abstract getStrategyTokensFromValue(
    maturity: number,
    valuation: TypedBigNumber,
    blockTime?: number
  ): TypedBigNumber;

  public abstract getDepositParameters(
    maturity: number,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ): D;

  public abstract getDepositParametersExact(
    maturity: number,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ): Promise<D>;

  public abstract getRedeemParametersExact(
    maturity: number,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ): Promise<R>;

  public abstract getSlippageForDeposit(
    maturity: number,
    depositAmount: TypedBigNumber,
    strategyTokens: TypedBigNumber,
    params: D,
    blockTime?: number
  ): { likelySlippage: number; worstCaseSlippage: number };

  public abstract getRedeemParameters(
    maturity: number,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ): R;

  public abstract getSlippageForRedeem(
    maturity: number,
    redeemAmount: TypedBigNumber,
    strategyTokens: TypedBigNumber,
    params: R,
    blockTime?: number
  ): { likelySlippage: number; worstCaseSlippage: number };

  public abstract getDepositGivenStrategyTokens(
    vaultAccount: VaultAccount,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ): {
    requiredDeposit: TypedBigNumber;
    secondaryfCashBorrowed: SecondaryBorrowArray;
    depositParams: D;
  };

  public abstract getStrategyTokensGivenDeposit(
    vaultAccount: VaultAccount,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ): {
    strategyTokens: TypedBigNumber;
    secondaryfCashBorrowed: SecondaryBorrowArray;
    depositParams: D;
  };

  public abstract getRedeemGivenStrategyTokens(
    vaultAccount: VaultAccount,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ): {
    amountRedeemed: TypedBigNumber;
    secondaryfCashRepaid: SecondaryBorrowArray;
    redeemParams: R;
  };

  public abstract getStrategyTokensGivenRedeem(
    vaultAccount: VaultAccount,
    redeemAmount: TypedBigNumber,
    slippageBuffer: number,
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

  public getVaultSymbol(maturity: number) {
    return `${this.vaultAddress}:${maturity}`;
  }

  public getLiquidationVaultShareValue(vaultAccount: VaultAccount) {
    // Liquidation exchange rate is the exchange rate where the value of the vault shares
    // is below the minimum required collateral ratio of the borrowed currency

    // minCollateralRatio = (vaultShares - debtOutstanding) / debtOutstanding
    // minCollateralRatio * debtOutstanding + debtOutstanding = vaultShares
    // (minCollateralRatio + 1) * debtOutstanding = vaultSharesValue
    const debtOutstanding = vaultAccount.primaryBorrowfCash.neg();
    const minCollateralRatio = this.getVault().minCollateralRatioBasisPoints;

    // If the account's vault shares reach this value then they will become eligible for liquidation
    const liquidationVaultSharesValue = debtOutstanding.scale(minCollateralRatio + RATE_PRECISION, RATE_PRECISION);

    return {
      liquidationVaultSharesValue,
      perShareValue: liquidationVaultSharesValue.scale(INTERNAL_TOKEN_PRECISION, vaultAccount.vaultShares),
    };
  }

  public getDebtShareSymbol(index: 0 | 1, maturity: number) {
    const { secondaryBorrowCurrencies } = this.getVault();
    if (!secondaryBorrowCurrencies) throw Error('Invalid secondary borrow currency');
    if (secondaryBorrowCurrencies[index] !== 0) {
      const symbol = System.getSystem().getUnderlyingSymbol(secondaryBorrowCurrencies[index]);
      return `${this.getVaultSymbol(maturity)}:${symbol}`;
    }

    return undefined;
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

    const debtOutstanding = vaultAccount.primaryBorrowfCash.toAssetCash().neg();
    const netAssetValue = this.getCashValueOfShares(vaultAccount).sub(debtOutstanding);
    return netAssetValue.scale(RATE_PRECISION, debtOutstanding.n).toNumber();
  }

  public getLeverageRatio(vaultAccount: VaultAccount) {
    if (vaultAccount.primaryBorrowfCash.isZero()) return null;

    const debtOutstanding = vaultAccount.primaryBorrowfCash.toAssetCash().neg();
    const netAssetValue = this.getCashValueOfShares(vaultAccount).sub(debtOutstanding);
    // Minimum leverage ratio is 1
    return debtOutstanding.scale(RATE_PRECISION, netAssetValue.n).toNumber() + RATE_PRECISION;
  }

  public getCashValueOfShares(vaultAccount: VaultAccount) {
    const { assetCash } = vaultAccount.getPoolShare();
    const underlyingStrategyTokenValue = this.getStrategyTokenValue(vaultAccount);

    return assetCash.add(underlyingStrategyTokenValue.toAssetCash());
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

  // Operations
  public getDepositedCashFromBorrow(maturity: number, fCashToBorrow: TypedBigNumber, blockTime = getNowSeconds()) {
    const market = this.getVaultMarket(maturity);
    const { netCashToAccount: cashToBorrow } = market.getCashAmountGivenfCashAmount(fCashToBorrow, blockTime);
    const assessedFee = this.assessVaultFees(maturity, cashToBorrow, blockTime);
    return {
      cashToVault: cashToBorrow.sub(assessedFee),
      assessedFee,
    };
  }

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
    fCashToBorrow: TypedBigNumber,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime = getNowSeconds()
  ) {
    const vaultState = this.getVaultState(maturity);
    if (vaultState.isSettled || vaultState.totalAssetCash.isPositive()) {
      throw Error('Cannot enter vault');
    }
    const { cashToVault, assessedFee } = this.getDepositedCashFromBorrow(maturity, fCashToBorrow, blockTime);
    let totalCashDeposit = cashToVault.add(depositAmount);
    const newVaultAccount = VaultAccount.copy(vaultAccount);

    if (vaultAccount.canSettle()) {
      const { assetCash, strategyTokens } = newVaultAccount.settleVaultAccount();
      newVaultAccount.updateMaturity(maturity);
      newVaultAccount.addStrategyTokens(
        TypedBigNumber.from(strategyTokens.n, BigNumberType.StrategyToken, newVaultAccount.vaultSymbol)
      );
      totalCashDeposit = totalCashDeposit.add(assetCash.toUnderlying());
    } else if (vaultAccount.maturity === 0) {
      newVaultAccount.updateMaturity(maturity);
    }
    if (newVaultAccount.maturity !== maturity) throw Error('Cannot Enter, Invalid Maturity');

    const { strategyTokens, secondaryfCashBorrowed, depositParams } = this.getStrategyTokensGivenDeposit(
      newVaultAccount,
      totalCashDeposit,
      slippageBuffer,
      blockTime
    );
    if (!this.checkBorrowCapacity(fCashToBorrow.neg())) throw Error('Exceeds max primary borrow capacity');

    if (secondaryfCashBorrowed) {
      if (secondaryfCashBorrowed[0] && !this.checkBorrowCapacity(secondaryfCashBorrowed[0]))
        throw Error('Exceeds max secondary borrow capacity');
      if (secondaryfCashBorrowed[1] && !this.checkBorrowCapacity(secondaryfCashBorrowed[1]))
        throw Error('Exceeds max secondary borrow capacity');
    }

    newVaultAccount.updatePrimaryBorrowfCash(fCashToBorrow);
    newVaultAccount.addStrategyTokens(strategyTokens);
    newVaultAccount.addSecondaryDebtShares(secondaryfCashBorrowed);

    return {
      assessedFee,
      totalCashDeposit,
      newVaultAccount,
      depositParams,
    };
  }

  public simulateExitPostMaturity(vaultAccount: VaultAccount, slippageBuffer: number, blockTime = getNowSeconds()) {
    const vaultState = this.getVaultState(vaultAccount.maturity);
    if (!vaultState.isSettled) throw Error('Cannot exit, not settled');
    const newVaultAccount = VaultAccount.copy(vaultAccount);

    const { assetCash, strategyTokens } = newVaultAccount.settleVaultAccount();
    const { amountRedeemed, redeemParams } = this.getRedeemGivenStrategyTokens(
      // Pass the previous vault account prior to settlement (which clears all the attributes)
      vaultAccount,
      strategyTokens,
      slippageBuffer,
      blockTime
    );

    return {
      amountRedeemed: amountRedeemed.toInternalPrecision().add(assetCash.toUnderlying(true)),
      redeemParams,
      newVaultAccount,
    };
  }

  public simulateExitPreMaturity(
    vaultAccount: VaultAccount,
    fCashToLend: TypedBigNumber,
    slippageBuffer: number,
    blockTime = getNowSeconds()
  ) {
    const vaultState = this.getVaultState(vaultAccount.maturity);
    if (vaultState.maturity <= blockTime || vaultState.isSettled) throw Error('Cannot Exit, in Settlement');
    const vaultMarket = this.getVaultMarket(vaultAccount.maturity);
    if (fCashToLend.add(vaultAccount.primaryBorrowfCash).isPositive()) throw Error('Cannot lend to positive balance');

    const newVaultAccount = VaultAccount.copy(vaultAccount);
    const { netCashToAccount: costToLend } = vaultMarket.getCashAmountGivenfCashAmount(fCashToLend, blockTime);
    const { strategyTokens, secondaryfCashRepaid, redeemParams } = this.getStrategyTokensGivenRedeem(
      newVaultAccount,
      costToLend.neg(),
      slippageBuffer,
      blockTime
    );

    const vaultSharesToRedeemAtCost = vaultState.totalVaultShares.scale(strategyTokens, vaultState.totalStrategyTokens);
    newVaultAccount.updateVaultShares(vaultSharesToRedeemAtCost.neg());
    newVaultAccount.updatePrimaryBorrowfCash(fCashToLend);
    newVaultAccount.addSecondaryDebtShares(secondaryfCashRepaid);

    return {
      costToLend: costToLend.neg(),
      vaultSharesToRedeemAtCost,
      redeemParams,
      newVaultAccount,
    };
  }

  public simulateRollPosition(
    vaultAccount: VaultAccount,
    newMaturity: number,
    slippageBuffer: number,
    additionalCashToBorrow: TypedBigNumber,
    blockTime = getNowSeconds()
  ) {
    const vault = this.getVault();
    if (!vault.allowRollPosition) throw Error('Cannot roll position in vault');
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
    const assessedFee = this.assessVaultFees(newMaturity, costToLend.neg(), blockTime);
    // TODO: buffer this slippage amount
    let totalfCashToBorrow = newVaultMarket.getfCashAmountGivenCashAmount(costToLend.neg().add(assessedFee), blockTime);
    // TODO: need to have some default set of values here...
    let depositParams = this.getDepositParameters(
      newMaturity,
      TypedBigNumber.getZeroUnderlying(vault.primaryBorrowCurrency),
      slippageBuffer
    );

    if (additionalCashToBorrow.isPositive()) {
      totalfCashToBorrow = totalfCashToBorrow.add(
        newVaultMarket.getfCashAmountGivenCashAmount(additionalCashToBorrow, blockTime)
      );

      const {
        strategyTokens,
        secondaryfCashBorrowed,
        depositParams: _depositParams,
      } = this.getStrategyTokensGivenDeposit(newVaultAccount, additionalCashToBorrow, slippageBuffer, blockTime);

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

  public getfCashBorrowFromLeverageRatio(
    vaultAccount: VaultAccount,
    depositAmount: TypedBigNumber,
    leverageRatio: number,
    slippageBuffer: number,
    blockTime = getNowSeconds(),
    precision = BASIS_POINT * 50
  ) {
    let depositMultiple = leverageRatio;
    let valuation = depositAmount.scale(depositMultiple, RATE_PRECISION);
    let actualLeverageRatio = 0;
    let delta = 0;
    let fCashToBorrow: TypedBigNumber;
    let strategyTokens: TypedBigNumber;
    let iters = 0;

    do {
      strategyTokens = this.getStrategyTokensFromValue(vaultAccount.maturity, valuation, blockTime);
      const { requiredDeposit } = this.getDepositGivenStrategyTokens(vaultAccount, strategyTokens, slippageBuffer);
      const borrowedCash = requiredDeposit.sub(depositAmount);
      const fees = this.assessVaultFees(vaultAccount.maturity, borrowedCash, blockTime);

      fCashToBorrow = this.getVaultMarket(vaultAccount.maturity).getfCashAmountGivenCashAmount(
        borrowedCash.add(fees),
        blockTime
      );

      const debtOutstanding = fCashToBorrow.toAssetCash().neg();
      actualLeverageRatio =
        debtOutstanding.scale(RATE_PRECISION, valuation.toAssetCash().sub(debtOutstanding)).toNumber() + RATE_PRECISION;
      delta = leverageRatio - actualLeverageRatio;
      if (Math.abs(delta) < precision) break;

      depositMultiple = Math.floor(depositMultiple + delta);
      valuation = depositAmount.scale(depositMultiple, RATE_PRECISION);
      iters += 1;
    } while (iters < 10);

    return {
      fCashToBorrow,
      strategyTokens: this.getStrategyTokensFromValue(vaultAccount.maturity, valuation, blockTime),
    };
  }

  public async populateEnterTransaction(
    account: string,
    depositAmount: TypedBigNumber,
    maturity: number,
    fCashToBorrow: TypedBigNumber,
    maxBorrowRate: number,
    slippageBuffer: number
  ) {
    const system = System.getSystem();
    const notional = system.getNotionalProxy();
    const underlyingSymbol = system.getUnderlyingSymbol(this.getVault().primaryBorrowCurrency);
    depositAmount.check(BigNumberType.ExternalUnderlying, underlyingSymbol);
    fCashToBorrow.check(BigNumberType.InternalUnderlying, underlyingSymbol);
    const overrides = underlyingSymbol === 'ETH' ? { value: depositAmount.n } : {};
    const { cashToVault } = this.getDepositedCashFromBorrow(maturity, fCashToBorrow);
    const totalDepositAmount = cashToVault.add(depositAmount);
    const depositParams = await this.getDepositParametersExact(maturity, totalDepositAmount, slippageBuffer);

    return populateTxnAndGas(notional, account, 'enterVault', [
      account,
      this.vaultAddress,
      depositAmount.toExternalPrecision().n,
      maturity,
      fCashToBorrow.n,
      maxBorrowRate,
      this.encodeDepositParams(depositParams),
      overrides,
    ]);
  }

  public async populateExitTransaction(
    account: string,
    maturity: number,
    vaultSharesToRedeem: TypedBigNumber,
    fCashToLend: TypedBigNumber,
    minLendRate: number,
    slippageBuffer: number,
    receiver?: string
  ) {
    const system = System.getSystem();
    const notional = system.getNotionalProxy();
    const underlyingSymbol = system.getUnderlyingSymbol(this.getVault().primaryBorrowCurrency);
    if (vaultSharesToRedeem.type !== BigNumberType.VaultShare) throw Error('Invalid vault shares');
    fCashToLend.check(BigNumberType.InternalUnderlying, underlyingSymbol);
    const { strategyTokens } = this.getPoolShare(maturity, vaultSharesToRedeem);
    const redeemParams = await this.getRedeemParametersExact(maturity, strategyTokens, slippageBuffer);

    return populateTxnAndGas(notional, account, 'exitVault', [
      account,
      this.vaultAddress,
      receiver ?? account,
      vaultSharesToRedeem.n,
      fCashToLend.n,
      minLendRate,
      this.encodeRedeemParams(redeemParams),
    ]);
  }

  public async populateRollTransaction(
    account: string,
    maturity: number,
    fCashToBorrow: TypedBigNumber,
    minLendRate: number,
    maxBorrowRate: number,
    slippageBuffer: number
  ) {
    const system = System.getSystem();
    const notional = system.getNotionalProxy();
    const underlyingSymbol = system.getUnderlyingSymbol(this.getVault().primaryBorrowCurrency);
    fCashToBorrow.check(BigNumberType.InternalUnderlying, underlyingSymbol);
    const { cashToVault } = this.getDepositedCashFromBorrow(maturity, fCashToBorrow);
    // TODO: fix this here...
    const totalDepositAmount = cashToVault; // .sub(costToLend);
    const depositParams = await this.getDepositParametersExact(maturity, totalDepositAmount, slippageBuffer);

    return populateTxnAndGas(notional, account, 'rollVaultPosition', [
      account,
      this.vaultAddress,
      fCashToBorrow.n,
      maturity,
      minLendRate,
      maxBorrowRate,
      this.encodeDepositParams(depositParams),
    ]);
  }
}
