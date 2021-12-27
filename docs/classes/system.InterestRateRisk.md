# Class: InterestRateRisk

[system](../modules/system.md).InterestRateRisk

## Table of contents

### Constructors

- [constructor](system.InterestRateRisk.md#constructor)

### Methods

- [calculateInterestRateRisk](system.InterestRateRisk.md#calculateinterestraterisk)
- [findLiquidationRate](system.InterestRateRisk.md#findliquidationrate)
- [getMinLocalCurrencyCollateral](system.InterestRateRisk.md#getminlocalcurrencycollateral)
- [getNTokenSimulatedValue](system.InterestRateRisk.md#getntokensimulatedvalue)
- [getRiskyCurrencies](system.InterestRateRisk.md#getriskycurrencies)
- [getWeightedAvgInterestRate](system.InterestRateRisk.md#getweightedavginterestrate)
- [simulateLocalCurrencyValue](system.InterestRateRisk.md#simulatelocalcurrencyvalue)

## Constructors

### constructor

• **new InterestRateRisk**()

## Methods

### calculateInterestRateRisk

▸ `Static` **calculateInterestRateRisk**(`accountData`, `blockTime?`): `Map`<`number`, { `currentWeightedAvgInterestRate`: `number` ; `lowerLiquidationInterestRate`: ``null`` \| `number` ; `upperLiquidationInterestRate`: ``null`` \| `number`  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountData` | [`AccountData`](index.AccountData.md) |
| `blockTime` | `number` |

#### Returns

`Map`<`number`, { `currentWeightedAvgInterestRate`: `number` ; `lowerLiquidationInterestRate`: ``null`` \| `number` ; `upperLiquidationInterestRate`: ``null`` \| `number`  }\>

#### Defined in

[system/InterestRateRisk.ts:14](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/InterestRateRisk.ts#L14)

___

### findLiquidationRate

▸ `Static` **findLiquidationRate**(`currencyId`, `accountData`, `minLocalCollateral`, `fromMaxRate`, `blockTime?`, `precision?`): ``null`` \| `number`

Iterates over potential interest rate range to find the liquidation interest rates

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currencyId` | `number` |  |
| `accountData` | [`AccountData`](index.AccountData.md) |  |
| `minLocalCollateral` | [`TypedBigNumber`](index.TypedBigNumber.md) | threshold of collateral the account requires before liquidation |
| `fromMaxRate` | `boolean` | start from the highest interest rate, otherwise start from the lowest |
| `blockTime` | `number` |  |
| `precision` | `number` | minimum liquidation interest rate precision (default: 10 basis points) |

#### Returns

``null`` \| `number`

#### Defined in

[system/InterestRateRisk.ts:164](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/InterestRateRisk.ts#L164)

___

### getMinLocalCurrencyCollateral

▸ `Static` **getMinLocalCurrencyCollateral**(`currencyId`, `aggregateFC`, `netLocalUnderlying`): [`TypedBigNumber`](index.TypedBigNumber.md)

Returns the minimum amount of local currency gain or loss for FC to equal zero

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `aggregateFC` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netLocalUnderlying` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/InterestRateRisk.ts:131](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/InterestRateRisk.ts#L131)

___

### getNTokenSimulatedValue

▸ `Static` **getNTokenSimulatedValue**(`nTokenBalance`, `marketOverrides`, `blockTime?`): [`TypedBigNumber`](index.TypedBigNumber.md)

Calculates the simulated nToken value given the market overrides

#### Parameters

| Name | Type |
| :------ | :------ |
| `nTokenBalance` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `marketOverrides` | `undefined` \| [`Market`](system.Market.md)[] |
| `blockTime` | `number` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/InterestRateRisk.ts:267](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/InterestRateRisk.ts#L267)

___

### getRiskyCurrencies

▸ `Static` **getRiskyCurrencies**(`accountData`): `number`[]

Returns the currency ids the account has interest rate risk in

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountData` | [`AccountData`](index.AccountData.md) |

#### Returns

`number`[]

#### Defined in

[system/InterestRateRisk.ts:95](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/InterestRateRisk.ts#L95)

___

### getWeightedAvgInterestRate

▸ `Static` **getWeightedAvgInterestRate**(`currencyId`, `blockTime?`): `number`

Returns a weighted average interest rate from the current markets as a point of
comparison with the simulated liquidation interest rate

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `blockTime` | `number` |

#### Returns

`number`

current weighted average interest rate

#### Defined in

[system/InterestRateRisk.ts:67](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/InterestRateRisk.ts#L67)

___

### simulateLocalCurrencyValue

▸ `Static` **simulateLocalCurrencyValue**(`currencyId`, `interestRate`, `cashBalance`, `portfolio`, `nTokenBalance?`, `blockTime?`): [`TypedBigNumber`](index.TypedBigNumber.md)

Returns the net local currency value at the specified interest rate

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `interestRate` | `number` |
| `cashBalance` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `portfolio` | [`Asset`](../interfaces/index.Asset.md)[] |
| `nTokenBalance?` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `blockTime` | `number` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/InterestRateRisk.ts:226](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/system/InterestRateRisk.ts#L226)
