import { TypedBigNumber } from '..';
import { System } from '../system';
import { populateTxnAndGas } from '../libs/utils';
import { TreasuryManager } from '../typechain/TreasuryManager';

export default class Treasury {
  constructor(public treasuryManager: TreasuryManager, public manager: string) {}

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

  // public async submit0xLimitOrder();
}
