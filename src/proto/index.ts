import { BigNumber } from 'ethers';
import { TypedBigNumber } from '..';
import {
  AssetRate as _AssetRate,
  CashGroup as _CashGroup,
  Currency as _Currency,
  ETHRate as _ETHRate,
  nToken as _nToken,
  SerializedBigNumber,
  SerializedTypedBigNumber,
  sNOTE as _sNOTE,
} from './SystemProto';

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
    Replaced<T, SerializedBigNumber, BigNumber, Primitive>,
    SerializedTypedBigNumber,
    TypedBigNumber,
    Primitive | BigNumber
  >,
  BigNumber | TypedBigNumber
>;

export type StakedNoteParameters = Rewrite<_sNOTE>;
export type Currency = DeepRequired<_Currency, null>;
export type ETHRate = Rewrite<_ETHRate>;
export type AssetRate = Rewrite<_AssetRate>;
export type nToken = Rewrite<_nToken>;
export type CashGroupData = Rewrite<_CashGroup>;

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
