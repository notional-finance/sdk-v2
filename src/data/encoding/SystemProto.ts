// @ts-nocheck
export interface SerializedBigNumber {
  _isBigNumber?: boolean;
  _hex?: string;
}

export function encodeSerializedBigNumber(message: SerializedBigNumber): Uint8Array {
  const bb = popByteBuffer();
  _encodeSerializedBigNumber(message, bb);
  return toUint8Array(bb);
}

function _encodeSerializedBigNumber(message: SerializedBigNumber, bb: ByteBuffer): void {
  // optional bool _isBigNumber = 1;
  const $_isBigNumber = message._isBigNumber;
  if ($_isBigNumber !== undefined) {
    writeVarint32(bb, 8);
    writeByte(bb, $_isBigNumber ? 1 : 0);
  }

  // optional string _hex = 2;
  const $_hex = message._hex;
  if ($_hex !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $_hex);
  }
}

export function decodeSerializedBigNumber(binary: Uint8Array): SerializedBigNumber {
  return _decodeSerializedBigNumber(wrapByteBuffer(binary));
}

function _decodeSerializedBigNumber(bb: ByteBuffer): SerializedBigNumber {
  const message: SerializedBigNumber = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

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

export interface SerializedContract {
  _isSerializedContract?: boolean;
  _address?: string;
  _abiName?: string;
}

export function encodeSerializedContract(message: SerializedContract): Uint8Array {
  const bb = popByteBuffer();
  _encodeSerializedContract(message, bb);
  return toUint8Array(bb);
}

function _encodeSerializedContract(message: SerializedContract, bb: ByteBuffer): void {
  // optional bool _isSerializedContract = 1;
  const $_isSerializedContract = message._isSerializedContract;
  if ($_isSerializedContract !== undefined) {
    writeVarint32(bb, 8);
    writeByte(bb, $_isSerializedContract ? 1 : 0);
  }

  // optional string _address = 2;
  const $_address = message._address;
  if ($_address !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $_address);
  }

  // optional string _abiName = 3;
  const $_abiName = message._abiName;
  if ($_abiName !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $_abiName);
  }
}

export function decodeSerializedContract(binary: Uint8Array): SerializedContract {
  return _decodeSerializedContract(wrapByteBuffer(binary));
}

function _decodeSerializedContract(bb: ByteBuffer): SerializedContract {
  const message: SerializedContract = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional bool _isSerializedContract = 1;
      case 1: {
        message._isSerializedContract = !!readByte(bb);
        break;
      }

      // optional string _address = 2;
      case 2: {
        message._address = readString(bb, readVarint32(bb));
        break;
      }

      // optional string _abiName = 3;
      case 3: {
        message._abiName = readString(bb, readVarint32(bb));
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface SerializedTypedBigNumber {
  _isTypedBigNumber?: boolean;
  hex?: string;
  bigNumberType?: string;
  symbol?: string;
}

export function encodeSerializedTypedBigNumber(message: SerializedTypedBigNumber): Uint8Array {
  const bb = popByteBuffer();
  _encodeSerializedTypedBigNumber(message, bb);
  return toUint8Array(bb);
}

function _encodeSerializedTypedBigNumber(message: SerializedTypedBigNumber, bb: ByteBuffer): void {
  // optional bool _isTypedBigNumber = 1;
  const $_isTypedBigNumber = message._isTypedBigNumber;
  if ($_isTypedBigNumber !== undefined) {
    writeVarint32(bb, 8);
    writeByte(bb, $_isTypedBigNumber ? 1 : 0);
  }

  // optional string hex = 2;
  const $hex = message.hex;
  if ($hex !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $hex);
  }

  // optional string bigNumberType = 3;
  const $bigNumberType = message.bigNumberType;
  if ($bigNumberType !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $bigNumberType);
  }

  // optional string symbol = 4;
  const $symbol = message.symbol;
  if ($symbol !== undefined) {
    writeVarint32(bb, 34);
    writeString(bb, $symbol);
  }
}

export function decodeSerializedTypedBigNumber(binary: Uint8Array): SerializedTypedBigNumber {
  return _decodeSerializedTypedBigNumber(wrapByteBuffer(binary));
}

function _decodeSerializedTypedBigNumber(bb: ByteBuffer): SerializedTypedBigNumber {
  const message: SerializedTypedBigNumber = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

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
  ethBalance?: SerializedTypedBigNumber;
  noteBalance?: SerializedTypedBigNumber;
  balancerPoolTotalSupply?: SerializedBigNumber;
  sNOTEBptBalance?: SerializedBigNumber;
  swapFee?: SerializedBigNumber;
  sNOTETotalSupply?: SerializedTypedBigNumber;
}

export function encodesNOTE(message: sNOTE): Uint8Array {
  const bb = popByteBuffer();
  _encodesNOTE(message, bb);
  return toUint8Array(bb);
}

