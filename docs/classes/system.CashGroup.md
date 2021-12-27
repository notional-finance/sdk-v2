# Class: CashGroup

[system](../modules/system.md).CashGroup

## Table of contents

### Constructors

- [constructor](system.CashGroup.md#constructor)

### Properties

- [debtBufferBasisPoints](system.CashGroup.md#debtbufferbasispoints)
- [fCashHaircutBasisPoints](system.CashGroup.md#fcashhaircutbasispoints)
- [liquidityTokenHaircutsPercent](system.CashGroup.md#liquiditytokenhaircutspercent)
- [markets](system.CashGroup.md#markets)
- [maxMarketIndex](system.CashGroup.md#maxmarketindex)
- [rateOracleTimeWindowSeconds](system.CashGroup.md#rateoracletimewindowseconds)
- [rateScalars](system.CashGroup.md#ratescalars)
- [reserveFeeSharePercent](system.CashGroup.md#reservefeesharepercent)
- [totalFeeBasisPoints](system.CashGroup.md#totalfeebasispoints)

### Accessors

- [blockSupplyRate](system.CashGroup.md#blocksupplyrate)

### Methods

- [getLiquidityTokenValue](system.CashGroup.md#getliquiditytokenvalue)
- [getMarket](system.CashGroup.md#getmarket)
- [getOracleRate](system.CashGroup.md#getoraclerate)
- [getfCashPresentValueUnderlyingInternal](system.CashGroup.md#getfcashpresentvalueunderlyinginternal)
- [maxActiveMaturity](system.CashGroup.md#maxactivematurity)
- [setBlockSupplyRate](system.CashGroup.md#setblocksupplyrate)
- [copy](system.CashGroup.md#copy)
- [getMarketIndexForMaturity](system.CashGroup.md#getmarketindexformaturity)
- [getMarketMaturityLengthSeconds](system.CashGroup.md#getmarketmaturitylengthseconds)
- [getMaturityForMarketIndex](system.CashGroup.md#getmaturityformarketindex)
- [getSettlementDate](system.CashGroup.md#getsettlementdate)
- [getTimeReference](system.CashGroup.md#gettimereference)
- [isIdiosyncratic](system.CashGroup.md#isidiosyncratic)

## Constructors

### constructor

• **new CashGroup**(`maxMarketIndex`, `rateOracleTimeWindowSeconds`, `totalFeeBasisPoints`, `reserveFeeSharePercent`, `debtBufferBasisPoints`, `fCashHaircutBasisPoints`, `liquidityTokenHaircutsPercent`, `rateScalars`, `markets`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `maxMarketIndex` | `number` |
| `rateOracleTimeWindowSeconds` | `number` |
| `totalFeeBasisPoints` | `number` |
| `reserveFeeSharePercent` | `number` |
| `debtBufferBasisPoints` | `number` |
| `fCashHaircutBasisPoints` | `number` |
| `liquidityTokenHaircutsPercent` | `number`[] |
| `rateScalars` | `number`[] |
| `markets` | [`Market`](system.Market.md)[] |

#### Defined in

[system/CashGroup.ts:25](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L25)

## Properties

### debtBufferBasisPoints

• **debtBufferBasisPoints**: `number`

___

### fCashHaircutBasisPoints

• **fCashHaircutBasisPoints**: `number`

___

### liquidityTokenHaircutsPercent

• **liquidityTokenHaircutsPercent**: `number`[]

___

### markets

• **markets**: [`Market`](system.Market.md)[]

___

### maxMarketIndex

• **maxMarketIndex**: `number`

___

### rateOracleTimeWindowSeconds

• **rateOracleTimeWindowSeconds**: `number`

___

### rateScalars

• **rateScalars**: `number`[]

___

### reserveFeeSharePercent

• **reserveFeeSharePercent**: `number`

___

### totalFeeBasisPoints

• **totalFeeBasisPoints**: `number`

## Accessors

### blockSupplyRate

• `get` **blockSupplyRate**(): `undefined` \| `number`

#### Returns

`undefined` \| `number`

#### Defined in

[system/CashGroup.ts:13](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L13)

## Methods

### getLiquidityTokenValue

▸ **getLiquidityTokenValue**(`assetType`, `tokens`, `useHaircut`, `marketOverrides?`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `assetType` | [`AssetType`](../enums/index.AssetType.md) |
| `tokens` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `useHaircut` | `boolean` |
| `marketOverrides?` | [`Market`](system.Market.md)[] |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `assetCashClaim` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `fCashClaim` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[system/CashGroup.ts:169](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L169)

___

### getMarket

▸ **getMarket**(`marketIndex`): [`Market`](system.Market.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `marketIndex` | `number` |

#### Returns

[`Market`](system.Market.md)

#### Defined in

[system/CashGroup.ts:17](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L17)

___

### getOracleRate

▸ **getOracleRate**(`maturity`, `blockTime?`, `marketOverrides?`, `blockSupplyRateOverride?`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `maturity` | `number` |
| `blockTime` | `number` |
| `marketOverrides?` | [`Market`](system.Market.md)[] |
| `blockSupplyRateOverride?` | `number` |

#### Returns

`number`

#### Defined in

[system/CashGroup.ts:109](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L109)

___

### getfCashPresentValueUnderlyingInternal

▸ **getfCashPresentValueUnderlyingInternal**(`maturity`, `notional`, `useHaircut`, `blockTime?`, `marketOverrides?`, `blockSupplyRateOverride?`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `maturity` | `number` |
| `notional` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `useHaircut` | `boolean` |
| `blockTime` | `number` |
| `marketOverrides?` | [`Market`](system.Market.md)[] |
| `blockSupplyRateOverride?` | `number` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/CashGroup.ts:144](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L144)

___

### maxActiveMaturity

▸ **maxActiveMaturity**(): `number`

#### Returns

`number`

#### Defined in

[system/CashGroup.ts:104](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L104)

___

### setBlockSupplyRate

▸ **setBlockSupplyRate**(`rate`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `rate` | `BigNumber` |

#### Returns

`void`

#### Defined in

[system/CashGroup.ts:21](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L21)

___

### copy

▸ `Static` **copy**(`cashGroup`): [`CashGroup`](system.CashGroup.md)

Copies a cash group object for simulation

#### Parameters

| Name | Type |
| :------ | :------ |
| `cashGroup` | [`CashGroup`](system.CashGroup.md) |

#### Returns

[`CashGroup`](system.CashGroup.md)

a cash group object that is mutable

#### Defined in

[system/CashGroup.ts:42](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L42)

___

### getMarketIndexForMaturity

▸ `Static` **getMarketIndexForMaturity**(`maturity`, `blockTime?`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `maturity` | `number` |
| `blockTime` | `number` |

#### Returns

`number`

#### Defined in

[system/CashGroup.ts:84](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L84)

___

### getMarketMaturityLengthSeconds

▸ `Static` **getMarketMaturityLengthSeconds**(`marketIndex`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `marketIndex` | `number` |

#### Returns

`number`

#### Defined in

[system/CashGroup.ts:62](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L62)

___

### getMaturityForMarketIndex

▸ `Static` **getMaturityForMarketIndex**(`marketIndex`, `blockTime?`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `marketIndex` | `number` |
| `blockTime` | `number` |

#### Returns

`number`

#### Defined in

[system/CashGroup.ts:99](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L99)

___

### getSettlementDate

▸ `Static` **getSettlementDate**(`assetType`, `maturity`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `assetType` | [`AssetType`](../enums/index.AssetType.md) |
| `maturity` | `number` |

#### Returns

`number`

#### Defined in

[system/CashGroup.ts:92](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L92)

___

### getTimeReference

▸ `Static` **getTimeReference**(`timestamp?`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `timestamp` | `number` |

#### Returns

`number`

#### Defined in

[system/CashGroup.ts:58](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L58)

___

### isIdiosyncratic

▸ `Static` **isIdiosyncratic**(`maturity`, `blockTime?`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `maturity` | `number` |
| `blockTime` | `number` |

#### Returns

`boolean`

#### Defined in

[system/CashGroup.ts:74](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/CashGroup.ts#L74)
