// @ts-nocheck
export interface CacheRequest {
  network?: string;
}

export function encodeCacheRequest(message: CacheRequest): Uint8Array {
  let bb = popByteBuffer();
  _encodeCacheRequest(message, bb);
  return toUint8Array(bb);
}

function _encodeCacheRequest(message: CacheRequest, bb: ByteBuffer): void {
  // optional string network = 1;
  let $network = message.network;
  if ($network !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $network);
  }
}

export function decodeCacheRequest(binary: Uint8Array): CacheRequest {
  return _decodeCacheRequest(wrapByteBuffer(binary));
}

function _decodeCacheRequest(bb: ByteBuffer): CacheRequest {
  let message: CacheRequest = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string network = 1;
      case 1: {
        message.network = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface BigNumber {
  _isBigNumber?: boolean;
  _hex?: string;
}

export function encodeBigNumber(message: BigNumber): Uint8Array {
  let bb = popByteBuffer();
  _encodeBigNumber(message, bb);
  return toUint8Array(bb);
}

function _encodeBigNumber(message: BigNumber, bb: ByteBuffer): void {
  // optional bool _isBigNumber = 1;
  let $_isBigNumber = message._isBigNumber;
  if ($_isBigNumber !== undefined) {
    writeVarint32(bb, 8);
    writeByte(bb, $_isBigNumber ? 1 : 0);
  }

  // optional string _hex = 2;
  let $_hex = message._hex;
  if ($_hex !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $_hex);
  }
}

export function decodeBigNumber(binary: Uint8Array): BigNumber {
  return _decodeBigNumber(wrapByteBuffer(binary));
}

function _decodeBigNumber(bb: ByteBuffer): BigNumber {
  let message: BigNumber = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bool _isBigNumber = 1;
      case 1: {
        message._isBigNumber = !!readByte(bb);
        break;
      }

      // optional string _hex = 2;
      case 2: {
        message._hex = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface TypedBigNumber {
  _isTypedBigNumber?: boolean;
  hex?: string;
  bigNumberType?: string;
  symbol?: string;
}

export function encodeTypedBigNumber(message: TypedBigNumber): Uint8Array {
  let bb = popByteBuffer();
  _encodeTypedBigNumber(message, bb);
  return toUint8Array(bb);
}

function _encodeTypedBigNumber(message: TypedBigNumber, bb: ByteBuffer): void {
  // optional bool _isTypedBigNumber = 1;
  let $_isTypedBigNumber = message._isTypedBigNumber;
  if ($_isTypedBigNumber !== undefined) {
    writeVarint32(bb, 8);
    writeByte(bb, $_isTypedBigNumber ? 1 : 0);
  }

  // optional string hex = 2;
  let $hex = message.hex;
  if ($hex !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $hex);
  }

  // optional string bigNumberType = 3;
  let $bigNumberType = message.bigNumberType;
  if ($bigNumberType !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $bigNumberType);
  }

  // optional string symbol = 4;
  let $symbol = message.symbol;
  if ($symbol !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $symbol);
  }
}

export function decodeTypedBigNumber(binary: Uint8Array): TypedBigNumber {
  return _decodeTypedBigNumber(wrapByteBuffer(binary));
}

