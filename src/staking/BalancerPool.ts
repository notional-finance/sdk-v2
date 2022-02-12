import {gql} from '@apollo/client/core';
import {BigNumber, ethers} from 'ethers';
import {BigNumberType, TypedBigNumber} from '..';
import {INTERNAL_TOKEN_PRECISION} from '../config/constants';
import GraphClient from '../GraphClient';

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
 * Balancer pool math adapted from this code:
 * https://github.com/officialnico/balancerv2cad/blob/main/src/balancerv2cad/WeightedMath.py#L74
 */
export default class BalancerPool {
  public readonly BPT_PRECISION = ethers.constants.WeiPerEther;
  public readonly ETH_WEIGHT = BigNumber.from(0.2e18);
  public readonly NOTE_WEIGHT = BigNumber.from(0.8e18);
  public balancerGraphClient: GraphClient;

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

  constructor(
    public poolId: string,
    public ethBalance: TypedBigNumber,
    public noteBalance: TypedBigNumber,
    public totalSupply: BigNumber,
    public sNOTEBptBalance: BigNumber,
    public swapFee: BigNumber,
  ) {
    this.balancerGraphClient = new GraphClient('https://api.thegraph.com/subgraphs/name/balancer-labs/balancer-v2', 0);
  }

  /**
   * Returns the amount of BPT tokens expected given the two inputs.
   *
   * @dev Adapted from `calc_bpt_out_given_exact_tokens_in` in the python file above.
   * @param noteAmount
   * @param ethAmount
   * @returns
   */
  public getExpectedBPT(noteAmount: TypedBigNumber, ethAmount: TypedBigNumber) {
    noteAmount.checkType(BigNumberType.NOTE);
    ethAmount.check(BigNumberType.ExternalUnderlying, 'ETH');
    // These two ratios calculate how much the pool balance will change on a normalized basis.
    // ratio = (balance + amount) / balance
    const ethBalanceRatioWithFee = this.ethBalance.add(ethAmount).scale(this.BPT_PRECISION, this.ethBalance.n).n;
    const noteBalanceRatioWithFee = this.noteBalance
      .add(noteAmount)
      .scale(INTERNAL_TOKEN_PRECISION, this.noteBalance.n).n;

    // The invariant ratio with fees calculates the normalized change to the invariant given the
    // two deposit amounts.
    // (ethRatio * 0.20) + (noteRatio * 0.80)
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
      ethInWithoutFee = ethAmount.scale(this.BPT_PRECISION.sub(this.swapFee), this.BPT_PRECISION);
    } else {
      ethInWithoutFee = ethAmount;
    }

    const balanceRatioEth = this.ethBalance.add(ethInWithoutFee).scale(this.ethBalance.n, this.BPT_PRECISION);
    let invariantRatio = BigNumber.from(
      (balanceRatioEth.toNumber() / this.BPT_PRECISION.toNumber()) ** 0.2 * this.BPT_PRECISION.toNumber(),
    );

    if (noteBalanceRatioWithFee.gt(invariantRatioWithFees)) {
      // This will calculate whatever remains after the eth swap fee has been applied. If the invariant
      // ratio is still above one then part of the noteAmount will be subject to a swap fee as well.
      const nonTaxableAmount = this.noteBalance.scale(invariantRatio.sub(this.BPT_PRECISION), this.BPT_PRECISION);
      const taxableAmount = noteAmount.sub(nonTaxableAmount);
      noteInWithoutFee = nonTaxableAmount.add(
        taxableAmount.scale(this.BPT_PRECISION.sub(this.swapFee), this.BPT_PRECISION),
      );
    } else {
      noteInWithoutFee = noteAmount;
    }

    const balanceRatioNote = this.noteBalance.add(noteInWithoutFee).scale(this.noteBalance.n, this.BPT_PRECISION);
    invariantRatio = invariantRatio
      .mul(
        BigNumber.from(
          (balanceRatioNote.toNumber() / this.BPT_PRECISION.toNumber()) ** 0.8 * this.BPT_PRECISION.toNumber(),
        ),
      )
      .div(this.BPT_PRECISION);

    if (invariantRatio.gte(this.BPT_PRECISION)) {
      return this.totalSupply.mul(invariantRatio.sub(this.BPT_PRECISION)).div(this.BPT_PRECISION);
    }
    throw Error('Insufficient liquidity');
  }

  public async getExpectedPriceImpact(noteAmount: TypedBigNumber, ethAmount: TypedBigNumber) {
    noteAmount.checkType(BigNumberType.NOTE);
    ethAmount.check(BigNumberType.ExternalUnderlying, 'ETH');
    const noteRatio = this.noteBalance.add(noteAmount).scale(this.BPT_PRECISION, this.NOTE_WEIGHT).n;
    const ethRatio = this.ethBalance.add(ethAmount).scale(this.BPT_PRECISION, this.ETH_WEIGHT).n;

    // Returns the expected NOTE/ETH price after some investment (does not take fees into account)
    return noteRatio.mul(this.BPT_PRECISION).div(ethRatio);
  }

  public async getStakedNOTEPoolValue() {
    const ethValue = this.ethBalance.scale(this.sNOTEBptBalance, this.totalSupply);
    const noteValue = this.noteBalance.scale(this.sNOTEBptBalance, this.totalSupply);
    return {ethValue, noteValue, usdValue: ethValue.toUSD().add(noteValue.toUSD())};
  }

  public async getBptValue() {
    const ethValue = this.ethBalance.scale(1, this.totalSupply);
    const noteValue = this.noteBalance.scale(1, this.totalSupply);
    return {ethValue, noteValue, usdValue: ethValue.toUSD().add(noteValue.toUSD())};
  }

  // These three can be queried from the balancer subgraph, but we will need
  // to get historical prices for ETH and NOTE.
  // Use JoinExit, filter for the TreasuryManager contract
  public async calculatePoolReturns(treasuryManager: string) {
    const [joinExit, swapFee] = await Promise.all([
      this.balancerGraphClient.queryOrThrow<JoinExitResponse>(this.joinExitQuery(treasuryManager, this.poolId)),
      this.balancerGraphClient.queryOrThrow<SwapFeeResponse>(this.swapFeeQuery(this.poolId)),
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
