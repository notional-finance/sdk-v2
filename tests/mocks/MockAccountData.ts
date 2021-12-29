import {AccountData} from '../../src/account';
import {Balance, Asset} from '../../src/libs/types';

export default class MockAccountData extends AccountData {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(
    nextSettleTime: number,
    hasCashDebt: boolean,
    hasAssetDebt: boolean,
    bitmapCurrencyId: number | undefined,
    accountBalances: Balance[],
    _portfolio: Asset[],
    isCopy: boolean,
  ) {
    super(nextSettleTime, hasCashDebt, hasAssetDebt, bitmapCurrencyId, accountBalances, _portfolio, isCopy);
  }
}
