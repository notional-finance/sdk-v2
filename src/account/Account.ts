// prettier-ignore
import {
  BigNumber, ethers, Overrides, Signer,
} from 'ethers';
import {System} from '../system';
import {Notional as NotionalTypechain} from '../typechain/Notional';
import AccountRefresh from './AccountRefresh';
import GraphClient from '../GraphClient';
import BalanceSummary from './BalanceSummary';
import AssetSummary from './AssetSummary';
import {ERC20} from '../typechain/ERC20';
import TypedBigNumber, {BigNumberType} from '../libs/TypedBigNumber';
import {getNowSeconds} from '../libs/utils';

export default class Account extends AccountRefresh {
  private constructor(
    address: string,
    provider: ethers.providers.JsonRpcBatchProvider,
    notionalProxy: NotionalTypechain,
    private graphClient: GraphClient,
  ) {
    super(address, provider, notionalProxy);
  }

  /**
   * Loads an account object
   *
   * @param signer
   * @param provider
   * @param system
   * @returns
   */
  public static async load(
    signer: string | Signer,
    provider: ethers.providers.JsonRpcBatchProvider,
    system: System,
    graphClient: GraphClient,
  ) {
    let address: string;
    let notionalProxy = system.getNotionalProxy();

    if (typeof signer === 'string') {
      address = signer;
    } else {
      try {
        address = await signer.getAddress();
      } catch {
        address = ethers.constants.AddressZero;
      }
      notionalProxy = notionalProxy.connect(signer);
    }

    const account = new Account(address, provider, notionalProxy, graphClient);
    await account.refresh();

    return account;
  }

  /**
   * Returns a summary of an account's balances with historical transactions and internal return rate
   */
  public async getBalanceSummary() {
    if (!this.accountData) {
      return {
        balanceSummary: [],
        balanceHistory: [],
      };
    }

    const balanceHistory = await BalanceSummary.fetchBalanceHistory(this.address, this.graphClient);
    const balanceSummary = BalanceSummary.build(this.accountData, balanceHistory);
    return {balanceHistory, balanceSummary};
  }

  /**
   * Returns the tradeHistory and assetSummary for an account
   */
  public async getAssetSummary() {
    if (!this.accountData) {
      return {
        assetSummary: [],
        tradeHistory: [],
      };
    }

    const tradeHistory = await AssetSummary.fetchTradeHistory(this.address, this.graphClient);
    const assetSummary = AssetSummary.build(this.accountData, tradeHistory);
    return {tradeHistory, assetSummary};
  }

  /**
   * Returns the amount of deposit required and the amount of cash balance that will be applied
   * to a given trade.
   *
   * @param symbol
   * @param netCashRequiredInternal
   * @returns
   */
  public getNetCashAmount(symbol: string, netCashRequiredInternal: TypedBigNumber) {
    const currency = System.getSystem().getCurrencyBySymbol(symbol);
    const isUnderlying = currency.underlyingSymbol === symbol;
    const cashBalance = this.accountData?.cashBalance(currency.id)
      || TypedBigNumber.from(0, BigNumberType.InternalAsset, currency.symbol);
    const assetCashRequired = netCashRequiredInternal.toAssetCash(true);

    if (netCashRequiredInternal.isNegative()) throw new Error('Net cash required must be positive');

    if (assetCashRequired.gt(cashBalance)) {
      const depositAmount = assetCashRequired.sub(cashBalance);

      return {
        // External amounts
        depositAmount: isUnderlying ? depositAmount.toUnderlying(false) : depositAmount.toAssetCash(false),
        cashBalanceApplied: cashBalance,
      };
    }
    return {
      depositAmount: TypedBigNumber.from(
        0,
        isUnderlying ? BigNumberType.ExternalUnderlying : BigNumberType.ExternalAsset,
        symbol,
      ),
      cashBalanceApplied: netCashRequiredInternal,
    };
  }

  /**
   * Determines if the account has sufficient cash to complete a given trade
   *
   * @param symbol symbol of cash denomination
   * @param netCashRequiredInternal the total amount of positive cash required to complete the transaction
   * @param useCashBalance true if internal cash balances should be used to net off against the total (default: true)
   * @returns
   */
  public hasSufficientCash(symbol: string, netCashRequiredInternal: TypedBigNumber, useCashBalance = true) {
    const walletBalance = this.walletBalanceBySymbol(symbol);

    // Net cash required cannot be negative, this would result in negative account balances
    if (!walletBalance || netCashRequiredInternal.isNegative()) return false;
    if (useCashBalance) {
      const {depositAmount} = this.getNetCashAmount(symbol, netCashRequiredInternal);
      return walletBalance.balance.gte(depositAmount);
    }

    const netCashNativeAmount = walletBalance.isUnderlying
      ? netCashRequiredInternal.toUnderlying()
      : netCashRequiredInternal.toAssetCash();

    return walletBalance.balance.gte(netCashNativeAmount.toExternalPrecision());
  }

  /**
   * Checks if the account has sufficient allowance for the deposit amount
   *
   * @param symbol
   * @param depositAmount
   * @returns
   */
  public hasAllowance(symbol: string, depositAmount: TypedBigNumber) {
    const walletBalance = this.walletBalanceBySymbol(symbol);
    if (!walletBalance || depositAmount.isNegative()) return false;
    return walletBalance.allowance.gte(depositAmount);
  }

  /**
   * Checks if the account has sufficient allowance for the deposit amount
   *
   * @param symbol
   * @param depositAmount
   * @returns
   */
  public async hasAllowanceAsync(symbol: string, depositAmount: TypedBigNumber) {
    const allowance = await this.getAllowance(symbol);
    return allowance.gte(depositAmount);
  }

  /**
   * Returns the transfer allowance for a given currency symbol
   * @returns BigNumber
   */
  private async getAllowance(symbol: string) {
    if (symbol === 'ETH') {
      return TypedBigNumber.from(ethers.constants.MaxUint256, BigNumberType.ExternalUnderlying, 'ETH');
    }

    const currency = System.getSystem().getCurrencyBySymbol(symbol);
    const contract = currency.symbol === symbol ? currency.contract : (currency.underlyingContract as ERC20);
    const allowance = await contract.allowance(this.address, this.notionalProxy.address);
    return TypedBigNumber.from(allowance, BigNumberType.ExternalUnderlying, symbol);
  }

  /**
   * Sends a populated transaction
   *
   * @param txn a populated transaction
   * @returns a pending transaction object
   */
  public async sendTransaction(txn: ethers.PopulatedTransaction) {
    // eslint-disable-next-line no-param-reassign
    txn.from = this.address;
    return this.notionalProxy.signer.sendTransaction(txn);
  }

  /**
   * Sets the ERC20 token allowance on the given symbol
   *
   * @param symbol
   * @param amount
   * @param overrides
   * @returns
   */
  public async setAllowance(symbol: string, amount: BigNumber, overrides = {} as Overrides) {
    const currency = System.getSystem().getCurrencyBySymbol(symbol);
    const contract = currency.symbol === symbol ? currency.contract : (currency.underlyingContract as ERC20);
    const allowance = await this.getAllowance(symbol);
    if (!allowance.isZero() && !amount.isZero()) {
      throw new Error(`Resetting allowance from ${allowance.toString()}, first set allowance to zero`);
    }

    return contract.populateTransaction.approve(this.notionalProxy.address, amount, overrides);
  }

  public async fetchClaimableIncentives(account: string, blockTime = getNowSeconds()) {
    return this.notionalProxy.connect(account).nTokenGetClaimableIncentives(account, blockTime);
  }
}
