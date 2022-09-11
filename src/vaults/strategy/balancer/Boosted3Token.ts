import { BigNumber } from 'ethers';
import { INTERNAL_TOKEN_PRECISION } from '../../../config/constants';
import { SecondaryBorrowArray } from '../../../data';
import TypedBigNumber, { BigNumberType } from '../../../libs/TypedBigNumber';
import BaseVault, { LiquidationThreshold } from '../../BaseVault';
import VaultAccount from '../../VaultAccount';
import { BalancerStableMath, FixedPoint } from './BalancerMath';

interface DepositParams {
  minBPT: BigNumber;
  tradeData: string;
}

interface RedeemParams {
  minSecondaryLendRate: number;
  minPrimary: BigNumber;
  minSecondary: BigNumber;
  secondaryTradeParams: string;
}

/**
Balancer Pool: Constant Product Math
  - _calcBptOutGivenExactTokensIn
  - _calcTokenOutGivenExactBptIn

Balancer Pool: Stable Math
  - _calculateInvariant
  - _calcBptOutGivenExactTokensIn (wsteth/eth)
  - _calcTokenOutGivenExactBptIn (wsteth/eth)
  - _swapGivenIn (boost pool)
*/

/**
 * deposit:
 *  Boosted3TokenPoolUtils
 *    _swapGivenIn USDC => LinearPool BPT (underlyingPool)
 *    _swapGivenIn LinearPool BPT => Boosted BPT (basePool)
 *
 * redeem:
 *    _swapGivenIn Boosted BPT => LinearPool BPT (basePool)
 *    _swapGivenIn LinearPool BPT => USDC (underlyingPool)
 */

/**
 * getStrategyTokensFromValue [ value / _calcTokenOutGivenExactBPTIn = bptAmount ]
 * getStrategyTokenValue [_calcTokenOutGivenExactBptIn(1 BPT) * bptAmount], we can use a cached value
 * getLiquidationThresholds
 * getDepositParameters, getRedeemParameters
 * getDepositGivenStrategyTokens [??, maybe just iterate]
 * getStrategyTokensGivenDeposit [swapGivenIn, swapGivenIn]
 * getRedeemGivenStrategyTokens [swapGivenIn, swapGivenIn]
 * getStrategyTokensGivenRedeem [??, maybe just iterate]
 */
interface PoolContext {
  amplificationParameter: FixedPoint;
  balances: FixedPoint[];
  primaryTokenIndex: number;
  tokenOutIndex: number;
  totalSupply: FixedPoint;
  swapFeePercentage: FixedPoint;
  invariant: FixedPoint;
}

export default class BalancerBoosted3Token extends BaseVault<DepositParams, RedeemParams> {
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

  private convertBPTToStrategyTokens(bptAmount: FixedPoint, maturity: number) {
    return TypedBigNumber.from(bptAmount.n, BigNumberType.StrategyToken, this.getVaultSymbol(maturity));
  }

