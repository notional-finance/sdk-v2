import {BigNumber, ethers, providers} from 'ethers';
import {EventEmitter} from 'eventemitter3';
import BlocknativeSdk from 'bnc-sdk';
import {setIntervalAsync, clearIntervalAsync} from 'set-interval-async/fixed';
import {SetIntervalAsyncTimer} from 'set-interval-async';
import {Emitter} from 'bnc-sdk/dist/types/src/interfaces';
import {Notional as NotionalTypechain} from '../typechain/Notional';
import {System} from '../system';
import AccountData from './AccountData';
import {WalletBalance} from '../libs/types';
import {ETHER_CURRENCY_ID} from '../config/constants';
import {ERC20} from '../typechain/ERC20';
import TypedBigNumber from '../libs/TypedBigNumber';

const {AddressZero, MaxUint256} = ethers.constants;

export enum AccountEvents {
  ACCOUNT_DATA_REFRESH = 'ACCOUNT_DATA_REFRESH',
  WALLET_BALANCE_REFRESH = 'WALLET_BALANCE_REFRESH',
  WALLET_BALANCE_UPDATE = 'WALLET_BALANCE_UPDATE',
  WALLET_ALLOWANCE_UPDATE = 'WALLET_ALLOWANCE_UPDATE',
  ACCOUNT_TRANSACTION_MINED = 'ACCOUNT_TRANSACTION_MINED',
}

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

/**
 * Manages refresh intervals for an Account. An Account has two sets of data, one is the
 * Notional related balances and the other is a set of balances in it's Wallet
 */
export default abstract class AccountRefresh {
  public eventEmitter = new EventEmitter();
  private _lastUpdateBlockNumber: number = 0;
  private _lastUpdateTime: Date = new Date(0);
  private _accountData?: AccountData;
  private _lastAccountHash?: string;
  private _walletBalances = new Map<string, WalletBalance>();
  private accountRefreshInterval?: SetIntervalAsyncTimer;
  private accountBlocknativeListener?: Emitter;

  get lastUpdateBlockNumber() {
    return this._lastUpdateBlockNumber;
  }

  get lastUpdateTime() {
    return this._lastUpdateTime;
  }

  get accountData() {
    return this._accountData;
  }

  get walletBalances() {
    return Array.from(this._walletBalances.values());
  }

  public walletBalanceBySymbol(symbol: string) {
    return this._walletBalances.get(symbol);
  }

  constructor(
    public address: string,
    protected provider: ethers.providers.JsonRpcBatchProvider,
    protected notionalProxy: NotionalTypechain,
  ) {}

  /**
   * Enables a refresh of the account's wallet balances
   * @param opts
   */
  public enableRefresh(opts: {pollingIntervalMs?: number; blockNativeSDK?: BlocknativeSdk}) {
    if (opts.pollingIntervalMs) {
      this.accountRefreshInterval = setIntervalAsync(async () => {
        await this.refresh();
      }, opts.pollingIntervalMs);
    }

    if (opts.blockNativeSDK) {
      const {emitter} = opts.blockNativeSDK.account(this.address);
      emitter.on('txConfirmed', () => {
        this.refresh();
      });
      this.accountBlocknativeListener = emitter;
    }
  }

  public async refreshAccountData() {
    try {
      const data = await this.notionalProxy.getAccount(this.address).then((r) => AccountData.loadFromBlockchain(r));
      this._accountData = data;
    } catch (e) {
      throw new Error(`Failed to refresh account data for ${this.address}`);
    }
  }

  /**
   * Clears the account's update listeners
   */
  public destroy() {
    if (this.accountRefreshInterval) clearIntervalAsync(this.accountRefreshInterval);
    if (this.accountBlocknativeListener) this.accountBlocknativeListener.off('txConfirmed');
  }

