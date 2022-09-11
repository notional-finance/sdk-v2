import { SecondaryBorrowArray } from '../../data';
import TypedBigNumber from '../../libs/TypedBigNumber';
import { LiquidationThreshold } from '../BaseVault';
import VaultAccount from '../VaultAccount';

export default abstract class AbstractStrategy<D, R> {
  abstract readonly depositTuple: string;

  abstract readonly redeemTuple: string;

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
    maturity: number,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number,
    vaultAccount?: VaultAccount
  ): {
    requiredDeposit: TypedBigNumber;
    secondaryfCashBorrowed: SecondaryBorrowArray;
    depositParams: D;
  };

  public abstract getStrategyTokensGivenDeposit(
    maturity: number,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number,
    vaultAccount?: VaultAccount
  ): {
    strategyTokens: TypedBigNumber;
    secondaryfCashBorrowed: SecondaryBorrowArray;
    depositParams: D;
  };

  public abstract getRedeemGivenStrategyTokens(
    maturity: number,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number,
    vaultAccount?: VaultAccount
  ): {
    amountRedeemed: TypedBigNumber;
    secondaryfCashRepaid: SecondaryBorrowArray;
    redeemParams: R;
  };

  public abstract getStrategyTokensGivenRedeem(
    maturity: number,
    redeemAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number,
    vaultAccount?: VaultAccount
  ): {
    strategyTokens: TypedBigNumber;
    secondaryfCashRepaid: SecondaryBorrowArray;
    redeemParams: R;
  };
}
