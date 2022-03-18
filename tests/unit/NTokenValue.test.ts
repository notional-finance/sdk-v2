import {BigNumber, ethers} from 'ethers';
import {getNowSeconds} from '../../src/libs/utils';
import {
  NOTE_CURRENCY_ID, RATE_PRECISION, SECONDS_IN_QUARTER, SECONDS_IN_YEAR,
} from '../../src/config/constants';
import {
  System, NTokenValue, CashGroup, Market,
} from '../../src/system';
import MockSystem from '../mocks/MockSystem';
import TypedBigNumber, {BigNumberType} from '../../src/libs/TypedBigNumber';
import {AssetType} from '../../src/libs/types';
import NoteETHRateProvider from '../../src/system/NoteETHRateProvider';

describe('nToken value', () => {
  const system = new MockSystem();
  System.overrideSystem(system);
  afterAll(() => { system.destroy(); });
  const blockTime = CashGroup.getTimeReference(getNowSeconds());
  const tRef = CashGroup.getTimeReference(getNowSeconds());

  beforeAll(async () => {
    system.dataSource.refreshData();
    const cashGroup = system.getCashGroup(2);
    system.setMarketProvider(cashGroup.markets[0].marketKey, {
      getMarket: () => {
        const override = cashGroup.markets[0];
        override.setMarket({
          totalAssetCash: BigNumber.from(5_000_000e8),
          totalLiquidity: BigNumber.from(100_000e8),
          totalfCash: BigNumber.from(100_000e8),
          previousTradeTime: BigNumber.from(0),
          lastImpliedRate: BigNumber.from(0.04e9),
          oracleRate: BigNumber.from(0.04e9),
        });
        return override;
      },
    });
    system.setMarketProvider(cashGroup.markets[1].marketKey, {
      getMarket: () => {
        const override = cashGroup.markets[1];
        override.setMarket({
          totalAssetCash: BigNumber.from(5_000_000e8),
          totalLiquidity: BigNumber.from(150_000e8),
          totalfCash: BigNumber.from(100_000e8),
          previousTradeTime: BigNumber.from(0),
          lastImpliedRate: BigNumber.from(0.04e9),
          oracleRate: BigNumber.from(0.04e9),
        });
        return override;
      },
    });
    (system as MockSystem).setNTokenPortfolio(
      2,
      TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI'),
      TypedBigNumber.from(1862606860875000, BigNumberType.InternalAsset, 'cDAI'),
      TypedBigNumber.from(1_000_000e8, BigNumberType.nToken, 'nDAI'),
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
          notional: TypedBigNumber.from(-10000e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: tRef + SECONDS_IN_QUARTER,
          isIdiosyncratic: false,
        },
        {
          currencyId: 2,
          maturity: tRef + SECONDS_IN_QUARTER * 2,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-15000e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: tRef + SECONDS_IN_QUARTER * 2,
          isIdiosyncratic: false,
        },
      ],
    );

    const usdcCashGroup = system.getCashGroup(3);
    usdcCashGroup.maxMarketIndex = 3;
    system.setMarketProvider(usdcCashGroup.markets[0].marketKey, {
      getMarket: () => {
        const override = usdcCashGroup.markets[0];
        override.setMarket({
          totalAssetCash: BigNumber.from(5_000_000e8),
          totalLiquidity: BigNumber.from(100_000e8),
          totalfCash: BigNumber.from(100_000e8),
          previousTradeTime: BigNumber.from(0),
          lastImpliedRate: BigNumber.from(0.04e9),
          oracleRate: BigNumber.from(0.04e9),
        });
        return override;
      },
    });
    system.setMarketProvider(usdcCashGroup.markets[1].marketKey, {
      getMarket: () => {
        const override = usdcCashGroup.markets[1];
        override.setMarket({
          totalAssetCash: BigNumber.from(5_000_000e8),
          totalLiquidity: BigNumber.from(150_000e8),
          totalfCash: BigNumber.from(100_000e8),
          previousTradeTime: BigNumber.from(0),
          lastImpliedRate: BigNumber.from(0.04e9),
          oracleRate: BigNumber.from(0.04e9),
        });
        return override;
      },
    });

    usdcCashGroup.markets.push(new Market(
      3,
      3,
      CashGroup.getMaturityForMarketIndex(3, tRef),
      usdcCashGroup.rateScalars[1],
      usdcCashGroup.totalFeeBasisPoints,
      usdcCashGroup.reserveFeeSharePercent,
      usdcCashGroup.rateOracleTimeWindowSeconds,
      'cUSDC',
      'USDC',
    ));
    system.setMarketProvider(usdcCashGroup.markets[2].marketKey, {
      getMarket: () => {
        const override = usdcCashGroup.markets[2];
        override.setMarket({
          totalAssetCash: BigNumber.from(5_000_000e8),
          totalLiquidity: BigNumber.from(150_000e8),
          totalfCash: BigNumber.from(100_000e8),
          previousTradeTime: BigNumber.from(0),
          lastImpliedRate: BigNumber.from(0.04e9),
          oracleRate: BigNumber.from(0.04e9),
        });
        return override;
      },
    });
    (system as MockSystem).setCashGroup(3, usdcCashGroup);
    (system as MockSystem).setNTokenPortfolio(
      3,
      TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cUSDC'),
      TypedBigNumber.from(1862606860875000, BigNumberType.InternalAsset, 'cUSDC'),
      TypedBigNumber.from(1_000_000e8, BigNumberType.nToken, 'nUSDC'),
      [
        {
          currencyId: 3,
          maturity: tRef + SECONDS_IN_QUARTER,
          assetType: AssetType.LiquidityToken_3Month,
          notional: TypedBigNumber.from(100_000e8, BigNumberType.InternalUnderlying, 'USDC'),
          hasMatured: false,
          settlementDate: CashGroup.getSettlementDate(AssetType.LiquidityToken_6Month, tRef + SECONDS_IN_QUARTER),
          isIdiosyncratic: false,
        },
        {
          currencyId: 3,
          maturity: tRef + SECONDS_IN_QUARTER * 2,
          assetType: AssetType.LiquidityToken_6Month,
          notional: TypedBigNumber.from(150_000e8, BigNumberType.InternalUnderlying, 'USDC'),
          hasMatured: false,
          settlementDate: CashGroup.getSettlementDate(AssetType.LiquidityToken_6Month, tRef + SECONDS_IN_QUARTER * 2),
          isIdiosyncratic: false,
        },
      ],
      [
        {
          currencyId: 3,
          maturity: tRef + SECONDS_IN_QUARTER,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-10000e8, BigNumberType.InternalUnderlying, 'USDC'),
          hasMatured: false,
          settlementDate: tRef + SECONDS_IN_QUARTER,
          isIdiosyncratic: false,
        },
        {
          currencyId: 3,
          maturity: tRef + SECONDS_IN_QUARTER * 2,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-15000e8, BigNumberType.InternalUnderlying, 'USDC'),
          hasMatured: false,
          settlementDate: tRef + SECONDS_IN_QUARTER * 2,
          isIdiosyncratic: false,
        },
        {
          currencyId: 3,
          maturity: tRef + SECONDS_IN_QUARTER * 3,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-15000e8, BigNumberType.InternalUnderlying, 'USDC'),
          hasMatured: false,
          settlementDate: tRef + SECONDS_IN_QUARTER * 2,
          isIdiosyncratic: false,
        },
        {
          currencyId: 3,
          maturity: tRef + SECONDS_IN_QUARTER * 4,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-15000e8, BigNumberType.InternalUnderlying, 'USDC'),
          hasMatured: false,
          settlementDate: tRef + SECONDS_IN_QUARTER * 2,
          isIdiosyncratic: false,
        },
      ],
    );
  });

  it('converts ntokens to ntoken value', () => {
    const nTokenValue = NTokenValue.convertNTokenToInternalAsset(
      1,
      TypedBigNumber.from(100e8, BigNumberType.nToken, 'nETH'),
      false,
    );
    const nTokenValueHaircut = NTokenValue.convertNTokenToInternalAsset(
      1,
      TypedBigNumber.from(100e8, BigNumberType.nToken, 'nETH'),
      true,
    );
    expect(nTokenValue.toString()).toEqual(BigNumber.from(50e8).toString());
    expect(nTokenValueHaircut.toString()).toEqual(BigNumber.from(42.5e8).toString());
  });

  it('gets ntokens to mint', () => {
    const nTokensToMint = NTokenValue.getNTokensToMint(
      1,
      TypedBigNumber.from(100e8, BigNumberType.InternalAsset, 'cETH'),
    );
    expect(nTokensToMint.toString()).toEqual(BigNumber.from(200e8).toString());
  });

  it('gets claimable incentives when account requires migration', () => {
    const currentTime = getNowSeconds();
    system.setIncentiveMigration(3, {
      migrationTime: currentTime,
      integralTotalSupply: ethers.constants.WeiPerEther.mul(SECONDS_IN_YEAR),
      emissionRate: BigNumber.from('10000000000000'), // 100k NOTE per year
    });

    const incentives = NTokenValue.getClaimableIncentives(
      3,
      TypedBigNumber.from(100_000e8, BigNumberType.nToken, 'nUSDC'),
      currentTime - SECONDS_IN_YEAR,
      BigNumber.from(ethers.constants.WeiPerEther),
    );

    // Accumulate 1 NOTE under old calculation, accumulate 100k note under new calculation
    expect(incentives.toNumber()).toBeCloseTo(1e8 + 100_000e8, -1);
  });

  it('gets claimable incentives when account has migrated', () => {
    const incentives = NTokenValue.getClaimableIncentives(
      3,
      TypedBigNumber.from(1e8, BigNumberType.nToken, 'nUSDC'),
      0, // this means we've migrated
      BigNumber.from(0.5e8),
    );

    // Accumulate 1 NOTE per nToken, with 0.5 NOTE incentive debt
    expect(incentives.toString()).toBe(BigNumber.from(0.5e8).toString());
  });

  it('gets smaller redeem ntoken values (no ifCash)', () => {
    // InterestRateRisk.getNTokenSimulatedValue(TypedBigNumber.fromBalance(100, 'nDAI', true), undefined, blockTime)
    const assetCash = TypedBigNumber.from(100e8, BigNumberType.InternalAsset, 'cDAI');
    const nTokenRedeem = NTokenValue.getNTokenRedeemFromAsset(2, assetCash, blockTime);
    const assetFromRedeem = NTokenValue.getAssetFromRedeemNToken(2, nTokenRedeem, blockTime);
    expect(assetCash.n.toNumber()).toBeCloseTo(assetFromRedeem.n.toNumber(), -3);
  });

  it('gets larger redeem ntoken values (no ifCash)', () => {
    const assetCash = TypedBigNumber.from(500_000e8, BigNumberType.InternalAsset, 'cDAI');
    const nTokenRedeem = NTokenValue.getNTokenRedeemFromAsset(2, assetCash);
    const assetFromRedeem = NTokenValue.getAssetFromRedeemNToken(2, nTokenRedeem);
    expect(assetCash.n.toNumber()).toBeCloseTo(assetFromRedeem.n.toNumber(), -5);
  });

  it('gets larger redeem ntoken values (ifCash)', () => {
    const assetCash = TypedBigNumber.from(500_000e8, BigNumberType.InternalAsset, 'cUSDC');
    const nTokenRedeem = NTokenValue.getNTokenRedeemFromAsset(3, assetCash);
    const assetFromRedeem = NTokenValue.getAssetFromRedeemNToken(3, nTokenRedeem);
    expect(assetCash.n.toNumber()).toBeCloseTo(assetFromRedeem.n.toNumber(), -5);
  });

  it('calculates the nToken blended yield', () => {
    const blendedYield = NTokenValue.getNTokenBlendedYield(2);
    // Supply rate is 5% and fCash is yielding 4%
    expect(blendedYield / RATE_PRECISION).toBeCloseTo(0.045);
  });

  it('calculates the nToken incentive yield', () => {
    system.setETHRateProvider(
      NOTE_CURRENCY_ID,
      new NoteETHRateProvider(BigNumber.from(175).mul(ethers.constants.WeiPerEther).div(100)),
    );
    const incentiveYield = NTokenValue.getNTokenIncentiveYield(2);
    // Underlying PV is 372,528e8, token value is 175,000e8 per annum
    // Incentive rate should be ~87.5%
    expect(incentiveYield / RATE_PRECISION).toBeCloseTo(0.469);
  });
});
