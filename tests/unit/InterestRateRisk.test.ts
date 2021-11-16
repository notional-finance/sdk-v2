import {BigNumber} from 'ethers';
import {AssetType} from '../../src/libs/types';
import {getNowSeconds} from '../../src/libs/utils';
import {TypedBigNumber} from '../../src';
import {CashGroup, FreeCollateral, System} from '../../src/system';
import MockSystem from '../mocks/MockSystem';
import MockAccountData from '../mocks/MockAccountData';
import {INTERNAL_TOKEN_PRECISION, SECONDS_IN_QUARTER} from '../../src/config/constants';
import InterestRateRisk from '../../src/system/InterestRateRisk';

describe('calculates interest rate risk', () => {
  const system = new MockSystem();
  System.overrideSystem(system);
  afterAll(() => { system.destroy(); });
  const accountData = new MockAccountData(0, false, true, 0, [], [], false);
  const blockTime = CashGroup.getTimeReference(getNowSeconds());
  (system as MockSystem).setNTokenPortfolio(
    2,
    TypedBigNumber.fromBalance(5000e8, 'cDAI', true),
    // This PV is correctly calculated
    TypedBigNumber.fromBalance(6234606640000, 'cDAI', true),
    TypedBigNumber.fromBalance(10000e8, 'nDAI', true),
    [
      {
        currencyId: 2,
        maturity: blockTime + SECONDS_IN_QUARTER,
        assetType: AssetType.LiquidityToken_3Month,
        notional: TypedBigNumber.fromBalance(100_000e8, 'DAI', true),
        hasMatured: false,
        settlementDate: CashGroup.getSettlementDate(AssetType.LiquidityToken_6Month, blockTime + SECONDS_IN_QUARTER),
        isIdiosyncratic: false,
      },
      {
        currencyId: 2,
        maturity: blockTime + SECONDS_IN_QUARTER * 2,
        assetType: AssetType.LiquidityToken_6Month,
        notional: TypedBigNumber.fromBalance(150_000e8, 'DAI', true),
        hasMatured: false,
        settlementDate: CashGroup.getSettlementDate(AssetType.LiquidityToken_6Month,
          blockTime + SECONDS_IN_QUARTER * 2),
        isIdiosyncratic: false,
      },
    ],
    [
      {
        currencyId: 2,
        maturity: blockTime + SECONDS_IN_QUARTER,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(-4000e8, 'DAI', true),
        hasMatured: false,
        settlementDate: blockTime + SECONDS_IN_QUARTER,
        isIdiosyncratic: false,
      },
      {
        currencyId: 2,
        maturity: blockTime + SECONDS_IN_QUARTER * 2,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(-5000e8, 'DAI', true),
        hasMatured: false,
        settlementDate: blockTime + SECONDS_IN_QUARTER * 2,
        isIdiosyncratic: false,
      },
    ],
  );

  it('gets all the risky currencies', () => {
    const maturity = CashGroup.getMaturityForMarketIndex(1, blockTime);
    accountData.accountBalances = [
      // No leverage on ETH
      {
        currencyId: 1,
        cashBalance: TypedBigNumber.fromBalance(0, 'cETH', true),
        nTokenBalance: TypedBigNumber.fromBalance(100e8, 'nETH', true),
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      },
      // Leveraged nToken
      {
        currencyId: 2,
        cashBalance: TypedBigNumber.fromBalance(0, 'cDAI', true),
        nTokenBalance: TypedBigNumber.fromBalance(100e8, 'nDAI', true),
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      },
      // Cross Currency fCash on USDC
      {
        currencyId: 3,
        cashBalance: TypedBigNumber.fromBalance(0, 'cUSDC', true),
        nTokenBalance: TypedBigNumber.fromBalance(0, 'nUSDC', true),
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      },
      // Tether debt against cash
      {
        currencyId: 4,
        cashBalance: TypedBigNumber.fromBalance(50e8, 'cUSDT', true),
        nTokenBalance: TypedBigNumber.fromBalance(0, 'nUSDT', true),
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      },
    ];

    accountData.portfolio = [
      // DAI leverage on nToken
      {
        currencyId: 2,
        maturity,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(-100e8, 'DAI', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
      // USDC cross currency
      {
        currencyId: 3,
        maturity,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(-100e8, 'USDC', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
      {
        currencyId: 3,
        maturity: maturity + SECONDS_IN_QUARTER,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(150e8, 'USDC', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
      // Tether Debt against cash
      {
        currencyId: 4,
        maturity: maturity + SECONDS_IN_QUARTER,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(-100e8, 'USDT', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
    ];

    const risky = InterestRateRisk.getRiskyCurrencies(accountData);
    expect(risky).toStrictEqual([2, 3, 4]);
  });

  it('gets weighted average interest rate', () => {
    const cashGroup = system.getCashGroup(1);
    const data = cashGroup.markets[0].market;
    cashGroup.markets[0].setMarket({
      totalfCash: data.totalfCash.n,
      totalAssetCash: data.totalAssetCash.n,
      totalLiquidity: BigNumber.from(1000e8),
      oracleRate: BigNumber.from(0.02e9),
      previousTradeTime: BigNumber.from(blockTime),
      lastImpliedRate: BigNumber.from(0.02e9),
    });
    expect(InterestRateRisk.getWeightedAvgInterestRate(1)).toBe(80416666);
  });

  it('gets simulated value at current rate', () => {
    const interestRate = InterestRateRisk.getWeightedAvgInterestRate(2);
    const maturity = CashGroup.getMaturityForMarketIndex(1, blockTime);
    accountData.accountBalances = [
      // Leveraged nToken
      {
        currencyId: 2,
        cashBalance: TypedBigNumber.fromBalance(0, 'cDAI', true),
        nTokenBalance: TypedBigNumber.fromBalance(100e8, 'nDAI', true),
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      },
    ];

    accountData.portfolio = [
      // DAI leverage on nToken
      {
        currencyId: 2,
        maturity,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(-100e8, 'DAI', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
    ];

    const value = InterestRateRisk.simulateLocalCurrencyValue(
      2,
      interestRate,
      accountData.cashBalance(2)!,
      accountData.portfolio,
      accountData.nTokenBalance(2),
      blockTime,
    );

    const {netUnderlyingAvailable} = FreeCollateral.getFreeCollateral(accountData, blockTime);
    // The rough approximation is that the FC and the local currency value at the weighted average interest
    // rate should be about the same
    expect(netUnderlyingAvailable.get(2)!.sub(value).toNumber() / INTERNAL_TOKEN_PRECISION).toBeCloseTo(0, -1);
  });

  it('finds liquidation rates, ntoken leverage', () => {
    // InterestRateRisk.getNTokenSimulatedValue(TypedBigNumber.fromBalance(100e8, 'nDAI', true), undefined, blockTime)
    const maturity = CashGroup.getMaturityForMarketIndex(1, blockTime);
    accountData.accountBalances = [
      // Leveraged nToken
      {
        currencyId: 2,
        cashBalance: TypedBigNumber.fromBalance(0, 'cDAI', true),
        nTokenBalance: TypedBigNumber.fromBalance(945e8, 'nDAI', true),
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      },
    ];

    accountData.portfolio = [
      // DAI leverage on nToken
      {
        currencyId: 2,
        maturity,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(-100.1e8, 'DAI', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
    ];

    const risk = InterestRateRisk.calculateInterestRateRisk(accountData, blockTime);
    expect(risk.get(2)?.upperLiquidationInterestRate).toBe(null);
    expect(risk.get(2)?.lowerLiquidationInterestRate).toBe(0.079e9);
  });

  it('finds liquidation rates, cross currency, undercollateralized', () => {
    const maturity = CashGroup.getMaturityForMarketIndex(1, blockTime);
    accountData.accountBalances = [
      {
        currencyId: 3,
        cashBalance: TypedBigNumber.fromBalance(0, 'cUSDC', true),
        nTokenBalance: TypedBigNumber.fromBalance(0, 'nUSDC', true),
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      },
    ];

    accountData.portfolio = [
      {
        currencyId: 3,
        maturity,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(-100e8, 'USDC', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
      {
        currencyId: 3,
        maturity: maturity + SECONDS_IN_QUARTER,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(102.5e8, 'USDC', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
    ];

    const risk = InterestRateRisk.calculateInterestRateRisk(accountData, blockTime);
    expect(risk.get(3)?.upperLiquidationInterestRate).toBe(0.069e9);
    expect(risk.get(3)?.lowerLiquidationInterestRate).toBe(null);
  });

  it('finds liquidation rates, cross currency, collateralized', () => {
    const maturity = CashGroup.getMaturityForMarketIndex(1, blockTime);
    accountData.accountBalances = [
      {
        currencyId: 3,
        cashBalance: TypedBigNumber.fromBalance(0, 'cUSDC', true),
        nTokenBalance: TypedBigNumber.fromBalance(0, 'nUSDC', true),
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      },
    ];

    accountData.portfolio = [
      {
        currencyId: 3,
        maturity,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(-100e8, 'USDC', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
      {
        currencyId: 3,
        maturity: maturity + SECONDS_IN_QUARTER,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(104e8, 'USDC', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
    ];

    const risk = InterestRateRisk.calculateInterestRateRisk(accountData, blockTime);
    expect(risk.get(3)?.upperLiquidationInterestRate).toBe(0.127e9);
    expect(risk.get(3)?.lowerLiquidationInterestRate).toBe(null);
  });

  it('finds liquidation rates lower interest rate', () => {
    const maturity = CashGroup.getMaturityForMarketIndex(1, blockTime);
    accountData.accountBalances = [
      {
        currencyId: 3,
        cashBalance: TypedBigNumber.fromBalance(5000e8, 'cUSDC', true),
        nTokenBalance: TypedBigNumber.fromBalance(0, 'nUSDC', true),
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      },
    ];

    accountData.portfolio = [
      {
        currencyId: 3,
        maturity: maturity + SECONDS_IN_QUARTER,
        assetType: AssetType.fCash,
        notional: TypedBigNumber.fromBalance(-100.5e8, 'USDC', true),
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      },
    ];

    const risk = InterestRateRisk.calculateInterestRateRisk(accountData, blockTime);
    expect(risk.get(3)?.upperLiquidationInterestRate).toBe(null);
    expect(risk.get(3)?.lowerLiquidationInterestRate).toBe(0.029e9);
  });
});
