import { BigNumber } from 'ethers';
import { BalanceHistory, StakedNoteHistory } from '../../src/libs/types';
import { getNowSeconds } from '../../src/libs/utils';
import { BalanceSummary } from '../../src/account';
import { SECONDS_IN_DAY } from '../../src/config/constants';
import MockSystem from '../mocks/MockSystem';
import MockAccountData from '../mocks/MockAccountData';
import TypedBigNumber, { BigNumberType } from '../../src/libs/TypedBigNumber';
import { System, CashGroup } from '../../src/system';

describe('Balance Summary', () => {
  const blockTime = CashGroup.getTimeReference(getNowSeconds());
  const system = new MockSystem();
  System.overrideSystem(system);
  afterAll(() => system.destroy());

  const baseBalanceHistory: BalanceHistory = {
    id: 'xxx',
    blockNumber: 0,
    blockTime: new Date((blockTime - 45 * SECONDS_IN_DAY) * 1000),
    transactionHash: 'xxx',
    currencyId: 2,
    tradeType: '',
    assetCashBalanceBefore: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
    assetCashBalanceAfter: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
    assetCashValueUnderlyingBefore: TypedBigNumber.from(0, BigNumberType.InternalUnderlying, 'DAI'),
    assetCashValueUnderlyingAfter: TypedBigNumber.from(0, BigNumberType.InternalUnderlying, 'DAI'),
    nTokenBalanceBefore: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
    nTokenBalanceAfter: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
    nTokenValueUnderlyingBefore: TypedBigNumber.from(0, BigNumberType.InternalUnderlying, 'DAI'),
    nTokenValueUnderlyingAfter: TypedBigNumber.from(0, BigNumberType.InternalUnderlying, 'DAI'),
    nTokenValueAssetBefore: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
    nTokenValueAssetAfter: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
    totalUnderlyingValueChange: TypedBigNumber.from(0, BigNumberType.InternalUnderlying, 'DAI'),
  };

  it('it returns cToken yield', () => {
    const cTokenBalance = { ...baseBalanceHistory };
    cTokenBalance.assetCashBalanceAfter = TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenBalance.assetCashValueUnderlyingAfter = TypedBigNumber.from(95e8, BigNumberType.InternalUnderlying, 'DAI');
    const tradeHistory = [cTokenBalance];
    const currentTime = blockTime + 45 * SECONDS_IN_DAY;
    const data = new MockAccountData(
      0,
      false,
      true,
      0,
      [
        {
          currencyId: 2,
          cashBalance: TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI'),
          nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
          lastClaimTime: BigNumber.from(0),
          accountIncentiveDebt: BigNumber.from(0),
        },
      ],
      [],
      false,
      {
        trades: [],
        balanceHistory: tradeHistory,
        sNOTEHistory: {} as StakedNoteHistory,
      }
    );

    const summary = BalanceSummary.build(data, currentTime);
    expect(summary).toHaveLength(1);
    expect(summary[0].assetCashBalance.toString()).toEqual(BigNumber.from(5000e8).toString());
    expect(summary[0].assetCashValueUnderlying.toString()).toEqual(BigNumber.from(100e8).toString());
    expect(summary[0].cTokenYield).toBeCloseTo(0.23);
  });

  it('it returns nToken total yield', () => {
    const nTokenBalance = { ...baseBalanceHistory };
    nTokenBalance.nTokenBalanceAfter = TypedBigNumber.from(1000e8, BigNumberType.nToken, 'nDAI');
    nTokenBalance.nTokenValueUnderlyingAfter = TypedBigNumber.from(9e8, BigNumberType.InternalUnderlying, 'DAI');
    nTokenBalance.nTokenValueAssetAfter = TypedBigNumber.from(459e8, BigNumberType.InternalAsset, 'cDAI');
    const tradeHistory = [nTokenBalance];

    const data = new MockAccountData(
      0,
      false,
      true,
      0,
      [
        {
          currencyId: 2,
          cashBalance: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
          nTokenBalance: TypedBigNumber.from(1000e8, BigNumberType.nToken, 'nDAI'),
          lastClaimTime: BigNumber.from(0),
          accountIncentiveDebt: BigNumber.from(0),
        },
      ],
      [],
      false,
      {
        trades: [],
        balanceHistory: tradeHistory,
        sNOTEHistory: {} as StakedNoteHistory,
      }
    );

    const currentTime = blockTime + 45 * SECONDS_IN_DAY;
    const summary = BalanceSummary.build(data, currentTime);
    expect(summary).toHaveLength(1);
    expect(summary[0].nTokenBalance!.toString()).toEqual(BigNumber.from(1000e8).toString());
    expect(summary[0].nTokenValueUnderlying!.toNumber()).toEqual(1989503177);
    expect(summary[0].nTokenYield).toBeCloseTo(22.02, -2);
    expect(summary[0].nTokenTotalYield).toBeCloseTo(22.95, -2);
  });

  it('it resets values on a zero cash flow', () => {
    const cTokenPrevious1 = { ...baseBalanceHistory };
    cTokenPrevious1.blockTime = new Date((blockTime - 200 * SECONDS_IN_DAY) * 1000);
    cTokenPrevious1.assetCashBalanceAfter = TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenPrevious1.assetCashValueUnderlyingAfter = TypedBigNumber.from(95e8, BigNumberType.InternalUnderlying, 'DAI');

    const cTokenPrevious2 = { ...baseBalanceHistory };
    cTokenPrevious2.blockTime = new Date((blockTime - 100 * SECONDS_IN_DAY) * 1000);
    cTokenPrevious2.assetCashBalanceBefore = TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenPrevious2.assetCashBalanceAfter = TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI');
    cTokenPrevious2.assetCashValueUnderlyingBefore = TypedBigNumber.from(95e8, BigNumberType.InternalUnderlying, 'DAI');
    cTokenPrevious2.assetCashValueUnderlyingAfter = TypedBigNumber.from(0, BigNumberType.InternalUnderlying, 'DAI');

    const cTokenBalance = { ...baseBalanceHistory };
    cTokenBalance.assetCashBalanceAfter = TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenBalance.assetCashValueUnderlyingAfter = TypedBigNumber.from(95e8, BigNumberType.InternalUnderlying, 'DAI');
    const tradeHistory = [cTokenPrevious1, cTokenPrevious2, cTokenBalance];
    const currentTime = blockTime + 45 * SECONDS_IN_DAY;
    const data = new MockAccountData(
      0,
      false,
      true,
      0,
      [
        {
          currencyId: 2,
          cashBalance: TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI'),
          nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
          lastClaimTime: BigNumber.from(0),
          accountIncentiveDebt: BigNumber.from(0),
        },
      ],
      [],
      false,
      {
        trades: [],
        balanceHistory: tradeHistory,
        sNOTEHistory: {} as StakedNoteHistory,
      }
    );
    const summary = BalanceSummary.build(data, currentTime);
    expect(summary).toHaveLength(1);
    expect(summary[0].assetCashBalance.toString()).toEqual(BigNumber.from(5000e8).toString());
    expect(summary[0].assetCashValueUnderlying.toString()).toEqual(BigNumber.from(100e8).toString());
    expect(summary[0].cTokenYield).toBeCloseTo(0.23);
  });

  it('it returns the entire balance to withdraw if there is no debt', () => {
    const cTokenBalance = { ...baseBalanceHistory };
    cTokenBalance.assetCashBalanceAfter = TypedBigNumber.from(1000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenBalance.assetCashValueUnderlyingAfter = TypedBigNumber.from(20e8, BigNumberType.InternalUnderlying, 'DAI');
    const tradeHistory = [cTokenBalance];

    const data = new MockAccountData(
      0,
      false,
      false,
      0,
      [
        {
          currencyId: 2,
          cashBalance: TypedBigNumber.from(1000e8, BigNumberType.InternalAsset, 'cDAI'),
          nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
          lastClaimTime: BigNumber.from(0),
          accountIncentiveDebt: BigNumber.from(0),
        },
      ],
      [],
      false,
      {
        trades: [],
        balanceHistory: tradeHistory,
        sNOTEHistory: {} as StakedNoteHistory,
      }
    );
    const currentTime = blockTime + 45 * SECONDS_IN_DAY;

    const summary = BalanceSummary.build(data, currentTime)[0];
    expect(summary.isWithdrawable).toBeTruthy();
    expect(summary.maxWithdrawValueAssetCash.toExactString()).toEqual('1000.0');
  });

  it('it returns the prorata balance to withdraw if there is debt', () => {
    const cTokenBalance = { ...baseBalanceHistory };
    cTokenBalance.assetCashBalanceAfter = TypedBigNumber.from(-1000e8, BigNumberType.InternalAsset, 'cETH');
    cTokenBalance.assetCashValueUnderlyingAfter = TypedBigNumber.from(-20e8, BigNumberType.InternalUnderlying, 'ETH');
    cTokenBalance.nTokenBalanceAfter = TypedBigNumber.from(5000e8, BigNumberType.nToken, 'nETH');
    cTokenBalance.nTokenValueAssetAfter = TypedBigNumber.from(2500e8, BigNumberType.InternalAsset, 'cETH');
    cTokenBalance.nTokenValueUnderlyingAfter = TypedBigNumber.from(50e8, BigNumberType.InternalUnderlying, 'ETH');
    const tradeHistory = [cTokenBalance];
    const data = new MockAccountData(
      0,
      true,
      false,
      0,
      [
        {
          currencyId: 1,
          cashBalance: TypedBigNumber.from(-2500e8, BigNumberType.InternalAsset, 'cETH'),
          nTokenBalance: TypedBigNumber.from(5000e8, BigNumberType.nToken, 'nETH'),
          lastClaimTime: BigNumber.from(0),
          accountIncentiveDebt: BigNumber.from(0),
        },
      ],
      [],
      false,
      {
        trades: [],
        balanceHistory: tradeHistory,
        sNOTEHistory: {} as StakedNoteHistory,
      }
    );
    const currentTime = blockTime + 45 * SECONDS_IN_DAY;

    const summary = BalanceSummary.build(data, currentTime)[0];
    expect(summary.isWithdrawable).toBeTruthy();
    // ntoken pv == 5000, haircut value is: 4500, free collateral is 2000 <= this is what can be withdrawn
    expect(summary.maxWithdrawValueAssetCash.toExactString()).toEqual('2000.0');
  });
});
