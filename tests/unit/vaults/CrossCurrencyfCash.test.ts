import { BigNumberType, TypedBigNumber } from '../../../src';
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
  const maturity = System.getSystem().getCashGroup(2).getMarket(1).maturity;
  const { vault, vaultSymbol } = MockCrossCurrencyConfig(maturity);
  const crossCurrency = new CrossCurrencyfCash(vault.vaultAddress, 3);
  system.setVault(vault);

  it.only('gets strategy token value', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress);
    vaultAccount.updateMaturity(maturity);
    vaultAccount.addStrategyTokens(TypedBigNumber.from(100e8, BigNumberType.StrategyToken, vaultSymbol));
    const value = crossCurrency.getStrategyTokenValue(vault, vault.vaultStates[0], vaultAccount);
    expect(value.symbol).toBe('DAI');
    expect(value.toNumber()).toBeLessThan(100e8);
    expect(value.toNumber()).toBeGreaterThan(95e8);
  });

  it('gets deposit parameters', () => {});
  it('gets redeem parameters', () => {});
  it('calculates total slippage from deposit parameters', () => {});
  it('calculates total slippage from redeem parameters', () => {});
  it('it converts between deposit and strategy tokens', () => {});
  it('it converts between strategy tokens and redemption', () => {});
  it('calculates collateral and leverage ratio for a vault', () => {});
  it('calculates cash value of shares with asset cash', () => {});
  it('checks borrow capacities do not exceed', () => {});

  it('simulates entering a vault', () => {});
  it('simulates entering a vault with settled shares', () => {});
  it('simulates exiting a vault', () => {});
  it('simulates exiting a vault with settled shares', () => {});
  it('fails when attempting to roll a vault that is not allowed to', () => {});
});
