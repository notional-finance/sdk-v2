import { BigNumber, ethers } from 'ethers';

class FixedPoint {
  private _1 = FixedPoint.from(1);
  public static ONE = FixedPoint.from(ethers.constants.WeiPerEther);

  constructor(public n: BigNumber) {}

  public static from(v: any) {
    return new FixedPoint(BigNumber.from(v));
  }

  public add(b: FixedPoint) {
    return new FixedPoint(this.n.add(b.n));
  }

  public sub(b: FixedPoint) {
    return new FixedPoint(this.n.sub(b.n));
  }

  public mul(b: FixedPoint) {
    return new FixedPoint(this.n.mul(b.n));
  }

  public div(b: FixedPoint) {
    return new FixedPoint(this.n.div(b.n));
  }

  public lt(b: FixedPoint) {
    return this.n.lt(b.n);
  }

  public lte(b: FixedPoint) {
    return this.n.lte(b.n);
  }

  public gt(b: FixedPoint) {
    return this.n.gt(b.n);
  }

  public isZero() {
    return this.n.isZero;
  }

  public mulUp(b: FixedPoint) {
    const product = this.mul(b);
    return product.isZero() ? product : product.sub(this._1).div(FixedPoint.ONE).add(this._1);
  }

  public mulDown(b: FixedPoint) {
    return this.mul(b).div(FixedPoint.ONE);
  }

  public divUp(b: FixedPoint) {
    return this.isZero() ? this : this.mul(FixedPoint.ONE).sub(this._1).div(b).add(this._1);
  }

  public divDown(b: FixedPoint) {
    return this.isZero() ? this : this.mul(FixedPoint.ONE).div(b);
  }

  public complement() {
    return this.lt(FixedPoint.ONE) ? FixedPoint.ONE.sub(this) : FixedPoint.from(0);
  }
}

export class BalancerStableMath extends FixedPoint {
  private static _AMP_PRECISION = FixedPoint.from(1e3);

  private static _calculateInvariant(amplificationParameter: FixedPoint, balances: FixedPoint[], roundUp: boolean) {
    const numTokens = FixedPoint.from(balances.length);
    const sum = balances.reduce((s, b) => {
      return s.add(b);
    }, FixedPoint.from(0));
    if (sum.isZero()) return sum;

    let prevInvariant = FixedPoint.from(0);
    let invariant = sum;
    const ampTimesTotal = amplificationParameter.mul(numTokens);

    for (let i = 0; i < 255; i++) {
      let P_D = balances[0].mul(numTokens);
      for (let j = 1; j < balances.length; j++) {
        P_D = roundUp
          ? P_D.mul(balances[j]).mul(numTokens).divUp(invariant)
          : P_D.mul(balances[j]).mul(numTokens).divDown(invariant);
      }

      prevInvariant = invariant;
      // prettier-ignore
      const invariantNum = numTokens.mul(invariant).mul(invariant).add(
        roundUp ?
          ampTimesTotal.mul(sum).mul(P_D).divUp(this._AMP_PRECISION) :
          ampTimesTotal.mul(sum).mul(P_D).divDown(this._AMP_PRECISION)
      )
      // prettier-ignore
      const invariantDenom = numTokens.add(FixedPoint.from(1)).mul(invariant).add(
        !roundUp ?
          ampTimesTotal.sub(this._AMP_PRECISION).mul(P_D).divUp(this._AMP_PRECISION) :
          ampTimesTotal.sub(this._AMP_PRECISION).mul(P_D).divDown(this._AMP_PRECISION)
      )
      invariant = roundUp ? invariantNum.divUp(invariantDenom) : invariantNum.divDown(invariantDenom);

      if (invariant.gt(prevInvariant)) {
        if (invariant.sub(prevInvariant).lte(FixedPoint.from(1))) {
          return invariant;
        }
      } else if (prevInvariant.sub(invariant).lte(FixedPoint.from(1))) {
        return invariant;
      }
    }

    throw Error('Did not converge');
  }

  private static _getTokenBalanceGivenInvariantAndAllOtherBalances(
    amplificationParameter: FixedPoint,
    balances: FixedPoint[],
    invariant: FixedPoint,
    tokenIndex: number
  ) {
    const balancesLength = FixedPoint.from(balances.length);
    const ampTimesTotal = amplificationParameter.mul(balancesLength);
    let sum = balances.reduce((s, b) => {
      return s.add(b);
    }, FixedPoint.from(0));

    let P_D = balances[0].mul(balancesLength);
    for (let j = 1; j < balances.length; j++) {
      P_D = P_D.mul(balances[j]).mul(balancesLength).divDown(invariant);
    }

    sum = sum.sub(balances[tokenIndex]);

    const inv2 = invariant.mul(invariant);
    const c = inv2.divUp(ampTimesTotal.mul(P_D)).mul(this._AMP_PRECISION).mul(balances[tokenIndex]);
    const b = sum.add(invariant.divDown(ampTimesTotal).mul(this._AMP_PRECISION));

    let prevTokenBalance = FixedPoint.from(0);
    let tokenBalance = inv2.add(c).divUp(invariant.add(b));

    for (let i = 0; i < 255; i++) {
      prevTokenBalance = tokenBalance;
      // prettier-ignore
      tokenBalance = tokenBalance.mul(tokenBalance).add(c).divUp(
        tokenBalance.mul(FixedPoint.from(2)).add(b).sub(invariant)
      )

      if (tokenBalance.gt(prevTokenBalance)) {
        if (tokenBalance.sub(prevTokenBalance).lte(FixedPoint.from(1))) {
          return tokenBalance;
        } else if (prevTokenBalance.sub(tokenBalance).lte(FixedPoint.from(1))) {
          return tokenBalance;
        }
      }
    }

    throw Error('Did not converge');
  }

