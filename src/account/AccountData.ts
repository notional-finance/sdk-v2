import {BigNumber, utils} from 'ethers';
import {
  ETHER_CURRENCY_ID,
  INTERNAL_TOKEN_PRECISION,
  MAX_BALANCES,
  MAX_BITMAP_ASSETS,
  MAX_PORTFOLIO_ASSETS,
} from '../config/constants';
import TypedBigNumber, {BigNumberType} from '../libs/TypedBigNumber';
import {Asset, AssetType, Balance} from '../libs/types';
import {assetTypeNum, convertAssetType, getNowSeconds} from '../libs/utils';
import {
  System, CashGroup, FreeCollateral, NTokenValue,
} from '../system';

interface AssetResult {
  currencyId: BigNumber;
  maturity: BigNumber;
  assetType: BigNumber;
  notional: BigNumber;
  storageSlot: BigNumber;
  storageState: number;
}

interface BalanceResult {
  currencyId: number;
  cashBalance: BigNumber;
  nTokenBalance: BigNumber;
  lastClaimTime: BigNumber;
  lastClaimIntegralSupply: BigNumber;
}

export interface GetAccountResult {
  accountContext: {
    nextSettleTime: number;
    hasDebt: string;
    assetArrayLength: number;
    bitmapCurrencyId: number;
    activeCurrencies: string;
  };
  accountBalances: BalanceResult[];
  portfolio: AssetResult[];
}

export default class AccountData {
  protected constructor(
    public nextSettleTime: number,
    public hasCashDebt: boolean,
    public hasAssetDebt: boolean,
    public bitmapCurrencyId: number | undefined,
    public accountBalances: Balance[],
    public portfolio: Asset[],
    public isCopy: boolean,
  ) {}

  public cashBalance(currencyId: number) {
    return this.accountBalances.find((b) => b.currencyId === currencyId)?.cashBalance;
  }

  public nTokenBalance(currencyId: number) {
    return this.accountBalances.find((b) => b.currencyId === currencyId)?.nTokenBalance;
  }

  public getHash() {
    // Gets a rough hash of the account data object to detect if it has changed
    return utils.id(
      [
        this.nextSettleTime.toString(),
        this.hasCashDebt.toString(),
        this.hasAssetDebt.toString(),
        this.bitmapCurrencyId?.toString() || '',
        this.accountBalances.toString(),
        this.portfolio.toString(),
        this.isCopy.toString(),
      ].join(':'),
    );
  }

  public static emptyAccountData() {
    return AccountData.copyAccountData();
  }

  /**
   * Copies an account data object for simulation
   * @param account if undefined, will return an empty account data object
   * @returns an account data object that is mutable
   */
  public static copyAccountData(accountData?: AccountData) {
    if (!accountData) {
      return new AccountData(0, false, false, undefined, [], [], true);
    }

    return new AccountData(
      accountData.nextSettleTime,
      accountData.hasCashDebt,
      accountData.hasAssetDebt,
      accountData.bitmapCurrencyId,
      accountData.accountBalances.map((b) => ({...b})),
      accountData.portfolio.map((a) => ({...a})),
      true,
    );
  }

  public static parsePortfolioFromBlockchain(portfolio: AssetResult[]): Asset[] {
    const system = System.getSystem();
    return portfolio.map((v) => {
      const currency = system.getCurrencyById(v.currencyId.toNumber());
      const underlyingSymbol = system.getUnderlyingSymbol(v.currencyId.toNumber());
      const maturity = v.maturity.toNumber();
      const assetType = convertAssetType(v.assetType);
      const notional = assetType === AssetType.fCash
        ? TypedBigNumber.from(v.notional, BigNumberType.InternalUnderlying, underlyingSymbol)
        : TypedBigNumber.from(v.notional, BigNumberType.LiquidityToken, currency.symbol);
      const settlementDate = CashGroup.getSettlementDate(assetType, maturity);

      return {
        currencyId: currency.id,
        maturity,
        assetType,
        notional,
        hasMatured: settlementDate < getNowSeconds(),
        settlementDate,
        isIdiosyncratic: CashGroup.isIdiosyncratic(maturity),
      };
    });
  }

