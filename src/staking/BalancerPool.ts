import {gql} from '@apollo/client/core';
import {ethers} from 'ethers';
import {BigNumberType, TypedBigNumber} from '..';
import {INTERNAL_TOKEN_PRECISION} from '../config/constants';
import GraphClient from '../GraphClient';
import {System} from '../system';

interface JoinExitResponse {
  joinExits: {
    id: string;
    type: string;
    timestamp: number;
    amounts: string[];
  };
}

interface SwapFeeResponse {
  pool: {
    createTime: number;
    totalSwapFee: string;
  };
}

/**
 * Balancer pool math adapted from this code. Although the code is incorrect in a few places:
 * https://github.com/officialnico/balancerv2cad/blob/main/src/balancerv2cad/WeightedMath.py#L74
 */
export default class BalancerPool {
  public readonly BPT_PRECISION = ethers.constants.WeiPerEther;
  public readonly ETH_WEIGHT = ethers.utils.parseEther('0.2');
  public readonly NOTE_WEIGHT = ethers.utils.parseEther('0.8');
  public balancerGraphClient = new GraphClient('https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2', 0);

  joinExitQuery = (treasuryManager: string, poolId: string) => gql`{
    joinExits(where: {user: "${treasuryManager}", pool: "${poolId}"}){
      id
      type
      timestamp
      amounts
    }
  }`;

  // Returns total swap fees in USD since creation
  swapFeeQuery = (poolId: string) => gql`{
    pool(id: "${poolId}"}){
      createTime
      totalSwapFee
    }
  }`;

  /**
   * Returns the amount of BPT tokens expected given the two inputs.
   *
   * @dev Adapted from `calc_bpt_out_given_exact_tokens_in` in the python file above.
   * @param noteAmount
   * @param ethAmount
   * @returns
   */
  public getExpectedBPT(noteAmount: TypedBigNumber, ethAmount: TypedBigNumber) {
    const {
      ethBalance, swapFee, noteBalance, totalSupply,
    } = System.getSystem().getStakedNoteParameters();
    noteAmount.checkType(BigNumberType.NOTE);
    ethAmount.check(BigNumberType.ExternalUnderlying, 'ETH');
    // These two ratios calculate how much the pool balance will change on a normalized basis.
    // ratio = (balance + amount) / balance
    const ethBalanceRatioWithFee = ethBalance.add(ethAmount).scale(this.BPT_PRECISION, ethBalance.n).n;
    const noteBalanceRatioWithFee = noteBalance
      .add(noteAmount)
      .scale(INTERNAL_TOKEN_PRECISION, noteBalance.n)
      // This needs to be scaled up to 1e18 to match the ethBalanceRatio precision
      .scale(1e10, 1).n;

    // The invariant ratio with fees calculates the normalized change to the invariant given the
    // two deposit amounts. The invariant ratio is: (ethRatio ** 0.2) * (noteRatio ** 0.8), this
    // formula calculates the log of those two figures:
    // log(invariant) = 0.2 * log(ethRatio) + 0.8 * log(noteRatio)
    const invariantRatioWithFees = ethBalanceRatioWithFee
      .mul(this.ETH_WEIGHT)
      .div(this.BPT_PRECISION)
      .add(noteBalanceRatioWithFee.mul(this.NOTE_WEIGHT).div(this.BPT_PRECISION));

    let ethInWithoutFee: TypedBigNumber;
    let noteInWithoutFee: TypedBigNumber;

    if (ethBalanceRatioWithFee.gt(invariantRatioWithFees)) {
      // If depositing ETH (ethBalanceRatioWithFee > 1) will result in the invariant moving
      // away from it's target position (invariantRatioWithFees == 1) then we need to apply
      // a swap fee to the ethAmount.
      const nonTaxableAmount = ethBalance.scale(
        invariantRatioWithFees.sub(this.BPT_PRECISION),
        this.BPT_PRECISION,
      );
      const taxableAmount = ethAmount.sub(nonTaxableAmount);
      ethInWithoutFee = nonTaxableAmount.add(
        taxableAmount.scale(this.BPT_PRECISION.sub(swapFee), this.BPT_PRECISION),
      );
    } else {
      ethInWithoutFee = ethAmount;
    }

    const balanceRatioEth = ethBalance.add(ethInWithoutFee).scale(this.BPT_PRECISION, ethBalance.n);
    let invariantRatio = ethers.utils.parseUnits((parseFloat(balanceRatioEth.toExactString()) ** 0.2).toFixed(18), 18);

    if (noteBalanceRatioWithFee.gt(invariantRatioWithFees)) {
      // This will calculate whatever remains after the eth swap fee has been applied. If the invariant
      // ratio is still above one then part of the noteAmount will be subject to a swap fee as well.
      // noteBalance * (log(invariantRatio) - 1)
      const nonTaxableAmount = noteBalance.scale(
        invariantRatioWithFees.sub(this.BPT_PRECISION),
        this.BPT_PRECISION,
      );
      const taxableAmount = noteAmount.sub(nonTaxableAmount);
      noteInWithoutFee = nonTaxableAmount.add(
        taxableAmount.scale(this.BPT_PRECISION.sub(swapFee), this.BPT_PRECISION),
      );
    } else {
      noteInWithoutFee = noteAmount;
    }

    const balanceRatioNote = noteBalance.add(noteInWithoutFee).scale(INTERNAL_TOKEN_PRECISION, noteBalance.n);
    const invariantRatioNote = ethers.utils.parseUnits(
      (parseFloat(balanceRatioNote.toExactString()) ** 0.8).toFixed(8),
      8,
    );
    invariantRatio = invariantRatio.mul(invariantRatioNote).div(INTERNAL_TOKEN_PRECISION);

    if (invariantRatio.gte(this.BPT_PRECISION)) {
      return totalSupply.mul(invariantRatio.sub(this.BPT_PRECISION)).div(this.BPT_PRECISION);
    }
    throw Error('Insufficient liquidity');
  }

