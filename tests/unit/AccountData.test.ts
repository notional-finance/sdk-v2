import {BigNumber} from 'ethers';
import {AccountData} from '../../src/account';
import TypedBigNumber, {BigNumberType} from '../../src/libs/TypedBigNumber';
import {AssetType} from '../../src/libs/types';
import MockSystem from '../mocks/MockSystem';
import {FreeCollateral, System} from '../../src/system';
import {getNowSeconds} from '../../src/libs/utils';
import MockAccountData from '../mocks/MockAccountData';

describe('Account Data', () => {
  const system = new MockSystem();
  System.overrideSystem(system);
  afterAll(() => {
    system.destroy();
  });

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

    AccountData.loadFromBlockchain(accountResult).then((a) => {
      expect(a.cashBalance(2)?.toString()).toEqual('50000.0');
      expect(a.portfolio.length).toEqual(0);
      done();
    }).catch(() => {
      done();
    });
  });

  describe('loan to value ratio', () => {
    it('no debt', () => {
      const {totalETHDebts, totalETHValue, loanToValue} = accountData.loanToValueRatio();
      expect(totalETHValue.toNumber()).toBe(100e8);
      expect(totalETHDebts.isZero()).toBeTruthy();
      expect(loanToValue).toBe(0);
    });

    it('ntoken value', () => {
      const accountData2 = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: 1,
            cashBalance: TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cETH'),
            nTokenBalance: TypedBigNumber.from(5000e8, BigNumberType.nToken, 'nETH'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [],
        false,
      );

      const {totalETHDebts, totalETHValue, loanToValue} = accountData2.loanToValueRatio();
      expect(totalETHValue.toNumber()).toBe(150e8);
      expect(totalETHDebts.isZero()).toBeTruthy();
      expect(loanToValue).toBe(0);
    });

    it('haircut ltv is 100 when fc is zero', () => {
      const accountData2 = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: 1,
            cashBalance: TypedBigNumber.from(52.5e8, BigNumberType.InternalAsset, 'cETH'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nETH'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
          {
            currencyId: 2,
            cashBalance: TypedBigNumber.from(-3500e8, BigNumberType.InternalAsset, 'cDAI'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [],
        false,
      );

      const {
        netETHCollateralWithHaircut,
        netETHDebtWithBuffer,
      } = FreeCollateral.getFreeCollateral(accountData2);
      expect(netETHCollateralWithHaircut.sub(netETHDebtWithBuffer).isZero()).toBeTruthy();
      const {haircutLoanToValue, maxLoanToValue, loanToValue} = accountData2.loanToValueRatio();
      expect(haircutLoanToValue).toBe(100);
      expect(maxLoanToValue).toBe(loanToValue);
    });

    // todo more tests
  });

  describe('liquidation price', () => {
    it('gets liquidation price with ETH collateral', () => {
      const account = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: 1,
            cashBalance: TypedBigNumber.from(100e8, BigNumberType.InternalAsset, 'cETH'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nETH'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
          {
            currencyId: 2,
            cashBalance: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [
          {
            currencyId: 2,
            maturity: getNowSeconds() + 1000,
            assetType: AssetType.fCash,
            notional: TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI'),
            hasMatured: false,
            settlementDate: getNowSeconds() + 1000,
            isIdiosyncratic: true,
          },
        ],
        false,
      );

      const liquidationPrice = account.getLiquidationPrice(1, 2);
      expect(liquidationPrice?.symbol).toBe('DAI');
      expect(liquidationPrice?.toNumber()).toBeCloseTo(73.076e8, -6);
    });

    it('returns null on negative liquidation price', () => {
      const account = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: 1,
            cashBalance: TypedBigNumber.from(50e8, BigNumberType.InternalAsset, 'cETH'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nETH'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
          {
            currencyId: 2,
            cashBalance: TypedBigNumber.from(100000e8, BigNumberType.InternalAsset, 'cDAI'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [
          {
            currencyId: 1,
            maturity: getNowSeconds() + 1000,
            assetType: AssetType.fCash,
            notional: TypedBigNumber.from(-1e8, BigNumberType.InternalUnderlying, 'ETH'),
            hasMatured: false,
            settlementDate: getNowSeconds() + 1000,
            isIdiosyncratic: true,
          },
        ],
        false,
      );

      expect(account.getLiquidationPrice(2, 1)).toBeNull();
    });

    it('gets liquidation price with USDC collateral', () => {
      const account = new MockAccountData(
        0,
        false,
        false,
        undefined,
        [
          {
            currencyId: 2,
            cashBalance: TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nDAI'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
          {
            currencyId: 3,
            cashBalance: TypedBigNumber.from(6000e8, BigNumberType.InternalAsset, 'cUSDC'),
            nTokenBalance: TypedBigNumber.from(0, BigNumberType.nToken, 'nUSDC'),
            lastClaimTime: BigNumber.from(0),
            lastClaimIntegralSupply: BigNumber.from(0),
          },
        ],
        [
          {
            currencyId: 2,
            maturity: getNowSeconds() + 1000,
            assetType: AssetType.fCash,
            notional: TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI'),
            hasMatured: false,
            settlementDate: getNowSeconds() + 1000,
            isIdiosyncratic: true,
          },
        ],
        false,
      );

      const liquidationPrice = account.getLiquidationPrice(3, 2);
      expect(liquidationPrice?.symbol).toBe('DAI');
      expect(liquidationPrice?.toNumber()).toBeCloseTo(0.921e8, -6);
    });
  });
});
