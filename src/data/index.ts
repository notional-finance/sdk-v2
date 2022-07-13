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

type Rewrite<T> = DeepRequired<
  Replaced<
    Replaced<
      Replaced<T, SerializedBigNumber, BigNumber, Primitive>,
      SerializedTypedBigNumber,
      TypedBigNumber,
      Primitive | BigNumber
    >,
    SerializedContract,
    Contract,
    Primitive | BigNumber | TypedBigNumber
  >,
  BigNumber | TypedBigNumber | Contract
>;

export type StakedNoteParameters = Rewrite<_sNOTE>;
export type Currency = Omit<Omit<Rewrite<_Currency>, 'assetContract'>, 'underlyingContract'> & {
  assetContract: ERC20;
  underlyingContract: ERC20;
};
export type ETHRate = Omit<Rewrite<_ETHRate>, 'rateOracle'> & { rateOracle: IAggregator };
export type AssetRate = Omit<Rewrite<_AssetRate>, 'rateAdapter'> & { rateAdapter: AssetRateAggregator };
export type nToken = Omit<Rewrite<_nToken>, 'contract'> & { contract: NTokenERC20 };
export type CashGroupData = Rewrite<_CashGroup>;
export type Asset = Omit<Rewrite<_Asset>, 'assetType'> & { assetType: AssetType };

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
}