  public static parseBalancesFromBlockchain(accountBalances: BalanceResult[]): Balance[] {
    const system = System.getSystem();
    return accountBalances
      .filter((v) => v.currencyId !== 0)
      .map((v) => {
        const {symbol} = system.getCurrencyById(v.currencyId);
        const nTokenSymbol = system.getNToken(v.currencyId)?.symbol;
        return {
          currencyId: v.currencyId,
          cashBalance: TypedBigNumber.from(v.cashBalance, BigNumberType.InternalAsset, symbol),
          nTokenBalance: nTokenSymbol
            ? TypedBigNumber.from(v.nTokenBalance, BigNumberType.nToken, nTokenSymbol)
            : undefined,
          lastClaimTime: v.lastClaimTime,
          lastClaimIntegralSupply: v.lastClaimIntegralSupply,
        };
      });
  }

  public static async loadFromBlockchain(result: GetAccountResult): Promise<AccountData> {
    const portfolio = AccountData.parsePortfolioFromBlockchain(result.portfolio);
    const balances = AccountData.parseBalancesFromBlockchain(result.accountBalances);

    // eslint-disable-next-line
    const bitmapCurrencyId =
      result.accountContext.bitmapCurrencyId === 0 ? undefined : result.accountContext.bitmapCurrencyId;

    return AccountData.load(
      result.accountContext.nextSettleTime,
      result.accountContext.hasDebt === '0x02' || result.accountContext.hasDebt === '0x03',
      result.accountContext.hasDebt === '0x01' || result.accountContext.hasDebt === '0x03',
      bitmapCurrencyId,
      balances,
      portfolio,
    );
  }

  public static async load(
    nextSettleTime: number,
    hasCashDebt: boolean,
    hasAssetDebt: boolean,
    bitmapCurrencyId: number | undefined,
    balances: Balance[],
    portfolio: Asset[],
  ): Promise<AccountData> {
    const system = System.getSystem();

    // Settles matured assets here to cash and fCash assets
    const maturedAssets = portfolio.filter((a) => a.hasMatured);

    // eslint-disable-next-line no-restricted-syntax
    for (const asset of maturedAssets) {
      // eslint-disable-next-line no-await-in-loop
      const {assetCash, fCashAsset} = await system.settlePortfolioAsset(asset);

      // Use private static methods to bypass copy check
      // eslint-disable-next-line no-underscore-dangle
      if (fCashAsset) AccountData._updateAsset(portfolio, asset, bitmapCurrencyId);
      // eslint-disable-next-line no-underscore-dangle
      AccountData._updateBalance(balances, asset.currencyId, assetCash, undefined, bitmapCurrencyId);
    }

    return new AccountData(nextSettleTime, hasCashDebt, hasAssetDebt, bitmapCurrencyId, balances, portfolio, false);
  }

  /**
   * Updates a balance in place, can only be done on copied account data objects, will throw an error if balances
   * exceed the maximum number of slots.
   * @param currencyId
   * @param netCashChange
   * @param netNTokenChange
   */
  public updateBalance(currencyId: number, netCashChange: TypedBigNumber, netNTokenChange?: TypedBigNumber) {
    if (!this.isCopy) throw Error('Cannot update balances on non copy');
    // eslint-disable-next-line no-underscore-dangle
    this.accountBalances = AccountData._updateBalance(
      this.accountBalances,
      currencyId,
      netCashChange,
      netNTokenChange,
      this.bitmapCurrencyId,
    );
  }

  /**
   * Updates the portfolio in place, can only be done on copied account data objects, will throw an error if assets
   * exceed the maximum number of slots
   * @param asset
   */
  public updateAsset(asset: Asset) {
    if (!this.isCopy) throw Error('Cannot update assets on non copy');
    if (asset.hasMatured) throw Error('Cannot add matured asset to account copy');

    // eslint-disable-next-line no-underscore-dangle
    this.portfolio = AccountData._updateAsset(this.portfolio, asset, this.bitmapCurrencyId);
    const {symbol} = System.getSystem().getCurrencyById(asset.currencyId);

    // Do this to ensure that there is a balance slot set for the asset
    this.updateBalance(asset.currencyId, TypedBigNumber.from(0, BigNumberType.InternalAsset, symbol));
  }

