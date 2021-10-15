import {
  BigNumber, BigNumberish, constants, utils,
} from 'ethers';
import {INTERNAL_TOKEN_PRECISION, PERCENTAGE_BASIS, INTERNAL_TOKEN_DECIMAL_PLACES} from '../config/constants';
import {System, NTokenValue} from '../system';

export enum BigNumberType {
  ExternalUnderlying = 'External Underlying',
  InternalUnderlying = 'Internal Underlying',
  ExternalAsset = 'External Asset',
  InternalAsset = 'Internal Asset',
  LiquidityToken = 'Liquidity Token',
  nToken = 'nToken',
  NOTE = 'NOTE',
}

class TypedBigNumber {
  public currencyId: number;

  private constructor(public n: BigNumber, public type: BigNumberType, public symbol: string) {
    if (symbol === 'NOTE') {
      this.currencyId = 2 ** 32 - 1;
    } else {
      this.currencyId = System.getSystem().getCurrencyBySymbol(symbol).id;
    }
  }

  static getType(symbol: string, isInternal: boolean) {
    const currency = System.getSystem().getCurrencyBySymbol(symbol);
    if (symbol === currency.underlyingSymbol) {
      return isInternal ? BigNumberType.InternalUnderlying : BigNumberType.ExternalUnderlying;
    }
    if (symbol === currency.symbol) {
      return isInternal ? BigNumberType.InternalAsset : BigNumberType.ExternalAsset;
    }
    if (symbol === currency.nTokenSymbol) {
      return BigNumberType.nToken;
    }
    if (symbol === 'NOTE') {
      return BigNumberType.NOTE;
    }
    throw Error(`Invalid symbol ${symbol}`);
  }

  static fromBalance(value: any, symbol: string, isInternal: boolean) {
    const bnType = TypedBigNumber.getType(symbol, isInternal);
    return new TypedBigNumber(BigNumber.from(value), bnType, symbol);
  }

  static from(value: any, type: BigNumberType, symbol: string) {
    // eslint-disable-next-line no-underscore-dangle
    if (value._isBigNumber) return new TypedBigNumber(value, type, symbol);
    return new TypedBigNumber(BigNumber.from(value), type, symbol);
  }

  static max(a: TypedBigNumber, b: TypedBigNumber): TypedBigNumber {
    a.checkMatch(b);
    return a.gte(b) ? a : b;
  }

  static min(a: TypedBigNumber, b: TypedBigNumber): TypedBigNumber {
    a.checkMatch(b);
    return a.lte(b) ? a : b;
  }

  checkType(type: BigNumberType) {
    if (this.type !== type) throw TypeError(`Invalid TypedBigNumber type ${this.type} != ${type}`);
  }

  check(type: BigNumberType, symbol: string | undefined) {
    if (this.type !== type) throw TypeError(`Invalid TypedBigNumber type ${this.type} != ${type}`);
    if (this.symbol !== symbol) throw TypeError(`Invalid TypedBigNumber currency ${this.symbol} != ${symbol}`);
  }

  checkMatch(other: TypedBigNumber) {
    if (other.type !== this.type) throw TypeError(`Unmatched BigNumber types ${this.type} != ${other.type}`);
    if (this.symbol && this.symbol !== other.symbol) {
      throw TypeError(`Unmatched currency types ${this.symbol} != ${other.symbol}`);
    }
  }

  copy(n: BigNumberish) {
    return new TypedBigNumber(BigNumber.from(n), this.type, this.symbol);
  }

  abs(): TypedBigNumber {
    return this.copy(this.n.abs());
  }

  add(other: TypedBigNumber): TypedBigNumber {
    this.checkMatch(other);
    return this.copy(this.n.add(other.n));
  }

  sub(other: TypedBigNumber): TypedBigNumber {
    this.checkMatch(other);
    return this.copy(this.n.sub(other.n));
  }

  scale(numerator: BigNumberish, divisor: BigNumberish): TypedBigNumber {
    return this.copy(this.n.mul(numerator).div(divisor));
  }

  neg(): TypedBigNumber {
    return this.copy(this.n.mul(-1));
  }

  eq(other: TypedBigNumber): boolean {
    this.checkMatch(other);
    return this.n.eq(other.n);
  }

  lt(other: TypedBigNumber): boolean {
    this.checkMatch(other);
    return this.n.lt(other.n);
  }

  lte(other: TypedBigNumber): boolean {
    this.checkMatch(other);
    return this.n.lte(other.n);
  }

  gt(other: TypedBigNumber): boolean {
    this.checkMatch(other);
    return this.n.gt(other.n);
  }

  gte(other: TypedBigNumber): boolean {
    this.checkMatch(other);
    return this.n.gte(other.n);
  }

  isNegative(): boolean {
    return this.n.isNegative();
  }

  isPositive(): boolean {
    return this.n.gt(0);
  }

  isZero(): boolean {
    return this.n.isZero();
  }

  toNumber(): number {
    return this.n.toNumber();
  }

  toBigInt(): bigint {
    return this.n.toBigInt();
  }

