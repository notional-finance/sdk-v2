import { INTERNAL_TOKEN_PRECISION } from '../../../config/constants';
import TypedBigNumber from '../../../libs/TypedBigNumber';
import { LiquidationThreshold } from '../../BaseVault';
import VaultAccount from '../../VaultAccount';
import BalancerStableMath from './BalancerStableMath';
import { BaseBalancerStablePool, PoolContext } from './BaseBalancerStablePool';
import FixedPoint from './FixedPoint';

export default class MetaStable2Token extends BaseBalancerStablePool {
  public poolContext?: PoolContext;

  public oraclePrice?: FixedPoint;

  public async initializeVault() {
    // Get relevant context and set pool context
  }

  public getLiquidationThresholds(_: VaultAccount, __: number): Array<LiquidationThreshold> {
    return [];
  }

  protected getBPTValue(amountIn: FixedPoint = FixedPoint.ONE): FixedPoint {
    if (!this.oraclePrice) throw Error('Not Initialized');
    return this.oraclePrice.mul(amountIn).div(FixedPoint.ONE);
  }

  protected getBPTOut(tokenAmountIn: FixedPoint) {
    if (!this.poolContext) throw Error('Not Initialized');
    const { amplificationParameter, balances, primaryTokenIndex, totalSupply, invariant, swapFeePercentage } =
      this.poolContext;
    const amountsIn = new Array<FixedPoint>(balances.length).fill(FixedPoint.from(0));
    amountsIn[primaryTokenIndex] = tokenAmountIn;

    console.log(`
    amp: ${amplificationParameter.n.toString()}
    balances: ${balances.map((b) => b.n.toString())}
    primaryTokenIndex: ${primaryTokenIndex}
    totalSupply: ${totalSupply.n.toString()}
    invariant: ${invariant.n.toString()}
    swapFeePercentage: ${swapFeePercentage.n.toString()}
    amountsIn: ${amountsIn.map((b) => b.n.toString())}
    `);

    return BalancerStableMath.calcBptOutGivenExactTokensIn(
      amplificationParameter,
      balances,
      amountsIn,
      totalSupply,
      swapFeePercentage,
      invariant
    );
  }

  protected getUnderlyingOut(BPTIn: FixedPoint) {
    if (!this.poolContext) throw Error('Not Initialized');
    const { amplificationParameter, balances, primaryTokenIndex, totalSupply, invariant, swapFeePercentage } =
      this.poolContext;

    const tokensOut = BalancerStableMath.calcTokenOutGivenExactBptIn(
      amplificationParameter,
      balances,
      primaryTokenIndex,
      BPTIn,
      totalSupply,
      swapFeePercentage,
      invariant
    );

    return TypedBigNumber.fromBalance(
      tokensOut.mul(FixedPoint.from(INTERNAL_TOKEN_PRECISION)).div(FixedPoint.ONE),
      this.getPrimaryBorrowSymbol(),
      true
    );
  }
}
