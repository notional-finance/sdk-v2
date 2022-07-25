import { BigNumberType, TypedBigNumber } from '../../../src';
import { RATE_PRECISION, SECONDS_IN_DAY, SECONDS_IN_QUARTER } from '../../../src/config/constants';
import { System } from '../../../src/system';
import CrossCurrencyfCash from '../../../src/vaults/strategy/CrossCurrencyfCash';
import VaultAccount from '../../../src/vaults/VaultAccount';
import { MockCrossCurrencyConfig } from '../../mocks/MockCrossCurrencyConfig';
import MockSystem from '../../mocks/MockSystem';

describe('Cross Currency fCash', () => {
  const system = new MockSystem();
  System.overrideSystem(system);
  MockSystem.overrideSystem(system);
  afterAll(() => {
    system.destroy();
    expect(() => System.getSystem()).toThrowError('System not initialized');
  });
  const { maturity } = System.getSystem().getCashGroup(2).getMarket(1);
  const { vault, vaultSymbol } = MockCrossCurrencyConfig(maturity);
  const crossCurrency = new CrossCurrencyfCash(vault.vaultAddress, 3);
  system.setVault(vault);

  it('gets strategy token value', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress);
    vaultAccount.updateMaturity(maturity);
    vaultAccount.addStrategyTokens(TypedBigNumber.from(100e8, BigNumberType.StrategyToken, vaultSymbol));
    const value = crossCurrency.getStrategyTokenValue(vaultAccount);
    expect(value.symbol).toBe('DAI');
    expect(value.toNumber()).toBeLessThan(100e8);
    expect(value.toNumber()).toBeGreaterThan(95e8);
  });

  it('gets value from strategy token', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress);
    vaultAccount.updateMaturity(maturity);
    vaultAccount.addStrategyTokens(TypedBigNumber.from(100e8, BigNumberType.StrategyToken, vaultSymbol));
    const value = crossCurrency.getStrategyTokenValue(vaultAccount);
    const strategyTokens = crossCurrency.getStrategyTokensFromValue(maturity, value);
    expect(strategyTokens.toNumber()).toBeCloseTo(100e8, -3);
  });

  it('gets deposit parameters', () => {
    const depositAmount = TypedBigNumber.fromBalance(100e8, 'DAI', true);
    const depositParams = crossCurrency.getDepositParameters(
      maturity,
      TypedBigNumber.fromBalance(100e8, 'DAI', true),
      0.0025
    );

    const slippage = crossCurrency.getSlippageFromDepositParameters(maturity, depositAmount, depositParams);
    console.log(slippage);
  });

  it('gets redeem parameters', () => {});
  it('calculates total slippage from deposit parameters', () => {});
  it('calculates total slippage from redeem parameters', () => {});

  it('it converts between deposit and strategy tokens', () => {
    const depositAmount = TypedBigNumber.fromBalance(100e8, 'DAI', true);
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress, maturity);
    const { strategyTokens, depositParams: depositParams1 } = crossCurrency.getStrategyTokensGivenDeposit(
      vaultAccount,
      depositAmount,
      0.0025
    );

    const { requiredDeposit, depositParams: depositParams2 } = crossCurrency.getDepositGivenStrategyTokens(
      vaultAccount,
      strategyTokens,
      0.0025
    );

    expect(requiredDeposit.toNumber()).toBeCloseTo(depositAmount.toNumber(), -3);
    expect(depositParams1.minPurchaseAmount.toString()).toBe(depositParams2.minPurchaseAmount.toString());
    expect(depositParams1.minLendRate).toBeCloseTo(depositParams2.minLendRate, -3);
  });

  it('it converts between strategy tokens and redemption', () => {
    const strategyTokens = TypedBigNumber.from(100e8, BigNumberType.StrategyToken, vaultSymbol);
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress, maturity);
    const { amountRedeemed, redeemParams: redeemParams1 } = crossCurrency.getRedeemGivenStrategyTokens(
      vaultAccount,
      strategyTokens,
      0.0025
    );

    const { strategyTokens: strategyTokens1, redeemParams: redeemParams2 } = crossCurrency.getStrategyTokensGivenRedeem(
      vaultAccount,
      amountRedeemed,
      0.0025
    );
    expect(strategyTokens1.toNumber()).toBeCloseTo(strategyTokens.toNumber(), -3);
    expect(redeemParams1.minPurchaseAmount.toString()).toBe(redeemParams2.minPurchaseAmount.toString());
    expect(redeemParams1.maxBorrowRate).toBeCloseTo(redeemParams2.maxBorrowRate, -3);
  });

  it('simulates entering a vault with empty account', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress);

    const fCashToBorrow = TypedBigNumber.fromBalance(-100e8, 'DAI', true);
    const { assessedFee, totalCashDeposit, newVaultAccount } = crossCurrency.simulateEnter(
      vaultAccount,
      maturity,
      fCashToBorrow,
      TypedBigNumber.fromBalance(25e8, 'DAI', true),
      0.0025
    );

    expect(totalCashDeposit.add(assessedFee).toNumber()).toBeCloseTo(124.375e8, -7);
    expect(newVaultAccount.primaryBorrowfCash.eq(fCashToBorrow)).toBeTruthy();
    expect(crossCurrency.getCollateralRatio(newVaultAccount)! / RATE_PRECISION).toBeCloseTo(0.2293);
    expect(crossCurrency.getLeverageRatio(newVaultAccount)! / RATE_PRECISION).toBeCloseTo(4.3257);
  });

  it('simulates entering a vault with matching shares', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress, maturity);
    vaultAccount.updatePrimaryBorrowfCash(TypedBigNumber.fromBalance(-100e8, 'DAI', true));
    vaultAccount.updateVaultShares(
      TypedBigNumber.from(12553117188, BigNumberType.VaultShare, vaultAccount.vaultSymbol)
    );

    const fCashToBorrow = TypedBigNumber.fromBalance(-100e8, 'DAI', true);
    const { assessedFee, totalCashDeposit, newVaultAccount } = crossCurrency.simulateEnter(
      vaultAccount,
      maturity,
      fCashToBorrow,
      TypedBigNumber.fromBalance(25e8, 'DAI', true),
      0.0025
    );

    expect(totalCashDeposit.add(assessedFee).toNumber()).toBeCloseTo(124.375e8, -7);
    expect(newVaultAccount.primaryBorrowfCash.eq(fCashToBorrow.add(vaultAccount.primaryBorrowfCash))).toBeTruthy();
    expect(crossCurrency.getCollateralRatio(newVaultAccount)! / RATE_PRECISION).toBeCloseTo(0.2293);
    expect(crossCurrency.getLeverageRatio(newVaultAccount)! / RATE_PRECISION).toBeCloseTo(4.2686);
  });

  it('simulates entering a vault with settled shares', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress, maturity - SECONDS_IN_QUARTER);
    vaultAccount.updateVaultShares(TypedBigNumber.from(100e8, BigNumberType.VaultShare, vaultAccount.vaultSymbol));
    vaultAccount.updatePrimaryBorrowfCash(TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI'));
    const { assessedFee, totalCashDeposit, newVaultAccount } = crossCurrency.simulateEnter(
      vaultAccount,
      maturity,
      TypedBigNumber.fromBalance(-100e8, 'DAI', true),
      TypedBigNumber.fromBalance(0, 'DAI', true),
      0.0025
    );

    // There is 2e8 asset cash from the settled vault
    expect(totalCashDeposit.add(assessedFee).toNumber()).toBeCloseTo(101.3764e8, -7);
    expect(newVaultAccount.primaryBorrowfCash.toNumber()).toBe(-100e8);
    expect(newVaultAccount.vaultShares.toNumber()).toBeCloseTo(101.799e8, -7);
  });

  it('checks borrow capacities do not exceed', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress, maturity);
    expect(() => {
      crossCurrency.simulateEnter(
        vaultAccount,
        maturity,
        TypedBigNumber.fromBalance(-11_000e8, 'DAI', true),
        TypedBigNumber.fromBalance(25e8, 'DAI', true),
        0.0025
      );
    }).toThrow('Exceeds max primary borrow capacity');
  });

  it('simulates exiting a vault', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress, maturity);
    vaultAccount.updatePrimaryBorrowfCash(TypedBigNumber.fromBalance(-100e8, 'DAI', true));
    vaultAccount.updateVaultShares(
      TypedBigNumber.from(12553117188, BigNumberType.VaultShare, vaultAccount.vaultSymbol)
    );

    const { costToLend, vaultSharesToRedeemAtCost, newVaultAccount } = crossCurrency.simulateExitPreMaturity(
      vaultAccount,
      TypedBigNumber.fromBalance(100e8, 'DAI', true),
      0.0025
    );

    expect(costToLend.neg().toNumber()).toBeLessThan(100e8);
    expect(costToLend.neg().toNumber()).toBeGreaterThan(98.5e8);
    expect(vaultSharesToRedeemAtCost.toNumber()).toBeGreaterThan(100e8);
    expect(newVaultAccount.primaryBorrowfCash.isZero()).toBeTruthy();
    expect(vaultAccount.vaultShares.sub(newVaultAccount.vaultShares).toExactString()).toBe(
      vaultSharesToRedeemAtCost.toExactString()
    );
  });

  it('simulates exiting a vault with settled shares', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress, maturity - SECONDS_IN_QUARTER);
    vaultAccount.updateVaultShares(TypedBigNumber.from(100e8, BigNumberType.VaultShare, vaultAccount.vaultSymbol));
    vaultAccount.updatePrimaryBorrowfCash(TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI'));
    const { amountRedeemed, newVaultAccount } = crossCurrency.simulateExitPostMaturity(vaultAccount, 0.0025);
    expect(newVaultAccount.primaryBorrowfCash.isZero()).toBeTruthy();
    expect(newVaultAccount.vaultShares.isZero()).toBeTruthy();
    expect(amountRedeemed.toNumber()).toBeCloseTo(2e8);
  });

  it('fails when attempting to roll a vault that is not allowed to', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress);

    const { newVaultAccount } = crossCurrency.simulateEnter(
      vaultAccount,
      maturity,
      TypedBigNumber.fromBalance(-100e8, 'DAI', true),
      TypedBigNumber.fromBalance(25e8, 'DAI', true),
      0.0025
    );

    expect(() => {
      crossCurrency.simulateRollPosition(
        newVaultAccount,
        maturity + SECONDS_IN_DAY,
        0.0025,
        TypedBigNumber.getZeroUnderlying(2)
      );
    }).toThrow('Cannot roll position in vault');
  });

  it('simulates entering a vault given leverage ratio', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress, maturity);
    const depositAmount = TypedBigNumber.fromBalance(25e8, 'DAI', true);
    const { fCashToBorrow, strategyTokens } = crossCurrency.getfCashBorrowFromLeverageRatio(
      vaultAccount,
      depositAmount,
      5e9,
      0.025
    );

    const { newVaultAccount } = crossCurrency.simulateEnter(
      vaultAccount,
      maturity,
      fCashToBorrow,
      depositAmount,
      0.0025
    );
    const { strategyTokens: finalStrategyTokens } = newVaultAccount.getPoolShare();

    expect(Math.abs(finalStrategyTokens.sub(strategyTokens).toNumber())).toBeLessThan(5000);
    expect(crossCurrency.getLeverageRatio(newVaultAccount)! / RATE_PRECISION).toBeCloseTo(5.0);
  });

  it('calculates collateral and leverage ratio for a vault', () => {});
  it('calculates cash value of shares with asset cash', () => {});
});