  /**
   * Refreshes both the Notional account data as well as the Account's wallet data
   */
  public async refresh() {
    const [accountResult, block] = await Promise.all([
      this.notionalProxy.getAccount(this.address).then((r) => AccountData.loadFromBlockchain(r)),
      this.provider.getBlock('latest'),
      this.refreshWalletBalances(),
    ]);

    const newHash = accountResult.getHash();
    this._accountData = accountResult;
    if (this._lastAccountHash !== newHash) {
      // Only emit an event if the account hash has changed
      this.eventEmitter.emit(AccountEvents.ACCOUNT_DATA_REFRESH, this);
      this._lastAccountHash = newHash;
    }

    this._lastUpdateBlockNumber = block.number;
    this._lastUpdateTime = new Date(block.timestamp * 1000);
  }

  /**
   * Refreshes only the Account's wallet data
   */
  public async refreshWalletBalances() {
    // Gets wallet balances and allowances for listed currencies on Notional
    const system = System.getSystem();
    const block = await this.provider.getBlock('latest');
    const listedCurrencies = system.getAllCurrencies();
    const updatedCurrencies = (
      await Promise.all(
        listedCurrencies
          .flatMap((c) => {
            const spender = this.notionalProxy.address;
            if (c.id === ETHER_CURRENCY_ID) {
              return [
                // Special handling for ETH balance (spender is irrelevant)
                this.provider
                  .getBalance(this.address)
                  .then((b) => this.updateWalletBalance('ETH', AddressZero, block, b, MaxUint256)),
                // This is for cETH
                this.fetchBalanceAndAllowance(c.symbol, c.contract, spender, block),
              ];
            }
            if (c.underlyingContract) {
              // Fetch both underlying and asset token
              return [
                this.fetchBalanceAndAllowance(c.underlyingSymbol!, c.underlyingContract, spender, block),
                this.fetchBalanceAndAllowance(c.symbol, c.contract, spender, block),
              ];
            }
            // Fetch just asset token
            return this.fetchBalanceAndAllowance(c.symbol, c.contract, spender, block);
          })
          // Fetch balances specific to staking
          .concat(
            this.fetchBalanceAndAllowance('NOTE', system.getNOTE() as ERC20, system.getStakedNote().address, block),
            this.fetchBalanceAndAllowance('WETH', system.getWETH() as ERC20, system.getStakedNote().address, block),
            this.fetchBalanceAndAllowance('sNOTE', system.getStakedNote() as ERC20, AddressZero, block),
          ),
      )
    ).filter((v) => v !== null) as string[];

    if (updatedCurrencies.length) {
      this.eventEmitter.emit(AccountEvents.WALLET_BALANCE_REFRESH, this, updatedCurrencies);
    }
  }

  private async fetchBalanceAndAllowance(symbol: string, contract: ERC20, spender: string, block: providers.Block) {
    return Promise.all([contract.balanceOf(this.address), contract.allowance(this.address, spender)]).then(
      ([_balance, _allowance]) => this.updateWalletBalance(symbol, spender, block, _balance, _allowance),
    );
  }

  private async updateWalletBalance(
    symbol: string,
    spender: string,
    block: providers.Block,
    _balance: BigNumber,
    _allowance: BigNumber,
  ) {
    let didUpdate = false;
    const balance = TypedBigNumber.fromBalance(_balance, symbol, false);
    const allowance = TypedBigNumber.fromBalance(_allowance, symbol, false);
    const existingBalance = this.walletBalanceBySymbol(symbol);

    if (existingBalance && !existingBalance.balance.eq(balance)) {
      this.eventEmitter.emit(AccountEvents.WALLET_BALANCE_UPDATE, symbol, balance);
      didUpdate = true;
    }

    if (existingBalance && !existingBalance.allowance.eq(allowance)) {
      this.eventEmitter.emit(AccountEvents.WALLET_ALLOWANCE_UPDATE, symbol, allowance, spender);
      didUpdate = true;
    }

    this._walletBalances.set(symbol, {
      lastUpdateBlockNumber: block.number,
      lastUpdateTime: new Date(block.timestamp * 1000),
      currencyId: balance.currencyId,
      symbol,
      balance,
      allowance,
      spender,
      isUnderlying: balance.isUnderlying(),
    });

    // Return the symbol if we did update
    return didUpdate ? symbol : null;
  }
}
