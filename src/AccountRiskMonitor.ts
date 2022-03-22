import {BigNumber} from 'ethers';
import {Market, CashGroup} from './system';
import Notional, {
  EthRate, AccountData, AssetType, Currency, Asset,
} from '.';

type CurrencyChangesSimulationResult = Array<{
  scenario: Array<{percentage: number; currency: Currency}>;
  accounts: Array<{accountId: string; accountData: AccountData}>;
}>;

type DebtSettlementSimulationResult = Array<{
  accountId: string;
  accountData: AccountData;
  positionsAtRisk: Asset[];
}>;

/**
 * Runs risk simulations for all accounts on Notional.
 */
export default class AccountRiskMonitor {
  public readonly originalCashGroups: Map<number, CashGroup>;

  public readonly originalMarkets = new Map<string, Market>();

  public readonly originalETHRates: Map<number, {ethRateConfig?: EthRate; ethRate?: BigNumber}>;

  constructor(public readonly notional: Notional, private readonly accounts: Map<string, AccountData>) {
    this.originalETHRates = new Map(
      this.notional.system
        .getAllCurrencies()
        .map((currency) => [currency.id, this.notional.system.getETHRate(currency.id)]),
    );
    this.originalCashGroups = this.getAllCashGroups();
    // eslint-disable-next-line no-restricted-syntax
    for (const cashGroup of this.originalCashGroups.values()) {
      // eslint-disable-next-line no-restricted-syntax
      for (const market of cashGroup.markets) {
        this.originalMarkets.set(market.marketKey, market);
      }
    }
  }

  static async load(): Promise<AccountRiskMonitor> {
    // @ts-ignore
    const sdk = await Notional.load(1, null);
    const allAccounts = await sdk.getAccountsFromGraph();

    return new AccountRiskMonitor(sdk, allAccounts);
  }

  private getAllCashGroups() {
    const cashGroups = new Map(
      this.notional.system
        .getAllCurrencies()
        .map((currency) => [currency.id, this.notional.system.getCashGroup(currency.id)]),
    );
    return cashGroups;
  }

  private setExchangeRate(currencyId: number, percentage: number) {
    const {ethRateConfig, ethRate} = this.originalETHRates.get(currencyId)!;
    if (!ethRateConfig || !ethRate) {
      return;
    }
    const denominator = 10 ** 4;
    const numerator = Math.floor(percentage * denominator);
    const provider = {getETHRate: () => ({ethRateConfig, ethRate: ethRate.mul(numerator).div(denominator)})};
    this.notional.system.setETHRateProvider(currencyId, provider);
  }

  private getDebtPositions(accountData: AccountData, maxMaturity: number) {
    return accountData.portfolio.filter(
      (a) => a.assetType === AssetType.fCash && a.notional.isNegative() && maxMaturity >= a.maturity,
    );
  }

  private getAccountNetFreeCollateral(accountData: AccountData) {
    const {netETHDebtWithBuffer, netETHCollateralWithHaircut} = accountData.getFreeCollateral();
    return netETHCollateralWithHaircut.sub(netETHDebtWithBuffer);
  }

  private resetNotionalSDKState() {
    this.notional.system.clearMarketProviders();
    this.notional.system.clearAssetRateProviders();
    this.notional.system.clearETHRateProviders();
  }

  /**
   * Get accounts that have at least one debt position at risk of getting settled.
   * Returns the account along with the positions at risk.
   *
   * @param threshold Time before settlement, in seconds.
   */
  private getAccountsWithNegativeNetFreeCollateral() {
    return [...this.accounts]
      .filter(
        // eslint-disable-next-line max-len
        ([_, accountData]) => accountData.hasAssetDebt && this.getAccountNetFreeCollateral(accountData).isNegative(),
      )
      .map(([accountId, accountData]) => ({accountId, accountData}));
  }

  /**
   * Get currency change scenarios to test accounts against.
   * @returns List of scenarios, comprised of percentage changes for all currencies
   */
  private getCurrencyChangeScenarios(): Array<Array<{percentage: number; currency: Currency}>> {
    // Matrix of scenarios to be tested.
    const scenarios: Array<Array<number>> = [
      [-10, 0, 0, 0], // -10% Eth
      [-10, 0, 0, -10], // -10% ETH, -10% BTC
      [0, 0, 0, -10], // -10% BTC
      [10, 0, 0, 0], // +10% ETH
      [10, 0, 0, 10], // +10% ETH, +10% BTC
      [0, 0, 0, 10], // +10% BTC
      [-5, 0, 0, 5], // -5% ETH, +5% BTC
      [5, 0, 0, -5], // +5% ETH, -5% BTC
    ];
    const currencies = this.notional.system.getAllCurrencies();
    return scenarios.map((scenario) => scenario.map((percentage, i) => ({
      percentage,
      currency: currencies.find((currency) => currency.id === i + 1)!,
    })));
  }

  /**
   * Get accounts that have at least one debt position at risk of getting settled.
   * Returns the account along with the positions at risk.
   *
   * @param timeBeforeMaturity Time before maturity, in seconds.
   */
  simulateDebtSettlement(timeBeforeMaturity: number): DebtSettlementSimulationResult {
    const nowUnixTimestamp = new Date().getTime() / 1000;

    const maxMaturity = nowUnixTimestamp + timeBeforeMaturity;
    return [...this.accounts]
      .map(([accountId, accountData]) => ({
        accountId,
        accountData,
        positionsAtRisk: this.getDebtPositions(accountData, maxMaturity),
      }))
      .filter(({positionsAtRisk}) => positionsAtRisk.length > 0);
  }

  /**
   * Get accounts that are at risk of holding net negative free collateral given a series of
   * currency change scenarios.
   *
   * @returns For every tested scenarios, list of accounts that are at risk.
   */
  simulateCurrencyChanges(): CurrencyChangesSimulationResult {
    const scenarios = this.getCurrencyChangeScenarios();
    const results = scenarios.map((scenario) => {
      scenario.forEach(({currency, percentage}) => this.setExchangeRate(currency.id, (100 + percentage) / 100));
      const accounts = this.getAccountsWithNegativeNetFreeCollateral();
      return {scenario, accounts};
    });
    this.resetNotionalSDKState();
    return results;
  }
}
