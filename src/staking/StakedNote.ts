import { ethers, Overrides } from 'ethers';
import { BigNumberType, TypedBigNumber } from '..';
import { getNowSeconds, populateTxnAndGas } from '../libs/utils';
import { SNOTE } from '../typechain/SNOTE';
import BalancerPool from './BalancerPool';

export default class StakedNote {
  constructor(
    public coolDownTimeInSeconds: number,
    public redeemWindowSeconds: number,
    public sNOTE: SNOTE,
    private pool: BalancerPool,
  ) {}

  private async populateTxnAndGas(msgSender: string, methodName: string, methodArgs: any[]) {
    return populateTxnAndGas(this.sNOTE, msgSender, methodName, methodArgs);
  }

  /** Contract interaction methods * */
  public async mintFromETH(
    noteAmount: TypedBigNumber,
    ethAmount: TypedBigNumber,
    address: string,
    bptSlippagePercent = 0.005,
    overrides = {} as Overrides,
  ) {
    const minBPT = this.pool
      .getExpectedBPT(noteAmount, ethAmount)
      .mul((1 - bptSlippagePercent) * 1e9)
      .div(1e9);
    const ethOverrides = Object.assign(overrides, { value: ethAmount.n }) as ethers.PayableOverrides;

    return this.populateTxnAndGas(address, 'mintFromETH', [noteAmount.n, minBPT, ethOverrides]);
  }

  public async mintFromWETH(
    noteAmount: TypedBigNumber,
    ethAmount: TypedBigNumber,
    address: string,
    bptSlippagePercent = 0.005,
    overrides = {} as Overrides,
  ) {
    const minBPT = this.pool
      .getExpectedBPT(noteAmount, ethAmount)
      .mul((1 - bptSlippagePercent) * 1e9)
      .div(1e9);
    return this.populateTxnAndGas(address, 'mintFromWETH', [noteAmount.n, ethAmount.n, minBPT, overrides]);
  }

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
    const redeemWindowBegin = await this.sNOTE.accountRedeemWindowBegin(address);
    const redeemWindowEnd = redeemWindowBegin.add(this.redeemWindowSeconds);
    const isInCoolDown = !redeemWindowBegin.isZero() && redeemWindowEnd.gte(blockTime);

    return { isInCoolDown, redeemWindowBegin, redeemWindowEnd };
  }

  /**
   * Whether or not the account can redeem
   * @param address account address
   * @param blockTime
   * @returns true if the account can redeem
   */
  public async canAccountRedeem(address: string, blockTime = getNowSeconds()) {
    const { redeemWindowBegin, redeemWindowEnd } = await this.accountCoolDown(address, blockTime);
    return !redeemWindowBegin.isZero() && redeemWindowBegin.lte(blockTime) && redeemWindowEnd.gte(blockTime);
  }
}
