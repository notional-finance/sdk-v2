import {BigNumber, ethers} from 'ethers';
import CashGroup from '../../src/system/CashGroup';
import {BalanceHistory} from '../../src/libs/types';
import {getNowSeconds} from '../../src/libs/utils';
import {BalanceSummary} from '../../src/account';
import {Notional as NotionalTypechain} from '../../src/typechain/Notional';
import {SECONDS_IN_DAY} from '../../src/config/constants';
import GraphClient from '../../src/GraphClient';
import MockSystem, {systemQueryResult} from '../mocks/MockSystem';
import MockAccountData from './AccountData.test';
import TypedBigNumber, {BigNumberType} from '../../src/libs/TypedBigNumber';
import {System} from '../../src/system';

describe('Balance Summary', () => {
  const blockTime = CashGroup.getTimeReference(getNowSeconds());
  const provider = new ethers.providers.JsonRpcBatchProvider('http://localhost:8545');
  const system = new MockSystem(
    systemQueryResult,
    ({} as unknown) as GraphClient,
    ({} as unknown) as NotionalTypechain,
    provider,
  );
  System.overrideSystem(system);

  const baseBalanceHistory: BalanceHistory = {
    id: 'xxx',
    blockNumber: 0,
    blockTime: new Date((blockTime - 45 * SECONDS_IN_DAY) * 1000),
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
    const cTokenBalance = {...baseBalanceHistory};
    cTokenBalance.assetCashBalanceAfter = TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenBalance.assetCashValueUnderlyingAfter = TypedBigNumber.from(
      95e8,
      BigNumberType.InternalUnderlying,
      'DAI',
    );
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
          lastClaimIntegralSupply: BigNumber.from(0),
        },
      ],
      [],
      false,
    );

    const summary = BalanceSummary.build(data, tradeHistory, currentTime);
    expect(summary).toHaveLength(1);
    expect(summary[0].assetCashBalance.toString()).toEqual(BigNumber.from(5000e8).toString());
    expect(summary[0].assetCashValueUnderlying.toString()).toEqual(BigNumber.from(100e8).toString());
    expect(summary[0].cTokenYield).toBeCloseTo(0.23);
  });

  it('it returns nToken total yield', () => {
    const nTokenBalance = {...baseBalanceHistory};
    nTokenBalance.nTokenBalanceAfter = TypedBigNumber.from(1000e8, BigNumberType.nToken, 'nDAI');
    nTokenBalance.nTokenValueUnderlyingAfter = TypedBigNumber.from(
      9e8,
      BigNumberType.InternalUnderlying,
      'DAI',
    );
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
          lastClaimIntegralSupply: BigNumber.from(0),
        },
      ],
      [],
      false,
    );

    const currentTime = blockTime + 45 * SECONDS_IN_DAY;
    const summary = BalanceSummary.build(data, tradeHistory, currentTime);
    expect(summary).toHaveLength(1);
    expect(summary[0].nTokenBalance!.toString()).toEqual(BigNumber.from(1000e8).toString());
    expect(summary[0].nTokenValueUnderlying!.toString()).toEqual(BigNumber.from(10e8).toString());
    expect(summary[0].nTokenYield).toBeCloseTo(0.41);
    expect(summary[0].nTokenTotalYield).toBeCloseTo(0.53);
  });

  it('it resets values on a zero cash flow', () => {
    const cTokenPrevious1 = {...baseBalanceHistory};
    cTokenPrevious1.blockTime = new Date((blockTime - 200 * SECONDS_IN_DAY) * 1000);
    cTokenPrevious1.assetCashBalanceAfter = TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenPrevious1.assetCashValueUnderlyingAfter = TypedBigNumber.from(
      95e8,
      BigNumberType.InternalUnderlying,
      'DAI',
    );

    const cTokenPrevious2 = {...baseBalanceHistory};
    cTokenPrevious2.blockTime = new Date((blockTime - 100 * SECONDS_IN_DAY) * 1000);
    cTokenPrevious2.assetCashBalanceBefore = TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenPrevious2.assetCashBalanceAfter = TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI');
    cTokenPrevious2.assetCashValueUnderlyingBefore = TypedBigNumber.from(
      95e8,
      BigNumberType.InternalUnderlying,
      'DAI',
    );
    cTokenPrevious2.assetCashValueUnderlyingAfter = TypedBigNumber.from(
      0,
      BigNumberType.InternalUnderlying,
      'DAI',
    );

    const cTokenBalance = {...baseBalanceHistory};
    cTokenBalance.assetCashBalanceAfter = TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenBalance.assetCashValueUnderlyingAfter = TypedBigNumber.from(
      95e8,
      BigNumberType.InternalUnderlying,
      'DAI',
    );
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
          lastClaimIntegralSupply: BigNumber.from(0),
        },
      ],
      [],
      false,
    );
    const summary = BalanceSummary.build(data, tradeHistory, currentTime);
    expect(summary).toHaveLength(1);
    expect(summary[0].assetCashBalance.toString()).toEqual(BigNumber.from(5000e8).toString());
    expect(summary[0].assetCashValueUnderlying.toString()).toEqual(BigNumber.from(100e8).toString());
    expect(summary[0].cTokenYield).toBeCloseTo(0.23);
  });

  it('it returns the entire balance to withdraw if there is no debt', () => {
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
          lastClaimIntegralSupply: BigNumber.from(0),
        },
      ],
      [],
      false,
    );
    const cTokenBalance = {...baseBalanceHistory};
    cTokenBalance.assetCashBalanceAfter = TypedBigNumber.from(1000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenBalance.assetCashValueUnderlyingAfter = TypedBigNumber.from(
      20e8,
      BigNumberType.InternalUnderlying,
      'DAI',
    );
    const tradeHistory = [cTokenBalance];
    const currentTime = blockTime + 45 * SECONDS_IN_DAY;

    const summary = BalanceSummary.build(data, tradeHistory, currentTime)[0];
    expect(summary.isWithdrawable).toBeTruthy();
    expect(summary.maxWithdrawValueAssetCash.toExactString()).toEqual('1000.0');
  });

  it('it returns the prorata balance to withdraw if there is debt', () => {
    const data = new MockAccountData(
      0,
      true,
      false,
      0,
      [
        {
          currencyId: 2,
          cashBalance: TypedBigNumber.from(-1000e8, BigNumberType.InternalAsset, 'cDAI'),
          nTokenBalance: TypedBigNumber.from(5000e8, BigNumberType.nToken, 'nDAI'),
          lastClaimTime: BigNumber.from(0),
          lastClaimIntegralSupply: BigNumber.from(0),
        },
      ],
      [],
      false,
    );
    const cTokenBalance = {...baseBalanceHistory};
    cTokenBalance.assetCashBalanceAfter = TypedBigNumber.from(-1000e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenBalance.assetCashValueUnderlyingAfter = TypedBigNumber.from(
      -20e8,
      BigNumberType.InternalUnderlying,
      'DAI',
    );
    cTokenBalance.nTokenBalanceAfter = TypedBigNumber.from(5000e8, BigNumberType.nToken, 'nDAI');
    cTokenBalance.nTokenValueAssetAfter = TypedBigNumber.from(2500e8, BigNumberType.InternalAsset, 'cDAI');
    cTokenBalance.nTokenValueUnderlyingAfter = TypedBigNumber.from(50e8, BigNumberType.InternalUnderlying, 'DAI');
    const tradeHistory = [cTokenBalance];
    const currentTime = blockTime + 45 * SECONDS_IN_DAY;

    const summary = BalanceSummary.build(data, tradeHistory, currentTime)[0];
    expect(summary.isWithdrawable).toBeTruthy();
    // ntoken value == 2500, haircut value is: 2250, net asset value is 1250
    expect(summary.maxWithdrawValueAssetCash.toExactString()).toEqual('1250.0');
  });
});