  /**
   * Calculates loan to value ratio. A loan to value ratio is the total value of debts in ETH divided by
   * the total value of collateral in ETH. It does not use any net currency values.
   */
  public loanToValueRatio() {
    const system = System.getSystem();
    // All values in this method are denominated in ETH

    /* eslint-disable @typescript-eslint/no-shadow */
    /* eslint-disable no-param-reassign */
    const {
      cashDebts,
      cashAssets,
      cashDebtsWithBuffer,
      cashAssetsWithHaircut,
      cashGroups,
    } = this.accountBalances.reduce(({
      cashDebts,
      cashAssets,
      cashDebtsWithBuffer,
      cashAssetsWithHaircut,
      cashGroups,
    }, b) => {
      if (b.cashBalance.isNegative()) {
        cashDebts = cashDebts.add(b.cashBalance.toETH(false).abs());
        cashDebtsWithBuffer = cashDebtsWithBuffer.add(b.cashBalance.toETH(true).abs());
      } else if (b.cashBalance.isPositive()) {
        cashAssets = cashAssets.add(b.cashBalance.toETH(false));
        cashAssetsWithHaircut = cashAssetsWithHaircut.add(b.cashBalance.toETH(true));
      }

      if (b.nTokenBalance?.isPositive()) {
        cashAssets = cashAssets.add(b.nTokenBalance.toAssetCash().toETH(false));
        const nTokenHaircut = NTokenValue.convertNTokenToInternalAsset(b.currencyId, b.nTokenBalance, true);
        cashAssetsWithHaircut = cashAssetsWithHaircut.add(nTokenHaircut.toETH(true));
      }

      const {
        totalCashClaims,
        fCashAssets,
      } = FreeCollateral.getNetfCashPositions(b.currencyId, this.portfolio, undefined, false);
      const {
        totalCashClaims: totalCashClaimsHaircut,
        fCashAssets: fCashAssetsHaircut,
      } = FreeCollateral.getNetfCashPositions(b.currencyId, this.portfolio, undefined, true);

      cashAssets = cashAssets.add(totalCashClaims.toETH(false));
      cashAssetsWithHaircut = cashAssetsWithHaircut.add(totalCashClaimsHaircut.toETH(true));
      if (fCashAssets.length > 0 || fCashAssetsHaircut.length > 0) {
        cashGroups.push({currencyId: b.currencyId, noHaircut: fCashAssets, haircut: fCashAssetsHaircut});
      }

      return {
        cashDebts, cashAssets, cashDebtsWithBuffer, cashAssetsWithHaircut, cashGroups,
      };
    }, {
      cashDebts: TypedBigNumber.fromBalance(0, 'ETH', true),
      cashAssets: TypedBigNumber.fromBalance(0, 'ETH', true),
      cashDebtsWithBuffer: TypedBigNumber.fromBalance(0, 'ETH', true),
      cashAssetsWithHaircut: TypedBigNumber.fromBalance(0, 'ETH', true),
      cashGroups: Array<{currencyId: number, noHaircut: Asset[], haircut: Asset[]}>(),
    });

    const {
      fCashDebts,
      fCashAssets,
      fCashAssetsWithHaircut,
      fCashDebtsWithBuffer,
    } = cashGroups.reduce(({
      fCashDebts,
      fCashAssets,
      fCashAssetsWithHaircut,
      fCashDebtsWithBuffer,
    }, {currencyId, haircut, noHaircut}) => {
      const cashGroup = system.getCashGroup(currencyId);

      noHaircut.forEach((a) => {
        const ethPV = cashGroup.getfCashPresentValueUnderlyingInternal(a.maturity, a.notional, false).toETH(false);
        if (a.notional.isPositive()) {
          fCashAssets = fCashAssets.add(ethPV);
        } else {
          fCashDebts = fCashDebts.add(ethPV.abs());
        }
      });

      haircut.forEach((a) => {
        const ethPV = cashGroup.getfCashPresentValueUnderlyingInternal(a.maturity, a.notional, true).toETH(true);
        if (a.notional.isPositive()) {
          fCashAssetsWithHaircut = fCashAssetsWithHaircut.add(ethPV);
        } else {
          fCashDebtsWithBuffer = fCashDebtsWithBuffer.add(ethPV.abs());
        }
      });

      return {
        fCashDebts,
        fCashAssets,
        fCashAssetsWithHaircut,
        fCashDebtsWithBuffer,
      };
    }, {
      fCashDebts: TypedBigNumber.fromBalance(0, 'ETH', true),
      fCashAssets: TypedBigNumber.fromBalance(0, 'ETH', true),
      fCashAssetsWithHaircut: TypedBigNumber.fromBalance(0, 'ETH', true),
      fCashDebtsWithBuffer: TypedBigNumber.fromBalance(0, 'ETH', true),
    });
    /* eslint-enable @typescript-eslint/no-shadow */
    /* eslint-enable no-param-reassign */

    const totalETHValue = cashAssets.add(fCashAssets);
    const totalETHDebts = cashDebts.add(fCashDebts);
    const totalETHValueHaircut = cashAssetsWithHaircut.add(fCashAssetsWithHaircut);
    const totalETHDebtsBuffer = cashDebtsWithBuffer.add(fCashDebtsWithBuffer);
    let loanToValue: number | null = null;
    let haircutLoanToValue: number | null = null;
    let maxLoanToValue: number | null = null;
    if (!totalETHValue.isZero()) {
      loanToValue = (totalETHDebts.scale(INTERNAL_TOKEN_PRECISION, totalETHValue.n).toNumber()
      / INTERNAL_TOKEN_PRECISION) * 100;
      haircutLoanToValue = (totalETHDebtsBuffer.scale(INTERNAL_TOKEN_PRECISION, totalETHValueHaircut.n).toNumber()
      / INTERNAL_TOKEN_PRECISION) * 100;
      maxLoanToValue = (loanToValue / haircutLoanToValue) * 100;
    }

    return {
      totalETHDebts,
      totalETHValue,
      loanToValue,
      haircutLoanToValue,
      maxLoanToValue,
    };
  }

