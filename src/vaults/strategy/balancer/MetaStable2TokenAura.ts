import { BigNumber, Contract, utils } from 'ethers';
import { BASIS_POINT, INTERNAL_TOKEN_PRECISION, RATE_PRECISION } from '../../../config/constants';
import { AggregateCall } from '../../../data/Multicall';
import TypedBigNumber from '../../../libs/TypedBigNumber';
import { LiquidationThreshold, LiquidationThresholdType } from '../../../libs/types';
import { DexId, DexTradeType } from '../../../trading/TradeHandler';
import { BalancerStablePool } from '../../../typechain/BalancerStablePool';
import { MetaStable2Token } from '../../../typechain/MetaStable2Token';
import { doBinarySearch } from '../../Approximation';
import VaultAccount from '../../VaultAccount';
import BalancerStableMath from './BalancerStableMath';
import { BaseBalancerStablePool, BaseBalancerStablePoolInitParams, PoolContext } from './BaseBalancerStablePool';
import FixedPoint from './FixedPoint';

const MetaStable2TokenAuraABI = require('../../../abi/MetaStable2Token.json');
const BalancerStablePoolABI = require('../../../abi/BalancerStablePool.json');

interface InitParams extends BaseBalancerStablePoolInitParams {
  poolContext: PoolContext;
  scalingFactors: FixedPoint[];
  amplificationParameter: FixedPoint;
  totalSupply: FixedPoint;
  swapFeePercentage: FixedPoint;
  oracleContext: {
    bptPrice: FixedPoint;
    pairPrice: FixedPoint;
  };
}

export default class MetaStable2TokenAura extends BaseBalancerStablePool<InitParams> {
  public get oraclePrice() {
    if (this.initParams.poolContext.primaryTokenIndex === 0) {
      return this.initParams.oracleContext.bptPrice;
    }
    const { bptPrice, pairPrice } = this.initParams.oracleContext;
    return bptPrice.mul(FixedPoint.ONE).div(pairPrice);
  }

  public get balances() {
    return this.initParams.poolContext.balances.map((b, i) =>
      b.mul(this.initParams.scalingFactors[i]).div(FixedPoint.ONE)
    );
  }

  public initVaultParams() {
    const vaultContract = new Contract(this.vaultAddress, MetaStable2TokenAuraABI) as MetaStable2Token;
    return [
      {
        stage: 0,
        target: vaultContract,
        method: 'getStrategyContext',
        args: [],
        key: 'strategyContext',
        transform: (r: Awaited<ReturnType<typeof vaultContract.getStrategyContext>>) => ({
          totalStrategyTokensGlobal: FixedPoint.from(r.baseStrategy.vaultState.totalStrategyTokenGlobal),
          totalBPTHeld: FixedPoint.from(r.baseStrategy.totalBPTHeld),
        }),
      },
      {
        stage: 0,
        target: vaultContract,
        method: 'getStrategyContext',
        args: [],
        key: 'poolContext',
        transform: (r: Awaited<ReturnType<typeof vaultContract.getStrategyContext>>) => {
          const balances = [
            FixedPoint.from(
              r.poolContext.primaryIndex === 0 ? r.poolContext.primaryBalance : r.poolContext.secondaryBalance
            ),
            FixedPoint.from(
              r.poolContext.primaryIndex === 1 ? r.poolContext.primaryBalance : r.poolContext.secondaryBalance
            ),
          ];
          return {
            poolAddress: r.poolContext.basePool.pool,
            poolId: r.poolContext.basePool.poolId,
            primaryTokenIndex: r.poolContext.primaryIndex,
            tokenOutIndex: r.poolContext.secondaryIndex,
            balances,
            totalStrategyTokensGlobal: FixedPoint.from(r.baseStrategy.vaultState.totalStrategyTokenGlobal),
            totalBPTHeld: FixedPoint.from(r.baseStrategy.totalBPTHeld),
          };
        },
      },
      {
        stage: 1,
        target: (r) => new Contract(r.poolContext.poolAddress, BalancerStablePoolABI),
        method: 'getAmplificationParameter',
        key: 'amplificationParameter',
        transform: (r: Awaited<ReturnType<BalancerStablePool['functions']['getAmplificationParameter']>>) =>
          FixedPoint.from(r.value),
      },
      {
        stage: 1,
        target: (r) => new Contract(r.poolContext.poolAddress, BalancerStablePoolABI),
        method: 'getSwapFeePercentage',
        key: 'swapFeePercentage',
        transform: (r: Awaited<ReturnType<BalancerStablePool['functions']['getSwapFeePercentage']>>) =>
          FixedPoint.from(r),
      },
      {
        stage: 1,
        target: (r) => new Contract(r.poolContext.poolAddress, BalancerStablePoolABI),
        method: 'totalSupply',
        key: 'totalSupply',
        transform: (r: Awaited<ReturnType<BalancerStablePool['functions']['totalSupply']>>) => FixedPoint.from(r),
      },
      {
        stage: 1,
        target: (r) => new Contract(r.poolContext.poolAddress, BalancerStablePoolABI),
        method: 'getScalingFactors',
        key: 'scalingFactors',
        transform: (r: Awaited<ReturnType<BalancerStablePool['functions']['getScalingFactors']>>) =>
          r.map(FixedPoint.from),
      },
      {
        stage: 1,
        target: (r) => new Contract(r.poolContext.poolAddress, BalancerStablePoolABI),
        key: 'oracleContext',
        method: 'getTimeWeightedAverage',
        args: [
          [
            {
              variable: 0, // Pair Price
              secs: 3600,
              ago: 0,
            },
            {
              variable: 1, // BPT Price
              secs: 3600,
              ago: 0,
            },
          ],
        ],
        transform: (r: Awaited<ReturnType<BalancerStablePool['functions']['getTimeWeightedAverage']>>) => ({
          pairPrice: FixedPoint.from(r[0]),
          bptPrice: FixedPoint.from(r[1]),
        }),
      },
    ] as AggregateCall[];
  }