  public static calcTokenOutGivenExactBptIn(
    amp: FixedPoint,
    balances: FixedPoint[],
    tokenIndex: number,
    bptAmountIn: FixedPoint,
    bptTotalSupply: FixedPoint,
    swapFeePercentage: FixedPoint,
    currentInvariant: FixedPoint
  ) {
    const newInvariant = bptTotalSupply.sub(bptAmountIn).divUp(bptTotalSupply).mulUp(currentInvariant);
    const newBalanceTokenIndex = this._getTokenBalanceGivenInvariantAndAllOtherBalances(
      amp,
      balances,
      newInvariant,
      tokenIndex
    );
    const amountOutWithoutFee = balances[tokenIndex].sub(newBalanceTokenIndex);
    const sumBalances = balances.reduce((s, b) => {
      return s.add(b);
    }, FixedPoint.from(0));

    // Excess balance being withdrawn as a result of virtual swaps, requires swap fees
    const currentWeight = balances[tokenIndex].divDown(sumBalances);
    const taxablePercentage = currentWeight.complement();

    // Fees rounded up and applied to token out
    const taxableAmount = amountOutWithoutFee.mulUp(taxablePercentage);
    const nonTaxableAmount = amountOutWithoutFee.sub(taxableAmount);
    return nonTaxableAmount.add(taxableAmount.mulDown(FixedPoint.ONE.sub(swapFeePercentage)));
  }

  public static calcBptOutGivenExactTokensIn(
    amp: FixedPoint,
    balances: FixedPoint[],
    amountsIn: FixedPoint[],
    bptTotalSupply: FixedPoint,
    swapFeePercentage: FixedPoint,
    currentInvariant: FixedPoint
  ) {
    const sumBalances = balances.reduce((s, b) => {
      return s.add(b);
    }, FixedPoint.from(0));

    let invariantRatioWithFees = FixedPoint.from(0);
    const balanceRatiosWithFee = balances.map((b, i) => {
      const currentWeight = b.divDown(sumBalances);
      const balanceRatioWithFee = b.add(amountsIn[i]).divDown(b);
      invariantRatioWithFees = invariantRatioWithFees.add(balanceRatioWithFee.mulDown(currentWeight));
      return balanceRatioWithFee;
    });

    const newBalances = balances.map((b, i) => {
      let amountInWithoutFee: FixedPoint;
      if (balanceRatiosWithFee[i].gt(invariantRatioWithFees)) {
        const nonTaxableAmount = b.mulDown(invariantRatioWithFees.sub(FixedPoint.ONE));
        const taxableAmount = amountsIn[i].sub(nonTaxableAmount);
        amountInWithoutFee = nonTaxableAmount.add(taxableAmount.mulDown(FixedPoint.ONE.sub(swapFeePercentage)));
      } else {
        amountInWithoutFee = amountsIn[i];
      }

      return b.add(amountInWithoutFee);
    });

    // Get current and new invariants given swap fees
    const newInvariant = this._calculateInvariant(amp, newBalances, false);
    const invariantRatio = newInvariant.divDown(currentInvariant);

    // Invariant must increase or we don't mint BPT
    if (invariantRatio.gt(FixedPoint.ONE)) {
      return bptTotalSupply.mulDown(invariantRatio.sub(FixedPoint.ONE));
    } else {
      return FixedPoint.from(0);
    }
  }

  public static calcOutGivenIn(
    amplificationParameter: FixedPoint,
    balances: FixedPoint[],
    tokenIndexIn: number,
    tokenIndexOut: number,
    tokenAmountIn: FixedPoint,
    invariant: FixedPoint
  ) {
    const _balances = Array.from(balances);
    _balances[tokenIndexIn] = _balances[tokenIndexIn].add(tokenAmountIn);
    const finalBalanceOut = this._getTokenBalanceGivenInvariantAndAllOtherBalances(
      amplificationParameter,
      _balances,
      invariant,
      tokenIndexOut
    );
    _balances[tokenIndexIn] = _balances[tokenIndexIn].sub(tokenAmountIn);
    return _balances[tokenIndexOut].sub(finalBalanceOut).sub(FixedPoint.from(1));
  }
}
