import {ethers, Overrides} from 'ethers';
import {BigNumberType, TypedBigNumber} from '..';
import {RATE_PRECISION} from '../config/constants';
import {getNowSeconds, populateTxnAndGas} from '../libs/utils';
import {System} from '../system';
import {SNOTE} from '../typechain/SNOTE';
import BalancerPool from './BalancerPool';

export default class StakedNote extends BalancerPool {
  constructor(public sNOTE: SNOTE) {
    super();
  }

  private async populateTxnAndGas(msgSender: string, methodName: string, methodArgs: any[]) {
    return populateTxnAndGas(this.sNOTE, msgSender, methodName, methodArgs);
  }

  /**
   * Mints sNOTE from ETH and NOTE
   *
   * @param noteAmount amount of NOTE to contribute to the pool (can be zero)
   * @param ethAmount amount of ETH to contribut to the pool (can be zero)
   * @param address address that will send the tokens
   * @param bptSlippagePercent slippage applied to the expected BPT to be minted (default: 0.5%)
   * @param overrides transaction overrides
   * @returns a populated transaction
   */
  public async mintFromETH(
    noteAmount: TypedBigNumber,
    ethAmount: TypedBigNumber,
    address: string,
    bptSlippagePercent = 0.005,
    overrides = {} as Overrides,
  ) {
    const minBPT = this.getExpectedBPT(noteAmount, ethAmount)
      .mul((1 - bptSlippagePercent) * RATE_PRECISION)
      .div(RATE_PRECISION);
    const ethOverrides = Object.assign(overrides, {value: ethAmount.n}) as ethers.PayableOverrides;

    return this.populateTxnAndGas(address, 'mintFromETH', [noteAmount.n, minBPT, ethOverrides]);
  }

  /**
   * Mints sNOTE from WETH and NOTE
   *
   * @param noteAmount amount of NOTE to contribute to the pool (can be zero)
   * @param ethAmount amount of ETH to contribut to the pool (can be zero)
   * @param address address that will send the tokens
   * @param bptSlippagePercent slippage applied to the expected BPT to be minted (default: 0.5%)
   * @param overrides transaction overrides
   * @returns a populated transaction
   */
  public async mintFromWETH(
    noteAmount: TypedBigNumber,
    ethAmount: TypedBigNumber,
    address: string,
    bptSlippagePercent = 0.005,
    overrides = {} as Overrides,
  ) {
    const minBPT = this.getExpectedBPT(noteAmount, ethAmount)
      .mul((1 - bptSlippagePercent) * RATE_PRECISION)
      .div(RATE_PRECISION);
    return this.populateTxnAndGas(address, 'mintFromWETH', [noteAmount.n, ethAmount.n, minBPT, overrides]);
  }

  /**
   * An amount of sNOTE to redeem
   *
   * @param sNOTEAmount amount of sNOTE to redeem
   * @param address address to redeem the sNOTE
   * @param blockTime current time to assess the redemption window
   * @param overrides
   * @returns a populated transaction
   */
  public async redeem(
    sNOTEAmount: TypedBigNumber,
    address: string,
    blockTime = getNowSeconds(),
    overrides = {} as Overrides,
  ) {
    sNOTEAmount.checkType(BigNumberType.sNOTE);
    if (!this.canAccountRedeem(address, blockTime)) {
      throw Error(`Account ${address} not in redemption window`);
    }

    return this.populateTxnAndGas(address, 'redeem', [sNOTEAmount.n, overrides]);
  }

  /**
   * Starts a cool down for the given address
   * @param address address of the cool down to initiate
   */
  public async startCoolDown(address: string, overrides = {} as Overrides) {
    return this.populateTxnAndGas(address, 'startCoolDown', [overrides]);
  }

  /**
   * Stops a cool down for the given address
   * @param address address of the cool down to stop
   */
  public async stopCoolDown(address: string, overrides = {} as Overrides) {
    return this.populateTxnAndGas(address, 'stopCoolDown', [overrides]);
  }

  /**
   * Returns account cool down parameters
   * @param address account address
   * @param blockTime
   * @returns isInCoolDown true if the account is in cool down
   * @returns redeemWindowBegin when the account can begin to redeem sNOTE
   * @returns redeemWindowEnd when the redeem window will end
   */
  public async accountCoolDown(address: string, blockTime = getNowSeconds()) {
    const {redeemWindowSeconds} = System.getSystem().getStakedNoteParameters();
    const redeemWindowBegin = await this.sNOTE.accountRedeemWindowBegin(address);
    const redeemWindowEnd = redeemWindowBegin.add(redeemWindowSeconds);
    const isInCoolDown = !redeemWindowBegin.isZero() && redeemWindowEnd.gte(blockTime);

    return {isInCoolDown, redeemWindowBegin, redeemWindowEnd};
  }

  /**
   * Whether or not the account can redeem
   * @param address account address
   * @param blockTime
   * @returns true if the account can redeem
   */
  public async canAccountRedeem(address: string, blockTime = getNowSeconds()) {
    const {redeemWindowBegin, redeemWindowEnd} = await this.accountCoolDown(address, blockTime);
    return !redeemWindowBegin.isZero() && redeemWindowBegin.lte(blockTime) && redeemWindowEnd.gte(blockTime);
  }
}
