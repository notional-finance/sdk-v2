import {BigNumber, utils} from 'ethers';
import {MAX_BALANCES, MAX_BITMAP_ASSETS, MAX_PORTFOLIO_ASSETS} from '../config/constants';
import TypedBigNumber, {BigNumberType} from '../libs/TypedBigNumber';
import {Asset, AssetType, Balance} from '../libs/types';
import {assetTypeNum, convertAssetType, getNowSeconds} from '../libs/utils';
import {System, CashGroup} from '../system';

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

  public static parsePortfolio(portfolio: AssetResult[], system: System): Asset[] {
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

  public static parseBalances(accountBalances: BalanceResult[], system: System): Balance[] {
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
      })
      .filter((b) => b.currencyId !== 0);
  }

  public static async load(result: GetAccountResult): Promise<AccountData> {
    const system = System.getSystem();
    const portfolio = AccountData.parsePortfolio(result.portfolio, system);
    const balances = AccountData.parseBalances(result.accountBalances, system);

    // eslint-disable-next-line
    const bitmapCurrencyId =
      result.accountContext.bitmapCurrencyId === 0 ? undefined : result.accountContext.bitmapCurrencyId;

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

    return new AccountData(
      result.accountContext.nextSettleTime,
      result.accountContext.hasDebt === '0x02' || result.accountContext.hasDebt === '0x03',
      result.accountContext.hasDebt === '0x01' || result.accountContext.hasDebt === '0x03',
      bitmapCurrencyId,
      balances,
      portfolio,
      false,
    );
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
    // eslint-disable-next-line no-underscore-dangle
    this.portfolio = AccountData._updateAsset(this.portfolio, asset, this.bitmapCurrencyId);
    const {symbol} = System.getSystem().getCurrencyById(asset.currencyId);

    // Do this to ensure that there is a balance slot set for the asset
    this.updateBalance(asset.currencyId, TypedBigNumber.from(0, BigNumberType.InternalAsset, symbol));
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
