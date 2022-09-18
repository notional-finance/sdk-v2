import { INTERNAL_TOKEN_PRECISION } from '../../../config/constants';
import TypedBigNumber from '../../../libs/TypedBigNumber';
import { LiquidationThreshold } from '../../BaseVault';
import VaultAccount from '../../VaultAccount';
import BalancerStableMath from './BalancerStableMath';
import { BaseBalancerStablePool, PoolContext } from './BaseBalancerStablePool';
import FixedPoint from './FixedPoint';

export default class Boosted3TokenAuraVault extends BaseBalancerStablePool {
  public underlyingPoolContext?: PoolContext;

  public basePoolContext?: PoolContext;

  readonly depositTuple: string = 'tuple(uint256 minBPT, bytes tradeData) d';

  readonly redeemTuple: string =
    'tuple(uint32 minSecondaryLendRate, uint256 minPrimary, uint256 minSecondary, bytes secondaryTradeParams) r';

  public async initializeVault() {
    // Get relevant context and set pool context
  }

  public getLiquidationThresholds(_: VaultAccount, __: number): Array<LiquidationThreshold> {
    return [];
  }

  protected getBPTValue(amountIn: FixedPoint = FixedPoint.ONE) {
    // Valuation is done on the base pool since this is the token the vault holds
    if (!this.basePoolContext) throw Error('Not Initialized');
    const { amplificationParameter, balances, primaryTokenIndex, totalSupply, invariant } = this.basePoolContext;

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
      const { amplificationParameter, balances, primaryTokenIndex, tokenOutIndex, invariant } =
        this.underlyingPoolContext;
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
      const { amplificationParameter, balances, primaryTokenIndex, tokenOutIndex, invariant } = this.basePoolContext;
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
      const { amplificationParameter, balances, primaryTokenIndex, tokenOutIndex, invariant } = this.basePoolContext;
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
      const { amplificationParameter, balances, primaryTokenIndex, tokenOutIndex, invariant } =
        this.underlyingPoolContext;
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
