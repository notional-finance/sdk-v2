import FixedPoint from './FixedPoint';

export type BalancerLinearParams = {
  fee: FixedPoint;
  lowerTarget: FixedPoint;
  upperTarget: FixedPoint;
};

export default class BalancerLinearMath extends FixedPoint {
  public static calcInvariant(nominalMainBalance: FixedPoint, wrappedBalance: FixedPoint) {
    return nominalMainBalance.add(wrappedBalance);
  }

  public static calcBptOutPerMainIn(
    mainIn: FixedPoint,
    mainBalance: FixedPoint,
    wrappedBalance: FixedPoint,
    bptSupply: FixedPoint,
    params: BalancerLinearParams
  ) {
    // Amount out, so we round down overall.

    if (bptSupply.isZero()) {
      // BPT typically grows in the same ratio the invariant does. The first time liquidity is added however, the
      // BPT supply is initialized to equal the invariant (which in this case is just the nominal main balance as
      // there is no wrapped balance).
      return this._toNominal(mainIn, params);
    }

    const previousNominalMain = this._toNominal(mainBalance, params);
    const afterNominalMain = this._toNominal(mainBalance.add(mainIn), params);
    const deltaNominalMain = afterNominalMain.sub(previousNominalMain);
    const invariant = this.calcInvariant(previousNominalMain, wrappedBalance);
    return bptSupply.mul(deltaNominalMain).divNoScale(invariant, false);
  }

  private static _toNominal(real: FixedPoint, params: BalancerLinearParams) {
    // Fees are always rounded down: either direction would work but we need to be consistent, and rounding down
    // uses less gas.

    if (real.lt(params.lowerTarget)) {
      const fees = params.lowerTarget.sub(real).mulDown(params.fee);
      return real.sub(fees);
    } else if (real.lte(params.upperTarget)) {
      return real;
    } else {
      const fees = real.sub(params.upperTarget).mulDown(params.fee);
      return real.sub(fees);
    }
  }
}
