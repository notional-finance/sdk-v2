import {BigNumber, ethers} from 'ethers';
import CashGroup from '../../src/system/CashGroup';
import {AssetType, TradeType} from '../../src/libs/types';
import {AssetSummary} from '../../src/account';
import {Notional as NotionalTypechain} from '../../src/typechain/Notional';
import {SECONDS_IN_DAY, SECONDS_IN_QUARTER} from '../../src/config/constants';
import GraphClient from '../../src/GraphClient';
import MockSystem, {systemQueryResult} from './MockSystem';
import MockAccountData from './AccountData.test';
import TypedBigNumber, {BigNumberType} from '../../src/libs/TypedBigNumber';
import {System} from '../../src/system';

describe('Asset Summary', () => {
  const blockTime = CashGroup.getTimeReference(1621857396);
  const maturity = CashGroup.getMaturityForMarketIndex(1, blockTime);
  const provider = new ethers.providers.JsonRpcBatchProvider('http://localhost:8545');
  const system = new MockSystem(
    systemQueryResult,
    ({} as unknown) as GraphClient,
    ({} as unknown) as NotionalTypechain,
    provider,
  );
  System.overrideSystem((system as unknown) as System);

  const baseTradeHistory = {
    id: 'xxx',
    blockNumber: 0,
    blockTime: new Date((blockTime + 1 * SECONDS_IN_DAY) * 1000),
    transactionHash: '0x0',
    currencyId: 2,
    tradeType: TradeType.Lend,
    maturity: BigNumber.from(maturity),
    settlementDate: BigNumber.from(maturity),
    maturityLength: SECONDS_IN_QUARTER,
    netAssetCash: TypedBigNumber.from(-4750e8, BigNumberType.InternalAsset, 'cDAI'),
    netUnderlyingCash: TypedBigNumber.from(-95e8, BigNumberType.InternalUnderlying, 'DAI'),
    netfCash: TypedBigNumber.from(100e8, BigNumberType.InternalUnderlying, 'DAI'),
    netLiquidityTokens: null,
  };

  it('produces irr for a lend fcash asset', () => {
    const tradeHistory = [baseTradeHistory];
    const currentTime = blockTime + 45 * SECONDS_IN_DAY;
    const accountData = new MockAccountData(
      0,
      false,
      true,
      undefined,
      [],
      [
        {
          currencyId: 2,
          maturity,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(100e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: maturity,
          isIdiosyncratic: false,
        },
      ],
      false,
    );

    const summary = AssetSummary.build(accountData, tradeHistory, currentTime);
    expect(summary).toHaveLength(1);
    expect(summary[0].history).toHaveLength(1);
    expect(summary[0].fCash).toBeDefined();
    expect(summary[0].fCashValue.toString()).toEqual(BigNumber.from(100e8).toString());
    const pnl = summary[0].underlyingInternalPV.n.add(BigNumber.from(-95e8));
    expect(summary[0].underlyingInternalProfitLoss.toNumber()).toEqual(pnl.toNumber());
    expect(summary[0].irr).toBeCloseTo(0.4279, -1);
  });

  it('produces irr for a borrow fcash asset', () => {
    const borrowTradeHistory = {...baseTradeHistory};
    borrowTradeHistory.netUnderlyingCash = borrowTradeHistory.netUnderlyingCash.neg();
    borrowTradeHistory.netfCash = borrowTradeHistory.netfCash.neg();
    const accountData = new MockAccountData(
      0,
      false,
      true,
      undefined,
      [],
      [
        {
          currencyId: 2,
          maturity,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: maturity,
          isIdiosyncratic: false,
        },
      ],
      false,
    );

    const tradeHistory = [borrowTradeHistory];
    const currentTime = blockTime + 45 * SECONDS_IN_DAY;
    const summary = AssetSummary.build(accountData, tradeHistory, currentTime);
    expect(summary).toHaveLength(1);
    expect(summary[0].history).toHaveLength(1);
    expect(summary[0].fCash).toBeDefined();
    expect(summary[0].fCashValue.toString()).toEqual(BigNumber.from(-100e8).toString());
    const pnl = summary[0].underlyingInternalPV.n.add(BigNumber.from(95e8));
    expect(summary[0].underlyingInternalProfitLoss.toNumber()).toEqual(pnl.toNumber());
    expect(summary[0].irr).toBeCloseTo(0.4279, -1);
  });
});
