import { AccountData } from "../../src/account";
import { Balance, Asset } from "../../src/libs/types";

export default class MockAccountData extends AccountData {
  constructor(
    public nextSettleTime: number,
    public hasCashDebt: boolean,
    public hasAssetDebt: boolean,
    public bitmapCurrencyId: number | undefined,
    public accountBalances: Balance[],
    public portfolio: Asset[],
    public isCopy: boolean,
  ) {
    super(nextSettleTime, hasCashDebt, hasAssetDebt, bitmapCurrencyId, accountBalances, portfolio, isCopy);
  }
}

