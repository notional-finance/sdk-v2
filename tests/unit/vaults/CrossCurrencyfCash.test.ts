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
  const crossCurrency = new CrossCurrencyfCash();
  crossCurrency.setLendCurrency(3);
  const maturity = System.getSystem().getCashGroup(2).getMarket(1).maturity;
  const { vault, vaultSymbol } = MockCrossCurrencyConfig(maturity);

  system.setVault(vault);

  it.only('gets strategy token value', () => {
    const vaultAccount = VaultAccount.emptyVaultAccount(vault.vaultAddress);
    vaultAccount.updateMaturity(maturity);
    vaultAccount.addStrategyTokens(TypedBigNumber.from(100e8, BigNumberType.StrategyToken, vaultSymbol));
    console.log(crossCurrency.getStrategyTokenValue(vault, vault.vaultStates[0], vaultAccount).toDisplayString());
  });

  it('gets deposit parameters value', () => {});

  it('gets redeem parameters', () => {});
});
