import { INTERNAL_TOKEN_PRECISION } from '../config/constants';
import { SecondaryBorrowArray, VaultConfig, VaultState } from '../data';
import TypedBigNumber, { BigNumberType } from '../libs/TypedBigNumber';
import { System } from '../system';

export default class VaultAccount {
  public static emptyVaultAccount(vaultAddress: string) {
    const vault = System.getSystem().getVault(vaultAddress);
    return new VaultAccount(
      vaultAddress,
      0,
      TypedBigNumber.from(0, BigNumberType.VaultShare, `${vaultAddress}:0`),
      TypedBigNumber.getZeroUnderlying(vault.primaryBorrowCurrency),
      undefined
    );
  }

  public static copy(vaultAccount: VaultAccount) {
    return new VaultAccount(
      vaultAccount.vaultAddress,
      vaultAccount.maturity,
      vaultAccount.vaultShares,
      vaultAccount.primaryBorrowfCash,
      vaultAccount.secondaryBorrowDebtShares
    );
  }

  constructor(
    public vaultAddress: string,
    private _maturity: number,
    private _vaultShares: TypedBigNumber,
    private _primaryBorrowfCash: TypedBigNumber,
    private _secondaryBorrowDebtShares: SecondaryBorrowArray
  ) {}

  public get maturity() {
    return this._maturity;
  }

  public get vaultShares() {
    return this._vaultShares;
  }

  public get primaryBorrowfCash() {
    return this._primaryBorrowfCash;
  }

  public get secondaryBorrowDebtShares() {
    return this._secondaryBorrowDebtShares;
  }

  public getVaultState() {
    return System.getSystem().getVaultState(this.vaultAddress, this.maturity);
  }

  public getVault() {
    return System.getSystem().getVault(this.vaultAddress);
  }

  public canSettle() {
    return this.getVaultState().isSettled;
  }

  public updateMaturity(maturity: number) {
    if (this.maturity === 0) this._maturity = maturity;
    throw Error('Cannot set maturity');
  }

  public updateVaultShares(netVaultShares: TypedBigNumber) {
    this._vaultShares = this.vaultShares.add(netVaultShares);
    if (this.vaultShares.isNegative()) throw Error('Cannot reduce vault shares negative');
  }

  public updatePrimaryBorrowfCash(netfCash: TypedBigNumber) {
    this._primaryBorrowfCash = this.primaryBorrowfCash.add(netfCash);
    if (this.primaryBorrowfCash.isPositive()) throw Error('Cannot have positive fCash');
  }

  public addStrategyTokens(strategyTokens: TypedBigNumber) {
    const vaultState = this.getVaultState();
    if (vaultState.totalVaultShares.isZero()) {
      this._vaultShares = this.vaultShares.add(vaultState.totalVaultShares.copy(strategyTokens.n));
    } else {
      this._vaultShares = this.vaultShares.add(
        vaultState.totalVaultShares.scale(strategyTokens, vaultState.totalStrategyTokens)
      );
    }
  }

  public addSecondaryDebtShares(secondaryfCashBorrowed: SecondaryBorrowArray) {
    if (!secondaryfCashBorrowed) return;
    const { secondaryBorrowCurrencies } = this.getVault();
    if (!secondaryBorrowCurrencies) throw Error('Invalid secondary borrow');

    const didBorrow =
      (secondaryfCashBorrowed[0] && secondaryfCashBorrowed[0].isPositive()) ||
      (secondaryfCashBorrowed[1] && secondaryfCashBorrowed[1].isPositive());

    if (didBorrow && !this.secondaryBorrowDebtShares) {
      // Init the array if it does not yet exit
      this._secondaryBorrowDebtShares = [
        secondaryBorrowCurrencies[0] !== 0 ? TypedBigNumber.getZeroUnderlying(secondaryBorrowCurrencies[0]) : undefined,
        secondaryBorrowCurrencies[1] !== 0 ? TypedBigNumber.getZeroUnderlying(secondaryBorrowCurrencies[1]) : undefined,
      ];
    }

    if (secondaryfCashBorrowed[0] && secondaryfCashBorrowed[0].isPositive()) {
      const newDebtShares = this.secondaryBorrowDebtShares![0]!.add(
        this._getDebtSharesMinted(secondaryfCashBorrowed[0])
      );
      if (newDebtShares.isNegative()) throw Error('Debt shares negative');
      this._secondaryBorrowDebtShares![0] = newDebtShares;
    }

    if (secondaryfCashBorrowed[1] && secondaryfCashBorrowed[1].isPositive()) {
      const newDebtShares = this.secondaryBorrowDebtShares![1]!.add(
        this._getDebtSharesMinted(secondaryfCashBorrowed[1])
      );

      if (newDebtShares.isNegative()) throw Error('Debt shares negative');
      this._secondaryBorrowDebtShares![1] = newDebtShares;
    }
  }

  private _getDebtSharesMinted(secondaryfCashBorrowed: TypedBigNumber) {
    const index = this.getSecondaryBorrowIndex(secondaryfCashBorrowed.currencyId);
    const vaultState = this.getVaultState();
    const totalfCashBorrowed = vaultState.totalSecondaryfCashBorrowed![index]!;
    const totalAccountDebtShares = vaultState.totalSecondaryDebtShares![index]!;

    if (totalfCashBorrowed.isZero()) {
      return totalAccountDebtShares.copy(secondaryfCashBorrowed.n);
    }
    return totalAccountDebtShares.scale(secondaryfCashBorrowed, totalfCashBorrowed);
  }

