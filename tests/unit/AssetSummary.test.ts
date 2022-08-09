import { BigNumber } from 'ethers';
import { AssetType, TradeType } from '../../src/libs/types';
import { AssetSummary } from '../../src/account';
import { SECONDS_IN_DAY, SECONDS_IN_QUARTER } from '../../src/config/constants';
import MockSystem from '../mocks/MockSystem';
import TypedBigNumber, { BigNumberType } from '../../src/libs/TypedBigNumber';
import { System, CashGroup } from '../../src/system';
import MockAccountData from '../mocks/MockAccountData';
import { getNowSeconds } from '../../src/libs/utils';

describe('Asset Summary', () => {
  const blockTime = CashGroup.getTimeReference(getNowSeconds());
  const maturity = CashGroup.getMaturityForMarketIndex(1, blockTime);
  const system = new MockSystem();
  System.overrideSystem(system);
  afterAll(() => system.destroy());

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
    tradedInterestRate: 0,
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
          settlementDate: maturity,
        },
      ],
      false,
      {
        trades: tradeHistory,
        balanceHistory: [],
      }
    );

    const summary = AssetSummary.build(accountData, currentTime);
    expect(summary).toHaveLength(1);
    expect(summary[0].history).toHaveLength(1);
    expect(summary[0].fCash).toBeDefined();
    expect(summary[0].fCashValue.toString()).toEqual(BigNumber.from(100e8).toString());
    const pnl = summary[0].underlyingInternalPV.n.add(BigNumber.from(-95e8));
    expect(summary[0].underlyingInternalProfitLoss.toNumber()).toEqual(pnl.toNumber());
    expect(summary[0].irr).toBeCloseTo(0.4279, -1);
  });

  it('produces irr for a borrow fcash asset', () => {
    const borrowTradeHistory = { ...baseTradeHistory };
    borrowTradeHistory.netUnderlyingCash = borrowTradeHistory.netUnderlyingCash.neg();
    borrowTradeHistory.netfCash = borrowTradeHistory.netfCash.neg();
    const tradeHistory = [borrowTradeHistory];
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
          settlementDate: maturity,
        },
      ],
      false,
      {
        trades: tradeHistory,
        balanceHistory: [],
      }
    );

    const currentTime = blockTime + 45 * SECONDS_IN_DAY;
    const summary = AssetSummary.build(accountData, currentTime);
    expect(summary).toHaveLength(1);
    expect(summary[0].history).toHaveLength(1);
    expect(summary[0].fCash).toBeDefined();
    expect(summary[0].fCashValue.toString()).toEqual(BigNumber.from(-100e8).toString());
    const pnl = summary[0].underlyingInternalPV.n.add(BigNumber.from(95e8));
    expect(summary[0].underlyingInternalProfitLoss.toNumber()).toEqual(pnl.toNumber());
    expect(summary[0].irr).toBeCloseTo(0.4279, -1);
  });
});
