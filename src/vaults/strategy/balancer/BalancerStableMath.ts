import FixedPoint from './FixedPoint';

export default class BalancerStableMath extends FixedPoint {
  private static _AMP_PRECISION = FixedPoint.from(1e3);

  public static calculateInvariant(amplificationParameter: FixedPoint, balances: FixedPoint[], roundUp: boolean) {
    const numTokens = FixedPoint.from(balances.length);
    const sum = balances.reduce((s, b) => s.add(b), FixedPoint.from(0));
    if (sum.isZero()) return sum;

    let prevInvariant = FixedPoint.from(0);
    let invariant = sum;
    const ampTimesTotal = amplificationParameter.mul(numTokens);

    for (let i = 0; i < 255; i += 1) {
      let P_D = balances[0].mul(numTokens);
      for (let j = 1; j < balances.length; j += 1) {
        P_D = P_D.mul(balances[j]).mul(numTokens).divNoScale(invariant, roundUp);
      }

      prevInvariant = invariant;
      // prettier-ignore
      const invariantNum = numTokens.mul(invariant).mul(invariant).add(
          ampTimesTotal.mul(sum).mul(P_D).divNoScale(this._AMP_PRECISION, roundUp)
      )
      // prettier-ignore
      const invariantDenom = numTokens.add(FixedPoint._1).mul(invariant).add(
          ampTimesTotal.sub(this._AMP_PRECISION).mul(P_D).divNoScale(this._AMP_PRECISION, !roundUp)
      )
      invariant = invariantNum.divNoScale(invariantDenom, roundUp);

      console.log(`
      P_D:            ${P_D.n.toString()}
      invariantNum:   ${invariantNum.n.toString()}
      invariantDenom: ${invariantDenom.n.toString()}
      prev:      ${prevInvariant.n.toString()}
      invariant: ${invariant.n.toString()}
      `);

      if (invariant.gt(prevInvariant)) {
        if (invariant.sub(prevInvariant).lte(FixedPoint._1)) {
          return invariant;
        }
      } else if (prevInvariant.sub(invariant).lte(FixedPoint._1)) {
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
    let sum = balances.reduce((s, b) => s.add(b), FixedPoint.from(0));

    let P_D = balances[0].mul(balancesLength);
    for (let j = 1; j < balances.length; j += 1) {
      P_D = P_D.mul(balances[j]).mul(balancesLength).divDown(invariant);
    }

    sum = sum.sub(balances[tokenIndex]);

    const inv2 = invariant.mul(invariant);
    const c = inv2.divUp(ampTimesTotal.mul(P_D)).mul(this._AMP_PRECISION).mul(balances[tokenIndex]);
    const b = sum.add(invariant.divDown(ampTimesTotal).mul(this._AMP_PRECISION));

    let prevTokenBalance = FixedPoint.from(0);
    let tokenBalance = inv2.add(c).divUp(invariant.add(b));

    for (let i = 0; i < 255; i += 1) {
      prevTokenBalance = tokenBalance;
      // prettier-ignore
      tokenBalance = tokenBalance.mul(tokenBalance).add(c).divUp(
        tokenBalance.mul(FixedPoint.from(2)).add(b).sub(invariant)
      )

      if (tokenBalance.gt(prevTokenBalance)) {
        if (tokenBalance.sub(prevTokenBalance).lte(FixedPoint.from(1))) {
          return tokenBalance;
        }
        if (prevTokenBalance.sub(tokenBalance).lte(FixedPoint.from(1))) {
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
    const sumBalances = balances.reduce((s, b) => s.add(b), FixedPoint.from(0));

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
    const sumBalances = balances.reduce((s, b) => s.add(b), FixedPoint.from(0));

    let invariantRatioWithFees = FixedPoint.from(0);
    const balanceRatiosWithFee = balances.map((b, i) => {
      const currentWeight = b.divDown(sumBalances);
      console.log(`
      balance:        ${b.n.toString()}
      current weight: ${currentWeight.n.toString()}
      `);
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
    const newInvariant = this.calculateInvariant(amp, newBalances, false);
    const invariantRatio = newInvariant.divDown(currentInvariant);
    console.log(`
      sumBalances: ${sumBalances.n.toString()}
      invariantRatioWithFees: ${invariantRatioWithFees.n.toString()}
      currentInvariant:       ${currentInvariant.n.toString()}
      newInvariant:           ${newInvariant.n.toString()}
      invariantRatio:         ${invariantRatio.n.toString()}
      balanceRatios: ${balanceRatiosWithFee.map((b) => b.n.toString())}
      newBalances:   ${newBalances.map((b) => b.n.toString())}
      oldBalances:   ${balances.map((b) => b.n.toString())}
    `);

    // Invariant must increase or we don't mint BPT
    if (invariantRatio.gt(FixedPoint.ONE)) {
      console.log(`
        bpt supply: ${bptTotalSupply.n.toString()}
        invariant ratio - 1: ${invariantRatio.sub(FixedPoint.ONE).n.toString()}
      `);
      return bptTotalSupply.mulDown(invariantRatio.sub(FixedPoint.ONE));
    }
    return FixedPoint.from(0);
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