  public getLiquidationPrice(collateralId: number, debtCurrencyId: number) {
    // We represent everything as FX to ETH so in the case that the collateral is in ETH we
    // vary the debt currency id
    const {
      netETHCollateralWithHaircut,
      netETHDebtWithBuffer,
      netUnderlyingAvailable,
    } = FreeCollateral.getFreeCollateral(this);
    const collateralAmount = netUnderlyingAvailable.get(collateralId);
    // There is no collateral in the specified currency so we do not have a liquidation price
    if (!collateralAmount || collateralAmount.n.lte(0)) return null;

    const targetId = collateralId === ETHER_CURRENCY_ID ? debtCurrencyId : collateralId;
    const aggregateFC = netETHCollateralWithHaircut.sub(netETHDebtWithBuffer);
    const targetCurrencyFC = aggregateFC.fromETH(targetId, true);
    const netUnderlying = netUnderlyingAvailable.get(targetId);

    if (!netUnderlying) throw Error('Invalid target currency when calculating liquidation price');
    const fcSurplusProportion = targetCurrencyFC.scale(INTERNAL_TOKEN_PRECISION, netUnderlying.n).abs();
    // This is the max exchange rate decrease as a portion of a single token in internal token precision, can
    // see this as the liquidation price of a single unit of ETH
    const maxExchangeRateDecrease = collateralId === targetId
      ? fcSurplusProportion.copy(INTERNAL_TOKEN_PRECISION).sub(fcSurplusProportion)
      : fcSurplusProportion.copy(INTERNAL_TOKEN_PRECISION).add(fcSurplusProportion);

    // Convert to the debt currency denomination
    if (collateralId === ETHER_CURRENCY_ID) {
      // If using the debt currency this will do 1 / maxExchangeRateDecrease.toETH(), returning a TypedNumber
      // in the debt currency denomination
      return maxExchangeRateDecrease
        .copy(INTERNAL_TOKEN_PRECISION)
        .scale(INTERNAL_TOKEN_PRECISION, maxExchangeRateDecrease.toETH(false).n);
    }

    // Convert from collateral to debt via ETH
    return maxExchangeRateDecrease.toETH(false).fromETH(debtCurrencyId, false);
  }

