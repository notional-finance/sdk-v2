import {BigNumber, ethers} from 'ethers';
import GraphClient from '../../src/GraphClient';
import {
  System, FreeCollateral, NTokenValue, CashGroup,
} from '../../src/system';
import MockSystem, {systemQueryResult} from '../mocks/MockSystem';
import {SECONDS_IN_MONTH} from '../../src/config/constants';
import TypedBigNumber, {BigNumberType} from '../../src/libs/TypedBigNumber';
import {AssetType} from '../../src/libs/types';
import {getNowSeconds} from '../../src/libs/utils';
import MockAccountData from './AccountData.test';
import MockNotionalProxy from '../mocks/MockNotionalProxy';
import {AccountData} from '../../src/account';

describe('calculates free collateral', () => {
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
  });

  describe('calculates free collateral', () => {
    const blockTime = CashGroup.getTimeReference(getNowSeconds());
    const maturity = CashGroup.getMaturityForMarketIndex(1, blockTime);
    const accountData = new MockAccountData(0, false, true, 0, [], [], false);

    it('for positive fcash', () => {
      accountData.accountBalances = [
        {
          currencyId: 2,
          cashBalance: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
          nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
          lastClaimTime: BigNumber.from(0),
          lastClaimIntegralSupply: BigNumber.from(0),
        },
      ];
      accountData.portfolio = [
        {
          currencyId: 2,
          maturity,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(100e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: maturity,
          isIdiosyncratic: false,
        },
      ];
      // prettier-ignore
      const {
        netETHDebt, netETHDebtWithBuffer, netETHCollateralWithHaircut, netUnderlyingAvailable,
      } = FreeCollateral.getFreeCollateral(
        accountData,
        blockTime,
      );

      expect(netETHDebt.isZero()).toBeTruthy();
      expect(netETHDebtWithBuffer.isZero()).toBeTruthy();
      // 100 fDAI with a 95% haircut to pv should be a little more than 95% of the notional
      expect(netETHCollateralWithHaircut.n.sub(BigNumber.from(0.95e8)).abs().toNumber()).toBeLessThanOrEqual(0.03e8);
      expect(netUnderlyingAvailable.get(2)!.scale(1, 100).toNumber()).toBeCloseTo(
        netETHCollateralWithHaircut.scale(100, 95).toNumber(),
        -1,
      );
    });

    it('for negative fcash', () => {
      accountData.accountBalances = [
        {
          currencyId: 2,
          cashBalance: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
          nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
          lastClaimTime: BigNumber.from(0),
          lastClaimIntegralSupply: BigNumber.from(0),
        },
      ];
      accountData.portfolio = [
        {
          currencyId: 2,
          maturity,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: maturity,
          isIdiosyncratic: false,
        },
      ];
      const {
        netETHDebt,
        netETHDebtWithBuffer,
        netETHCollateralWithHaircut,
        netUnderlyingAvailable,
      } = FreeCollateral.getFreeCollateral(accountData, blockTime);

      expect(netETHDebt.n.sub(BigNumber.from(1e8)).abs().toNumber()).toBeLessThanOrEqual(0.03e8);
      // Should be buffered by 105
      expect(Math.abs(netETHDebtWithBuffer.scale(100, netETHDebt.n).toNumber() - 105)).toBeLessThanOrEqual(1);
      expect(netETHCollateralWithHaircut.isZero()).toBeTruthy();
      expect(netUnderlyingAvailable.get(2)!.scale(1, 100).toString()).toBe(netETHDebt.neg().toString());
    });

    it('for liquidity token', () => {
      const ltMaturity = blockTime + 6 * SECONDS_IN_MONTH;
      accountData.accountBalances = [
        {
          currencyId: 2,
          cashBalance: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
          nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
          lastClaimTime: BigNumber.from(0),
          lastClaimIntegralSupply: BigNumber.from(0),
        },
      ];
      accountData.portfolio = [
        {
          currencyId: 2,
          maturity: ltMaturity,
          assetType: AssetType.LiquidityToken_6Month,
          notional: TypedBigNumber.from(5000e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: CashGroup.getSettlementDate(AssetType.LiquidityToken_6Month, ltMaturity),
          isIdiosyncratic: false,
        },
        {
          currencyId: 2,
          maturity: ltMaturity,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: maturity,
          isIdiosyncratic: false,
        },
      ];

      const {
        netETHDebt,
        netETHDebtWithBuffer,
        netETHCollateralWithHaircut,
        netUnderlyingAvailable,
      } = FreeCollateral.getFreeCollateral(accountData, blockTime);

      expect(netETHDebt.isZero()).toBeTruthy();
      expect(netETHDebtWithBuffer.isZero()).toBeTruthy();
      expect(netETHCollateralWithHaircut.toNumber()).toEqual(Math.trunc(96083219 * 0.95));
      expect(netUnderlyingAvailable.get(2)!.toNumber()).toBe(9608321907);
    });

    it('for cash balances and ntokens with fcash', () => {
      accountData.accountBalances = [
        {
          currencyId: 2,
          cashBalance: TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI'),
          nTokenBalance: TypedBigNumber.from(100e8, BigNumberType.nToken, 'nDAI'),
          lastClaimTime: BigNumber.from(0),
          lastClaimIntegralSupply: BigNumber.from(0),
        },
      ];
      accountData.portfolio = [
        {
          currencyId: 2,
          maturity,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(100e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: maturity,
          isIdiosyncratic: false,
        },
      ];

      const {
        netETHDebt,
        netETHDebtWithBuffer,
        netETHCollateralWithHaircut,
        netUnderlyingAvailable,
      } = FreeCollateral.getFreeCollateral(accountData, blockTime);

      expect(netETHDebt.isZero()).toBeTruthy();
      expect(netETHDebtWithBuffer.isZero()).toBeTruthy();
      expect(netETHCollateralWithHaircut.toNumber()).toBeGreaterThan(1.98e8 * 0.95);
      expect(netETHCollateralWithHaircut.toNumber()).toBeLessThan(2.0e8 * 0.95);
      expect(netUnderlyingAvailable.get(2)!.toNumber()).toBeGreaterThan(198e8);
      expect(netUnderlyingAvailable.get(2)!.toNumber()).toBeLessThan(200e8);
    });

    it('for negative cash balances with fcash', () => {
      accountData.accountBalances = [
        {
          currencyId: 2,
          cashBalance: TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI'),
          nTokenBalance: TypedBigNumber.from(1000e8, BigNumberType.nToken, 'nDAI'),
          lastClaimTime: BigNumber.from(0),
          lastClaimIntegralSupply: BigNumber.from(0),
        },
      ];
      accountData.portfolio = [
        {
          currencyId: 2,
          maturity,
          assetType: AssetType.fCash,
          notional: TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI'),
          hasMatured: false,
          settlementDate: maturity,
          isIdiosyncratic: false,
        },
      ];

      const {
        netETHDebt,
        netETHDebtWithBuffer,
        netETHCollateralWithHaircut,
        netUnderlyingAvailable,
      } = FreeCollateral.getFreeCollateral(accountData, blockTime);

      expect(netETHDebt.isZero()).toBeTruthy();
      expect(netETHDebtWithBuffer.isZero()).toBeTruthy();
      expect(netETHCollateralWithHaircut.toNumber()).toBeGreaterThan(0.1e8 * 0.95);
      expect(netETHCollateralWithHaircut.toNumber()).toBeLessThan(0.13e8 * 0.95);
      expect(netUnderlyingAvailable.get(2)!.toNumber()).toBeGreaterThan(10e8);
      expect(netUnderlyingAvailable.get(2)!.toNumber()).toBeLessThan(13e8);
    });
  });

  describe('borrow requirements', () => {
    const borrowCurrencyId = 2;
    // use USDC because it has both haircuts and buffers in this configuration
    const collateralCurrencyId = 3;
    const blockTime = getNowSeconds();
    let cashGroup: CashGroup;
    let maturity: number;
    let borrowfCashAmount: TypedBigNumber;
    let borrowAmountHaircutPV: number;

    beforeEach(() => {
      cashGroup = system.getCashGroup(borrowCurrencyId);
      maturity = cashGroup.markets[0].maturity;
      borrowfCashAmount = TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI');
      borrowAmountHaircutPV = cashGroup
        .getfCashPresentValueUnderlyingInternal(maturity, borrowfCashAmount, true, blockTime)
        .toNumber();
    });

    it('calculates borrowing requirements for stable / stable with no account data', () => {
      const accountData = AccountData.emptyAccountData();
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });

      const {
        minCollateral,
        targetCollateral,
        minCollateralRatio,
        minBufferedRatio,
        targetCollateralRatio,
        targetBufferedRatio,
      } = FreeCollateral.calculateBorrowRequirement(
        collateralCurrencyId,
        200,
        accountData,
        false,
        blockTime,
      );

      const usdcCollateral = (borrowAmountHaircutPV * -1.05) / 0.95;
      const usdcTargetCollateral = (borrowAmountHaircutPV * -2.1) / 0.95;
      expect(minCollateral.toNumber()).toBeCloseTo(usdcCollateral, -3);
      expect(targetCollateral.toNumber()).toBeCloseTo(usdcTargetCollateral, -3);
      expect(minCollateralRatio).toBeCloseTo(110, -1);
      expect(targetCollateralRatio).toBeCloseTo(221, -1);
      expect(minBufferedRatio).toBeCloseTo(100);
      expect(targetBufferedRatio).toBeCloseTo(200);
    });

    it('calculates borrowing requirements for stable / crypto with no account data', () => {
      const accountData = AccountData.emptyAccountData();
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });

      const {
        minCollateral,
        targetCollateral,
        minCollateralRatio,
        minBufferedRatio,
        targetCollateralRatio,
        targetBufferedRatio,
      } = FreeCollateral.calculateBorrowRequirement(
        1,
        200,
        accountData,
        false,
        blockTime,
      );

      const ethCollateral = (borrowAmountHaircutPV * -1.05) / 100 / 0.7;
      const ethTargetCollateral = (borrowAmountHaircutPV * -2.1) / 100 / 0.7;
      expect(minCollateral.toNumber()).toBeCloseTo(ethCollateral, -3);
      expect(targetCollateral.toNumber()).toBeCloseTo(ethTargetCollateral, -3);
      expect(minCollateralRatio).toBeCloseTo(150, -1);
      expect(targetCollateralRatio).toBeCloseTo(300, -1);
      expect(minBufferedRatio).toBeCloseTo(100);
      expect(targetBufferedRatio).toBeCloseTo(200);
    });

    it.only('calculates borrowing requirements for stable / crypto with nTokens', () => {
      const accountData = AccountData.emptyAccountData();
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });

      const {
        minCollateral,
        targetCollateral,
        minCollateralRatio,
        minBufferedRatio,
        targetCollateralRatio,
        targetBufferedRatio,
      } = FreeCollateral.calculateBorrowRequirement(
        1,
        200,
        accountData,
        true,
        blockTime,
      );

      const ethCollateral = (borrowAmountHaircutPV * -1.05) / 0.7 / 0.85;
      const ethTargetCollateral = (borrowAmountHaircutPV * -2.1) / 0.7 / 0.85;
      expect(minCollateral.toNumber()).toBeCloseTo(ethCollateral, -3);
      expect(targetCollateral.toNumber()).toBeCloseTo(ethTargetCollateral, -3);
      expect(minCollateralRatio).toBeCloseTo(150, -1);
      expect(targetCollateralRatio).toBeCloseTo(300, -1);
      expect(minBufferedRatio).toBeCloseTo(100);
      expect(targetBufferedRatio).toBeCloseTo(200);
    });

    it('calculates borrowing requirements when local collateral can net off', () => {
      const accountData = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: borrowCurrencyId,
            cashBalance: TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [],
        true,
      );
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });

      const {
        minCollateral,
        targetCollateral,
        minCollateralRatio,
        minBufferedRatio,
        targetCollateralRatio,
        targetBufferedRatio,
      } = FreeCollateral.calculateBorrowRequirement(
        collateralCurrencyId,
        200,
        accountData,
        false,
        blockTime,
      );

      expect(minCollateral.toNumber()).toBe(0);
      expect(targetCollateral.toNumber()).toBe(0);
      expect(minCollateralRatio).toBeNull();
      expect(targetCollateralRatio).toBeNull();
      expect(minBufferedRatio).toBeNull();
      expect(targetBufferedRatio).toBeNull();
    });

    it('calculates borrowing requirements when local collateral can partially net off', () => {
      const accountData = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: borrowCurrencyId,
            cashBalance: TypedBigNumber.from(2500e8, BigNumberType.InternalAsset, 'cDAI'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [],
        true,
      );
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });

      const {
        minCollateral,
        targetCollateral,
        minCollateralRatio,
        minBufferedRatio,
        targetCollateralRatio,
        targetBufferedRatio,
      } = FreeCollateral.calculateBorrowRequirement(
        collateralCurrencyId,
        200,
        accountData,
        false,
        blockTime,
      );

      const usdcCollateral = ((borrowAmountHaircutPV + 50e8) * -1.05) / 0.95;
      const usdcTargetCollateral = ((borrowAmountHaircutPV + 50e8) * -2.1) / 0.95;
      expect(minCollateral.toNumber()).toBeCloseTo(usdcCollateral, -3);
      expect(targetCollateral.toNumber()).toBeCloseTo(usdcTargetCollateral, -3);
      expect(minCollateralRatio).toBeCloseTo(110, -1);
      expect(targetCollateralRatio).toBeCloseTo(221, -1);
      expect(minBufferedRatio).toBeCloseTo(100);
      expect(targetBufferedRatio).toBeCloseTo(200);
    });

    it('calculates borrowing requirements when local collateral is in debt', () => {
      const accountData = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: borrowCurrencyId,
            cashBalance: TypedBigNumber.from(-2500e8, BigNumberType.InternalAsset, 'cDAI'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [],
        true,
      );
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });

      const {
        minCollateral,
        targetCollateral,
        minCollateralRatio,
        minBufferedRatio,
        targetCollateralRatio,
        targetBufferedRatio,
      } = FreeCollateral.calculateBorrowRequirement(
        collateralCurrencyId,
        200,
        accountData,
        false,
        blockTime,
      );

      const usdcCollateral = ((borrowAmountHaircutPV - 50e8) * -1.05) / 0.95;
      const usdcTargetCollateral = ((borrowAmountHaircutPV - 50e8) * -2.1) / 0.95;
      expect(minCollateral.toNumber()).toBeCloseTo(usdcCollateral, -3);
      expect(targetCollateral.toNumber()).toBeCloseTo(usdcTargetCollateral, -3);
      expect(minCollateralRatio).toBeCloseTo(110, -1);
      expect(targetCollateralRatio).toBeCloseTo(221, -1);
      expect(minBufferedRatio).toBeCloseTo(100);
      expect(targetBufferedRatio).toBeCloseTo(200);
    });

    it('calculates borrowing requirements when collateral is positive', () => {
      const accountData = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: collateralCurrencyId,
            cashBalance: TypedBigNumber.from(500e8, BigNumberType.InternalAsset, 'cUSDC'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nUSDC'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [],
        true,
      );
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });

      const {
        minCollateral,
        targetCollateral,
        minCollateralRatio,
        minBufferedRatio,
        targetCollateralRatio,
        targetBufferedRatio,
      } = FreeCollateral.calculateBorrowRequirement(
        collateralCurrencyId,
        200,
        accountData,
        false,
        blockTime,
      );

      // We don't haircut the usdc cash balance here since we have converted collateral figures
      // into required USDC amounts already by dividing by 0.95
      const usdcCollateral = (borrowAmountHaircutPV * -1.05) / 0.95 - 10e8;
      const usdcTargetCollateral = (borrowAmountHaircutPV * -2.1) / 0.95 - 10e8;
      expect(minCollateral.toNumber()).toBeCloseTo(usdcCollateral, -3);
      expect(targetCollateral.toNumber()).toBeCloseTo(usdcTargetCollateral, -3);
      expect(minCollateralRatio).toBeCloseTo(110, -1);
      expect(targetCollateralRatio).toBeCloseTo(221, -1);
      expect(minBufferedRatio).toBeCloseTo(100);
      expect(targetBufferedRatio).toBeCloseTo(200);
    });

    it('calculates borrowing requirements when more collateral than ratio', () => {
      const accountData = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: collateralCurrencyId,
            cashBalance: TypedBigNumber.from(50000e8, BigNumberType.InternalAsset, 'cUSDC'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nUSDC'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [],
        true,
      );
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });
      const {
        netETHCollateral, netETHCollateralWithHaircut, netETHDebt, netETHDebtWithBuffer,
      } = FreeCollateral.getFreeCollateral(accountData);
      const collateralRatioBefore = FreeCollateral.calculateCollateralRatio(netETHCollateral, netETHDebt);
      const bufferedRatioBefore = FreeCollateral.calculateCollateralRatio(
        netETHCollateralWithHaircut, netETHDebtWithBuffer,
      );

      const {
        minCollateral,
        targetCollateral,
        targetCollateralRatio,
        minBufferedRatio,
        targetBufferedRatio,
      } = FreeCollateral.calculateBorrowRequirement(
        collateralCurrencyId,
        200,
        accountData,
        false,
        blockTime,
      );

      expect(minCollateral.toNumber()).toBe(0);
      expect(targetCollateral.toNumber()).toBe(0);
      expect(targetCollateralRatio).toBeCloseTo(collateralRatioBefore!);
      expect(minBufferedRatio).toBeCloseTo(bufferedRatioBefore!);
      expect(targetBufferedRatio).toBeCloseTo(bufferedRatioBefore!);
    });

    it('calculates borrowing requirements when net collateral is negative but no eth required', () => {
      const accountData = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: 1,
            cashBalance: TypedBigNumber.from(250e8, BigNumberType.InternalAsset, 'cETH'),
            nTokenBalance: undefined,
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
          {
            currencyId: collateralCurrencyId,
            cashBalance: TypedBigNumber.from(-5000e8, BigNumberType.InternalAsset, 'cUSDC'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nUSDC'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [],
        true,
      );
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });

      const {
        netETHCollateral, netETHCollateralWithHaircut, netETHDebt, netETHDebtWithBuffer,
      } = FreeCollateral.getFreeCollateral(accountData);
      const collateralRatioBefore = FreeCollateral.calculateCollateralRatio(netETHCollateral, netETHDebt);
      const bufferedRatioBefore = FreeCollateral.calculateCollateralRatio(
        netETHCollateralWithHaircut, netETHDebtWithBuffer,
      );

      const {
        minCollateral, targetCollateral, minCollateralRatio, minBufferedRatio,
      } = FreeCollateral.calculateBorrowRequirement(
        collateralCurrencyId,
        200,
        accountData,
        false,
        blockTime,
      );

      expect(minCollateral.toNumber()).toBe(0);
      expect(minCollateralRatio).toBeCloseTo(collateralRatioBefore!);
      expect(minBufferedRatio).toBeCloseTo(bufferedRatioBefore!);
      const assetCashBalance = targetCollateral.toAssetCash();

      accountData.updateBalance(collateralCurrencyId, assetCashBalance);
      const {
        netETHCollateralWithHaircut: netETHAfter,
        netETHDebtWithBuffer: netDebtAfter,
      } = FreeCollateral.getFreeCollateral(accountData);
      // Expect that the buffered collateral ratio afterwards is about 200
      expect(FreeCollateral.calculateCollateralRatio(netETHAfter, netDebtAfter)).toBeCloseTo(
        200,
        0,
      );
    });

    it('calculates borrowing requirements when collateral is negative', () => {
      const accountData = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: collateralCurrencyId,
            cashBalance: TypedBigNumber.from(-5000e8, BigNumberType.InternalAsset, 'cUSDC'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nUSDC'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [],
        true,
      );
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });

      const {targetCollateral} = FreeCollateral.calculateBorrowRequirement(
        collateralCurrencyId,
        200,
        accountData,
        false,
        blockTime,
      );

      const targetAssetCashBalance = targetCollateral.toAssetCash();
      accountData.updateBalance(
        collateralCurrencyId,
        targetAssetCashBalance,
        TypedBigNumber.from(0, BigNumberType.nToken, 'nUSDC'),
      );
      const {netETHCollateralWithHaircut, netETHDebtWithBuffer} = FreeCollateral.getFreeCollateral(accountData);
      // Expect that the buffered collateral ratio afterwards is about 200
      expect(FreeCollateral.calculateCollateralRatio(netETHCollateralWithHaircut, netETHDebtWithBuffer)).toBeCloseTo(
        200,
        0,
      );
    });

    it('it nets off fcash before calculating collateral requirement', () => {
      const accountData = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: borrowCurrencyId,
            cashBalance: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [
          // This asset should be net off exactly
          {
            currencyId: borrowCurrencyId,
            assetType: AssetType.fCash,
            notional: borrowfCashAmount.neg(),
            maturity,
            hasMatured: false,
            settlementDate: maturity,
            isIdiosyncratic: false,
          },
        ],
        true,
      );
      accountData.updateAsset({
        currencyId: borrowCurrencyId,
        maturity,
        assetType: AssetType.fCash,
        notional: borrowfCashAmount,
        hasMatured: false,
        settlementDate: maturity,
        isIdiosyncratic: false,
      });

      const {targetCollateral, minCollateral} = FreeCollateral.calculateBorrowRequirement(
        collateralCurrencyId,
        200,
        accountData,
        false,
        blockTime,
      );

      expect(minCollateral.isZero()).toBeTruthy();
      expect(targetCollateral.isZero()).toBeTruthy();
    });

    it('can override ETH rate', () => {
      const accountData = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: collateralCurrencyId,
            cashBalance: TypedBigNumber.from(-5000e8, BigNumberType.InternalAsset, 'cUSDC'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nUSDC'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [],
        true,
      );

      expect(FreeCollateral.getFreeCollateral(accountData).netETHDebtWithBuffer.toString()).toEqual('105000000');

      system.setETHRateProvider(collateralCurrencyId, {
        getETHRate: () => ({
          ethRateConfig: {
            haircut: 96,
            buffer: 105,
            mustInvert: false,
            rateDecimalPlaces: 18,
          },
          ethRate: BigNumber.from('100000000000000'),
        }),
      });

      expect(FreeCollateral.getFreeCollateral(accountData).netETHDebtWithBuffer.toString()).toEqual('1050000');
    });

    it('can override nToken asset cash PV', () => {
      let val = NTokenValue.getAssetRequiredToMintNToken(
        collateralCurrencyId,
        TypedBigNumber.from(5000e8, BigNumberType.nToken, 'nUSDC'),
      );

      expect(val.toString()).toEqual('250000000000');

      system.setNTokenAssetCashPVProvider(collateralCurrencyId, {
        getNTokenAssetCashPV: () => TypedBigNumber.from(5000000e8, BigNumberType.InternalAsset, 'cUSDC'),
      });

      val = NTokenValue.getAssetRequiredToMintNToken(
        collateralCurrencyId,
        TypedBigNumber.from(5000e8, BigNumberType.nToken, 'nUSDC'),
      );

      expect(val.toString()).toEqual('125000000');
    });
  });
});