  public getLiquidationThresholds(vaultAccount: VaultAccount): Array<LiquidationThreshold> {
    const { perStrategyTokenValue } = this.getLiquidationVaultShareValue(vaultAccount);
    if (!perStrategyTokenValue) return [] as LiquidationThreshold[];
    const thresholdBPTValue = FixedPoint.from(perStrategyTokenValue.n);

    // Finds how much the pool needs to move away from the primary token in order to hit
    // the liquidation strategy token value.
    const findLiquidationUtilization = (secondaryPercentSold: number) => {
      const { primaryTokenIndex, tokenOutIndex } = this.initParams.poolContext;
      // The multiple in this case is the percentage of the secondary token pool that should be
      // sold to the pool in RATE_PRECISION
      const secondaryTokensSold = this.balances[tokenOutIndex]
        .mul(FixedPoint.from(secondaryPercentSold))
        .div(FixedPoint.from(RATE_PRECISION));

      const initialInvariant = BalancerStableMath.calculateInvariant(
        this.initParams.amplificationParameter,
        this.balances,
        true
      );

      // Calculate the amount of primary tokens leaving the pool after selling
      // the given amount of secondary tokens
      const primaryTokenOut = BalancerStableMath.calcOutGivenIn(
        this.initParams.amplificationParameter,
        this.balances,
        tokenOutIndex, // selling secondary
        primaryTokenIndex, // purchasing primary
        secondaryTokensSold,
        initialInvariant
      );

      // Update balances to account for the trade
      const newBalances = this.initParams.poolContext.balances.map((b, i) => {
        const scalingFactor = this.initParams.scalingFactors[i];
        let newB: FixedPoint;
        if (i === tokenOutIndex) newB = b.add(secondaryTokensSold);
        else if (i === primaryTokenIndex) newB = b.sub(primaryTokenOut);
        // Any other balances will remain unchanged
        else newB = b;

        // Apply the scaling factor after the balance adjustment
        return newB.mul(scalingFactor).div(FixedPoint.ONE);
      });

      // Re-calculate the invariant at the new utilization
      const newInvariant = BalancerStableMath.calculateInvariant(
        this.initParams.amplificationParameter,
        newBalances,
        true
      );

      let targetSecondaryPrice = FixedPoint.from(0);
      const oneBPTValueSpotInPrimary = newBalances
        // Returns the claims of one BPT on constituent tokens
        .map((b) => b.mul(FixedPoint.ONE).div(this.initParams.totalSupply))
        .reduce((totalValue, b, i) => {
          if (i === primaryTokenIndex) return totalValue.add(b);

          // Calculate how much primary token you get for one unit of
          // secondary token to get the current spot price
          const primaryTokenSpotPrice = BalancerStableMath.calcOutGivenIn(
            this.initParams.amplificationParameter,
            newBalances,
            i, // selling the current token index
            primaryTokenIndex, // purchasing primary token
            b, // selling all of the secondary token claim
            newInvariant
          );

          if (i === tokenOutIndex) targetSecondaryPrice = primaryTokenSpotPrice;
          return totalValue.add(primaryTokenSpotPrice);
        }, FixedPoint.from(0));

      // Get the percentage difference in price in RATE_PRECISION
      const delta = oneBPTValueSpotInPrimary
        .div(FixedPoint.from(1e10))
        .sub(thresholdBPTValue)
        .mul(FixedPoint.from(RATE_PRECISION))
        .div(thresholdBPTValue)
        .n.toNumber();

      return {
        actualMultiple: delta,
        breakLoop: false,
        value: targetSecondaryPrice,
      };
    };

    const bptValueInInternal = this.getBPTValue().div(FixedPoint.from(1e10));
    const initialGuess = bptValueInInternal
      .sub(thresholdBPTValue)
      .mul(FixedPoint.from(RATE_PRECISION))
      .div(bptValueInInternal)
      .n.toNumber();

    // prettier-ignore
    const targetSecondaryPrice = doBinarySearch(
      initialGuess, // this is the percentage difference from the threshold value
      0, // no target value since the calculation function just returns a delta
      findLiquidationUtilization,
      50 * BASIS_POINT,
      // Change the adjustment faster since trading is quite sensitive
      (m, d) => Math.floor(m - d / 4)
    );

    // The target secondary price is quoted in terms of the primary borrow currency
    const ethExchangeRate = TypedBigNumber.fromBalance(
      targetSecondaryPrice.div(FixedPoint.from(1e10)).n,
      this.getPrimaryBorrowSymbol(),
      true
    ).toETH(false);

    return [
      {
        name: 'Threshold',
        type: LiquidationThresholdType.exchangeRate,
        ethExchangeRate,
      },
    ];
  }

