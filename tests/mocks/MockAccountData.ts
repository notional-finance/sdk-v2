import { AccountData } from '../../src/account';
import { Balance } from '../../src/libs/types';
import { Asset } from '../../src/proto';

export default class MockAccountData extends AccountData {
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(
    nextSettleTime: number,
    hasCashDebt: boolean,
    hasAssetDebt: boolean,
    bitmapCurrencyId: number | undefined,
    accountBalances: Balance[],
    _portfolio: Asset[],
    isCopy: boolean
  ) {
    super(nextSettleTime, hasCashDebt, hasAssetDebt, bitmapCurrencyId, accountBalances, _portfolio, isCopy);
  }
}
