import { BigNumber, Contract } from 'ethers';
import { AssetType, TypedBigNumber } from '..';
import { AssetRateAggregator, ERC20, NTokenERC20, IAggregator } from '../typechain';
import {
  Asset as _Asset,
  AssetRate as _AssetRate,
  CashGroup as _CashGroup,
  Currency as _Currency,
  ETHRate as _ETHRate,
  nToken as _nToken,
  SerializedBigNumber,
  SerializedContract,
  SerializedTypedBigNumber,
  sNOTE as _sNOTE,
  VaultConfig as _VaultConfig,
  VaultState as _VaultState,
  VaultHistoricalValue as _VaultHistoricalValue,
} from './encoding/SystemProto';

type DeepRequired<T, TIgnore> = T extends object | TIgnore
  ? T extends TIgnore
    ? T
    : {
        readonly [P in keyof T]-?: DeepRequired<T[P], TIgnore>;
      }
  : Required<T>;

type Primitive = string | number | bigint | boolean | null | undefined;

type Replaced<T, TReplace, TWith, TKeep = Primitive> = T extends TReplace | TKeep
  ? T extends TReplace
    ? TWith | Exclude<T, TReplace>
    : T
  : {
      [P in keyof T]: Replaced<T[P], TReplace, TWith, TKeep>;
    };

type RewriteRequired<T> = DeepRequired<Rewrite<T>, BigNumber | TypedBigNumber | Contract>;

type Rewrite<T> = Replaced<
  Replaced<
    Replaced<T, SerializedBigNumber, BigNumber, Primitive>,
    SerializedTypedBigNumber,
    TypedBigNumber,
    Primitive | BigNumber
  >,
  SerializedContract,
  Contract,
  Primitive | BigNumber | TypedBigNumber
>;

export type StakedNoteParameters = RewriteRequired<_sNOTE>;
export type Currency = Omit<RewriteRequired<_Currency>, 'assetContract' | 'underlyingContract'> & {
  readonly assetContract: ERC20;
  readonly underlyingContract: ERC20;
};
export type ETHRate = Omit<RewriteRequired<_ETHRate>, 'rateOracle'> & { readonly rateOracle: IAggregator };
export type AssetRate = Omit<RewriteRequired<_AssetRate>, 'rateAdapter'> & {
  readonly rateAdapter: AssetRateAggregator;
};
export type nToken = Omit<RewriteRequired<_nToken>, 'contract'> & { readonly contract: NTokenERC20 };
export type CashGroupData = RewriteRequired<_CashGroup>;
export type Asset = Omit<RewriteRequired<_Asset>, 'assetType'> & { readonly assetType: AssetType };
export type VaultHistoricalValue = RewriteRequired<_VaultHistoricalValue>;
export type VaultState = Omit<
  Rewrite<_VaultState>,
  | 'maturity'
  | 'isSettled'
  | 'totalPrimaryfCashBorrowed'
  | 'totalAssetCash'
  | 'totalVaultShares'
  | 'totalStrategyTokens'
  | 'historicalValue'
> & {
  readonly maturity: number;
  readonly isSettled: boolean;
  readonly totalPrimaryfCashBorrowed: TypedBigNumber;
  readonly totalAssetCash: TypedBigNumber;
  readonly totalVaultShares: TypedBigNumber;
  readonly totalStrategyTokens: TypedBigNumber;
  readonly historicalValue: VaultHistoricalValue;
};

export type VaultConfig = Omit<
  RewriteRequired<_VaultConfig>,
  'secondaryBorrowCurrencies' | 'maxSecondaryBorrowCapacity' | 'totalUsedSecondaryBorrowCapacity' | 'activeVaultStates'
> & {
  readonly secondaryBorrowCurrencies?: number[];
  readonly maxSecondaryBorrowCapacity?: TypedBigNumber[];
  readonly totalUsedSecondaryBorrowCapacity?: TypedBigNumber[];
  readonly activeVaultStates: VaultState[];
};

export interface SystemData {
  network: string;
  lastUpdateBlockNumber: number;
  lastUpdateTimestamp: number;
  USDExchangeRates: Map<string, BigNumber>;
  StakedNoteParameters: StakedNoteParameters;
  currencies: Map<number, Currency>;
  ethRateData: Map<number, ETHRate>;
  assetRateData: Map<number, AssetRate>;
  nTokenData: Map<number, nToken>;
  cashGroups: Map<number, CashGroupData>;
  vaults: Map<string, VaultConfig>;
}
