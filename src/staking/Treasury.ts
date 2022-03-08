import {BigNumberish, Signer} from 'ethers';
import {TypedBigNumber} from '..';
import {System} from '../system';
import {populateTxnAndGas} from '../libs/utils';
import {TreasuryManager} from '../typechain/TreasuryManager';
import Order from './Order';

export default class Treasury {
  constructor(public treasuryManager: TreasuryManager, public manager: string) { }

  private async populateTxnAndGas(msgSender: string, methodName: string, methodArgs: any[]) {
    return populateTxnAndGas(this.treasuryManager, msgSender, methodName, methodArgs);
  }

  /** Manager Methods */
  public async harvestAssetsFromNotional(currencyIds: number[]) {
    return this.populateTxnAndGas(this.manager, 'harvestAssetsFromNotional', currencyIds);
  }

  public async harvestCOMPFromNotional(currencyIds: number[]) {
    const system = System.getSystem();
    const cTokens = currencyIds.map((c) => system.getCurrencyById(c).contract.address);
    return this.populateTxnAndGas(this.manager, 'harvestCOMPFromNotional', cTokens);
  }

  public async investIntoStakedNOTE(noteAmount: TypedBigNumber, ethAmount: TypedBigNumber) {
    return this.populateTxnAndGas(this.manager, 'investIntoSNOTE', [noteAmount, ethAmount]);
  }

  public async claimCOMP() {
    return null;
  }

  public async submit0xLimitOrder(
    signer: Signer,
    makerTokenAddress: string,
    makerAmount: BigNumberish,
    takerAmount: BigNumberish,
  ) {
    // takerTokenAddress is hardcoded to WETH
    const order = new Order(1, makerTokenAddress, makerAmount, takerAmount);
    console.log(JSON.stringify(await order.hash(System.getSystem().getExchangeV3())));
    console.log(JSON.stringify(await order.sign(System.getSystem().getExchangeV3(), signer)));
    return null;
  }
}