  /**
   * Calculates a collateral ratio, this uses the net value of currencies in the free collateral figure without
   * applying any buffers or haircuts. This is used as a user friendly way of showing free collateral.
   */
  public collateralRatio() {
    const {netETHCollateral, netETHDebt} = FreeCollateral.getFreeCollateral(this);
    return FreeCollateral.calculateCollateralRatio(netETHCollateral, netETHDebt);
  }

  /**
   * Calculates a buffered collateral ratio, this uses the net value of currencies in the free collateral figure
   * after applying buffers and haircuts. An account is liquidatable when this is below 100.
   */
  public bufferedCollateralRatio() {
    const {netETHCollateralWithHaircut, netETHDebtWithBuffer} = FreeCollateral.getFreeCollateral(this);
    return FreeCollateral.calculateCollateralRatio(netETHCollateralWithHaircut, netETHDebtWithBuffer);
  }

  private static _updateBalance(
    accountBalances: Balance[],
    currencyId: number,
    netCashChange: TypedBigNumber,
    netNTokenChange?: TypedBigNumber,
    bitmapCurrencyId?: number,
  ) {
    const balance = accountBalances.find((v) => v.currencyId === currencyId);
    if (!balance) {
      // Cannot have negative balances if the balance is not in the account already
      if (netNTokenChange && netNTokenChange.isNegative()) throw Error('nToken balance not found');
      if (netCashChange.isNegative()) throw Error('Cash balance not found');
      if (bitmapCurrencyId && accountBalances.length === MAX_BALANCES) throw Error('Exceeds max balances');
      if (!bitmapCurrencyId && accountBalances.length === MAX_BALANCES - 1) throw Error('Exceeds max balances');

      accountBalances.push({
        currencyId,
        cashBalance: netCashChange,
        nTokenBalance: netNTokenChange,
        lastClaimTime: BigNumber.from(0),
        lastClaimIntegralSupply: BigNumber.from(0),
      });

      return accountBalances.sort((a, b) => a.currencyId - b.currencyId);
    }

    balance.cashBalance = balance.cashBalance.add(netCashChange);
    if (netNTokenChange && !netNTokenChange.isZero()) {
      if (!balance.nTokenBalance) {
        balance.nTokenBalance = netNTokenChange;
      } else {
        balance.nTokenBalance = balance.nTokenBalance.add(netNTokenChange);
      }
    }

    return accountBalances;
  }

  private static _updateAsset(portfolio: Asset[], asset: Asset, bitmapCurrencyId?: number) {
    const existingAsset = portfolio.find(
      (a) => a.currencyId === asset.currencyId && a.assetType === asset.assetType && a.maturity === asset.maturity,
    );

    if (existingAsset) {
      existingAsset.notional = existingAsset.notional.add(asset.notional);
    } else {
      if (bitmapCurrencyId && bitmapCurrencyId !== asset.currencyId) throw Error('Asset is not bitmap currency');
      if (bitmapCurrencyId && portfolio.length === MAX_BITMAP_ASSETS) throw Error('Max bitmap assets');
      if (!bitmapCurrencyId && portfolio.length === MAX_PORTFOLIO_ASSETS) throw Error('Max portfolio assets');
      portfolio.push(asset);

      // Sorting is done in place
      portfolio.sort(
        (a, b) => a.currencyId - b.currencyId
          || assetTypeNum(a.assetType) - assetTypeNum(b.assetType)
          || a.maturity - b.maturity,
      );
    }

    return portfolio;
  }
}
