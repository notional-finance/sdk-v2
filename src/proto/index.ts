import { BigNumber } from 'ethers';
import { TypedBigNumber } from '..';
import {
  AssetRate,
  CashGroup,
  Currency,
  ETHRate,
  nToken,
  SerializedBigNumber,
  SerializedTypedBigNumber,
  sNOTE,
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

export interface SystemData {
  network: string;
  lastUpdateBlockNumber: number;
  lastUpdateTimestamp: number;
  USDExchangeRates: { [key: string]: BigNumber };
  StakedNoteParameters: Rewrite<sNOTE>;
  currencies: { [key: number]: DeepRequired<Currency, null> };
  ethRateData: { [key: number]: Rewrite<ETHRate> };
  assetRateData: { [key: number]: Rewrite<AssetRate> };
  nTokenData: { [key: number]: Rewrite<nToken> };
  cashGroups: { [key: number]: Rewrite<CashGroup> };
}