  toString(): string {
    return this.n.toString();
  }

  toHexString(): string {
    return this.n.toHexString();
  }

  isAssetCash(): boolean {
    return this.type === BigNumberType.InternalAsset || this.type === BigNumberType.ExternalAsset;
  }

  isUnderlying(): boolean {
    return this.type === BigNumberType.InternalUnderlying || this.type === BigNumberType.ExternalUnderlying;
  }

  isNToken(): boolean {
    return this.type === BigNumberType.nToken;
  }

  isInternalPrecision(): boolean {
    return (
      this.type === BigNumberType.InternalUnderlying
      || this.type === BigNumberType.InternalAsset
      || this.type === BigNumberType.LiquidityToken
      || this.type === BigNumberType.NOTE
      || this.type === BigNumberType.nToken
    );
  }

  isExternalPrecision(): boolean {
    return !this.isInternalPrecision();
  }

  toExactString(): string {
    if (this.isInternalPrecision()) {
      return utils.formatUnits(this.n, INTERNAL_TOKEN_DECIMAL_PLACES);
    }
    const currency = System.getSystem().getCurrencyBySymbol(this.symbol);
    return utils.formatUnits(
      this.n,
      this.isUnderlying() ? currency.underlyingDecimalPlaces : currency.decimalPlaces,
    );
  }