  public async getExpectedPriceImpact(noteAmount: TypedBigNumber, ethAmount: TypedBigNumber) {
    const {ethBalance, noteBalance} = System.getSystem().getStakedNoteParameters();
    noteAmount.checkType(BigNumberType.NOTE);
    ethAmount.check(BigNumberType.ExternalUnderlying, 'ETH');
    const noteRatio = noteBalance.add(noteAmount).scale(this.BPT_PRECISION, this.NOTE_WEIGHT).n;
    const ethRatio = ethBalance.add(ethAmount).scale(this.BPT_PRECISION, this.ETH_WEIGHT).n;

    // Returns the expected NOTE/ETH price after some investment (does not take fees into account)
    return noteRatio.mul(this.BPT_PRECISION).div(ethRatio);
  }

  public async getStakedNOTEPoolValue() {
    const {
      ethBalance, sNOTEBptBalance, noteBalance, totalSupply,
    } = System.getSystem().getStakedNoteParameters();
    const ethValue = ethBalance.scale(sNOTEBptBalance, totalSupply);
    const noteValue = noteBalance.scale(sNOTEBptBalance, totalSupply);
    return {ethValue, noteValue, usdValue: ethValue.toUSD().add(noteValue.toUSD())};
  }

  public async getBptValue() {
    const {ethBalance, noteBalance, totalSupply} = System.getSystem().getStakedNoteParameters();
    const ethValue = ethBalance.scale(1, totalSupply);
    const noteValue = noteBalance.scale(1, totalSupply);
    return {ethValue, noteValue, usdValue: ethValue.toUSD().add(noteValue.toUSD())};
  }

  // These three can be queried from the balancer subgraph, but we will need
  // to get historical prices for ETH and NOTE.
  // Use JoinExit, filter for the TreasuryManager contract
  public async calculatePoolReturns(treasuryManager: string) {
    const {poolId} = System.getSystem().getStakedNoteParameters();
    const [joinExit, swapFee] = await Promise.all([
      this.balancerGraphClient.queryOrThrow<JoinExitResponse>(this.joinExitQuery(treasuryManager, poolId)),
      this.balancerGraphClient.queryOrThrow<SwapFeeResponse>(this.swapFeeQuery(poolId)),
    ]);
    console.log(joinExit);
    console.log(swapFee);
    // So we have three cash flows here (use xirr)
    // 1. incentiveReturns: joins in NOTE token (NOTE in USD / poolValueInUSD -- poolTotalLiquidity)
    // 2. buybackReturns: joins in WETH token (WETH in USD / poolValueInUSD)
    // 3. swapFee: use poolSnapshot object, we can calculate swapVolume and swapFees (both denominated in USD)
    // const incentiveReturns;
    // const buybackReturns;
    // const swapFees = BigNumber.from(swapFee.pool.totalSwapFee);
  }
}
