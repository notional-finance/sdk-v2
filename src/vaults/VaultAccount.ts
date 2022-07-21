import { SecondaryBorrowArray } from '../data';
import TypedBigNumber, { BigNumberType } from '../libs/TypedBigNumber';
import { System } from '../system';

export default class VaultAccount {
  constructor(
    public vaultAddress: string,
    public maturity: number,
    public vaultShares: TypedBigNumber,
    public primaryBorrowfCash: TypedBigNumber,
    public secondaryBorrowDebtShares: SecondaryBorrowArray
  ) {}

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
}
