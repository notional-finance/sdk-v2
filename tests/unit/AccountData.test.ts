import {BigNumber, ethers} from 'ethers';
import {AccountData} from '../../src/account';
import TypedBigNumber, {BigNumberType} from '../../src/libs/TypedBigNumber';
import {Asset, Balance, AssetType} from '../../src/libs/types';
import MockSystem, {systemQueryResult} from '../mocks/MockSystem';
import GraphClient from '../../src/GraphClient';
import {System} from '../../src/system';
import {getNowSeconds} from '../../src/libs/utils';
import MockNotionalProxy from '../mocks/MockNotionalProxy';

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

describe('Account Data', () => {
  const provider = new ethers.providers.JsonRpcBatchProvider('http://localhost:8545');
  const system = new MockSystem(
    systemQueryResult,
    ({} as unknown) as GraphClient,
    MockNotionalProxy,
    provider,
  );
  System.overrideSystem((system as unknown) as System);
  const accountData = new MockAccountData(
    0,
    false,
    false,
    undefined,
    [
      {
        currencyId: 1,
        cashBalance: TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cETH'),
        nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nETH'),
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      },
    ],
    [],
    false,
  );

  it('does not update non copy', () => {
    expect(() => accountData.updateBalance(
      1,
      TypedBigNumber.from(-100e8, BigNumberType.InternalAsset, 'cETH'),
      TypedBigNumber.from(0, BigNumberType.nToken, 'nETH'),
    )).toThrowError();

    expect(() => accountData.updateAsset(
      {
        currencyId: 2,
        maturity: 100,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.from(100e8, BigNumberType.InternalUnderlying, 'DAI'),
        hasMatured: false,
        settlementDate: 100,
        isIdiosyncratic: false,
      },
    )).toThrowError();
  });

  it('updates cash balances', () => {
    const accountDataCopy = AccountData.copyAccountData(accountData);
    accountDataCopy.updateBalance(1, TypedBigNumber.from(-100e8, BigNumberType.InternalAsset, 'cETH'));
    expect(accountDataCopy.cashBalance(1)!.n).toEqual(BigNumber.from(4900e8));
    // Expect original object did not change
    expect(accountData.cashBalance(1)!.n).toEqual(BigNumber.from(5000e8));
  });

  it('fails to update when balances dont match types', () => {
    const accountDataCopy = AccountData.copyAccountData(accountData);
    // eslint-disable-next-line
    expect(() => accountDataCopy.updateBalance(1, TypedBigNumber.from(-100e8, BigNumberType.ExternalAsset, 'cDAI'))).toThrowError();

    expect(() => accountDataCopy.updateBalance(
      1,
      TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
      TypedBigNumber.from(100e8, BigNumberType.nToken, 'nDAI'),
    )).toThrowError();
  });

  it('adds cash balances', () => {
    const accountDataCopy = AccountData.copyAccountData(accountData);
    accountDataCopy.updateBalance(
      2,
      TypedBigNumber.from(100e8, BigNumberType.InternalAsset, 'cDAI'),
      TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
    );
    expect(accountDataCopy.cashBalance(2)!.n).toEqual(BigNumber.from(100e8));
  });

  it('updates ntoken balances', () => {
    const accountDataCopy = AccountData.copyAccountData(accountData);
    accountDataCopy.updateBalance(
      2,
      TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
      TypedBigNumber.from(100e8, BigNumberType.nToken, 'nDAI'),
    );
    expect(accountDataCopy.nTokenBalance(2)!.n).toEqual(BigNumber.from(100e8));
  });

  it('fails to update when assets dont match types', () => {
    const accountDataCopy = AccountData.copyAccountData(accountData);
    expect(() => {
      const asset1 = {
        currencyId: 1,
        maturity: 100,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.from(100e8, BigNumberType.InternalUnderlying, 'ETH'),
        hasMatured: false,
        settlementDate: 100,
        isIdiosyncratic: false,
      };
      const asset2 = {
        currencyId: 1,
        maturity: 100,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.from(100e8, BigNumberType.InternalUnderlying, 'DAI'),
        hasMatured: false,
        settlementDate: 100,
        isIdiosyncratic: false,
      };
      accountDataCopy.updateAsset(asset1);
      accountDataCopy.updateAsset(asset2);
    }).toThrowError();
  });

  it('updates assets and sorts', () => {
    const accountDataCopy = AccountData.copyAccountData(accountData);
    const asset1 = {
      currencyId: 1,
      maturity: 100,
      assetType: AssetType.fCash,
      notional: TypedBigNumber.from(100e8, BigNumberType.InternalUnderlying, 'ETH'),
      hasMatured: false,
      settlementDate: 100,
      isIdiosyncratic: false,
    };
    const asset2 = {
      currencyId: 1,
      maturity: 100,
      assetType: AssetType.LiquidityToken_3Month,
      notional: TypedBigNumber.from(100e8, BigNumberType.LiquidityToken, 'cETH'),
      hasMatured: false,
      settlementDate: 100,
      isIdiosyncratic: false,
    };
    accountDataCopy.updateAsset(asset2);
    accountDataCopy.updateAsset(asset1);
    expect(accountDataCopy.portfolio[0]).toEqual(asset1);
    expect(accountDataCopy.portfolio[1]).toEqual(asset2);
  });

  it('settles matured cash balances', (done) => {
    const accountResult = {
      accountContext: {
        nextSettleTime: 0,
        hasDebt: '0x00',
        assetArrayLength: 1,
        bitmapCurrencyId: 0,
        activeCurrencies: '',
      },
      accountBalances: [],
      portfolio: [{
        currencyId: BigNumber.from(2),
        maturity: BigNumber.from(getNowSeconds() - 1000),
        assetType: BigNumber.from(1),
        notional: BigNumber.from(1000e8),
        storageSlot: BigNumber.from(0),
        storageState: 0,
      }],
    };

    AccountData.load(accountResult).then((a) => {
      expect(a.cashBalance(2)?.toString()).toEqual('50000.0');
      expect(a.portfolio.length).toEqual(0);
      done();
    }).catch(() => {
      done();
    });
  });
});
