import {BigNumber, ethers} from 'ethers';
import {getNowSeconds} from '../../src/libs/utils';
import {RATE_PRECISION, SECONDS_IN_QUARTER, SECONDS_IN_YEAR} from '../../src/config/constants';
import GraphClient from '../../src/GraphClient';
import {System, NTokenValue, CashGroup} from '../../src/system';
import MockSystem, {systemQueryResult} from '../mocks/MockSystem';
import TypedBigNumber, {BigNumberType} from '../../src/libs/TypedBigNumber';
import {AssetType} from '../../src/libs/types';
import MockNotionalProxy from '../mocks/MockNotionalProxy';

describe('nToken value', () => {
  let system: System;

  beforeEach(() => {
    // This provider is not used, it's just a dummy
    const provider = new ethers.providers.JsonRpcBatchProvider('http://localhost:8545');
    system = new MockSystem(
      systemQueryResult,
      ({} as unknown) as GraphClient,
      MockNotionalProxy,
      provider,
    );
    System.overrideSystem(system);
    const tRef = CashGroup.getTimeReference(getNowSeconds());
    const cashGroup = system.getCashGroup(2);
    cashGroup.markets[0].setMarket({
      totalAssetCash: BigNumber.from(5_000_000e8),
      totalLiquidity: BigNumber.from(100_000e8),
      totalfCash: BigNumber.from(100_000e8),
      previousTradeTime: BigNumber.from(0),
      lastImpliedRate: BigNumber.from(0.04e9),
      oracleRate: BigNumber.from(0.04e9),
    });
    cashGroup.markets[1].setMarket({
      totalAssetCash: BigNumber.from(5_000_000e8),
      totalLiquidity: BigNumber.from(150_000e8),
      totalfCash: BigNumber.from(100_000e8),
      previousTradeTime: BigNumber.from(0),
      lastImpliedRate: BigNumber.from(0.04e9),
      oracleRate: BigNumber.from(0.04e9),
    });

    (system as MockSystem).setNTokenPortfolio(
      2,
      TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI'),
      TypedBigNumber.from(10000000e8, BigNumberType.InternalAsset, 'cDAI'),
      TypedBigNumber.from(10000e8, BigNumberType.nToken, 'nDAI'),
      [
        {
          currencyId: 2,
          maturity: tRef + SECONDS_IN_QUARTER,
          assetType: AssetType.LiquidityToken_3Month,
          notional: TypedBigNumber.from(100_000e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: CashGroup.getSettlementDate(AssetType.LiquidityToken_6Month, tRef + SECONDS_IN_QUARTER),
          isIdiosyncratic: false,
        },
        {
          currencyId: 2,
          maturity: tRef + SECONDS_IN_QUARTER * 2,
          assetType: AssetType.LiquidityToken_6Month,
          notional: TypedBigNumber.from(150_000e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: CashGroup.getSettlementDate(AssetType.LiquidityToken_6Month, tRef + SECONDS_IN_QUARTER * 2),
          isIdiosyncratic: false,
        },
      ],
      [
        {
          currencyId: 2,
          maturity: tRef + SECONDS_IN_QUARTER,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: tRef + SECONDS_IN_QUARTER,
          isIdiosyncratic: false,
        },
        {
          currencyId: 2,
          maturity: tRef + SECONDS_IN_QUARTER * 2,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-150e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: tRef + SECONDS_IN_QUARTER * 2,
          isIdiosyncratic: false,
        },
      ],
    );
  });

  it('converts ntokens to ntoken value', () => {
    const nTokenValue = NTokenValue.convertNTokenToInternalAsset(
      3,
      TypedBigNumber.from(100e8, BigNumberType.nToken, 'nUSDC'),
      false,
    );
    const nTokenValueHaircut = NTokenValue.convertNTokenToInternalAsset(
      3,
      TypedBigNumber.from(100e8, BigNumberType.nToken, 'nUSDC'),
      true,
    );
    expect(nTokenValue.toString()).toEqual(BigNumber.from(50e8).toString());
    expect(nTokenValueHaircut.toString()).toEqual(BigNumber.from(45e8).toString());
  });

  it('gets ntokens to mint', () => {
    const nTokensToMint = NTokenValue.getNTokensToMint(
      3,
      TypedBigNumber.from(100e8, BigNumberType.InternalAsset, 'cUSDC'),
    );
    expect(nTokensToMint.toString()).toEqual(BigNumber.from(200e8).toString());
  });

  it('gets claimable incentives', () => {
    const blockTime = getNowSeconds();
    const incentives = NTokenValue.getClaimableIncentives(
      3,
      TypedBigNumber.from(2000e8, BigNumberType.nToken, 'nUSDC'),
      blockTime - SECONDS_IN_YEAR,
      BigNumber.from(ethers.constants.WeiPerEther),
      blockTime,
    );
    expect(incentives.toString()).toBe(BigNumber.from(0.01e8).toString());
  });

  it('gets redeem ntoken values', () => {
    const assetCash = TypedBigNumber.from(100e8, BigNumberType.InternalAsset, 'cDAI');
    const nTokenRedeem = NTokenValue.getNTokenRedeemFromAsset(2, assetCash);
    const assetFromRedeem = NTokenValue.getAssetFromRedeemNToken(2, nTokenRedeem);
    expect(assetCash.n.toNumber()).toBeCloseTo(assetFromRedeem.n.toNumber(), -4);
  });

  it('calculates the nToken blended yield', () => {
    const blendedYield = NTokenValue.getNTokenBlendedYield(2);
    // Supply rate is 5% and fCash is yielding 4%
    expect(blendedYield / RATE_PRECISION).toBeCloseTo(0.045);
  });
});
