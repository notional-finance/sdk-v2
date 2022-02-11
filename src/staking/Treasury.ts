import { TypedBigNumber } from '..';
import { populateTxnAndGas } from '../libs/utils';
import { TreasuryManager } from '../typechain/TreasuryManager';

export default class Treasury {
  constructor(public treasuryManager: TreasuryManager) {}

  private async populateTxnAndGas(msgSender: string, methodName: string, methodArgs: any[]) {
    return populateTxnAndGas(this.treasuryManager, msgSender, methodName, methodArgs);
  }

  /** Manager Methods */
  public async harvestAssetsFromNotional(currencyIds: number[]) {}

  public async harvestCOMPFromNotional(currencyIds: number[]) {}

  public async investIntoStakedNOTE(noteAmount: TypedBigNumber, ethAmount: TypedBigNumber) {}

  // public async submit0xLimitOrder();
}
