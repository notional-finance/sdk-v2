import { BigNumber } from 'ethers';
import { TypedBigNumber } from '..';

import { TypedBigNumber as TBN, BigNumber as BN, SystemData as SystemDataProto } from './SystemProto';

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

export interface SystemDataExport
  extends DeepRequired<
    Replaced<Replaced<SystemDataProto, TBN, TypedBigNumber>, BN, BigNumber, Primitive | TypedBigNumber>,
    TypedBigNumber | BigNumber
  > {}
