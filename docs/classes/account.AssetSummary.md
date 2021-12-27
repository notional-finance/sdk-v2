# Class: AssetSummary

[account](../modules/account.md).AssetSummary

## Table of contents

### Constructors

- [constructor](account.AssetSummary.md#constructor)

### Properties

- [assetKey](account.AssetSummary.md#assetkey)
- [currencyId](account.AssetSummary.md#currencyid)
- [fCash](account.AssetSummary.md#fcash)
- [fCashValue](account.AssetSummary.md#fcashvalue)
- [history](account.AssetSummary.md#history)
- [irr](account.AssetSummary.md#irr)
- [liquidityToken](account.AssetSummary.md#liquiditytoken)
- [maturity](account.AssetSummary.md#maturity)
- [underlyingInternalPV](account.AssetSummary.md#underlyinginternalpv)
- [underlyingInternalProfitLoss](account.AssetSummary.md#underlyinginternalprofitloss)

### Accessors

- [hasMatured](account.AssetSummary.md#hasmatured)
- [symbol](account.AssetSummary.md#symbol)
- [underlyingSymbol](account.AssetSummary.md#underlyingsymbol)

### Methods

- [internalRateOfReturnString](account.AssetSummary.md#internalrateofreturnstring)
- [mostRecentTradedRate](account.AssetSummary.md#mostrecenttradedrate)
- [build](account.AssetSummary.md#build)
- [fetchTradeHistory](account.AssetSummary.md#fetchtradehistory)

## Constructors

### constructor

• **new AssetSummary**(`assetKey`, `underlyingInternalPV`, `fCashValue`, `underlyingInternalProfitLoss`, `irr`, `history`, `fCash?`, `liquidityToken?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `assetKey` | `string` |
| `underlyingInternalPV` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `fCashValue` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `underlyingInternalProfitLoss` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `irr` | `number` |
| `history` | [`TradeHistory`](../interfaces/index.TradeHistory.md)[] |
| `fCash?` | [`Asset`](../interfaces/index.Asset.md) |
| `liquidityToken?` | [`Asset`](../interfaces/index.Asset.md) |

#### Defined in

[account/AssetSummary.ts:67](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AssetSummary.ts#L67)

## Properties

### assetKey

• **assetKey**: `string`

___

### currencyId

• **currencyId**: `number`

#### Defined in

[account/AssetSummary.ts:40](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AssetSummary.ts#L40)

___

### fCash

• `Optional` **fCash**: [`Asset`](../interfaces/index.Asset.md)

___

### fCashValue

• **fCashValue**: [`TypedBigNumber`](index.TypedBigNumber.md)

___

### history

• **history**: [`TradeHistory`](../interfaces/index.TradeHistory.md)[]

___

### irr

• **irr**: `number`

___

### liquidityToken

• `Optional` **liquidityToken**: [`Asset`](../interfaces/index.Asset.md)

___

### maturity

• **maturity**: `number`

#### Defined in

[account/AssetSummary.ts:39](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AssetSummary.ts#L39)

___

### underlyingInternalPV

• **underlyingInternalPV**: [`TypedBigNumber`](index.TypedBigNumber.md)

___

### underlyingInternalProfitLoss

• **underlyingInternalProfitLoss**: [`TypedBigNumber`](index.TypedBigNumber.md)

## Accessors

### hasMatured

• `get` **hasMatured**(): `boolean`

#### Returns

`boolean`

#### Defined in

[account/AssetSummary.ts:43](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AssetSummary.ts#L43)

___

### symbol

• `get` **symbol**(): `string`

#### Returns

`string`

#### Defined in

[account/AssetSummary.ts:51](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AssetSummary.ts#L51)

___

### underlyingSymbol

• `get` **underlyingSymbol**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[account/AssetSummary.ts:47](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AssetSummary.ts#L47)

## Methods

### internalRateOfReturnString

▸ **internalRateOfReturnString**(`locale?`, `precision?`): `string`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `locale` | `string` | `'en-US'` |
| `precision` | `number` | `3` |

#### Returns

`string`

#### Defined in

[account/AssetSummary.ts:55](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AssetSummary.ts#L55)

___

### mostRecentTradedRate

▸ **mostRecentTradedRate**(): `undefined` \| `number`

#### Returns

`undefined` \| `number`

#### Defined in

[account/AssetSummary.ts:62](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AssetSummary.ts#L62)

___

### build

▸ `Static` **build**(`accountData`, `tradeHistory`, `currentTime?`): [`AssetSummary`](account.AssetSummary.md)[]

Builds a summary of a portfolio given the current account portfolio and the trade history.

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountData` | [`AccountData`](index.AccountData.md) |
| `tradeHistory` | [`TradeHistory`](../interfaces/index.TradeHistory.md)[] |
| `currentTime` | `number` |

#### Returns

[`AssetSummary`](account.AssetSummary.md)[]

#### Defined in

[account/AssetSummary.ts:166](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AssetSummary.ts#L166)

___

### fetchTradeHistory

▸ `Static` **fetchTradeHistory**(`address`, `graphClient`): `Promise`<[`TradeHistory`](../interfaces/index.TradeHistory.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `graphClient` | `default` |

#### Returns

`Promise`<[`TradeHistory`](../interfaces/index.TradeHistory.md)[]\>

#### Defined in

[account/AssetSummary.ts:113](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AssetSummary.ts#L113)