function _encodesNOTE(message: sNOTE, bb: ByteBuffer): void {
  // optional string poolId = 1;
  const $poolId = message.poolId;
  if ($poolId !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $poolId);
  }

  // optional int32 coolDownTimeInSeconds = 2;
  const $coolDownTimeInSeconds = message.coolDownTimeInSeconds;
  if ($coolDownTimeInSeconds !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($coolDownTimeInSeconds));
  }

  // optional int32 redeemWindowSeconds = 3;
  const $redeemWindowSeconds = message.redeemWindowSeconds;
  if ($redeemWindowSeconds !== undefined) {
    writeVarint32(bb, 24);
    writeVarint64(bb, intToLong($redeemWindowSeconds));
  }

  // optional SerializedTypedBigNumber ethBalance = 4;
  const $ethBalance = message.ethBalance;
  if ($ethBalance !== undefined) {
    writeVarint32(bb, 34);
    const nested = popByteBuffer();
    _encodeSerializedTypedBigNumber($ethBalance, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedTypedBigNumber noteBalance = 5;
  const $noteBalance = message.noteBalance;
  if ($noteBalance !== undefined) {
    writeVarint32(bb, 42);
    const nested = popByteBuffer();
    _encodeSerializedTypedBigNumber($noteBalance, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedBigNumber balancerPoolTotalSupply = 6;
  const $balancerPoolTotalSupply = message.balancerPoolTotalSupply;
  if ($balancerPoolTotalSupply !== undefined) {
    writeVarint32(bb, 50);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($balancerPoolTotalSupply, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedBigNumber sNOTEBptBalance = 7;
  const $sNOTEBptBalance = message.sNOTEBptBalance;
  if ($sNOTEBptBalance !== undefined) {
    writeVarint32(bb, 58);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($sNOTEBptBalance, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedBigNumber swapFee = 8;
  const $swapFee = message.swapFee;
  if ($swapFee !== undefined) {
    writeVarint32(bb, 66);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($swapFee, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedTypedBigNumber sNOTETotalSupply = 9;
  const $sNOTETotalSupply = message.sNOTETotalSupply;
  if ($sNOTETotalSupply !== undefined) {
    writeVarint32(bb, 74);
    const nested = popByteBuffer();
    _encodeSerializedTypedBigNumber($sNOTETotalSupply, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodesNOTE(binary: Uint8Array): sNOTE {
  return _decodesNOTE(wrapByteBuffer(binary));
}

function _decodesNOTE(bb: ByteBuffer): sNOTE {
  const message: sNOTE = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

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

      // optional SerializedTypedBigNumber ethBalance = 4;
      case 4: {
        const limit = pushTemporaryLength(bb);
        message.ethBalance = _decodeSerializedTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedTypedBigNumber noteBalance = 5;
      case 5: {
        const limit = pushTemporaryLength(bb);
        message.noteBalance = _decodeSerializedTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedBigNumber balancerPoolTotalSupply = 6;
      case 6: {
        const limit = pushTemporaryLength(bb);
        message.balancerPoolTotalSupply = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedBigNumber sNOTEBptBalance = 7;
      case 7: {
        const limit = pushTemporaryLength(bb);
        message.sNOTEBptBalance = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedBigNumber swapFee = 8;
      case 8: {
        const limit = pushTemporaryLength(bb);
        message.swapFee = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedTypedBigNumber sNOTETotalSupply = 9;
      case 9: {
        const limit = pushTemporaryLength(bb);
        message.sNOTETotalSupply = _decodeSerializedTypedBigNumber(bb);
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
  notional?: SerializedTypedBigNumber;
  settlementDate?: number;
}

export function encodeAsset(message: Asset): Uint8Array {
  const bb = popByteBuffer();
  _encodeAsset(message, bb);
  return toUint8Array(bb);
}

function _encodeAsset(message: Asset, bb: ByteBuffer): void {
  // optional int32 currencyId = 1;
  const $currencyId = message.currencyId;
  if ($currencyId !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($currencyId));
  }

  // optional int32 maturity = 2;
  const $maturity = message.maturity;
  if ($maturity !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($maturity));
  }

  // optional string assetType = 3;
  const $assetType = message.assetType;
  if ($assetType !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $assetType);
  }

  // optional SerializedTypedBigNumber notional = 4;
  const $notional = message.notional;
  if ($notional !== undefined) {
    writeVarint32(bb, 34);
    const nested = popByteBuffer();
    _encodeSerializedTypedBigNumber($notional, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional int32 settlementDate = 5;
  const $settlementDate = message.settlementDate;
  if ($settlementDate !== undefined) {
    writeVarint32(bb, 40);
    writeVarint64(bb, intToLong($settlementDate));
  }
}

export function decodeAsset(binary: Uint8Array): Asset {
  return _decodeAsset(wrapByteBuffer(binary));
}

function _decodeAsset(bb: ByteBuffer): Asset {
  const message: Asset = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

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

      // optional SerializedTypedBigNumber notional = 4;
      case 4: {
        const limit = pushTemporaryLength(bb);
        message.notional = _decodeSerializedTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional int32 settlementDate = 5;
      case 5: {
        message.settlementDate = readVarint32(bb);
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface ETHRate {
  rateOracle?: SerializedContract;
  rateDecimalPlaces?: number;
  mustInvert?: boolean;
  buffer?: number;
  haircut?: number;
  latestRate?: SerializedBigNumber;
}

export function encodeETHRate(message: ETHRate): Uint8Array {
  const bb = popByteBuffer();
  _encodeETHRate(message, bb);
  return toUint8Array(bb);
}

function _encodeETHRate(message: ETHRate, bb: ByteBuffer): void {
  // optional SerializedContract rateOracle = 1;
  const $rateOracle = message.rateOracle;
  if ($rateOracle !== undefined) {
    writeVarint32(bb, 10);
    const nested = popByteBuffer();
    _encodeSerializedContract($rateOracle, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional int32 rateDecimalPlaces = 2;
  const $rateDecimalPlaces = message.rateDecimalPlaces;
  if ($rateDecimalPlaces !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($rateDecimalPlaces));
  }

  // optional bool mustInvert = 3;
  const $mustInvert = message.mustInvert;
  if ($mustInvert !== undefined) {
    writeVarint32(bb, 24);
    writeByte(bb, $mustInvert ? 1 : 0);
  }

  // optional int32 buffer = 4;
  const $buffer = message.buffer;
  if ($buffer !== undefined) {
    writeVarint32(bb, 32);
    writeVarint64(bb, intToLong($buffer));
  }

  // optional int32 haircut = 5;
  const $haircut = message.haircut;
  if ($haircut !== undefined) {
    writeVarint32(bb, 40);
    writeVarint64(bb, intToLong($haircut));
  }

  // optional SerializedBigNumber latestRate = 6;
  const $latestRate = message.latestRate;
  if ($latestRate !== undefined) {
    writeVarint32(bb, 50);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($latestRate, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeETHRate(binary: Uint8Array): ETHRate {
  return _decodeETHRate(wrapByteBuffer(binary));
}

function _decodeETHRate(bb: ByteBuffer): ETHRate {
  const message: ETHRate = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional SerializedContract rateOracle = 1;
      case 1: {
        const limit = pushTemporaryLength(bb);
        message.rateOracle = _decodeSerializedContract(bb);
        bb.limit = limit;
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

      // optional SerializedBigNumber latestRate = 6;
      case 6: {
        const limit = pushTemporaryLength(bb);
        message.latestRate = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      default:
        skipUnknownField(bb, tag & 7);
    }
  }

  return message;
}

export interface AssetRate {
  rateAdapter?: SerializedContract;
  underlyingDecimalPlaces?: number;
  latestRate?: SerializedBigNumber;
  annualSupplyRate?: SerializedBigNumber;
}

export function encodeAssetRate(message: AssetRate): Uint8Array {
  const bb = popByteBuffer();
  _encodeAssetRate(message, bb);
  return toUint8Array(bb);
}

function _encodeAssetRate(message: AssetRate, bb: ByteBuffer): void {
  // optional SerializedContract rateAdapter = 1;
  const $rateAdapter = message.rateAdapter;
  if ($rateAdapter !== undefined) {
    writeVarint32(bb, 10);
    const nested = popByteBuffer();
    _encodeSerializedContract($rateAdapter, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional int32 underlyingDecimalPlaces = 2;
  const $underlyingDecimalPlaces = message.underlyingDecimalPlaces;
  if ($underlyingDecimalPlaces !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($underlyingDecimalPlaces));
  }

  // optional SerializedBigNumber latestRate = 3;
  const $latestRate = message.latestRate;
  if ($latestRate !== undefined) {
    writeVarint32(bb, 26);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($latestRate, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedBigNumber annualSupplyRate = 4;
  const $annualSupplyRate = message.annualSupplyRate;
  if ($annualSupplyRate !== undefined) {
    writeVarint32(bb, 34);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($annualSupplyRate, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }
}

export function decodeAssetRate(binary: Uint8Array): AssetRate {
  return _decodeAssetRate(wrapByteBuffer(binary));
}

function _decodeAssetRate(bb: ByteBuffer): AssetRate {
  const message: AssetRate = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional SerializedContract rateAdapter = 1;
      case 1: {
        const limit = pushTemporaryLength(bb);
        message.rateAdapter = _decodeSerializedContract(bb);
        bb.limit = limit;
        break;
      }

      // optional int32 underlyingDecimalPlaces = 2;
      case 2: {
        message.underlyingDecimalPlaces = readVarint32(bb);
        break;
      }

      // optional SerializedBigNumber latestRate = 3;
      case 3: {
        const limit = pushTemporaryLength(bb);
        message.latestRate = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedBigNumber annualSupplyRate = 4;
      case 4: {
        const limit = pushTemporaryLength(bb);
        message.annualSupplyRate = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
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
  nTokenSymbol?: string;
  incentiveEmissionRate?: SerializedBigNumber;
  pvHaircutPercentage?: number;
  depositShares?: number[];
  leverageThresholds?: number[];
  contract?: SerializedContract;
  assetCashPV?: SerializedTypedBigNumber;
  totalSupply?: SerializedTypedBigNumber;
  accumulatedNOTEPerNToken?: SerializedBigNumber;
  lastAccumulatedTime?: SerializedBigNumber;
  cashBalance?: SerializedTypedBigNumber;
  liquidityTokens?: Asset[];
  fCash?: Asset[];
  migratedEmissionRate?: SerializedBigNumber;
  integralTotalSupply?: SerializedBigNumber;
  migrationTime?: number;
}

export function encodenToken(message: nToken): Uint8Array {
  const bb = popByteBuffer();
  _encodenToken(message, bb);
  return toUint8Array(bb);
}

function _encodenToken(message: nToken, bb: ByteBuffer): void {
  // optional string name = 1;
  const $name = message.name;
  if ($name !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $name);
  }

  // optional string nTokenSymbol = 2;
  const $nTokenSymbol = message.nTokenSymbol;
  if ($nTokenSymbol !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $nTokenSymbol);
  }

  // optional SerializedBigNumber incentiveEmissionRate = 3;
  const $incentiveEmissionRate = message.incentiveEmissionRate;
  if ($incentiveEmissionRate !== undefined) {
    writeVarint32(bb, 26);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($incentiveEmissionRate, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional int32 pvHaircutPercentage = 4;
  const $pvHaircutPercentage = message.pvHaircutPercentage;
  if ($pvHaircutPercentage !== undefined) {
    writeVarint32(bb, 32);
    writeVarint64(bb, intToLong($pvHaircutPercentage));
  }

  // repeated int32 depositShares = 5;
  const array$depositShares = message.depositShares;
  if (array$depositShares !== undefined) {
    const packed = popByteBuffer();
    for (const value of array$depositShares) {
      writeVarint64(packed, intToLong(value));
    }
    writeVarint32(bb, 42);
    writeVarint32(bb, packed.offset);
    writeByteBuffer(bb, packed);
    pushByteBuffer(packed);
  }

  // repeated int32 leverageThresholds = 6;
  const array$leverageThresholds = message.leverageThresholds;
  if (array$leverageThresholds !== undefined) {
    const packed = popByteBuffer();
    for (const value of array$leverageThresholds) {
      writeVarint64(packed, intToLong(value));
    }
    writeVarint32(bb, 50);
    writeVarint32(bb, packed.offset);
    writeByteBuffer(bb, packed);
    pushByteBuffer(packed);
  }

  // optional SerializedContract contract = 7;
  const $contract = message.contract;
  if ($contract !== undefined) {
    writeVarint32(bb, 58);
    const nested = popByteBuffer();
    _encodeSerializedContract($contract, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedTypedBigNumber assetCashPV = 8;
  const $assetCashPV = message.assetCashPV;
  if ($assetCashPV !== undefined) {
    writeVarint32(bb, 66);
    const nested = popByteBuffer();
    _encodeSerializedTypedBigNumber($assetCashPV, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedTypedBigNumber totalSupply = 9;
  const $totalSupply = message.totalSupply;
  if ($totalSupply !== undefined) {
    writeVarint32(bb, 74);
    const nested = popByteBuffer();
    _encodeSerializedTypedBigNumber($totalSupply, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedBigNumber accumulatedNOTEPerNToken = 10;
  const $accumulatedNOTEPerNToken = message.accumulatedNOTEPerNToken;
  if ($accumulatedNOTEPerNToken !== undefined) {
    writeVarint32(bb, 82);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($accumulatedNOTEPerNToken, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedBigNumber lastAccumulatedTime = 11;
  const $lastAccumulatedTime = message.lastAccumulatedTime;
  if ($lastAccumulatedTime !== undefined) {
    writeVarint32(bb, 90);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($lastAccumulatedTime, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedTypedBigNumber cashBalance = 12;
  const $cashBalance = message.cashBalance;
  if ($cashBalance !== undefined) {
    writeVarint32(bb, 98);
    const nested = popByteBuffer();
    _encodeSerializedTypedBigNumber($cashBalance, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // repeated Asset liquidityTokens = 13;
  const array$liquidityTokens = message.liquidityTokens;
  if (array$liquidityTokens !== undefined) {
    for (const value of array$liquidityTokens) {
      writeVarint32(bb, 106);
      const nested = popByteBuffer();
      _encodeAsset(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }

  // repeated Asset fCash = 14;
  const array$fCash = message.fCash;
  if (array$fCash !== undefined) {
    for (const value of array$fCash) {
      writeVarint32(bb, 114);
      const nested = popByteBuffer();
      _encodeAsset(value, nested);
      writeVarint32(bb, nested.limit);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }

  // optional SerializedBigNumber migratedEmissionRate = 15;
  const $migratedEmissionRate = message.migratedEmissionRate;
  if ($migratedEmissionRate !== undefined) {
    writeVarint32(bb, 122);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($migratedEmissionRate, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedBigNumber integralTotalSupply = 16;
  const $integralTotalSupply = message.integralTotalSupply;
  if ($integralTotalSupply !== undefined) {
    writeVarint32(bb, 130);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($integralTotalSupply, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional int32 migrationTime = 17;
  const $migrationTime = message.migrationTime;
  if ($migrationTime !== undefined) {
    writeVarint32(bb, 136);
    writeVarint64(bb, intToLong($migrationTime));
  }
}

export function decodenToken(binary: Uint8Array): nToken {
  return _decodenToken(wrapByteBuffer(binary));
}

function _decodenToken(bb: ByteBuffer): nToken {
  const message: nToken = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional string name = 1;
      case 1: {
        message.name = readString(bb, readVarint32(bb));
        break;
      }

      // optional string nTokenSymbol = 2;
      case 2: {
        message.nTokenSymbol = readString(bb, readVarint32(bb));
        break;
      }

      // optional SerializedBigNumber incentiveEmissionRate = 3;
      case 3: {
        const limit = pushTemporaryLength(bb);
        message.incentiveEmissionRate = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional int32 pvHaircutPercentage = 4;
      case 4: {
        message.pvHaircutPercentage = readVarint32(bb);
        break;
      }

      // repeated int32 depositShares = 5;
      case 5: {
        const values = message.depositShares || (message.depositShares = []);
        if ((tag & 7) === 2) {
          const outerLimit = pushTemporaryLength(bb);
          while (!isAtEnd(bb)) {
            values.push(readVarint32(bb));
          }
          bb.limit = outerLimit;
        } else {
          values.push(readVarint32(bb));
        }
        break;
      }

      // repeated int32 leverageThresholds = 6;
      case 6: {
        const values = message.leverageThresholds || (message.leverageThresholds = []);
        if ((tag & 7) === 2) {
          const outerLimit = pushTemporaryLength(bb);
          while (!isAtEnd(bb)) {
            values.push(readVarint32(bb));
          }
          bb.limit = outerLimit;
        } else {
          values.push(readVarint32(bb));
        }
        break;
      }

      // optional SerializedContract contract = 7;
      case 7: {
        const limit = pushTemporaryLength(bb);
        message.contract = _decodeSerializedContract(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedTypedBigNumber assetCashPV = 8;
      case 8: {
        const limit = pushTemporaryLength(bb);
        message.assetCashPV = _decodeSerializedTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedTypedBigNumber totalSupply = 9;
      case 9: {
        const limit = pushTemporaryLength(bb);
        message.totalSupply = _decodeSerializedTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedBigNumber accumulatedNOTEPerNToken = 10;
      case 10: {
        const limit = pushTemporaryLength(bb);
        message.accumulatedNOTEPerNToken = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedBigNumber lastAccumulatedTime = 11;
      case 11: {
        const limit = pushTemporaryLength(bb);
        message.lastAccumulatedTime = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedTypedBigNumber cashBalance = 12;
      case 12: {
        const limit = pushTemporaryLength(bb);
        message.cashBalance = _decodeSerializedTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // repeated Asset liquidityTokens = 13;
      case 13: {
        const limit = pushTemporaryLength(bb);
        const values = message.liquidityTokens || (message.liquidityTokens = []);
        values.push(_decodeAsset(bb));
        bb.limit = limit;
        break;
      }

      // repeated Asset fCash = 14;
      case 14: {
        const limit = pushTemporaryLength(bb);
        const values = message.fCash || (message.fCash = []);
        values.push(_decodeAsset(bb));
        bb.limit = limit;
        break;
      }

      // optional SerializedBigNumber migratedEmissionRate = 15;
      case 15: {
        const limit = pushTemporaryLength(bb);
        message.migratedEmissionRate = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedBigNumber integralTotalSupply = 16;
      case 16: {
        const limit = pushTemporaryLength(bb);
        message.integralTotalSupply = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional int32 migrationTime = 17;
      case 17: {
        message.migrationTime = readVarint32(bb);
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
  assetName?: string;
  assetSymbol?: string;
  assetDecimals?: SerializedBigNumber;
  assetDecimalPlaces?: number;
  assetContract?: SerializedContract;
  tokenType?: string;
  hasTransferFee?: boolean;
  underlyingName?: string;
  underlyingSymbol?: string;
  underlyingDecimals?: SerializedBigNumber;
  underlyingDecimalPlaces?: number;
  underlyingContract?: SerializedContract;
  nTokenSymbol?: string;
}

export function encodeCurrency(message: Currency): Uint8Array {
  const bb = popByteBuffer();
  _encodeCurrency(message, bb);
  return toUint8Array(bb);
}

function _encodeCurrency(message: Currency, bb: ByteBuffer): void {
  // optional int32 id = 1;
  const $id = message.id;
  if ($id !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($id));
  }

  // optional string assetName = 2;
  const $assetName = message.assetName;
  if ($assetName !== undefined) {
    writeVarint32(bb, 18);
    writeString(bb, $assetName);
  }

  // optional string assetSymbol = 3;
  const $assetSymbol = message.assetSymbol;
  if ($assetSymbol !== undefined) {
    writeVarint32(bb, 26);
    writeString(bb, $assetSymbol);
  }

  // optional SerializedBigNumber assetDecimals = 4;
  const $assetDecimals = message.assetDecimals;
  if ($assetDecimals !== undefined) {
    writeVarint32(bb, 34);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($assetDecimals, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional int32 assetDecimalPlaces = 5;
  const $assetDecimalPlaces = message.assetDecimalPlaces;
  if ($assetDecimalPlaces !== undefined) {
    writeVarint32(bb, 40);
    writeVarint64(bb, intToLong($assetDecimalPlaces));
  }

  // optional SerializedContract assetContract = 6;
  const $assetContract = message.assetContract;
  if ($assetContract !== undefined) {
    writeVarint32(bb, 50);
    const nested = popByteBuffer();
    _encodeSerializedContract($assetContract, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional string tokenType = 7;
  const $tokenType = message.tokenType;
  if ($tokenType !== undefined) {
    writeVarint32(bb, 58);
    writeString(bb, $tokenType);
  }

  // optional bool hasTransferFee = 8;
  const $hasTransferFee = message.hasTransferFee;
  if ($hasTransferFee !== undefined) {
    writeVarint32(bb, 64);
    writeByte(bb, $hasTransferFee ? 1 : 0);
  }

  // optional string underlyingName = 9;
  const $underlyingName = message.underlyingName;
  if ($underlyingName !== undefined) {
    writeVarint32(bb, 74);
    writeString(bb, $underlyingName);
  }

  // optional string underlyingSymbol = 10;
  const $underlyingSymbol = message.underlyingSymbol;
  if ($underlyingSymbol !== undefined) {
    writeVarint32(bb, 82);
    writeString(bb, $underlyingSymbol);
  }

  // optional SerializedBigNumber underlyingDecimals = 11;
  const $underlyingDecimals = message.underlyingDecimals;
  if ($underlyingDecimals !== undefined) {
    writeVarint32(bb, 90);
    const nested = popByteBuffer();
    _encodeSerializedBigNumber($underlyingDecimals, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional int32 underlyingDecimalPlaces = 12;
  const $underlyingDecimalPlaces = message.underlyingDecimalPlaces;
  if ($underlyingDecimalPlaces !== undefined) {
    writeVarint32(bb, 96);
    writeVarint64(bb, intToLong($underlyingDecimalPlaces));
  }

  // optional SerializedContract underlyingContract = 13;
  const $underlyingContract = message.underlyingContract;
  if ($underlyingContract !== undefined) {
    writeVarint32(bb, 106);
    const nested = popByteBuffer();
    _encodeSerializedContract($underlyingContract, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional string nTokenSymbol = 14;
  const $nTokenSymbol = message.nTokenSymbol;
  if ($nTokenSymbol !== undefined) {
    writeVarint32(bb, 114);
    writeString(bb, $nTokenSymbol);
  }
}

export function decodeCurrency(binary: Uint8Array): Currency {
  return _decodeCurrency(wrapByteBuffer(binary));
}

function _decodeCurrency(bb: ByteBuffer): Currency {
  const message: Currency = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional int32 id = 1;
      case 1: {
        message.id = readVarint32(bb);
        break;
      }

      // optional string assetName = 2;
      case 2: {
        message.assetName = readString(bb, readVarint32(bb));
        break;
      }

      // optional string assetSymbol = 3;
      case 3: {
        message.assetSymbol = readString(bb, readVarint32(bb));
        break;
      }

      // optional SerializedBigNumber assetDecimals = 4;
      case 4: {
        const limit = pushTemporaryLength(bb);
        message.assetDecimals = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional int32 assetDecimalPlaces = 5;
      case 5: {
        message.assetDecimalPlaces = readVarint32(bb);
        break;
      }

      // optional SerializedContract assetContract = 6;
      case 6: {
        const limit = pushTemporaryLength(bb);
        message.assetContract = _decodeSerializedContract(bb);
        bb.limit = limit;
        break;
      }

      // optional string tokenType = 7;
      case 7: {
        message.tokenType = readString(bb, readVarint32(bb));
        break;
      }

      // optional bool hasTransferFee = 8;
      case 8: {
        message.hasTransferFee = !!readByte(bb);
        break;
      }

      // optional string underlyingName = 9;
      case 9: {
        message.underlyingName = readString(bb, readVarint32(bb));
        break;
      }

      // optional string underlyingSymbol = 10;
      case 10: {
        message.underlyingSymbol = readString(bb, readVarint32(bb));
        break;
      }

      // optional SerializedBigNumber underlyingDecimals = 11;
      case 11: {
        const limit = pushTemporaryLength(bb);
        message.underlyingDecimals = _decodeSerializedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional int32 underlyingDecimalPlaces = 12;
      case 12: {
        message.underlyingDecimalPlaces = readVarint32(bb);
        break;
      }

      // optional SerializedContract underlyingContract = 13;
      case 13: {
        const limit = pushTemporaryLength(bb);
        message.underlyingContract = _decodeSerializedContract(bb);
        bb.limit = limit;
        break;
      }

      // optional string nTokenSymbol = 14;
      case 14: {
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
  totalfCash?: SerializedTypedBigNumber;
  totalAssetCash?: SerializedTypedBigNumber;
  totalLiquidity?: SerializedTypedBigNumber;
  lastImpliedRate?: number;
  oracleRate?: number;
  previousTradeTime?: number;
}

export function encodeMarket(message: Market): Uint8Array {
  const bb = popByteBuffer();
  _encodeMarket(message, bb);
  return toUint8Array(bb);
}

function _encodeMarket(message: Market, bb: ByteBuffer): void {
  // optional SerializedTypedBigNumber totalfCash = 1;
  const $totalfCash = message.totalfCash;
  if ($totalfCash !== undefined) {
    writeVarint32(bb, 10);
    const nested = popByteBuffer();
    _encodeSerializedTypedBigNumber($totalfCash, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedTypedBigNumber totalAssetCash = 2;
  const $totalAssetCash = message.totalAssetCash;
  if ($totalAssetCash !== undefined) {
    writeVarint32(bb, 18);
    const nested = popByteBuffer();
    _encodeSerializedTypedBigNumber($totalAssetCash, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional SerializedTypedBigNumber totalLiquidity = 3;
  const $totalLiquidity = message.totalLiquidity;
  if ($totalLiquidity !== undefined) {
    writeVarint32(bb, 26);
    const nested = popByteBuffer();
    _encodeSerializedTypedBigNumber($totalLiquidity, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional int32 lastImpliedRate = 4;
  const $lastImpliedRate = message.lastImpliedRate;
  if ($lastImpliedRate !== undefined) {
    writeVarint32(bb, 32);
    writeVarint64(bb, intToLong($lastImpliedRate));
  }

  // optional int32 oracleRate = 5;
  const $oracleRate = message.oracleRate;
  if ($oracleRate !== undefined) {
    writeVarint32(bb, 40);
    writeVarint64(bb, intToLong($oracleRate));
  }

  // optional int32 previousTradeTime = 6;
  const $previousTradeTime = message.previousTradeTime;
  if ($previousTradeTime !== undefined) {
    writeVarint32(bb, 48);
    writeVarint64(bb, intToLong($previousTradeTime));
  }
}

export function decodeMarket(binary: Uint8Array): Market {
  return _decodeMarket(wrapByteBuffer(binary));
}

function _decodeMarket(bb: ByteBuffer): Market {
  const message: Market = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

    switch (tag >>> 3) {
      case 0:
        break end_of_message;

      // optional SerializedTypedBigNumber totalfCash = 1;
      case 1: {
        const limit = pushTemporaryLength(bb);
        message.totalfCash = _decodeSerializedTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedTypedBigNumber totalAssetCash = 2;
      case 2: {
        const limit = pushTemporaryLength(bb);
        message.totalAssetCash = _decodeSerializedTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional SerializedTypedBigNumber totalLiquidity = 3;
      case 3: {
        const limit = pushTemporaryLength(bb);
        message.totalLiquidity = _decodeSerializedTypedBigNumber(bb);
        bb.limit = limit;
        break;
      }

      // optional int32 lastImpliedRate = 4;
      case 4: {
        message.lastImpliedRate = readVarint32(bb);
        break;
      }

      // optional int32 oracleRate = 5;
      case 5: {
        message.oracleRate = readVarint32(bb);
        break;
      }

      // optional int32 previousTradeTime = 6;
      case 6: {
        message.previousTradeTime = readVarint32(bb);
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
  const bb = popByteBuffer();
  _encodeCashGroup(message, bb);
  return toUint8Array(bb);
}

function _encodeCashGroup(message: CashGroup, bb: ByteBuffer): void {
  // optional int32 maxMarketIndex = 1;
  const $maxMarketIndex = message.maxMarketIndex;
  if ($maxMarketIndex !== undefined) {
    writeVarint32(bb, 8);
    writeVarint64(bb, intToLong($maxMarketIndex));
  }

  // optional int32 rateOracleTimeWindowSeconds = 2;
  const $rateOracleTimeWindowSeconds = message.rateOracleTimeWindowSeconds;
  if ($rateOracleTimeWindowSeconds !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($rateOracleTimeWindowSeconds));
  }

  // optional int32 totalFeeBasisPoints = 3;
  const $totalFeeBasisPoints = message.totalFeeBasisPoints;
  if ($totalFeeBasisPoints !== undefined) {
    writeVarint32(bb, 24);
    writeVarint64(bb, intToLong($totalFeeBasisPoints));
  }

  // optional int32 reserveFeeSharePercent = 4;
  const $reserveFeeSharePercent = message.reserveFeeSharePercent;
  if ($reserveFeeSharePercent !== undefined) {
    writeVarint32(bb, 32);
    writeVarint64(bb, intToLong($reserveFeeSharePercent));
  }

  // optional int32 debtBufferBasisPoints = 5;
  const $debtBufferBasisPoints = message.debtBufferBasisPoints;
  if ($debtBufferBasisPoints !== undefined) {
    writeVarint32(bb, 40);
    writeVarint64(bb, intToLong($debtBufferBasisPoints));
  }

  // optional int32 fCashHaircutBasisPoints = 6;
  const $fCashHaircutBasisPoints = message.fCashHaircutBasisPoints;
  if ($fCashHaircutBasisPoints !== undefined) {
    writeVarint32(bb, 48);
    writeVarint64(bb, intToLong($fCashHaircutBasisPoints));
  }

  // repeated int32 liquidityTokenHaircutsPercent = 7;
  const array$liquidityTokenHaircutsPercent = message.liquidityTokenHaircutsPercent;
  if (array$liquidityTokenHaircutsPercent !== undefined) {
    const packed = popByteBuffer();
    for (const value of array$liquidityTokenHaircutsPercent) {
      writeVarint64(packed, intToLong(value));
    }
    writeVarint32(bb, 58);
    writeVarint32(bb, packed.offset);
    writeByteBuffer(bb, packed);
    pushByteBuffer(packed);
  }

  // repeated int32 rateScalars = 8;
  const array$rateScalars = message.rateScalars;
  if (array$rateScalars !== undefined) {
    const packed = popByteBuffer();
    for (const value of array$rateScalars) {
      writeVarint64(packed, intToLong(value));
    }
    writeVarint32(bb, 66);
    writeVarint32(bb, packed.offset);
    writeByteBuffer(bb, packed);
    pushByteBuffer(packed);
  }

  // repeated Market markets = 9;
  const array$markets = message.markets;
  if (array$markets !== undefined) {
    for (const value of array$markets) {
      writeVarint32(bb, 74);
      const nested = popByteBuffer();
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
  const message: CashGroup = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

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
        const values = message.liquidityTokenHaircutsPercent || (message.liquidityTokenHaircutsPercent = []);
        if ((tag & 7) === 2) {
          const outerLimit = pushTemporaryLength(bb);
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
        const values = message.rateScalars || (message.rateScalars = []);
        if ((tag & 7) === 2) {
          const outerLimit = pushTemporaryLength(bb);
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
        const limit = pushTemporaryLength(bb);
        const values = message.markets || (message.markets = []);
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

export interface SystemData {
  network?: string;
  lastUpdateBlockNumber?: number;
  lastUpdateTimestamp?: number;
  USDExchangeRates?: { [key: string]: SerializedBigNumber };
  StakedNoteParameters?: sNOTE;
  currencies?: { [key: number]: Currency };
  ethRateData?: { [key: number]: ETHRate };
  assetRateData?: { [key: number]: AssetRate };
  nTokenData?: { [key: number]: nToken };
  cashGroups?: { [key: number]: CashGroup };
}

export function encodeSystemData(message: SystemData): Uint8Array {
  const bb = popByteBuffer();
  _encodeSystemData(message, bb);
  return toUint8Array(bb);
}

function _encodeSystemData(message: SystemData, bb: ByteBuffer): void {
  // optional string network = 1;
  const $network = message.network;
  if ($network !== undefined) {
    writeVarint32(bb, 10);
    writeString(bb, $network);
  }

  // optional int32 lastUpdateBlockNumber = 2;
  const $lastUpdateBlockNumber = message.lastUpdateBlockNumber;
  if ($lastUpdateBlockNumber !== undefined) {
    writeVarint32(bb, 16);
    writeVarint64(bb, intToLong($lastUpdateBlockNumber));
  }

  // optional int32 lastUpdateTimestamp = 3;
  const $lastUpdateTimestamp = message.lastUpdateTimestamp;
  if ($lastUpdateTimestamp !== undefined) {
    writeVarint32(bb, 24);
    writeVarint64(bb, intToLong($lastUpdateTimestamp));
  }

  // optional map<string, SerializedBigNumber> USDExchangeRates = 4;
  const map$USDExchangeRates = message.USDExchangeRates;
  if (map$USDExchangeRates !== undefined) {
    for (const key in map$USDExchangeRates) {
      const nested = popByteBuffer();
      const value = map$USDExchangeRates[key];
      writeVarint32(nested, 10);
      writeString(nested, key);
      writeVarint32(nested, 18);
      const nestedValue = popByteBuffer();
      _encodeSerializedBigNumber(value, nestedValue);
      writeVarint32(nested, nestedValue.limit);
      writeByteBuffer(nested, nestedValue);
      pushByteBuffer(nestedValue);
      writeVarint32(bb, 34);
      writeVarint32(bb, nested.offset);
      writeByteBuffer(bb, nested);
      pushByteBuffer(nested);
    }
  }

  // optional sNOTE StakedNoteParameters = 5;
  const $StakedNoteParameters = message.StakedNoteParameters;
  if ($StakedNoteParameters !== undefined) {
    writeVarint32(bb, 42);
    const nested = popByteBuffer();
    _encodesNOTE($StakedNoteParameters, nested);
    writeVarint32(bb, nested.limit);
    writeByteBuffer(bb, nested);
    pushByteBuffer(nested);
  }

  // optional map<int32, Currency> currencies = 6;
  const map$currencies = message.currencies;
  if (map$currencies !== undefined) {
    for (const key in map$currencies) {
      const nested = popByteBuffer();
      const value = map$currencies[key];
      writeVarint32(nested, 8);
      writeVarint64(nested, intToLong(+key));
      writeVarint32(nested, 18);
      const nestedValue = popByteBuffer();
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
  const map$ethRateData = message.ethRateData;
  if (map$ethRateData !== undefined) {
    for (const key in map$ethRateData) {
      const nested = popByteBuffer();
      const value = map$ethRateData[key];
      writeVarint32(nested, 8);
      writeVarint64(nested, intToLong(+key));
      writeVarint32(nested, 18);
      const nestedValue = popByteBuffer();
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
  const map$assetRateData = message.assetRateData;
  if (map$assetRateData !== undefined) {
    for (const key in map$assetRateData) {
      const nested = popByteBuffer();
      const value = map$assetRateData[key];
      writeVarint32(nested, 8);
      writeVarint64(nested, intToLong(+key));
      writeVarint32(nested, 18);
      const nestedValue = popByteBuffer();
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
  const map$nTokenData = message.nTokenData;
  if (map$nTokenData !== undefined) {
    for (const key in map$nTokenData) {
      const nested = popByteBuffer();
      const value = map$nTokenData[key];
      writeVarint32(nested, 8);
      writeVarint64(nested, intToLong(+key));
      writeVarint32(nested, 18);
      const nestedValue = popByteBuffer();
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
  const map$cashGroups = message.cashGroups;
  if (map$cashGroups !== undefined) {
    for (const key in map$cashGroups) {
      const nested = popByteBuffer();
      const value = map$cashGroups[key];
      writeVarint32(nested, 8);
      writeVarint64(nested, intToLong(+key));
      writeVarint32(nested, 18);
      const nestedValue = popByteBuffer();
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

export function decodeSystemData(binary: Uint8Array): SystemData {
  return _decodeSystemData(wrapByteBuffer(binary));
}

function _decodeSystemData(bb: ByteBuffer): SystemData {
  const message: SystemData = {} as any;

  end_of_message: while (!isAtEnd(bb)) {
    const tag = readVarint32(bb);

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

      // optional map<string, SerializedBigNumber> USDExchangeRates = 4;
      case 4: {
        const values = message.USDExchangeRates || (message.USDExchangeRates = {});
        const outerLimit = pushTemporaryLength(bb);
        let key: string | undefined;
        let value: SerializedBigNumber | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          const tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readString(bb, readVarint32(bb));
              break;
            }
            case 2: {
              const valueLimit = pushTemporaryLength(bb);
              value = _decodeSerializedBigNumber(bb);
              bb.limit = valueLimit;
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
        const limit = pushTemporaryLength(bb);
        message.StakedNoteParameters = _decodesNOTE(bb);
        bb.limit = limit;
        break;
      }

      // optional map<int32, Currency> currencies = 6;
      case 6: {
        const values = message.currencies || (message.currencies = {});
        const outerLimit = pushTemporaryLength(bb);
        let key: number | undefined;
        let value: Currency | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          const tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readVarint32(bb);
              break;
            }
            case 2: {
              const valueLimit = pushTemporaryLength(bb);
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
        const values = message.ethRateData || (message.ethRateData = {});
        const outerLimit = pushTemporaryLength(bb);
        let key: number | undefined;
        let value: ETHRate | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          const tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readVarint32(bb);
              break;
            }
            case 2: {
              const valueLimit = pushTemporaryLength(bb);
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
        const values = message.assetRateData || (message.assetRateData = {});
        const outerLimit = pushTemporaryLength(bb);
        let key: number | undefined;
        let value: AssetRate | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          const tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readVarint32(bb);
              break;
            }
            case 2: {
              const valueLimit = pushTemporaryLength(bb);
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
        const values = message.nTokenData || (message.nTokenData = {});
        const outerLimit = pushTemporaryLength(bb);
        let key: number | undefined;
        let value: nToken | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          const tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readVarint32(bb);
              break;
            }
            case 2: {
              const valueLimit = pushTemporaryLength(bb);
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
        const values = message.cashGroups || (message.cashGroups = {});
        const outerLimit = pushTemporaryLength(bb);
        let key: number | undefined;
        let value: CashGroup | undefined;
        end_of_entry: while (!isAtEnd(bb)) {
          const tag = readVarint32(bb);
          switch (tag >>> 3) {
            case 0:
              break end_of_entry;
            case 1: {
              key = readVarint32(bb);
              break;
            }
            case 2: {
              const valueLimit = pushTemporaryLength(bb);
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
  const length = readVarint32(bb);
  const { limit } = bb;
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
      throw new Error(`Unimplemented type: ${type}`);
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
  const { low } = value;
  const { high } = value;
  return String.fromCharCode(low & 0xffff, low >>> 16, high & 0xffff, high >>> 16);
}

// The code below was modified from https://github.com/protobufjs/bytebuffer.js
// which is under the Apache License 2.0.

const f32 = new Float32Array(1);
const f32_u8 = new Uint8Array(f32.buffer);

const f64 = new Float64Array(1);
const f64_u8 = new Uint8Array(f64.buffer);

function intToLong(value: number): Long {
  value |= 0;
  return {
    low: value,
    high: value >> 31,
    unsigned: value >= 0,
  };
}

const bbStack: ByteBuffer[] = [];

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
  const { bytes } = bb;
  const { limit } = bb;
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
  const { bytes } = bb;
  const { offset } = bb;
  const { limit } = bb;
  const finalOffset = offset + count;
  if (finalOffset > bytes.length) {
    const newBytes = new Uint8Array(finalOffset * 2);
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
  const { offset } = bb;
  if (offset + count > bb.limit) {
    throw new Error('Read past limit');
  }
  bb.offset += count;
  return offset;
}

function readBytes(bb: ByteBuffer, count: number): Uint8Array {
  const offset = advance(bb, count);
  return bb.bytes.subarray(offset, offset + count);
}

function writeBytes(bb: ByteBuffer, buffer: Uint8Array): void {
  const offset = grow(bb, buffer.length);
  bb.bytes.set(buffer, offset);
}

function readString(bb: ByteBuffer, count: number): string {
  // Sadly a hand-coded UTF8 decoder is much faster than subarray+TextDecoder in V8
  const offset = advance(bb, count);
  const { fromCharCode } = String;
  const { bytes } = bb;
  const invalid = '\uFFFD';
  let text = '';

  for (let i = 0; i < count; i++) {
    const c1 = bytes[i + offset];
    let c2: number;
    let c3: number;
    let c4: number;
    let c: number;

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
  const n = text.length;
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
  const { bytes } = bb;

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
  const offset = grow(bb, buffer.limit);
  const from = bb.bytes;
  const to = buffer.bytes;

  // This for loop is much faster than subarray+set on V8
  for (let i = 0, n = buffer.limit; i < n; i++) {
    from[i + offset] = to[i];
  }
}

function readByte(bb: ByteBuffer): number {
  return bb.bytes[advance(bb, 1)];
}

function writeByte(bb: ByteBuffer, value: number): void {
  const offset = grow(bb, 1);
  bb.bytes[offset] = value;
}

function readFloat(bb: ByteBuffer): number {
  let offset = advance(bb, 4);
  const { bytes } = bb;

  // Manual copying is much faster than subarray+set in V8
  f32_u8[0] = bytes[offset++];
  f32_u8[1] = bytes[offset++];
  f32_u8[2] = bytes[offset++];
  f32_u8[3] = bytes[offset++];
  return f32[0];
}

function writeFloat(bb: ByteBuffer, value: number): void {
  let offset = grow(bb, 4);
  const { bytes } = bb;
  f32[0] = value;

  // Manual copying is much faster than subarray+set in V8
  bytes[offset++] = f32_u8[0];
  bytes[offset++] = f32_u8[1];
  bytes[offset++] = f32_u8[2];
  bytes[offset++] = f32_u8[3];
}

function readDouble(bb: ByteBuffer): number {
  let offset = advance(bb, 8);
  const { bytes } = bb;

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
  const { bytes } = bb;
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
  const offset = advance(bb, 4);
  const { bytes } = bb;
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
}

function writeInt32(bb: ByteBuffer, value: number): void {
  const offset = grow(bb, 4);
  const { bytes } = bb;
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
  const part0 = value.low >>> 0;
  const part1 = ((value.low >>> 28) | (value.high << 4)) >>> 0;
  const part2 = value.high >>> 24;

  // ref: src/google/protobuf/io/coded_stream.cc
  const size =
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

  const offset = grow(bb, size);
  const { bytes } = bb;

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
  const value = readVarint32(bb);

  // ref: src/google/protobuf/wire_format_lite.h
  return (value >>> 1) ^ -(value & 1);
}

function writeVarint32ZigZag(bb: ByteBuffer, value: number): void {
  // ref: src/google/protobuf/wire_format_lite.h
  writeVarint32(bb, (value << 1) ^ (value >> 31));
}

function readVarint64ZigZag(bb: ByteBuffer): Long {
  const value = readVarint64(bb, /* unsigned */ false);
  const { low } = value;
  const { high } = value;
  const flip = -(low & 1);

  // ref: src/google/protobuf/wire_format_lite.h
  return {
    low: ((low >>> 1) | (high << 31)) ^ flip,
    high: (high >>> 1) ^ flip,
    unsigned: false,
  };
}

function writeVarint64ZigZag(bb: ByteBuffer, value: Long): void {
  const { low } = value;
  const { high } = value;
  const flip = high >> 31;

  // ref: src/google/protobuf/wire_format_lite.h
  writeVarint64(bb, {
    low: (low << 1) ^ flip,
    high: ((high << 1) | (low >>> 31)) ^ flip,
    unsigned: false,
  });
}
