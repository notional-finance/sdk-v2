import {BigNumber, ethers} from 'ethers';
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
import TypedBigNumber, {BigNumberType} from '../libs/TypedBigNumber';

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

  public destroy() {
    if (this.accountRefreshInterval) clearIntervalAsync(this.accountRefreshInterval);
    if (this.accountBlocknativeListener) this.accountBlocknativeListener.off('txConfirmed');
  }

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

  public async refreshWalletBalances() {
    const promises = System.getSystem()
      .getAllCurrencies()
      .reduce((p, c) => {
        if (c.id === ETHER_CURRENCY_ID) {
          // Special handling for ETH balance
          p.push(
            this.provider.getBalance(this.address).then((b) => ({
              currencyId: ETHER_CURRENCY_ID,
              balance: b as BigNumber,
              allowance: ethers.constants.MaxUint256 as BigNumber,
              isUnderlying: true,
            })),
          );
        }

        if (c.underlyingContract) {
          p.push(this.fetchBalanceAndAllowance(c.id, c.underlyingContract, true));
        }

        p.push(this.fetchBalanceAndAllowance(c.id, c.contract, false));
        return p;
      }, new Array<ReturnType<AccountRefresh['fetchBalanceAndAllowance']>>());

    const balances = await Promise.all(promises);
    const block = await this.provider.getBlock('latest');
    let walletDidUpdate = false;

    balances.forEach((v) => {
      const currency = System.getSystem().getCurrencyById(v.currencyId);
      const symbol = v.isUnderlying ? currency.underlyingSymbol! : currency.symbol;
      const existingBalance = this.walletBalanceBySymbol(symbol);
      const bnType = v.isUnderlying ? BigNumberType.ExternalUnderlying : BigNumberType.ExternalAsset;

      if (existingBalance && !existingBalance.balance.n.eq(v.balance)) {
        this.eventEmitter.emit(AccountEvents.WALLET_BALANCE_UPDATE, symbol, v.balance);
        walletDidUpdate = true;
      }

      if (existingBalance && !existingBalance.allowance.n.eq(v.allowance)) {
        this.eventEmitter.emit(AccountEvents.WALLET_ALLOWANCE_UPDATE, symbol, v.allowance);
        walletDidUpdate = true;
      }

      this._walletBalances.set(symbol, {
        lastUpdateBlockNumber: block.number,
        lastUpdateTime: new Date(block.timestamp * 1000),
        currencyId: v.currencyId,
        symbol,
        balance: TypedBigNumber.from(v.balance, bnType, symbol),
        allowance: TypedBigNumber.from(v.allowance, bnType, symbol),
        isUnderlying: v.isUnderlying,
      });
    });

    if (walletDidUpdate) this.eventEmitter.emit(AccountEvents.WALLET_BALANCE_REFRESH, this);
  }

  private async fetchBalanceAndAllowance(currencyId: number, contract: ERC20, isUnderlying: boolean) {
    const proxyAddress = this.notionalProxy.address;

    // prettier-ignore
    return contract.balanceOf(this.address).then((b) => contract.allowance(this.address, proxyAddress).then((a) => ({
      currencyId,
      balance: b as BigNumber,
      allowance: a as BigNumber,
      isUnderlying,
    })));
  }
}