  public getSecondaryBorrowIndex(currencyId: number): 0 | 1 {
    const vault = this.getVault();
    if (!vault.secondaryBorrowCurrencies) {
      throw Error('Invalid secondary borrow');
    } else if (vault.secondaryBorrowCurrencies[0] === currencyId) {
      return 0;
    } else if (vault.secondaryBorrowCurrencies[1] === currencyId) {
      return 1;
    } else {
      throw Error('Invalid secondary borrow');
    }
  }

  public getSecondaryDebtOwed() {
    if (this.secondaryBorrowDebtShares) {
      const vault = this.getVault();
      const vaultState = this.getVaultState();
      const value0 = this._getSecondaryDebtOwed(vault, vaultState, 0);
      const value1 = this._getSecondaryDebtOwed(vault, vaultState, 1);
      return [value0?.totalBorrowed, value1?.totalBorrowed];
    }

    return [undefined, undefined];
  }

  private _getSecondaryDebtOwed(vault: VaultConfig, vaultState: VaultState, index: 0 | 1) {
    if (!vault.secondaryBorrowCurrencies) return undefined;
    if (!this.secondaryBorrowDebtShares) return undefined;

    if (vault.secondaryBorrowCurrencies[index] !== 0) {
      const symbol = System.getSystem().getUnderlyingSymbol(vault.secondaryBorrowCurrencies[index]);
      const totalBorrowed = this.secondaryBorrowDebtShares[index]?.isPositive()
        ? vaultState.totalSecondaryfCashBorrowed![index]!.scale(
            this.secondaryBorrowDebtShares[index]!,
            vaultState.totalSecondaryDebtShares![index]!
          )
        : TypedBigNumber.getZeroUnderlying(vault.secondaryBorrowCurrencies![index]);
      return { symbol, totalBorrowed };
    }

    return undefined;
  }

  public getPoolShare() {
    const vaultState = this.getVaultState();
    if (vaultState.totalVaultShares.isZero()) {
      return {
        assetCash: vaultState.totalAssetCash.copy(0),
        strategyTokens: vaultState.totalStrategyTokens.copy(0),
      };
    }

    return {
      assetCash: vaultState.totalAssetCash.scale(this.vaultShares, vaultState.totalVaultShares),
      strategyTokens: vaultState.totalStrategyTokens.scale(this.vaultShares, vaultState.totalVaultShares),
    };
  }

  public settleVaultAccount() {
    if (!this.canSettle()) throw Error('Vault not settled');
    const vaultState = this.getVaultState();
    const vault = this.getVault();

    const totalStrategyTokenValueAtSettlement = TypedBigNumber.fromBalance(
      vaultState.totalStrategyTokens.scale(vaultState.settlementStrategyTokenValue!, INTERNAL_TOKEN_PRECISION).n,
      System.getSystem().getUnderlyingSymbol(vault.primaryBorrowCurrency),
      true
    );

    let totalVaultShareValueAtSettlement = totalStrategyTokenValueAtSettlement.add(
      vaultState.totalAssetCash.toUnderlying(true, vaultState.settlementRate)
    );

    let totalAccountValue = this.primaryBorrowfCash;
    if (vault.secondaryBorrowCurrencies) {
      const [debtOwedOne, debtOwedTwo] = this.getSecondaryDebtOwed();
      const [totalDebtOne, totalDebtTwo] = vaultState.settlementSecondaryBorrowfCashSnapshot!;

      if (debtOwedOne) totalAccountValue = totalAccountValue.sub(debtOwedOne);
      if (debtOwedTwo) totalAccountValue = totalAccountValue.sub(debtOwedTwo);
      if (totalDebtOne) totalVaultShareValueAtSettlement = totalVaultShareValueAtSettlement.add(totalDebtOne);
      if (totalDebtTwo) totalVaultShareValueAtSettlement = totalVaultShareValueAtSettlement.add(totalDebtTwo);
    }

    totalAccountValue = totalAccountValue.add(
      totalVaultShareValueAtSettlement.scale(this.vaultShares, vaultState.totalVaultShares)
    );

    if (totalAccountValue.isNegative()) {
      // This is an insolvent account
      totalAccountValue = totalAccountValue.copy(0);
    }

    const residualAssetCashBalance = vaultState.totalAssetCash.add(
      vaultState.totalPrimaryfCashBorrowed.toAssetCash(true, vaultState.settlementRate)
    );

    const settledVaultValue = residualAssetCashBalance
      .toUnderlying(true, vaultState.settlementRate)
      .add(totalStrategyTokenValueAtSettlement);

    const strategyTokens = vaultState.totalStrategyTokens.scale(totalAccountValue, settledVaultValue);
    const assetCash = residualAssetCashBalance.scale(totalAccountValue, settledVaultValue);

    // Clear all vault data at settlement
    this._maturity = 0;
    this._primaryBorrowfCash = this.primaryBorrowfCash.copy(0);
    this._vaultShares = this.vaultShares.copy(0);
    this._secondaryBorrowDebtShares = undefined;

    return { strategyTokens, assetCash };
  }
}