  toDisplayString(decimalPlaces = 3, locale = 'en-US'): string {
    const exactString = this.toExactString();
    const displayString = parseFloat(exactString).toLocaleString(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

    // If the return string is -0.00 or some variant, strip the negative
    if (displayString.match(/-0\.?[0]*/)) {
      return displayString.replace('-', '');
    }

    return displayString;
  }

  toAssetCash(internalPrecision: boolean = this.isInternalPrecision(), overrideRate?: BigNumber): TypedBigNumber {
    if (this.isAssetCash()) {
      return internalPrecision ? this.toInternalPrecision() : this.toExternalPrecision();
    }

    if (this.isUnderlying()) {
      const {underlyingDecimalPlaces, assetRate: fetchedRate} = System.getSystem().getAssetRate(this.currencyId);
      const assetRate = overrideRate || fetchedRate;
      if (!underlyingDecimalPlaces || !assetRate) throw Error(`Asset rate for ${this.currencyId} not found`);

      const underlyingDecimals = BigNumber.from(10).pow(underlyingDecimalPlaces);
      const currency = System.getSystem().getCurrencyById(this.currencyId);

      if (this.isInternalPrecision()) {
        // rateDecimals * balance * underlyingPrecision / assetRate * internalPrecision
        const assetValue = this.n
          .mul(constants.WeiPerEther as BigNumber)
          .mul(underlyingDecimals)
          .div(assetRate)
          .div(INTERNAL_TOKEN_PRECISION);

        const bn = new TypedBigNumber(assetValue, BigNumberType.InternalAsset, currency.symbol);
        return internalPrecision ? bn : bn.toExternalPrecision();
      }
      // rateDecimals * balance / assetRate
      const assetValue = this.n.mul(constants.WeiPerEther as BigNumber).div(assetRate);

      const bn = new TypedBigNumber(assetValue, BigNumberType.ExternalAsset, currency.symbol);
      // Convert to internal precision if required by parameter
      return internalPrecision ? bn.toInternalPrecision() : bn;
    }

    if (this.isNToken()) {
      // This returns the nToken balance in asset cash value (does not include redeem slippage)
      const assetValue = NTokenValue.convertNTokenToInternalAsset(this.currencyId, this, false);
      return internalPrecision ? assetValue : assetValue.toExternalPrecision();
    }

    throw Error(`Cannot convert ${this.type} to asset cash directly`);
  }

  toUnderlying(internalPrecision: boolean = this.isInternalPrecision(), overrideRate?: BigNumber): TypedBigNumber {
    if (this.isUnderlying()) {
      return internalPrecision ? this.toInternalPrecision() : this.toExternalPrecision();
    }

    if (this.isAssetCash()) {
      const {underlyingDecimalPlaces, assetRate: fetchedRate} = System.getSystem().getAssetRate(this.currencyId);
      const assetRate = overrideRate || fetchedRate;
      if (!underlyingDecimalPlaces || !assetRate) throw Error(`Asset rate for ${this.currencyId} not found`);

      const underlyingDecimals = BigNumber.from(10).pow(underlyingDecimalPlaces);
      const underlyingSymbol = System.getSystem().getUnderlyingSymbol(this.currencyId);

      if (this.isInternalPrecision()) {
        // (balance * assetRate * internalPrecision) / (assetRateDecimals * underlyingPrecision)
        const underlying = this.n
          .mul(assetRate)
          .mul(INTERNAL_TOKEN_PRECISION)
          .div(constants.WeiPerEther as BigNumber)
          .div(underlyingDecimals);

        const bn = new TypedBigNumber(underlying, BigNumberType.InternalUnderlying, underlyingSymbol);
        // Convert to external precision if required by parameter
        return internalPrecision ? bn : bn.toExternalPrecision();
      }
      // (balance * assetRate) / (assetRateDecimals)
      const underlying = this.n.mul(assetRate).div(constants.WeiPerEther as BigNumber);

      const bn = new TypedBigNumber(underlying, BigNumberType.ExternalUnderlying, underlyingSymbol);
      // Convert to internal precision if required by parameter
      return internalPrecision ? bn.toInternalPrecision() : bn;
    }

    if (this.isNToken()) {
      // This returns the nToken balance in underlying value (does not include redeem slippage)
      return NTokenValue.convertNTokenToInternalAsset(this.currencyId, this, false).toUnderlying(internalPrecision);
    }

    throw Error(`Cannot convert ${this.type} to underlying directly`);
  }

  toInternalPrecision(): TypedBigNumber {
    if (this.isInternalPrecision()) return this;

    let newType: BigNumberType;
    if (this.type === BigNumberType.ExternalAsset) {
      newType = BigNumberType.InternalAsset;
    } else if (this.type === BigNumberType.ExternalUnderlying) {
      newType = BigNumberType.InternalUnderlying;
    } else {
      throw TypeError('Unknown external precision type');
    }

    const currency = System.getSystem().getCurrencyById(this.currencyId);
    const decimals = this.isUnderlying() ? currency.underlyingDecimals : currency.decimals;
    if (!decimals) throw new Error(`Decimals not found for currency ${this.currencyId}`);

    return new TypedBigNumber(this.n.mul(INTERNAL_TOKEN_PRECISION).div(decimals), newType, this.symbol);
  }

  toExternalPrecision(): TypedBigNumber {
    if (this.isExternalPrecision()) return this;
    if (
      this.type === BigNumberType.LiquidityToken
      || this.type === BigNumberType.NOTE
      || this.type === BigNumberType.nToken
    ) return this;

    let newType: BigNumberType;
    if (this.type === BigNumberType.InternalAsset) {
      newType = BigNumberType.ExternalAsset;
    } else if (this.type === BigNumberType.InternalUnderlying) {
      newType = BigNumberType.ExternalUnderlying;
    } else {
      throw TypeError('Unknown external precision type');
    }

    const currency = System.getSystem().getCurrencyById(this.currencyId);
    const decimals = this.isUnderlying() ? currency.underlyingDecimals : currency.decimals;
    if (!decimals) throw new Error(`Decimals not found for currency ${this.currencyId}`);

    return new TypedBigNumber(this.n.mul(decimals).div(INTERNAL_TOKEN_PRECISION), newType, this.symbol);
  }

  toETH(useHaircut: boolean) {
    const {ethRateConfig, ethRate} = System.getSystem().getETHRate(this.currencyId);
    if (!ethRateConfig || !ethRate) throw new Error(`Eth rate data for ${this.symbol} not found`);
    if (!(this.isAssetCash() || this.isUnderlying())) throw new Error(`Cannot convert ${this.type} directly to ETH`);

    let multiplier = PERCENTAGE_BASIS;
    if (useHaircut) {
      multiplier = this.isPositive() ? ethRateConfig.haircut : ethRateConfig.buffer;
    }

    const underlyingValue = this.isUnderlying() ? this.n : this.toUnderlying(this.isInternalPrecision()).n;
    const eth = underlyingValue
      .mul(ethRate)
      .mul(multiplier)
      .div(PERCENTAGE_BASIS)
      .div(BigNumber.from(10).pow(ethRateConfig.rateDecimalPlaces));

    const bnType = this.isInternalPrecision() ? BigNumberType.InternalUnderlying : BigNumberType.ExternalUnderlying;
    return TypedBigNumber.from(eth, bnType, 'ETH');
  }

  fromETH(currencyId: number, useHaircut: boolean = false) {
    // Must be internal underlying, ETH
    this.check(BigNumberType.InternalUnderlying, 'ETH');
    const {ethRateConfig, ethRate} = System.getSystem().getETHRate(currencyId);
    const underlyingSymbol = System.getSystem().getUnderlyingSymbol(currencyId);

    if (!ethRateConfig) throw new Error(`Eth rate data for ${currencyId} not found`);
    if (!ethRate) throw new Error(`Eth exchange rate for ${currencyId} not found`);

    let multiplier = PERCENTAGE_BASIS;
    if (useHaircut) {
      multiplier = this.isPositive() ? ethRateConfig.haircut : ethRateConfig.buffer;
    }

    const internalUnderlying = this.n
      .mul(BigNumber.from(10).pow(ethRateConfig.rateDecimalPlaces))
      .mul(PERCENTAGE_BASIS)
      .div(ethRate)
      .div(multiplier);

    return TypedBigNumber.from(internalUnderlying, BigNumberType.InternalUnderlying, underlyingSymbol);
  }

  toJSON(_?: string): any {
    return {
      type: 'BigNumber',
      hex: this.toHexString(),
      bigNumberType: this.type,
      symbol: this.symbol,
    };
  }
}

export default TypedBigNumber;
