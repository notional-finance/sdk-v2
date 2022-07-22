import { TypedBigNumber, BigNumberType } from '../../src';
import { SECONDS_IN_QUARTER } from '../../src/config/constants';
import { VaultState, VaultConfig } from '../../src/data';

export function MockCrossCurrencyConfig(maturity: number) {
  const vaultSymbol = `0xabc:${maturity}`;
  const vaultSymbolSettled = `0xabc:${maturity - SECONDS_IN_QUARTER}`;

  const vaultState1: VaultState = {
    maturity,
    isSettled: false,
    totalPrimaryfCashBorrowed: TypedBigNumber.fromBalance(100_000e8, 'DAI', true),
    totalAssetCash: TypedBigNumber.fromBalance(0, 'cDAI', true),
    totalVaultShares: TypedBigNumber.from(100_000e8, BigNumberType.VaultShare, vaultSymbol),
    totalStrategyTokens: TypedBigNumber.from(100_000e8, BigNumberType.StrategyToken, vaultSymbol),
  } as unknown as VaultState;

  const vaultStateSettled: VaultState = {
    maturity: maturity - SECONDS_IN_QUARTER,
    isSettled: true,
    totalPrimaryfCashBorrowed: TypedBigNumber.fromBalance(100_000e8, 'DAI', true),
    totalAssetCash: TypedBigNumber.fromBalance(5_000_000e8, 'cDAI', true),
    totalVaultShares: TypedBigNumber.from(100_000e8, BigNumberType.VaultShare, vaultSymbolSettled),
    totalStrategyTokens: TypedBigNumber.from(100_000e8, BigNumberType.StrategyToken, vaultSymbolSettled),
  } as unknown as VaultState;

  const vault: VaultConfig = {
    vaultAddress: '0xabc',
    strategy: '0xstrat',
    name: 'Cross Currency',
    primaryBorrowCurrency: 2,
    minAccountBorrowSize: TypedBigNumber.fromBalance(100e8, 'DAI', true),
    minCollateralRatioBasisPoints: 2000,
    maxDeleverageCollateralRatioBasisPoints: 4000,
    feeRateBasisPoints: 20,
    liquidationRatePercent: 104,
    maxBorrowMarketIndex: 2,
    maxPrimaryBorrowCapacity: TypedBigNumber.fromBalance(100_000e8, 'DAI', true),
    totalUsedPrimaryBorrowCapacity: TypedBigNumber.fromBalance(0, 'DAI', true),
    enabled: true,
    allowRollPosition: false,
    onlyVaultEntry: false,
    onlyVaultExit: false,
    onlyVaultRoll: false,
    onlyVaultDeleverage: false,
    onlyVaultSettle: false,
    allowsReentrancy: true,
    vaultStates: [vaultStateSettled, vaultState1],
  };

  return { vault, vaultSymbol };
}
