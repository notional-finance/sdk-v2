import { INTERNAL_TOKEN_PRECISION } from '../../../config/constants';
import { AggregateCall } from '../../../data/Multicall';
import TypedBigNumber from '../../../libs/TypedBigNumber';
import { LiquidationThreshold } from '../../BaseVault';
import VaultAccount from '../../VaultAccount';
import BalancerStableMath from './BalancerStableMath';
import { BaseBalancerStablePool, PoolContext } from './BaseBalancerStablePool';
import FixedPoint from './FixedPoint';

interface InitParams {
  underlyingPoolContext: PoolContext;
  basePoolContext: PoolContext;
}

export default class Boosted3TokenAuraVault extends BaseBalancerStablePool<InitParams> {
  public get underlyingPoolContext() {
    return this.initParams.underlyingPoolContext;
  }

  public get basePoolContext() {
    return this.initParams.basePoolContext;
  }

  readonly depositTuple: string = 'tuple(uint256 minBPT, bytes tradeData) d';

  readonly redeemTuple: string =
    'tuple(uint32 minSecondaryLendRate, uint256 minPrimary, uint256 minSecondary, bytes secondaryTradeParams) r';

  public initVaultParams() {
    // Get relevant context and set pool context
    return [] as AggregateCall[];
  }

  public getLiquidationThresholds(_: VaultAccount, __: number): Array<LiquidationThreshold> {
    return [];
  }

  protected getBPTValue(amountIn: FixedPoint = FixedPoint.ONE) {
    // Valuation is done on the base pool since this is the token the vault holds
    if (!this.basePoolContext) throw Error('Not Initialized');
    const { amplificationParameter, balances, primaryTokenIndex, totalSupply } = this.basePoolContext;
    const invariant = BalancerStableMath.calculateInvariant(amplificationParameter, balances, true);

    return BalancerStableMath.calcTokenOutGivenExactBptIn(
      amplificationParameter,
      balances,
      primaryTokenIndex,
      amountIn,
      totalSupply,
      FixedPoint.from(0), // swap fee percentage set to zero
      invariant
    );
  }

  protected getBPTOut(tokenAmountIn: FixedPoint) {
    if (!this.underlyingPoolContext || !this.basePoolContext) throw Error('Not Initialized');

    let linearPoolBPT: FixedPoint;
    {
      const { amplificationParameter, balances, primaryTokenIndex, tokenOutIndex } = this.underlyingPoolContext;
      const invariant = BalancerStableMath.calculateInvariant(amplificationParameter, balances, true);
      linearPoolBPT = BalancerStableMath.calcOutGivenIn(
        amplificationParameter,
        balances,
        primaryTokenIndex,
        tokenOutIndex,
        tokenAmountIn,
        invariant
      );
    }

    let boostedBPT: FixedPoint;
    {
      const { amplificationParameter, balances, primaryTokenIndex, tokenOutIndex } = this.basePoolContext;
      const invariant = BalancerStableMath.calculateInvariant(amplificationParameter, balances, true);
      boostedBPT = BalancerStableMath.calcOutGivenIn(
        amplificationParameter,
        balances,
        primaryTokenIndex,
        tokenOutIndex,
        linearPoolBPT,
        invariant
      );
    }

    return boostedBPT;
  }

  protected getUnderlyingOut(BPTIn: FixedPoint) {
    if (!this.underlyingPoolContext || !this.basePoolContext) throw Error('Not Initialized');

    let linearPoolBPT: FixedPoint;
    {
      const { amplificationParameter, balances, primaryTokenIndex, tokenOutIndex } = this.basePoolContext;
      const invariant = BalancerStableMath.calculateInvariant(amplificationParameter, balances, true);
      linearPoolBPT = BalancerStableMath.calcOutGivenIn(
        amplificationParameter,
        balances,
        tokenOutIndex,
        primaryTokenIndex,
        BPTIn,
        invariant
      );
    }

    let underlyingTokensOut: FixedPoint;
    {
      const { amplificationParameter, balances, primaryTokenIndex, tokenOutIndex } = this.underlyingPoolContext;
      const invariant = BalancerStableMath.calculateInvariant(amplificationParameter, balances, true);
      underlyingTokensOut = BalancerStableMath.calcOutGivenIn(
        amplificationParameter,
        balances,
        tokenOutIndex,
        primaryTokenIndex,
        linearPoolBPT,
        invariant
      );
    }

    return TypedBigNumber.fromBalance(
      underlyingTokensOut.mul(FixedPoint.from(INTERNAL_TOKEN_PRECISION)).div(FixedPoint.ONE),
      this.getPrimaryBorrowSymbol(),
      true
    );
  }
}