function _decodeTypedBigNumber(bb: ByteBuffer): TypedBigNumber {
  let message: TypedBigNumber = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bool _isTypedBigNumber = 1;
      case 1: {
        message._isTypedBigNumber = !!readByte(bb);
        break;
      }

      // optional string hex = 2;
      case 2: {
        message.hex = readString(bb, readVarint32(bb));
        break;
      }

      // optional string bigNumberType = 3;
      case 3: {
        message.bigNumberType = readString(bb, readVarint32(bb));
        break;
      }

      // optional string symbol = 4;
      case 4: {
        message.symbol = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface sNOTE {
  poolId?: string;
  coolDownTimeInSeconds?: number;
  redeemWindowSeconds?: number;
  ethBalance?: TypedBigNumber;
  noteBalance?: TypedBigNumber;
  balancerPoolTotalSupply?: BigNumber;
  sNOTEBptBalance?: BigNumber;
  swapFee?: BigNumber;
  sNOTETotalSupply?: TypedBigNumber;
}

export function encodesNOTE(message: sNOTE): Uint8Array {
  let bb = popByteBuffer();
  _encodesNOTE(message, bb);
  return toUint8Array(bb);
}

function _encodesNOTE(message: sNOTE, bb: ByteBuffer): void {
  // optional string poolId = 1;
  let $poolId = message.poolId;
  if ($poolId !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $poolId);
  }

  // optional int32 coolDownTimeInSeconds = 2;
  let $coolDownTimeInSeconds = message.coolDownTimeInSeconds;
  if ($coolDownTimeInSeconds !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($coolDownTimeInSeconds));
  }

  // optional int32 redeemWindowSeconds = 3;
  let $redeemWindowSeconds = message.redeemWindowSeconds;
  if ($redeemWindowSeconds !== undefined) {
    writeVarint32(bb, 24);
    writeVarint64(bb, intToLong($redeemWindowSeconds));
  }

  // optional TypedBigNumber ethBalance = 4;
  let $ethBalance = message.ethBalance;
  if ($ethBalance !== undefined) {
    writeVarint32(bb, 34);
    let nested = popByteBuffer();
    _encodeTypedBigNumber($ethBalance, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional TypedBigNumber noteBalance = 5;
  let $noteBalance = message.noteBalance;
  if ($noteBalance !== undefined) {
    writeVarint32(bb, 42);
    let nested = popByteBuffer();
    _encodeTypedBigNumber($noteBalance, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BigNumber balancerPoolTotalSupply = 6;
  let $balancerPoolTotalSupply = message.balancerPoolTotalSupply;
  if ($balancerPoolTotalSupply !== undefined) {
    writeVarint32(bb, 50);
    let nested = popByteBuffer();
    _encodeBigNumber($balancerPoolTotalSupply, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BigNumber sNOTEBptBalance = 7;
  let $sNOTEBptBalance = message.sNOTEBptBalance;
  if ($sNOTEBptBalance !== undefined) {
    writeVarint32(bb, 58);
    let nested = popByteBuffer();
    _encodeBigNumber($sNOTEBptBalance, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional BigNumber swapFee = 8;
  let $swapFee = message.swapFee;
  if ($swapFee !== undefined) {
    writeVarint32(bb, 66);
    let nested = popByteBuffer();
    _encodeBigNumber($swapFee, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional TypedBigNumber sNOTETotalSupply = 9;
  let $sNOTETotalSupply = message.sNOTETotalSupply;
  if ($sNOTETotalSupply !== undefined) {
    writeVarint32(bb, 74);
    let nested = popByteBuffer();
    _encodeTypedBigNumber($sNOTETotalSupply, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodesNOTE(binary: Uint8Array): sNOTE {
  return _decodesNOTE(wrapByteBuffer(binary));
}

function _decodesNOTE(bb: ByteBuffer): sNOTE {
  let message: sNOTE = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string poolId = 1;
      case 1: {
        message.poolId = readString(bb, readVarint32(bb));
        break;
      }

      // optional int32 coolDownTimeInSeconds = 2;
      case 2: {
        message.coolDownTimeInSeconds = readVarint32(bb);
        break;
      }

      // optional int32 redeemWindowSeconds = 3;
      case 3: {
        message.redeemWindowSeconds = readVarint32(bb);
        break;
      }

      // optional TypedBigNumber ethBalance = 4;
      case 4: {
        let limit = pushTemporaryLength(bb);
        message.ethBalance = _decodeTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional TypedBigNumber noteBalance = 5;
      case 5: {
        let limit = pushTemporaryLength(bb);
        message.noteBalance = _decodeTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional BigNumber balancerPoolTotalSupply = 6;
      case 6: {
        let limit = pushTemporaryLength(bb);
        message.balancerPoolTotalSupply = _decodeBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional BigNumber sNOTEBptBalance = 7;
      case 7: {
        let limit = pushTemporaryLength(bb);
        message.sNOTEBptBalance = _decodeBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional BigNumber swapFee = 8;
      case 8: {
        let limit = pushTemporaryLength(bb);
        message.swapFee = _decodeBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional TypedBigNumber sNOTETotalSupply = 9;
      case 9: {
        let limit = pushTemporaryLength(bb);
        message.sNOTETotalSupply = _decodeTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Asset {
  currencyId?: number;
  maturity?: number;
  assetType?: string;
  notional?: string;
  hasMatured?: boolean;
  settlementDate?: number;
  isIdiosyncratic?: boolean;
}

export function encodeAsset(message: Asset): Uint8Array {
  let bb = popByteBuffer();
  _encodeAsset(message, bb);
  return toUint8Array(bb);
}

function _encodeAsset(message: Asset, bb: ByteBuffer): void {
  // optional int32 currencyId = 1;
  let $currencyId = message.currencyId;
  if ($currencyId !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($currencyId));
  }

  // optional int32 maturity = 2;
  let $maturity = message.maturity;
  if ($maturity !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($maturity));
  }

  // optional string assetType = 3;
  let $assetType = message.assetType;
  if ($assetType !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $assetType);
  }

  // optional string notional = 4;
  let $notional = message.notional;
  if ($notional !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $notional);
  }

  // optional bool hasMatured = 5;
  let $hasMatured = message.hasMatured;
  if ($hasMatured !== undefined) {
    writeVarint32(bb, 40);
    writeByte(bb, $hasMatured ? 1 : 0);
  }

  // optional int32 settlementDate = 6;
  let $settlementDate = message.settlementDate;
  if ($settlementDate !== undefined) {
    writeVarint32(bb, 48);
    writeVarint64(bb, intToLong($settlementDate));
  }

  // optional bool isIdiosyncratic = 7;
  let $isIdiosyncratic = message.isIdiosyncratic;
  if ($isIdiosyncratic !== undefined) {
    writeVarint32(bb, 56);
    writeByte(bb, $isIdiosyncratic ? 1 : 0);
  }
}

export function decodeAsset(binary: Uint8Array): Asset {
  return _decodeAsset(wrapByteBuffer(binary));
}

function _decodeAsset(bb: ByteBuffer): Asset {
  let message: Asset = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 currencyId = 1;
      case 1: {
        message.currencyId = readVarint32(bb);
        break;
      }

      // optional int32 maturity = 2;
      case 2: {
        message.maturity = readVarint32(bb);
        break;
      }

      // optional string assetType = 3;
      case 3: {
        message.assetType = readString(bb, readVarint32(bb));
        break;
      }

      // optional string notional = 4;
      case 4: {
        message.notional = readString(bb, readVarint32(bb));
        break;
      }

      // optional bool hasMatured = 5;
      case 5: {
        message.hasMatured = !!readByte(bb);
        break;
      }

      // optional int32 settlementDate = 6;
      case 6: {
        message.settlementDate = readVarint32(bb);
        break;
      }

      // optional bool isIdiosyncratic = 7;
      case 7: {
        message.isIdiosyncratic = !!readByte(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface ETHRate {
  rateOracle?: string;
  rateDecimalPlaces?: number;
  mustInvert?: boolean;
  buffer?: number;
  haircut?: number;
  latestRate?: string;
}

export function encodeETHRate(message: ETHRate): Uint8Array {
  let bb = popByteBuffer();
  _encodeETHRate(message, bb);
  return toUint8Array(bb);
}

function _encodeETHRate(message: ETHRate, bb: ByteBuffer): void {
  // optional string rateOracle = 1;
  let $rateOracle = message.rateOracle;
  if ($rateOracle !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $rateOracle);
  }

  // optional int32 rateDecimalPlaces = 2;
  let $rateDecimalPlaces = message.rateDecimalPlaces;
  if ($rateDecimalPlaces !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($rateDecimalPlaces));
  }

  // optional bool mustInvert = 3;
  let $mustInvert = message.mustInvert;
  if ($mustInvert !== undefined) {
    writeVarint32(bb, 24);
    writeByte(bb, $mustInvert ? 1 : 0);
  }

  // optional int32 buffer = 4;
  let $buffer = message.buffer;
  if ($buffer !== undefined) {
    writeVarint32(bb, 32);
    writeVarint64(bb, intToLong($buffer));
  }

  // optional int32 haircut = 5;
  let $haircut = message.haircut;
  if ($haircut !== undefined) {
    writeVarint32(bb, 40);
    writeVarint64(bb, intToLong($haircut));
  }

  // optional string latestRate = 6;
  let $latestRate = message.latestRate;
  if ($latestRate !== undefined) {
    writeVarint32(bb, 50);
    writeString(bb, $latestRate);
  }
}

export function decodeETHRate(binary: Uint8Array): ETHRate {
  return _decodeETHRate(wrapByteBuffer(binary));
}

function _decodeETHRate(bb: ByteBuffer): ETHRate {
  let message: ETHRate = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string rateOracle = 1;
      case 1: {
        message.rateOracle = readString(bb, readVarint32(bb));
        break;
      }

      // optional int32 rateDecimalPlaces = 2;
      case 2: {
        message.rateDecimalPlaces = readVarint32(bb);
        break;
      }

      // optional bool mustInvert = 3;
      case 3: {
        message.mustInvert = !!readByte(bb);
        break;
      }

      // optional int32 buffer = 4;
      case 4: {
        message.buffer = readVarint32(bb);
        break;
      }

      // optional int32 haircut = 5;
      case 5: {
        message.haircut = readVarint32(bb);
        break;
      }

      // optional string latestRate = 6;
      case 6: {
        message.latestRate = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface AssetRate {
  rateAdapter?: string;
  underlyingDecimalPlaces?: number;
  latestRate?: string;
}

export function encodeAssetRate(message: AssetRate): Uint8Array {
  let bb = popByteBuffer();
  _encodeAssetRate(message, bb);
  return toUint8Array(bb);
}

function _encodeAssetRate(message: AssetRate, bb: ByteBuffer): void {
  // optional string rateAdapter = 1;
  let $rateAdapter = message.rateAdapter;
  if ($rateAdapter !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $rateAdapter);
  }

  // optional int32 underlyingDecimalPlaces = 2;
  let $underlyingDecimalPlaces = message.underlyingDecimalPlaces;
  if ($underlyingDecimalPlaces !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($underlyingDecimalPlaces));
  }

  // optional string latestRate = 3;
  let $latestRate = message.latestRate;
  if ($latestRate !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $latestRate);
  }
}

export function decodeAssetRate(binary: Uint8Array): AssetRate {
  return _decodeAssetRate(wrapByteBuffer(binary));
}

function _decodeAssetRate(bb: ByteBuffer): AssetRate {
  let message: AssetRate = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string rateAdapter = 1;
      case 1: {
        message.rateAdapter = readString(bb, readVarint32(bb));
        break;
      }

      // optional int32 underlyingDecimalPlaces = 2;
      case 2: {
        message.underlyingDecimalPlaces = readVarint32(bb);
        break;
      }

      // optional string latestRate = 3;
      case 3: {
        message.latestRate = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface nToken {
  name?: string;
  symbol?: string;
  incentiveEmissionRate?: string;
  pvHaircutPercentage?: number;
  depositShares?: string[];
  leverageThresholds?: string[];
  contract?: string;
  assetCashPV?: string;
  totalSupply?: string;
  accumulatedNOTEPerNToken?: string;
  lastAccumulatedTime?: string;
  cashBalance?: string;
  liquidityTokens?: Asset[];
  fCash?: Asset[];
}

export function encodenToken(message: nToken): Uint8Array {
  let bb = popByteBuffer();
  _encodenToken(message, bb);
  return toUint8Array(bb);
}

function _encodenToken(message: nToken, bb: ByteBuffer): void {
  // optional string name = 1;
  let $name = message.name;
  if ($name !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $name);
  }

  // optional string symbol = 2;
  let $symbol = message.symbol;
  if ($symbol !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $symbol);
  }

  // optional string incentiveEmissionRate = 3;
  let $incentiveEmissionRate = message.incentiveEmissionRate;
  if ($incentiveEmissionRate !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $incentiveEmissionRate);
  }

  // optional int32 pvHaircutPercentage = 4;
  let $pvHaircutPercentage = message.pvHaircutPercentage;
  if ($pvHaircutPercentage !== undefined) {
    writeVarint32(bb, 32);
    writeVarint64(bb, intToLong($pvHaircutPercentage));
  }

  // repeated string depositShares = 5;
  let array$depositShares = message.depositShares;
  if (array$depositShares !== undefined) {
    for (let value of array$depositShares) {
      writeVarint32(bb, 42);
      writeString(bb, value);
    }
  }

  // repeated string leverageThresholds = 6;
  let array$leverageThresholds = message.leverageThresholds;
  if (array$leverageThresholds !== undefined) {
    for (let value of array$leverageThresholds) {
      writeVarint32(bb, 50);
      writeString(bb, value);
    }
  }

  // optional string contract = 7;
  let $contract = message.contract;
  if ($contract !== undefined) {
    writeVarint32(bb, 58);
    writeString(bb, $contract);
  }

  // optional string assetCashPV = 8;
  let $assetCashPV = message.assetCashPV;
  if ($assetCashPV !== undefined) {
    writeVarint32(bb, 66);
    writeString(bb, $assetCashPV);
  }

  // optional string totalSupply = 9;
  let $totalSupply = message.totalSupply;
  if ($totalSupply !== undefined) {
    writeVarint32(bb, 74);
    writeString(bb, $totalSupply);
  }

  // optional string accumulatedNOTEPerNToken = 10;
  let $accumulatedNOTEPerNToken = message.accumulatedNOTEPerNToken;
  if ($accumulatedNOTEPerNToken !== undefined) {
    writeVarint32(bb, 82);
    writeString(bb, $accumulatedNOTEPerNToken);
  }

  // optional string lastAccumulatedTime = 11;
  let $lastAccumulatedTime = message.lastAccumulatedTime;
  if ($lastAccumulatedTime !== undefined) {
    writeVarint32(bb, 90);
    writeString(bb, $lastAccumulatedTime);
  }

  // optional string cashBalance = 12;
  let $cashBalance = message.cashBalance;
  if ($cashBalance !== undefined) {
    writeVarint32(bb, 98);
    writeString(bb, $cashBalance);
  }

  // repeated Asset liquidityTokens = 13;
  let array$liquidityTokens = message.liquidityTokens;
  if (array$liquidityTokens !== undefined) {
    for (let value of array$liquidityTokens) {
      writeVarint32(bb, 106);
      let nested = popByteBuffer();
      _encodeAsset(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }

  // repeated Asset fCash = 14;
  let array$fCash = message.fCash;
  if (array$fCash !== undefined) {
    for (let value of array$fCash) {
      writeVarint32(bb, 114);
      let nested = popByteBuffer();
      _encodeAsset(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodenToken(binary: Uint8Array): nToken {
  return _decodenToken(wrapByteBuffer(binary));
}

function _decodenToken(bb: ByteBuffer): nToken {
  let message: nToken = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string name = 1;
      case 1: {
        message.name = readString(bb, readVarint32(bb));
        break;
      }

      // optional string symbol = 2;
      case 2: {
        message.symbol = readString(bb, readVarint32(bb));
        break;
      }

      // optional string incentiveEmissionRate = 3;
      case 3: {
        message.incentiveEmissionRate = readString(bb, readVarint32(bb));
        break;
      }

      // optional int32 pvHaircutPercentage = 4;
      case 4: {
        message.pvHaircutPercentage = readVarint32(bb);
        break;
      }

      // repeated string depositShares = 5;
      case 5: {
        let values = message.depositShares || (message.depositShares = []);
        values.push(readString(bb, readVarint32(bb)));
        break;
      }

      // repeated string leverageThresholds = 6;
      case 6: {
        let values = message.leverageThresholds || (message.leverageThresholds = []);
        values.push(readString(bb, readVarint32(bb)));
        break;
      }

      // optional string contract = 7;
      case 7: {
        message.contract = readString(bb, readVarint32(bb));
        break;
      }

      // optional string assetCashPV = 8;
      case 8: {
        message.assetCashPV = readString(bb, readVarint32(bb));
        break;
      }

      // optional string totalSupply = 9;
      case 9: {
        message.totalSupply = readString(bb, readVarint32(bb));
        break;
      }

      // optional string accumulatedNOTEPerNToken = 10;
      case 10: {
        message.accumulatedNOTEPerNToken = readString(bb, readVarint32(bb));
        break;
      }

      // optional string lastAccumulatedTime = 11;
      case 11: {
        message.lastAccumulatedTime = readString(bb, readVarint32(bb));
        break;
      }

      // optional string cashBalance = 12;
      case 12: {
        message.cashBalance = readString(bb, readVarint32(bb));
        break;
      }

      // repeated Asset liquidityTokens = 13;
      case 13: {
        let limit = pushTemporaryLength(bb);
        let values = message.liquidityTokens || (message.liquidityTokens = []);
        values.push(_decodeAsset(bb));
        bb.limit = limit;
        break;
      }

      // repeated Asset fCash = 14;
      case 14: {
        let limit = pushTemporaryLength(bb);
        let values = message.fCash || (message.fCash = []);
        values.push(_decodeAsset(bb));
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Currency {
  id?: number;
  name?: string;
  symbol?: string;
  decimalPlaces?: number;
  contract?: string;
  tokenType?: string;
  hasTransferFee?: boolean;
  underlyingName?: string;
  underlyingSymbol?: string;
  underlyingDecimalPlaces?: string;
  underlyingContract?: string;
  nTokenSymbol?: string;
}

export function encodeCurrency(message: Currency): Uint8Array {
  let bb = popByteBuffer();
  _encodeCurrency(message, bb);
  return toUint8Array(bb);
}

function _encodeCurrency(message: Currency, bb: ByteBuffer): void {
  // optional int32 id = 1;
  let $id = message.id;
  if ($id !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($id));
  }

  // optional string name = 2;
  let $name = message.name;
  if ($name !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $name);
  }

  // optional string symbol = 3;
  let $symbol = message.symbol;
  if ($symbol !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $symbol);
  }

  // optional int32 decimalPlaces = 4;
  let $decimalPlaces = message.decimalPlaces;
  if ($decimalPlaces !== undefined) {
    writeVarint32(bb, 32);
    writeVarint64(bb, intToLong($decimalPlaces));
  }

  // optional string contract = 5;
  let $contract = message.contract;
  if ($contract !== undefined) {
    writeVarint32(bb, 42);
    writeString(bb, $contract);
  }

  // optional string tokenType = 6;
  let $tokenType = message.tokenType;
  if ($tokenType !== undefined) {
    writeVarint32(bb, 50);
    writeString(bb, $tokenType);
  }

  // optional bool hasTransferFee = 7;
  let $hasTransferFee = message.hasTransferFee;
  if ($hasTransferFee !== undefined) {
    writeVarint32(bb, 56);
    writeByte(bb, $hasTransferFee ? 1 : 0);
  }

  // optional string underlyingName = 8;
  let $underlyingName = message.underlyingName;
  if ($underlyingName !== undefined) {
    writeVarint32(bb, 66);
    writeString(bb, $underlyingName);
  }

  // optional string underlyingSymbol = 9;
  let $underlyingSymbol = message.underlyingSymbol;
  if ($underlyingSymbol !== undefined) {
    writeVarint32(bb, 74);
    writeString(bb, $underlyingSymbol);
  }

  // optional string underlyingDecimalPlaces = 10;
  let $underlyingDecimalPlaces = message.underlyingDecimalPlaces;
  if ($underlyingDecimalPlaces !== undefined) {
    writeVarint32(bb, 82);
    writeString(bb, $underlyingDecimalPlaces);
  }

  // optional string underlyingContract = 11;
  let $underlyingContract = message.underlyingContract;
  if ($underlyingContract !== undefined) {
    writeVarint32(bb, 90);
    writeString(bb, $underlyingContract);
  }

  // optional string nTokenSymbol = 12;
  let $nTokenSymbol = message.nTokenSymbol;
  if ($nTokenSymbol !== undefined) {
    writeVarint32(bb, 98);
    writeString(bb, $nTokenSymbol);
  }
}

export function decodeCurrency(binary: Uint8Array): Currency {
  return _decodeCurrency(wrapByteBuffer(binary));
}

function _decodeCurrency(bb: ByteBuffer): Currency {
  let message: Currency = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 id = 1;
      case 1: {
        message.id = readVarint32(bb);
        break;
      }

      // optional string name = 2;
      case 2: {
        message.name = readString(bb, readVarint32(bb));
        break;
      }

      // optional string symbol = 3;
      case 3: {
        message.symbol = readString(bb, readVarint32(bb));
        break;
      }

      // optional int32 decimalPlaces = 4;
      case 4: {
        message.decimalPlaces = readVarint32(bb);
        break;
      }

      // optional string contract = 5;
      case 5: {
        message.contract = readString(bb, readVarint32(bb));
        break;
      }

      // optional string tokenType = 6;
      case 6: {
        message.tokenType = readString(bb, readVarint32(bb));
        break;
      }

      // optional bool hasTransferFee = 7;
      case 7: {
        message.hasTransferFee = !!readByte(bb);
        break;
      }

      // optional string underlyingName = 8;
      case 8: {
        message.underlyingName = readString(bb, readVarint32(bb));
        break;
      }

      // optional string underlyingSymbol = 9;
      case 9: {
        message.underlyingSymbol = readString(bb, readVarint32(bb));
        break;
      }

      // optional string underlyingDecimalPlaces = 10;
      case 10: {
        message.underlyingDecimalPlaces = readString(bb, readVarint32(bb));
        break;
      }

      // optional string underlyingContract = 11;
      case 11: {
        message.underlyingContract = readString(bb, readVarint32(bb));
        break;
      }

      // optional string nTokenSymbol = 12;
      case 12: {
        message.nTokenSymbol = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Market {
  totalfCash?: string;
  totalAssetCash?: string;
  totalLiquidity?: string;
  lastImpliedRate?: string;
  oracleRate?: string;
  previousTradeTime?: string;
}

export function encodeMarket(message: Market): Uint8Array {
  let bb = popByteBuffer();
  _encodeMarket(message, bb);
  return toUint8Array(bb);
}

function _encodeMarket(message: Market, bb: ByteBuffer): void {
  // optional string totalfCash = 1;
  let $totalfCash = message.totalfCash;
  if ($totalfCash !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $totalfCash);
  }

  // optional string totalAssetCash = 2;
  let $totalAssetCash = message.totalAssetCash;
  if ($totalAssetCash !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $totalAssetCash);
  }

  // optional string totalLiquidity = 3;
  let $totalLiquidity = message.totalLiquidity;
  if ($totalLiquidity !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $totalLiquidity);
  }

  // optional string lastImpliedRate = 4;
  let $lastImpliedRate = message.lastImpliedRate;
  if ($lastImpliedRate !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $lastImpliedRate);
  }

  // optional string oracleRate = 5;
  let $oracleRate = message.oracleRate;
  if ($oracleRate !== undefined) {
    writeVarint32(bb, 42);
    writeString(bb, $oracleRate);
  }

  // optional string previousTradeTime = 6;
  let $previousTradeTime = message.previousTradeTime;
  if ($previousTradeTime !== undefined) {
    writeVarint32(bb, 50);
    writeString(bb, $previousTradeTime);
  }
}

export function decodeMarket(binary: Uint8Array): Market {
  return _decodeMarket(wrapByteBuffer(binary));
}

function _decodeMarket(bb: ByteBuffer): Market {
  let message: Market = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string totalfCash = 1;
      case 1: {
        message.totalfCash = readString(bb, readVarint32(bb));
        break;
      }

      // optional string totalAssetCash = 2;
      case 2: {
        message.totalAssetCash = readString(bb, readVarint32(bb));
        break;
      }

      // optional string totalLiquidity = 3;
      case 3: {
        message.totalLiquidity = readString(bb, readVarint32(bb));
        break;
      }

      // optional string lastImpliedRate = 4;
      case 4: {
        message.lastImpliedRate = readString(bb, readVarint32(bb));
        break;
      }

      // optional string oracleRate = 5;
      case 5: {
        message.oracleRate = readString(bb, readVarint32(bb));
        break;
      }

      // optional string previousTradeTime = 6;
      case 6: {
        message.previousTradeTime = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface CashGroup {
  maxMarketIndex?: number;
  rateOracleTimeWindowSeconds?: number;
  totalFeeBasisPoints?: number;
  reserveFeeSharePercent?: number;
  debtBufferBasisPoints?: number;
  fCashHaircutBasisPoints?: number;
  liquidityTokenHaircutsPercent?: number[];
  rateScalars?: number[];
  markets?: Market[];
}

export function encodeCashGroup(message: CashGroup): Uint8Array {
  let bb = popByteBuffer();
  _encodeCashGroup(message, bb);
  return toUint8Array(bb);
}

function _encodeCashGroup(message: CashGroup, bb: ByteBuffer): void {
  // optional int32 maxMarketIndex = 1;
  let $maxMarketIndex = message.maxMarketIndex;
  if ($maxMarketIndex !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($maxMarketIndex));
  }

  // optional int32 rateOracleTimeWindowSeconds = 2;
  let $rateOracleTimeWindowSeconds = message.rateOracleTimeWindowSeconds;
  if ($rateOracleTimeWindowSeconds !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($rateOracleTimeWindowSeconds));
  }

  // optional int32 totalFeeBasisPoints = 3;
  let $totalFeeBasisPoints = message.totalFeeBasisPoints;
  if ($totalFeeBasisPoints !== undefined) {
    writeVarint32(bb, 24);
    writeVarint64(bb, intToLong($totalFeeBasisPoints));
  }

  // optional int32 reserveFeeSharePercent = 4;
  let $reserveFeeSharePercent = message.reserveFeeSharePercent;
  if ($reserveFeeSharePercent !== undefined) {
    writeVarint32(bb, 32);
    writeVarint64(bb, intToLong($reserveFeeSharePercent));
  }

  // optional int32 debtBufferBasisPoints = 5;
  let $debtBufferBasisPoints = message.debtBufferBasisPoints;
  if ($debtBufferBasisPoints !== undefined) {
    writeVarint32(bb, 40);
    writeVarint64(bb, intToLong($debtBufferBasisPoints));
  }

  // optional int32 fCashHaircutBasisPoints = 6;
  let $fCashHaircutBasisPoints = message.fCashHaircutBasisPoints;
  if ($fCashHaircutBasisPoints !== undefined) {
    writeVarint32(bb, 48);
    writeVarint64(bb, intToLong($fCashHaircutBasisPoints));
  }

  // repeated int32 liquidityTokenHaircutsPercent = 7;
  let array$liquidityTokenHaircutsPercent = message.liquidityTokenHaircutsPercent;
  if (array$liquidityTokenHaircutsPercent !== undefined) {
    let packed = popByteBuffer();
    for (let value of array$liquidityTokenHaircutsPercent) {
      writeVarint64(packed, intToLong(value));
    }
    writeVarint32(bb, 58);
    writeVarint32(bb, packed.offset);
    writeByteBuffer(bb, packed);
    pushByteBuffer(packed);
  }

  // repeated int32 rateScalars = 8;
  let array$rateScalars = message.rateScalars;
  if (array$rateScalars !== undefined) {
    let packed = popByteBuffer();
    for (let value of array$rateScalars) {
      writeVarint64(packed, intToLong(value));
    }
    writeVarint32(bb, 66);
    writeVarint32(bb, packed.offset);
    writeByteBuffer(bb, packed);
    pushByteBuffer(packed);
  }

  // repeated Market markets = 9;
  let array$markets = message.markets;
  if (array$markets !== undefined) {
    for (let value of array$markets) {
      writeVarint32(bb, 74);
      let nested = popByteBuffer();
      _encodeMarket(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodeCashGroup(binary: Uint8Array): CashGroup {
  return _decodeCashGroup(wrapByteBuffer(binary));
}

function _decodeCashGroup(bb: ByteBuffer): CashGroup {
  let message: CashGroup = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 maxMarketIndex = 1;
      case 1: {
        message.maxMarketIndex = readVarint32(bb);
        break;
      }

      // optional int32 rateOracleTimeWindowSeconds = 2;
      case 2: {
        message.rateOracleTimeWindowSeconds = readVarint32(bb);
        break;
      }

      // optional int32 totalFeeBasisPoints = 3;
      case 3: {
        message.totalFeeBasisPoints = readVarint32(bb);
        break;
      }

      // optional int32 reserveFeeSharePercent = 4;
      case 4: {
        message.reserveFeeSharePercent = readVarint32(bb);
        break;
      }

      // optional int32 debtBufferBasisPoints = 5;
      case 5: {
        message.debtBufferBasisPoints = readVarint32(bb);
        break;
      }

      // optional int32 fCashHaircutBasisPoints = 6;
      case 6: {
        message.fCashHaircutBasisPoints = readVarint32(bb);
        break;
      }

      // repeated int32 liquidityTokenHaircutsPercent = 7;
      case 7: {
        let values = message.liquidityTokenHaircutsPercent || (message.liquidityTokenHaircutsPercent = []);
        if ((tag & 7) === 2) {
          let outerLimit = pushTemporaryLength(bb);
          while (!isAtEnd(bb)) {
            values.push(readVarint32(bb));
          }
          bb.limit = outerLimit;
        } else {
          values.push(readVarint32(bb));
        }
        break;
      }

      // repeated int32 rateScalars = 8;
      case 8: {
        let values = message.rateScalars || (message.rateScalars = []);
        if ((tag & 7) === 2) {
          let outerLimit = pushTemporaryLength(bb);
          while (!isAtEnd(bb)) {
            values.push(readVarint32(bb));
          }
          bb.limit = outerLimit;
        } else {
          values.push(readVarint32(bb));
        }
        break;
      }

      // repeated Market markets = 9;
      case 9: {
        let limit = pushTemporaryLength(bb);
        let values = message.markets || (message.markets = []);
        values.push(_decodeMarket(bb));
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface System {
  network?: string;
  lastUpdateBlockNumber?: number;
  lastUpdateTimestamp?: number;
  USDExchangeRates?: { [key: string]: string };
  StakedNoteParameters?: sNOTE;
  currencies?: { [key: number]: Currency };
  ethRateData?: { [key: number]: ETHRate };
  assetRateData?: { [key: number]: AssetRate };
  nTokenData?: { [key: number]: nToken };
  cashGroups?: { [key: number]: CashGroup };
}

export function encodeSystem(message: System): Uint8Array {
  let bb = popByteBuffer();
  _encodeSystem(message, bb);
  return toUint8Array(bb);
}

function _encodeSystem(message: System, bb: ByteBuffer): void {
  // optional string network = 1;
  let $network = message.network;
  if ($network !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $network);
  }

  // optional int32 lastUpdateBlockNumber = 2;
  let $lastUpdateBlockNumber = message.lastUpdateBlockNumber;
  if ($lastUpdateBlockNumber !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($lastUpdateBlockNumber));
  }

  // optional int32 lastUpdateTimestamp = 3;
  let $lastUpdateTimestamp = message.lastUpdateTimestamp;
  if ($lastUpdateTimestamp !== undefined) {
    writeVarint32(bb, 24);
    writeVarint64(bb, intToLong($lastUpdateTimestamp));
  }

  // optional map<string, string> USDExchangeRates = 4;
  let map$USDExchangeRates = message.USDExchangeRates;
  if (map$USDExchangeRates !== undefined) {
    for (let key in map$USDExchangeRates) {
      let nested = popByteBuffer();
      let value = map$USDExchangeRates[key];
      writeVarint32(nested, 10);
      writeString(nested, key);
      writeVarint32(nested, 18);
      writeString(nested, value);
      writeVarint32(bb, 34);
      writeVarint32(bb, nested.offset);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }

  // optional sNOTE StakedNoteParameters = 5;
  let $StakedNoteParameters = message.StakedNoteParameters;
  if ($StakedNoteParameters !== undefined) {
    writeVarint32(bb, 42);
    let nested = popByteBuffer();
    _encodesNOTE($StakedNoteParameters, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional map<int32, Currency> currencies = 6;
  let map$currencies = message.currencies;
  if (map$currencies !== undefined) {
    for (let key in map$currencies) {
      let nested = popByteBuffer();
      let value = map$currencies[key];
      writeVarint32(nested, 8);
      writeVarint64(nested, intToLong(+key));
      writeVarint32(nested, 18);
      let nestedValue = popByteBuffer();
      _encodeCurrency(value, nestedValue);
      writeVarint32(nested, nestedValue.limit);
      writeByteBuffer(nested, nestedValue);
      pushByteBuffer(nestedValue);
      writeVarint32(bb, 50);
      writeVarint32(bb, nested.offset);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }

  // optional map<int32, ETHRate> ethRateData = 7;
  let map$ethRateData = message.ethRateData;
  if (map$ethRateData !== undefined) {
    for (let key in map$ethRateData) {
      let nested = popByteBuffer();
      let value = map$ethRateData[key];
      writeVarint32(nested, 8);
      writeVarint64(nested, intToLong(+key));
      writeVarint32(nested, 18);
      let nestedValue = popByteBuffer();
      _encodeETHRate(value, nestedValue);
      writeVarint32(nested, nestedValue.limit);
      writeByteBuffer(nested, nestedValue);
      pushByteBuffer(nestedValue);
      writeVarint32(bb, 58);
      writeVarint32(bb, nested.offset);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }

  // optional map<int32, AssetRate> assetRateData = 8;
  let map$assetRateData = message.assetRateData;
  if (map$assetRateData !== undefined) {
    for (let key in map$assetRateData) {
      let nested = popByteBuffer();
      let value = map$assetRateData[key];
      writeVarint32(nested, 8);
      writeVarint64(nested, intToLong(+key));
      writeVarint32(nested, 18);
      let nestedValue = popByteBuffer();
      _encodeAssetRate(value, nestedValue);
      writeVarint32(nested, nestedValue.limit);
      writeByteBuffer(nested, nestedValue);
      pushByteBuffer(nestedValue);
      writeVarint32(bb, 66);
      writeVarint32(bb, nested.offset);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }

  // optional map<int32, nToken> nTokenData = 9;
  let map$nTokenData = message.nTokenData;
  if (map$nTokenData !== undefined) {
    for (let key in map$nTokenData) {
      let nested = popByteBuffer();
      let value = map$nTokenData[key];
      writeVarint32(nested, 8);
      writeVarint64(nested, intToLong(+key));
      writeVarint32(nested, 18);
      let nestedValue = popByteBuffer();
      _encodenToken(value, nestedValue);
      writeVarint32(nested, nestedValue.limit);
      writeByteBuffer(nested, nestedValue);
      pushByteBuffer(nestedValue);
      writeVarint32(bb, 74);
      writeVarint32(bb, nested.offset);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }

  // optional map<int32, CashGroup> cashGroups = 10;
  let map$cashGroups = message.cashGroups;
  if (map$cashGroups !== undefined) {
    for (let key in map$cashGroups) {
      let nested = popByteBuffer();
      let value = map$cashGroups[key];
      writeVarint32(nested, 8);
      writeVarint64(nested, intToLong(+key));
      writeVarint32(nested, 18);
      let nestedValue = popByteBuffer();
      _encodeCashGroup(value, nestedValue);
      writeVarint32(nested, nestedValue.limit);
      writeByteBuffer(nested, nestedValue);
      pushByteBuffer(nestedValue);
      writeVarint32(bb, 82);
      writeVarint32(bb, nested.offset);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }
}

export function decodeSystem(binary: Uint8Array): System {
  return _decodeSystem(wrapByteBuffer(binary));
}

function _decodeSystem(bb: ByteBuffer): System {
  let message: System = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    let tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string network = 1;
      case 1: {
        message.network = readString(bb, readVarint32(bb));
        break;
      }

      // optional int32 lastUpdateBlockNumber = 2;
      case 2: {
        message.lastUpdateBlockNumber = readVarint32(bb);
        break;
      }

      // optional int32 lastUpdateTimestamp = 3;
      case 3: {
        message.lastUpdateTimestamp = readVarint32(bb);
        break;
      }

      // optional map<string, string> USDExchangeRates = 4;
      case 4: {
        let values = message.USDExchangeRates || (message.USDExchangeRates = {});
        let outerLimit = pushTemporaryLength(bb);
        let key: string | undefined;
        let value: string | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          let tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readString(bb, readVarint32(bb));
              break;
            }
            case 2: {
              value = readString(bb, readVarint32(bb));
              break;
            }
            default:
              skipUnknownField(bb, tag & 7);
          }
        }
        if (key === undefined || value === undefined) throw new Error('Invalid data for map: USDExchangeRates');
        values[key] = value;
        bb.limit = outerLimit;
        break;
      }

      // optional sNOTE StakedNoteParameters = 5;
      case 5: {
        let limit = pushTemporaryLength(bb);
        message.StakedNoteParameters = _decodesNOTE(bb);
        bb.limit = limit;
        break;
      }

      // optional map<int32, Currency> currencies = 6;
      case 6: {
        let values = message.currencies || (message.currencies = {});
        let outerLimit = pushTemporaryLength(bb);
        let key: number | undefined;
        let value: Currency | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          let tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readVarint32(bb);
              break;
            }
            case 2: {
              let valueLimit = pushTemporaryLength(bb);
              value = _decodeCurrency(bb);
              bb.limit = valueLimit;
              break;
            }
            default:
              skipUnknownField(bb, tag & 7);
          }
        }
        if (key === undefined || value === undefined) throw new Error('Invalid data for map: currencies');
        values[key] = value;
        bb.limit = outerLimit;
        break;
      }

      // optional map<int32, ETHRate> ethRateData = 7;
      case 7: {
        let values = message.ethRateData || (message.ethRateData = {});
        let outerLimit = pushTemporaryLength(bb);
        let key: number | undefined;
        let value: ETHRate | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          let tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readVarint32(bb);
              break;
            }
            case 2: {
              let valueLimit = pushTemporaryLength(bb);
              value = _decodeETHRate(bb);
              bb.limit = valueLimit;
              break;
            }
            default:
              skipUnknownField(bb, tag & 7);
          }
        }
        if (key === undefined || value === undefined) throw new Error('Invalid data for map: ethRateData');
        values[key] = value;
        bb.limit = outerLimit;
        break;
      }

      // optional map<int32, AssetRate> assetRateData = 8;
      case 8: {
        let values = message.assetRateData || (message.assetRateData = {});
        let outerLimit = pushTemporaryLength(bb);
        let key: number | undefined;
        let value: AssetRate | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          let tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readVarint32(bb);
              break;
            }
            case 2: {
              let valueLimit = pushTemporaryLength(bb);
              value = _decodeAssetRate(bb);
              bb.limit = valueLimit;
              break;
            }
            default:
              skipUnknownField(bb, tag & 7);
          }
        }
        if (key === undefined || value === undefined) throw new Error('Invalid data for map: assetRateData');
        values[key] = value;
        bb.limit = outerLimit;
        break;
      }

      // optional map<int32, nToken> nTokenData = 9;
      case 9: {
        let values = message.nTokenData || (message.nTokenData = {});
        let outerLimit = pushTemporaryLength(bb);
        let key: number | undefined;
        let value: nToken | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          let tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readVarint32(bb);
              break;
            }
            case 2: {
              let valueLimit = pushTemporaryLength(bb);
              value = _decodenToken(bb);
              bb.limit = valueLimit;
              break;
            }
            default:
              skipUnknownField(bb, tag & 7);
          }
        }
        if (key === undefined || value === undefined) throw new Error('Invalid data for map: nTokenData');
        values[key] = value;
        bb.limit = outerLimit;
        break;
      }

      // optional map<int32, CashGroup> cashGroups = 10;
      case 10: {
        let values = message.cashGroups || (message.cashGroups = {});
        let outerLimit = pushTemporaryLength(bb);
        let key: number | undefined;
        let value: CashGroup | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          let tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readVarint32(bb);
              break;
            }
            case 2: {
              let valueLimit = pushTemporaryLength(bb);
              value = _decodeCashGroup(bb);
              bb.limit = valueLimit;
              break;
            }
            default:
              skipUnknownField(bb, tag & 7);
          }
        }
        if (key === undefined || value === undefined) throw new Error('Invalid data for map: cashGroups');
        values[key] = value;
        bb.limit = outerLimit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface Long {
  low: number;
  high: number;
  unsigned: boolean;
}

interface ByteBuffer {
  bytes: Uint8Array;
  offset: number;
  limit: number;
}

function pushTemporaryLength(bb: ByteBuffer): number {
  let length = readVarint32(bb);
  let limit = bb.limit;
  bb.limit = bb.offset + length;
  return limit;
}

function skipUnknownField(bb: ByteBuffer, type: number): void {
  switch (type) {
    case 0:
      while (readByte(bb) & 0x80) {}
      break;
    case 2:
      skip(bb, readVarint32(bb));
      break;
    case 5:
      skip(bb, 4);
      break;
    case 1:
      skip(bb, 8);
      break;
    default:
      throw new Error('Unimplemented type: ' + type);
  }
}

function stringToLong(value: string): Long {
  return {
    low: value.charCodeAt(0) | (value.charCodeAt(1) << 16),
    high: value.charCodeAt(2) | (value.charCodeAt(3) << 16),
    unsigned: false,
  };
}

function longToString(value: Long): string {
  let low = value.low;
  let high = value.high;
  return String.fromCharCode(low & 0xffff, low >>> 16, high & 0xffff, high >>> 16);
}

// The code below was modified from https://github.com/protobufjs/bytebuffer.js
// which is under the Apache License 2.0.

let f32 = new Float32Array(1);
let f32_u8 = new Uint8Array(f32.buffer);

let f64 = new Float64Array(1);
let f64_u8 = new Uint8Array(f64.buffer);

function intToLong(value: number): Long {
  value |= 0;
  return {
    low: value,
    high: value >> 31,
    unsigned: value >= 0,
  };
}

let bbStack: ByteBuffer[] = [];

function popByteBuffer(): ByteBuffer {
  const bb = bbStack.pop();
  if (!bb) return { bytes: new Uint8Array(64), offset: 0, limit: 0 };
  bb.offset = bb.limit = 0;
  return bb;
}

function pushByteBuffer(bb: ByteBuffer): void {
  bbStack.push(bb);
}

function wrapByteBuffer(bytes: Uint8Array): ByteBuffer {
  return { bytes, offset: 0, limit: bytes.length };
}

function toUint8Array(bb: ByteBuffer): Uint8Array {
  let bytes = bb.bytes;
  let limit = bb.limit;
  return bytes.length === limit ? bytes : bytes.subarray(0, limit);
}

function skip(bb: ByteBuffer, offset: number): void {
  if (bb.offset + offset > bb.limit) {
    throw new Error('Skip past limit');
  }
  bb.offset += offset;
}

function isAtEnd(bb: ByteBuffer): boolean {
  return bb.offset >= bb.limit;
}

function grow(bb: ByteBuffer, count: number): number {
  let bytes = bb.bytes;
  let offset = bb.offset;
  let limit = bb.limit;
  let finalOffset = offset + count;
  if (finalOffset > bytes.length) {
    let newBytes = new Uint8Array(finalOffset * 2);
    newBytes.set(bytes);
    bb.bytes = newBytes;
  }
  bb.offset = finalOffset;
  if (finalOffset > limit) {
    bb.limit = finalOffset;
  }
  return offset;
}

function advance(bb: ByteBuffer, count: number): number {
  let offset = bb.offset;
  if (offset + count > bb.limit) {
    throw new Error('Read past limit');
  }
  bb.offset += count;
  return offset;
}

function readBytes(bb: ByteBuffer, count: number): Uint8Array {
  let offset = advance(bb, count);
  return bb.bytes.subarray(offset, offset + count);
}

function writeBytes(bb: ByteBuffer, buffer: Uint8Array): void {
  let offset = grow(bb, buffer.length);
  bb.bytes.set(buffer, offset);
}

function readString(bb: ByteBuffer, count: number): string {
  // Sadly a hand-coded UTF8 decoder is much faster than subarray+TextDecoder in V8
  let offset = advance(bb, count);
  let fromCharCode = String.fromCharCode;
  let bytes = bb.bytes;
  let invalid = '\uFFFD';
  let text = '';

  for (let i = 0; i < count; i++) {
    let c1 = bytes[i + offset],
      c2: number,
      c3: number,
      c4: number,
      c: number;

    // 1 byte
    if ((c1 & 0x80) === 0) {
      text += fromCharCode(c1);
    }

    // 2 bytes
    else if ((c1 & 0xe0) === 0xc0) {
      if (i + 1 >= count) text += invalid;
      else {
        c2 = bytes[i + offset + 1];
        if ((c2 & 0xc0) !== 0x80) text += invalid;
        else {
          c = ((c1 & 0x1f) << 6) | (c2 & 0x3f);
          if (c < 0x80) text += invalid;
          else {
            text += fromCharCode(c);
            i++;
          }
        }
      }
    }

    // 3 bytes
    else if ((c1 & 0xf0) == 0xe0) {
      if (i + 2 >= count) text += invalid;
      else {
        c2 = bytes[i + offset + 1];
        c3 = bytes[i + offset + 2];
        if (((c2 | (c3 << 8)) & 0xc0c0) !== 0x8080) text += invalid;
        else {
          c = ((c1 & 0x0f) << 12) | ((c2 & 0x3f) << 6) | (c3 & 0x3f);
          if (c < 0x0800 || (c >= 0xd800 && c <= 0xdfff)) text += invalid;
          else {
            text += fromCharCode(c);
            i += 2;
          }
        }
      }
    }

    // 4 bytes
    else if ((c1 & 0xf8) == 0xf0) {
      if (i + 3 >= count) text += invalid;
      else {
        c2 = bytes[i + offset + 1];
        c3 = bytes[i + offset + 2];
        c4 = bytes[i + offset + 3];
        if (((c2 | (c3 << 8) | (c4 << 16)) & 0xc0c0c0) !== 0x808080) text += invalid;
        else {
          c = ((c1 & 0x07) << 0x12) | ((c2 & 0x3f) << 0x0c) | ((c3 & 0x3f) << 0x06) | (c4 & 0x3f);
          if (c < 0x10000 || c > 0x10ffff) text += invalid;
          else {
            c -= 0x10000;
            text += fromCharCode((c >> 10) + 0xd800, (c & 0x3ff) + 0xdc00);
            i += 3;
          }
        }
      }
    } else text += invalid;
  }

  return text;
}

function writeString(bb: ByteBuffer, text: string): void {
  // Sadly a hand-coded UTF8 encoder is much faster than TextEncoder+set in V8
  let n = text.length;
  let byteCount = 0;

  // Write the byte count first
  for (let i = 0; i < n; i++) {
    let c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < n) {
      c = (c << 10) + text.charCodeAt(++i) - 0x35fdc00;
    }
    byteCount += c < 0x80 ? 1 : c < 0x800 ? 2 : c < 0x10000 ? 3 : 4;
  }
  writeVarint32(bb, byteCount);

  let offset = grow(bb, byteCount);
  let bytes = bb.bytes;

  // Then write the bytes
  for (let i = 0; i < n; i++) {
    let c = text.charCodeAt(i);
    if (c >= 0xd800 && c <= 0xdbff && i + 1 < n) {
      c = (c << 10) + text.charCodeAt(++i) - 0x35fdc00;
    }
    if (c < 0x80) {
      bytes[offset++] = c;
    } else {
      if (c < 0x800) {
        bytes[offset++] = ((c >> 6) & 0x1f) | 0xc0;
      } else {
        if (c < 0x10000) {
          bytes[offset++] = ((c >> 12) & 0x0f) | 0xe0;
        } else {
          bytes[offset++] = ((c >> 18) & 0x07) | 0xf0;
          bytes[offset++] = ((c >> 12) & 0x3f) | 0x80;
        }
        bytes[offset++] = ((c >> 6) & 0x3f) | 0x80;
      }
      bytes[offset++] = (c & 0x3f) | 0x80;
    }
  }
}

function writeByteBuffer(bb: ByteBuffer, buffer: ByteBuffer): void {
  let offset = grow(bb, buffer.limit);
  let from = bb.bytes;
  let to = buffer.bytes;

  // This for loop is much faster than subarray+set on V8
  for (let i = 0, n = buffer.limit; i < n; i++) {
    from[i + offset] = to[i];
  }
}

function readByte(bb: ByteBuffer): number {
  return bb.bytes[advance(bb, 1)];
}

function writeByte(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 1);
  bb.bytes[offset] = value;
}

function readFloat(bb: ByteBuffer): number {
  let offset = advance(bb, 4);
  let bytes = bb.bytes;

  // Manual copying is much faster than subarray+set in V8
  f32_u8[0] = bytes[offset++];
  f32_u8[1] = bytes[offset++];
  f32_u8[2] = bytes[offset++];
  f32_u8[3] = bytes[offset++];
  return f32[0];
}

function writeFloat(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 4);
  let bytes = bb.bytes;
  f32[0] = value;

  // Manual copying is much faster than subarray+set in V8
  bytes[offset++] = f32_u8[0];
  bytes[offset++] = f32_u8[1];
  bytes[offset++] = f32_u8[2];
  bytes[offset++] = f32_u8[3];
}

function readDouble(bb: ByteBuffer): number {
  let offset = advance(bb, 8);
  let bytes = bb.bytes;

  // Manual copying is much faster than subarray+set in V8
  f64_u8[0] = bytes[offset++];
  f64_u8[1] = bytes[offset++];
  f64_u8[2] = bytes[offset++];
  f64_u8[3] = bytes[offset++];
  f64_u8[4] = bytes[offset++];
  f64_u8[5] = bytes[offset++];
  f64_u8[6] = bytes[offset++];
  f64_u8[7] = bytes[offset++];
  return f64[0];
}

function writeDouble(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 8);
  let bytes = bb.bytes;
  f64[0] = value;

  // Manual copying is much faster than subarray+set in V8
  bytes[offset++] = f64_u8[0];
  bytes[offset++] = f64_u8[1];
  bytes[offset++] = f64_u8[2];
  bytes[offset++] = f64_u8[3];
  bytes[offset++] = f64_u8[4];
  bytes[offset++] = f64_u8[5];
  bytes[offset++] = f64_u8[6];
  bytes[offset++] = f64_u8[7];
}

function readInt32(bb: ByteBuffer): number {
  let offset = advance(bb, 4);
  let bytes = bb.bytes;
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}

function writeInt32(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 4);
  let bytes = bb.bytes;
  bytes[offset] = value;
  bytes[offset + 1] = value >> 8;
  bytes[offset + 2] = value >> 16;
  bytes[offset + 3] = value >> 24;
}

function readInt64(bb: ByteBuffer, unsigned: boolean): Long {
  return {
    low: readInt32(bb),
    high: readInt32(bb),
    unsigned,
  };
}

function writeInt64(bb: ByteBuffer, value: Long): void {
  writeInt32(bb, value.low);
  writeInt32(bb, value.high);
}

function readVarint32(bb: ByteBuffer): number {
  let c = 0;
  let value = 0;
  let b: number;
  do {
    b = readByte(bb);
    if (c < 32) value |= (b & 0x7f) << c;
    c += 7;
  } while (b & 0x80);
  return value;
}

function writeVarint32(bb: ByteBuffer, value: number): void {
  value >>>= 0;
  while (value >= 0x80) {
    writeByte(bb, (value & 0x7f) | 0x80);
    value >>>= 7;
  }
  writeByte(bb, value);
}

function readVarint64(bb: ByteBuffer, unsigned: boolean): Long {
  let part0 = 0;
  let part1 = 0;
  let part2 = 0;
  let b: number;

  b = readByte(bb);
  part0 = b & 0x7f;
  if (b & 0x80) {
    b = readByte(bb);
    part0 |= (b & 0x7f) << 7;
    if (b & 0x80) {
      b = readByte(bb);
      part0 |= (b & 0x7f) << 14;
      if (b & 0x80) {
        b = readByte(bb);
        part0 |= (b & 0x7f) << 21;
        if (b & 0x80) {
          b = readByte(bb);
          part1 = b & 0x7f;
          if (b & 0x80) {
            b = readByte(bb);
            part1 |= (b & 0x7f) << 7;
            if (b & 0x80) {
              b = readByte(bb);
              part1 |= (b & 0x7f) << 14;
              if (b & 0x80) {
                b = readByte(bb);
                part1 |= (b & 0x7f) << 21;
                if (b & 0x80) {
                  b = readByte(bb);
                  part2 = b & 0x7f;
                  if (b & 0x80) {
                    b = readByte(bb);
                    part2 |= (b & 0x7f) << 7;
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  return {
    low: part0 | (part1 << 28),
    high: (part1 >>> 4) | (part2 << 24),
    unsigned,
  };
}

function writeVarint64(bb: ByteBuffer, value: Long): void {
  let part0 = value.low >>> 0;
  let part1 = ((value.low >>> 28) | (value.high << 4)) >>> 0;
  let part2 = value.high >>> 24;

  // ref: src/google/protobuf/io/coded_stream.cc
  let size =
    part2 === 0
      ? part1 === 0
        ? part0 < 1 << 14
          ? part0 < 1 << 7
            ? 1
            : 2
          : part0 < 1 << 21
          ? 3
          : 4
        : part1 < 1 << 14
        ? part1 < 1 << 7
          ? 5
          : 6
        : part1 < 1 << 21
        ? 7
        : 8
      : part2 < 1 << 7
      ? 9
      : 10;

  let offset = grow(bb, size);
  let bytes = bb.bytes;

  switch (size) {
    case 10:
      bytes[offset + 9] = (part2 >>> 7) & 0x01;
    case 9:
      bytes[offset + 8] = size !== 9 ? part2 | 0x80 : part2 & 0x7f;
    case 8:
      bytes[offset + 7] = size !== 8 ? (part1 >>> 21) | 0x80 : (part1 >>> 21) & 0x7f;
    case 7:
      bytes[offset + 6] = size !== 7 ? (part1 >>> 14) | 0x80 : (part1 >>> 14) & 0x7f;
    case 6:
      bytes[offset + 5] = size !== 6 ? (part1 >>> 7) | 0x80 : (part1 >>> 7) & 0x7f;
    case 5:
      bytes[offset + 4] = size !== 5 ? part1 | 0x80 : part1 & 0x7f;
    case 4:
      bytes[offset + 3] = size !== 4 ? (part0 >>> 21) | 0x80 : (part0 >>> 21) & 0x7f;
    case 3:
      bytes[offset + 2] = size !== 3 ? (part0 >>> 14) | 0x80 : (part0 >>> 14) & 0x7f;
    case 2:
      bytes[offset + 1] = size !== 2 ? (part0 >>> 7) | 0x80 : (part0 >>> 7) & 0x7f;
    case 1:
      bytes[offset] = size !== 1 ? part0 | 0x80 : part0 & 0x7f;
  }
}

function readVarint32ZigZag(bb: ByteBuffer): number {
  let value = readVarint32(bb);

  // ref: src/google/protobuf/wire_format_lite.h
  return (value >>> 1) ^ -(value & 1);
}

function writeVarint32ZigZag(bb: ByteBuffer, value: number): void {
  // ref: src/google/protobuf/wire_format_lite.h
  writeVarint32(bb, (value << 1) ^ (value >> 31));
}

function readVarint64ZigZag(bb: ByteBuffer): Long {
  let value = readVarint64(bb, /* unsigned */ false);
  let low = value.low;
  let high = value.high;
  let flip = -(low & 1);

  // ref: src/google/protobuf/wire_format_lite.h
  return {
    low: ((low >>> 1) | (high << 31)) ^ flip,
    high: (high >>> 1) ^ flip,
    unsigned: false,
  };
}

function writeVarint64ZigZag(bb: ByteBuffer, value: Long): void {
  let low = value.low;
  let high = value.high;
  let flip = high >> 31;

  // ref: src/google/protobuf/wire_format_lite.h
  writeVarint64(bb, {
    low: (low << 1) ^ flip,
    high: ((high << 1) | (low >>> 31)) ^ flip,
    unsigned: false,
  });
}
