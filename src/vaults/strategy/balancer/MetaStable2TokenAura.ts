import { INTERNAL_TOKEN_PRECISION } from '../../../config/constants';
import { AggregateCall } from '../../../data/Multicall';
import TypedBigNumber from '../../../libs/TypedBigNumber';
import { LiquidationThreshold } from '../../BaseVault';
import VaultAccount from '../../VaultAccount';
import BalancerStableMath from './BalancerStableMath';
import { BaseBalancerStablePool, PoolContext } from './BaseBalancerStablePool';
import FixedPoint from './FixedPoint';

interface InitParams {
  poolContext: PoolContext;
  bptPrice: FixedPoint;
  pairPrice: FixedPoint;
}

export default class MetaStable2TokenAura extends BaseBalancerStablePool<InitParams> {
  public get poolContext() {
    return this.initParams.poolContext;
  }

  public get oraclePrice() {
    if (this.initParams.poolContext.primaryTokenIndex === 0) {
      return this.initParams.bptPrice;
    }
    return this.initParams.bptPrice.mul(FixedPoint.ONE).div(this.initParams.pairPrice);
  }

  public initVaultParams() {
    // Get relevant context and set pool context
    return [] as AggregateCall[];
  }

  public getLiquidationThresholds(_: VaultAccount, __: number): Array<LiquidationThreshold> {
    return [];
  }

  protected getBPTValue(amountIn: FixedPoint = FixedPoint.ONE): FixedPoint {
    return this.oraclePrice.mul(amountIn).div(FixedPoint.ONE);
  }

  protected getBPTOut(tokenAmountIn: FixedPoint) {
    const { amplificationParameter, balances, primaryTokenIndex, totalSupply, swapFeePercentage } = this.poolContext;
    const invariant = BalancerStableMath.calculateInvariant(amplificationParameter, balances, true);
    const amountsIn = new Array<FixedPoint>(balances.length).fill(FixedPoint.from(0));
    amountsIn[primaryTokenIndex] = tokenAmountIn;

    const dueProtocolFeeAmounts = this.getDueProtocolFeeAmounts(
      amplificationParameter,
      invariant,
      balances,
      swapFeePercentage
    );
    const balancesWithoutFees = balances.map((b, i) => b.sub(dueProtocolFeeAmounts[i]));

    console.log(`
    amp: ${amplificationParameter.n.toString()}
    balances: ${balances.map((b) => b.n.toString())}
    balancesWithoutFees: ${balancesWithoutFees.map((b) => b.n.toString())}
    primaryTokenIndex: ${primaryTokenIndex}
    totalSupply: ${totalSupply.n.toString()}
    invariant: ${invariant.n.toString()}
    swapFeePercentage: ${swapFeePercentage.n.toString()}
    amountsIn: ${amountsIn.map((b) => b.n.toString())}
    `);

    return BalancerStableMath.calcBptOutGivenExactTokensIn(
      amplificationParameter,
      balancesWithoutFees,
      amountsIn,
      totalSupply,
      swapFeePercentage,
      invariant
    );
  }

  /**
   * @dev Returns the amount of protocol fees to pay, given the value of the last stored invariant and the current
   * balances.
   */
  public getDueProtocolFeeAmounts(
    amplificationParameter: FixedPoint,
    invariant: FixedPoint,
    balances: FixedPoint[],
    protocolSwapFeePercentage: FixedPoint
  ) {
    // Initialize with zeros
    const numTokens = this.poolContext.balances.length;
    const dueProtocolFeeAmounts = new Array<FixedPoint>(numTokens).fill(FixedPoint.from(0));

    // Early return if the protocol swap fee percentage is zero, saving gas.
    if (protocolSwapFeePercentage.isZero()) {
      return dueProtocolFeeAmounts;
    }

    // Instead of paying the protocol swap fee in all tokens proportionally, we will pay it in a single one. This
    // will reduce gas costs for single asset joins and exits, as at most only two Pool balances will change (the
    // token joined/exited, and the token in which fees will be paid).

    // The protocol fee is charged using the token with the highest balance in the pool.
    let chosenTokenIndex = 0;
    let maxBalance = balances[0];
    for (let i = 1; i < numTokens; i += 1) {
      const currentBalance = balances[i];
      if (currentBalance.gt(maxBalance)) {
        chosenTokenIndex = i;
        maxBalance = currentBalance;
      }
    }

    // Set the fee amount to pay in the selected token
    dueProtocolFeeAmounts[chosenTokenIndex] = BalancerStableMath.calcDueTokenProtocolSwapFeeAmount(
      amplificationParameter,
      balances,
      invariant,
      chosenTokenIndex,
      protocolSwapFeePercentage
    );

    console.log(`
    dueProtocolFeeAmounts[chosenTokenIndex]: ${dueProtocolFeeAmounts[chosenTokenIndex].n.toString()}
    `);

    return dueProtocolFeeAmounts;
  }

  protected getUnderlyingOut(BPTIn: FixedPoint) {
    const { amplificationParameter, balances, primaryTokenIndex, totalSupply, swapFeePercentage } = this.poolContext;
    const invariant = BalancerStableMath.calculateInvariant(amplificationParameter, balances, true);

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