  protected getBPTValue(amountIn: FixedPoint = FixedPoint.ONE): FixedPoint {
    return this.oraclePrice.mul(amountIn).div(FixedPoint.ONE);
  }

  protected getBPTOut(tokenAmountIn: FixedPoint) {
    const { amplificationParameter, poolContext, totalSupply, swapFeePercentage } = this.initParams;
    const { primaryTokenIndex } = poolContext;
    const { balances } = this;
    const invariant = BalancerStableMath.calculateInvariant(amplificationParameter, balances, true);
    const amountsIn = new Array<FixedPoint>(this.balances.length).fill(FixedPoint.from(0));
    amountsIn[primaryTokenIndex] = tokenAmountIn;

    const dueProtocolFeeAmounts = this.getDueProtocolFeeAmounts(
      amplificationParameter,
      invariant,
      balances,
      swapFeePercentage
    );
    const balancesWithoutFees = balances.map((b, i) => b.sub(dueProtocolFeeAmounts[i]));

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
    const numTokens = this.balances.length;
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

    return dueProtocolFeeAmounts;
  }

  protected getUnderlyingOut(BPTIn: FixedPoint) {
    const { amplificationParameter, poolContext, totalSupply, swapFeePercentage } = this.initParams;
    const { balances } = this;
    const invariant = BalancerStableMath.calculateInvariant(amplificationParameter, balances, true);

    const tokensOut = BalancerStableMath.calcTokenOutGivenExactBptIn(
      amplificationParameter,
      balances,
      poolContext.primaryTokenIndex,
      BPTIn,
      totalSupply,
      swapFeePercentage,
      invariant
    );

    return TypedBigNumber.fromBalance(
      tokensOut.mul(FixedPoint.from(INTERNAL_TOKEN_PRECISION)).div(FixedPoint.ONE).n,
      this.getPrimaryBorrowSymbol(),
      true
    );
  }

  private static dynamicTradeTuple =
    'tuple(uint16 dexId, uint8 tradeType, uint32 oracleSlippagePercent, bool tradeUnwrapped, bytes exchangeData) t';

  public getRedeemParameters(
    _maturity: number,
    _strategyTokens: TypedBigNumber,
    _slippageBuffer: number,
    _blockTime?: number
  ) {
    const secondaryTradeParams = utils.defaultAbiCoder.encode(
      [MetaStable2TokenAura.dynamicTradeTuple],
      [
        {
          dexId: DexId.UNISWAP_V3,
          tradeType: DexTradeType.EXACT_IN_SINGLE,
          oracleSlippagePercent: 0.01e8,
          tradeUnwrapped: false,
          exchangeData: utils.defaultAbiCoder.encode(['uint24'], [3000]),
        },
      ]
    );

    return {
      minSecondaryLendRate: 0, // TODO: should this be here?
      minPrimary: BigNumber.from(0),
      minSecondary: BigNumber.from(0),
      secondaryTradeParams,
    };
  }
}
