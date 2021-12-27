# Class: Market

[system](../modules/system.md).Market

## Table of contents

### Constructors

- [constructor](system.Market.md#constructor)

### Properties

- [assetSymbol](system.Market.md#assetsymbol)
- [currencyId](system.Market.md#currencyid)
- [marketIndex](system.Market.md#marketindex)
- [maturity](system.Market.md#maturity)
- [rateOracleTimeWindow](system.Market.md#rateoracletimewindow)
- [rateScalar](system.Market.md#ratescalar)
- [reserveFeeShare](system.Market.md#reservefeeshare)
- [totalFee](system.Market.md#totalfee)
- [underlyingSymbol](system.Market.md#underlyingsymbol)

### Accessors

- [fCashUtilization](system.Market.md#fcashutilization)
- [hasLiquidity](system.Market.md#hasliquidity)
- [market](system.Market.md#market)
- [marketKey](system.Market.md#marketkey)
- [midRate](system.Market.md#midrate)
- [tenor](system.Market.md#tenor)
- [totalAssetCashDisplayString](system.Market.md#totalassetcashdisplaystring)
- [totalCashUnderlyingDisplayString](system.Market.md#totalcashunderlyingdisplaystring)
- [totalLiquidityDisplayString](system.Market.md#totalliquiditydisplaystring)
- [totalfCashDisplayString](system.Market.md#totalfcashdisplaystring)

### Calculation Methods

- [getfCashAmountGivenCashAmount](system.Market.md#getfcashamountgivencashamount)
- [marketAnnualizedRate](system.Market.md#marketannualizedrate)
- [marketExchangeRate](system.Market.md#marketexchangerate)

### Other Methods

- [getCashAmountGivenfCashAmount](system.Market.md#getcashamountgivenfcashamount)
- [getSimulatedMarket](system.Market.md#getsimulatedmarket)
- [marketOracleRate](system.Market.md#marketoraclerate)
- [setMarket](system.Market.md#setmarket)
- [cashFromExchangeRate](system.Market.md#cashfromexchangerate)
- [copy](system.Market.md#copy)
- [exchangeRate](system.Market.md#exchangerate)
- [exchangeToInterestRate](system.Market.md#exchangetointerestrate)
- [fCashFromExchangeRate](system.Market.md#fcashfromexchangerate)
- [formatInterestRate](system.Market.md#formatinterestrate)
- [getSlippageRate](system.Market.md#getslippagerate)
- [interestToExchangeRate](system.Market.md#interesttoexchangerate)

## Constructors

### constructor

• **new Market**(`currencyId`, `marketIndex`, `maturity`, `rateScalar`, `totalFee`, `reserveFeeShare`, `rateOracleTimeWindow`, `assetSymbol`, `underlyingSymbol`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `marketIndex` | `number` |
| `maturity` | `number` |
| `rateScalar` | `number` |
| `totalFee` | `number` |
| `reserveFeeShare` | `number` |
| `rateOracleTimeWindow` | `number` |
| `assetSymbol` | `string` |
| `underlyingSymbol` | `string` |

#### Defined in

[system/Market.ts:132](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L132)

## Properties

### assetSymbol

• **assetSymbol**: `string`

___

### currencyId

• **currencyId**: `number`

___

### marketIndex

• **marketIndex**: `number`

___

### maturity

• **maturity**: `number`

___

### rateOracleTimeWindow

• **rateOracleTimeWindow**: `number`

___

### rateScalar

• **rateScalar**: `number`

___

### reserveFeeShare

• **reserveFeeShare**: `number`

___

### totalFee

• **totalFee**: `number`

___

### underlyingSymbol

• **underlyingSymbol**: `string`

## Accessors

### fCashUtilization

• `get` **fCashUtilization**(): `number`

#### Returns

`number`

#### Defined in

[system/Market.ts:51](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L51)

___

### hasLiquidity

• `get` **hasLiquidity**(): `boolean`

#### Returns

`boolean`

#### Defined in

[system/Market.ts:58](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L58)

___

### market

• `get` **market**(): `MarketData`

#### Returns

`MarketData`

#### Defined in

[system/Market.ts:27](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L27)

___

### marketKey

• `get` **marketKey**(): `string`

#### Returns

`string`

#### Defined in

[system/Market.ts:31](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L31)

___

### midRate

• `get` **midRate**(): `string`

#### Returns

`string`

#### Defined in

[system/Market.ts:62](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L62)

___

### tenor

• `get` **tenor**(): `string`

#### Returns

`string`

#### Defined in

[system/Market.ts:70](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L70)

___

### totalAssetCashDisplayString

• `get` **totalAssetCashDisplayString**(): `string`

#### Returns

`string`

#### Defined in

[system/Market.ts:43](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L43)

___

### totalCashUnderlyingDisplayString

• `get` **totalCashUnderlyingDisplayString**(): `string`

#### Returns

`string`

#### Defined in

[system/Market.ts:39](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L39)

___

### totalLiquidityDisplayString

• `get` **totalLiquidityDisplayString**(): `string`

#### Returns

`string`

#### Defined in

[system/Market.ts:47](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L47)

___

### totalfCashDisplayString

• `get` **totalfCashDisplayString**(): `string`

#### Returns

`string`

#### Defined in

[system/Market.ts:35](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L35)

## Calculation Methods

### getfCashAmountGivenCashAmount

▸ **getfCashAmountGivenCashAmount**(`cashAmount`, `blockTime?`): [`TypedBigNumber`](index.TypedBigNumber.md)

Calculates the amount of fCash to be added to the portfolio for a given amount of cash. A positive amount of
cash represents borrowing, a negative amount of cash represents lending.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `cashAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of current cash to purchase |
| `blockTime` | `number` | block time where the exchange will occur |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

the amount of fCash that must be sold

#### Defined in

[system/Market.ts:363](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L363)

___

### marketAnnualizedRate

▸ **marketAnnualizedRate**(`blockTime?`): `number`

Returns the current market rate.

#### Parameters

| Name | Type |
| :------ | :------ |
| `blockTime` | `number` |

#### Returns

`number`

exchange rate at `blockTime`

#### Defined in

[system/Market.ts:288](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L288)

___

### marketExchangeRate

▸ **marketExchangeRate**(`blockTime?`): `number`

Returns the current market exchange rate

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `blockTime` | `number` | block time where the exchange will occur |

#### Returns

`number`

exchange rate at `blockTime`

#### Defined in

[system/Market.ts:299](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L299)

___

## Other Methods

### getCashAmountGivenfCashAmount

▸ **getCashAmountGivenfCashAmount**(`fCashAmount`, `blockTime?`): `Object`

Calculates the amount of current cash that can be borrowed after selling the specified amount of fCash.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fCashAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of fCash to sell |
| `blockTime` | `number` | block time where the exchange will occur |

#### Returns

`Object`

the amount of current cash this will purchase

| Name | Type |
| :------ | :------ |
| `cashToReserve` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netCashToAccount` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netCashToMarket` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[system/Market.ts:342](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L342)

___

### getSimulatedMarket

▸ **getSimulatedMarket**(`interestRate`, `blockTime`): [`Market`](system.Market.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `interestRate` | `number` |
| `blockTime` | `number` |

#### Returns

[`Market`](system.Market.md)

#### Defined in

[system/Market.ts:368](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L368)

___

### marketOracleRate

▸ **marketOracleRate**(`blockTime?`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `blockTime` | `number` |

#### Returns

`number`

#### Defined in

[system/Market.ts:310](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L310)

___

### setMarket

▸ **setMarket**(`m`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `m` | `Object` |
| `m.lastImpliedRate` | `BigNumber` |
| `m.oracleRate` | `BigNumber` |
| `m.previousTradeTime` | `BigNumber` |
| `m.totalAssetCash` | `BigNumber` |
| `m.totalLiquidity` | `BigNumber` |
| `m.totalfCash` | `BigNumber` |

#### Returns

`boolean`

#### Defined in

[system/Market.ts:91](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L91)

___

### cashFromExchangeRate

▸ `Static` **cashFromExchangeRate**(`exchangeRate`, `fCash`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `exchangeRate` | `number` |
| `fCash` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/Market.ts:232](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L232)

___

### copy

▸ `Static` **copy**(`market`): [`Market`](system.Market.md)

Copies a market object for simulation

#### Parameters

| Name | Type |
| :------ | :------ |
| `market` | [`Market`](system.Market.md) |

#### Returns

[`Market`](system.Market.md)

a market object that is mutable

#### Defined in

[system/Market.ts:149](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L149)

___

### exchangeRate

▸ `Static` **exchangeRate**(`fCashAmount`, `cashAmount`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `fCashAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `cashAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`number`

#### Defined in

[system/Market.ts:237](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L237)

___

### exchangeToInterestRate

▸ `Static` **exchangeToInterestRate**(`exchangeRate`, `blockTime`, `maturity`): `number`

Converts an exchange rate to an annual interest rate: ln(exchangeRate) * SECONDS_IN_YEAR / timeToMaturity

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `exchangeRate` | `number` |  |
| `blockTime` | `number` | block time the exchange occurs on |
| `maturity` | `number` | block height when the market will mature |

#### Returns

`number`

annualized interest rate in 1e9 precision

#### Defined in

[system/Market.ts:199](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L199)

___

### fCashFromExchangeRate

▸ `Static` **fCashFromExchangeRate**(`exchangeRate`, `cash`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `exchangeRate` | `number` |
| `cash` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/Market.ts:227](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L227)

___

### formatInterestRate

▸ `Static` **formatInterestRate**(`rate`, `precision?`): `string`

Formats rates as a string with a given precision.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `rate` | `number` | `undefined` | rate to format |
| `precision` | `number` | `3` | amount of decimals to return (default: 3) |

#### Returns

`string`

formatted rate string

#### Defined in

[system/Market.ts:181](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L181)

___

### getSlippageRate

▸ `Static` **getSlippageRate**(`fCashAmount`, `cashAmount`, `maturity`, `annualizedSlippage`, `blockTime?`): `Object`

Returns a new fCash amount after applying some amount of slippage

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `fCashAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) |  |
| `cashAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) |  |
| `maturity` | `number` |  |
| `annualizedSlippage` | `number` | positive or negative amount of slippage in annualized basis points |
| `blockTime` | `number` |  |

#### Returns

`Object`

new fCash amount with slippage applied and the new implied rate

| Name | Type |
| :------ | :------ |
| `annualizedRate` | `number` |
| `exchangeRatePostSlippage` | `number` |

#### Defined in

[system/Market.ts:254](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L254)

___

### interestToExchangeRate

▸ `Static` **interestToExchangeRate**(`annualRate`, `blockTime`, `maturity`): `number`

Converts an interest rate to an exchange rate: e ^ (annualRate * timeToMaturity / SECONDS_IN_YEAR)

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `annualRate` | `number` |  |
| `blockTime` | `number` | block time the exchange occurs on |
| `maturity` | `number` | block height when the market will mature |

#### Returns

`number`

exchange rate

#### Defined in

[system/Market.ts:217](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/Market.ts#L217)