  private getBPTValue(amountIn: FixedPoint = FixedPoint.ONE) {
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

  private getBoostedBPT(tokenAmountIn: FixedPoint) {
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

  public getStrategyTokenValue(vaultAccount: VaultAccount): TypedBigNumber {
    const { strategyTokens } = vaultAccount.getPoolShare();
    const oneBPTValue = this.getBPTValue();
    const accountValue = strategyTokens.scale(oneBPTValue.n, FixedPoint.ONE.n).n;

    // This is in 8 decimal precision
    return TypedBigNumber.fromBalance(accountValue, this.getPrimaryBorrowSymbol(), true);
  }

  public getStrategyTokensFromValue(maturity: number, valuation: TypedBigNumber, __?: number) {
    const oneBPTValue = this.getBPTValue();
    const tokens = valuation.scale(FixedPoint.ONE.n, oneBPTValue.n).n;

    // This is in 8 decimal precision
    return TypedBigNumber.from(tokens, BigNumberType.StrategyToken, this.getVaultSymbol(maturity));
  }

  public getDepositParameters(_: number, __: TypedBigNumber, ___: number, ____?: number) {
    return {
      minBPT: BigNumber.from(0),
      tradeData: '',
    };
  }

  public async getDepositParametersExact(
    maturity: number,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ) {
    return this.getDepositParameters(maturity, depositAmount, slippageBuffer, blockTime);
  }

  public getRedeemParameters(_: number, __: TypedBigNumber, ___: number, ____?: number) {
    return {
      minSecondaryLendRate: 0, // TODO: should this be here?
      minPrimary: BigNumber.from(0),
      minSecondary: BigNumber.from(0),
      secondaryTradeParams: '',
    };
  }

  public async getRedeemParametersExact(
    maturity: number,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number
  ) {
    return this.getRedeemParameters(maturity, strategyTokens, slippageBuffer, blockTime);
  }

  public getSlippageForDeposit(
    maturity: number,
    depositAmount: TypedBigNumber,
    strategyTokens: TypedBigNumber,
    params: DepositParams,
    blockTime?: number
  ) {
    return { likelySlippage: 0, worstCaseSlippage: 0 };
  }

  public getSlippageForRedeem(
    maturity: number,
    redeemAmount: TypedBigNumber,
    strategyTokens: TypedBigNumber,
    params: RedeemParams,
    blockTime?: number
  ) {
    return { likelySlippage: 0, worstCaseSlippage: 0 };
  }

  public abstract getDepositGivenStrategyTokens(
    maturity: number,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number,
    vaultAccount?: VaultAccount
  ) {
    let tokenAmountGuess = FixedPoint.from(depositAmount.scale(FixedPoint.ONE.n, depositAmount.decimals).n);
    const boostedBPT = this.getBoostedBPT(tokenAmountIn);
    return {
      requiredDeposit: this.convertBPTToStrategyTokens(boostedBPT, maturity),
      secondaryfCashBorrowed: undefined,
      depositParams: this.getDepositParameters(maturity, depositAmount, slippageBuffer, blockTime),
    };
  }

  public getStrategyTokensGivenDeposit(
    maturity: number,
    depositAmount: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number,
    _?: VaultAccount
  ) {
    // Convert deposit amount to 18 decimals
    const tokenAmountIn = FixedPoint.from(depositAmount.scale(FixedPoint.ONE.n, depositAmount.decimals).n);
    const boostedBPT = this.getBoostedBPT(tokenAmountIn);

    return {
      strategyTokens: this.convertBPTToStrategyTokens(boostedBPT, maturity),
      secondaryfCashBorrowed: undefined,
      depositParams: this.getDepositParameters(maturity, depositAmount, slippageBuffer, blockTime),
    };
  }

  public getRedeemGivenStrategyTokens(
    maturity: number,
    strategyTokens: TypedBigNumber,
    slippageBuffer: number,
    blockTime?: number,
    _?: VaultAccount
  ) {
    if (!this.underlyingPoolContext || !this.basePoolContext) throw Error('Not Initialized');
    // Convert strategy token amount to 18 decimals
    const boostedBPTIn = FixedPoint.from(strategyTokens.scale(FixedPoint.ONE.n, INTERNAL_TOKEN_PRECISION).n);

    let linearPoolBPT: FixedPoint;
    {
      const { amplificationParameter, balances, primaryTokenIndex, tokenOutIndex, invariant } = this.basePoolContext;
      linearPoolBPT = BalancerStableMath.calcOutGivenIn(
        amplificationParameter,
        balances,
        tokenOutIndex,
        primaryTokenIndex,
        boostedBPTIn,
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

    const amountRedeemed = TypedBigNumber.fromBalance(
      underlyingTokensOut.mul(FixedPoint.from(INTERNAL_TOKEN_PRECISION)).div(FixedPoint.ONE),
      this.getPrimaryBorrowSymbol(),
      true
    );

    return {
      amountRedeemed,
      secondaryfCashRepaid: undefined,
      redeemParams: this.getRedeemParameters(maturity, strategyTokens, slippageBuffer, blockTime),
    };
  }

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
