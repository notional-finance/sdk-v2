# Class: TypedBigNumber

[index](../modules/index.md).TypedBigNumber

## Table of contents

### Properties

- [currencyId](index.TypedBigNumber.md#currencyid)
- [n](index.TypedBigNumber.md#n)
- [symbol](index.TypedBigNumber.md#symbol)
- [type](index.TypedBigNumber.md#type)

### Methods

- [abs](index.TypedBigNumber.md#abs)
- [add](index.TypedBigNumber.md#add)
- [check](index.TypedBigNumber.md#check)
- [checkMatch](index.TypedBigNumber.md#checkmatch)
- [checkType](index.TypedBigNumber.md#checktype)
- [copy](index.TypedBigNumber.md#copy)
- [eq](index.TypedBigNumber.md#eq)
- [fromETH](index.TypedBigNumber.md#frometh)
- [gt](index.TypedBigNumber.md#gt)
- [gte](index.TypedBigNumber.md#gte)
- [isAssetCash](index.TypedBigNumber.md#isassetcash)
- [isExternalPrecision](index.TypedBigNumber.md#isexternalprecision)
- [isInternalPrecision](index.TypedBigNumber.md#isinternalprecision)
- [isNOTE](index.TypedBigNumber.md#isnote)
- [isNToken](index.TypedBigNumber.md#isntoken)
- [isNegative](index.TypedBigNumber.md#isnegative)
- [isPositive](index.TypedBigNumber.md#ispositive)
- [isUnderlying](index.TypedBigNumber.md#isunderlying)
- [isZero](index.TypedBigNumber.md#iszero)
- [lt](index.TypedBigNumber.md#lt)
- [lte](index.TypedBigNumber.md#lte)
- [neg](index.TypedBigNumber.md#neg)
- [scale](index.TypedBigNumber.md#scale)
- [sub](index.TypedBigNumber.md#sub)
- [toAssetCash](index.TypedBigNumber.md#toassetcash)
- [toBigInt](index.TypedBigNumber.md#tobigint)
- [toDisplayString](index.TypedBigNumber.md#todisplaystring)
- [toETH](index.TypedBigNumber.md#toeth)
- [toExactString](index.TypedBigNumber.md#toexactstring)
- [toExternalPrecision](index.TypedBigNumber.md#toexternalprecision)
- [toHexString](index.TypedBigNumber.md#tohexstring)
- [toInternalPrecision](index.TypedBigNumber.md#tointernalprecision)
- [toJSON](index.TypedBigNumber.md#tojson)
- [toNumber](index.TypedBigNumber.md#tonumber)
- [toString](index.TypedBigNumber.md#tostring)
- [toUSD](index.TypedBigNumber.md#tousd)
- [toUnderlying](index.TypedBigNumber.md#tounderlying)
- [from](index.TypedBigNumber.md#from)
- [fromBalance](index.TypedBigNumber.md#frombalance)
- [fromObject](index.TypedBigNumber.md#fromobject)
- [getType](index.TypedBigNumber.md#gettype)
- [getZeroUnderlying](index.TypedBigNumber.md#getzerounderlying)
- [max](index.TypedBigNumber.md#max)
- [min](index.TypedBigNumber.md#min)

## Properties

### currencyId

• **currencyId**: `number`

#### Defined in

[libs/TypedBigNumber.ts:20](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L20)

___

### n

• **n**: `BigNumber`

___

### symbol

• **symbol**: `string`

___

### type

• **type**: [`BigNumberType`](../enums/index.BigNumberType.md)

## Methods

### abs

▸ **abs**(): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:99](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L99)

___

### add

▸ **add**(`other`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:103](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L103)

___

### check

▸ **check**(`type`, `symbol`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`BigNumberType`](../enums/index.BigNumberType.md) |
| `symbol` | `undefined` \| `string` |

#### Returns

`void`

#### Defined in

[libs/TypedBigNumber.ts:83](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L83)

___

### checkMatch

▸ **checkMatch**(`other`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`void`

#### Defined in

[libs/TypedBigNumber.ts:88](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L88)

___

### checkType

▸ **checkType**(`type`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `type` | [`BigNumberType`](../enums/index.BigNumberType.md) |

#### Returns

`void`

#### Defined in

[libs/TypedBigNumber.ts:79](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L79)

___

### copy

▸ **copy**(`n`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `n` | `BigNumberish` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:95](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L95)

___

### eq

▸ **eq**(`other`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:121](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L121)

___

### fromETH

▸ **fromETH**(`currencyId`, `useHaircut?`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `currencyId` | `number` | `undefined` |
| `useHaircut` | `boolean` | `false` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:386](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L386)

___

### gt

▸ **gt**(`other`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:136](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L136)

___

### gte

▸ **gte**(`other`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:141](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L141)

___

### isAssetCash

▸ **isAssetCash**(): `boolean`

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:174](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L174)

___

### isExternalPrecision

▸ **isExternalPrecision**(): `boolean`

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:200](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L200)

___

### isInternalPrecision

▸ **isInternalPrecision**(): `boolean`

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:190](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L190)

___

### isNOTE

▸ **isNOTE**(): `boolean`

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:186](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L186)

___

### isNToken

▸ **isNToken**(): `boolean`

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:182](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L182)

___

### isNegative

▸ **isNegative**(): `boolean`

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:146](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L146)

___

### isPositive

▸ **isPositive**(): `boolean`

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:150](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L150)

___

### isUnderlying

▸ **isUnderlying**(): `boolean`

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:178](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L178)

___

### isZero

▸ **isZero**(): `boolean`

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:154](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L154)

___

### lt

▸ **lt**(`other`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:126](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L126)

___

### lte

▸ **lte**(`other`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`boolean`

#### Defined in

[libs/TypedBigNumber.ts:131](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L131)

___

### neg

▸ **neg**(): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:117](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L117)

___

### scale

▸ **scale**(`numerator`, `divisor`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `numerator` | `BigNumberish` |
| `divisor` | `BigNumberish` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:113](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L113)

___

### sub

▸ **sub**(`other`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `other` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:108](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L108)

___

### toAssetCash

▸ **toAssetCash**(`internalPrecision?`, `overrideRate?`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `internalPrecision` | `boolean` |
| `overrideRate?` | `BigNumber` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:230](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L230)

___

### toBigInt

▸ **toBigInt**(): `bigint`

#### Returns

`bigint`

#### Defined in

[libs/TypedBigNumber.ts:162](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L162)

___

### toDisplayString

▸ **toDisplayString**(`decimalPlaces?`, `locale?`): `string`

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `decimalPlaces` | `number` | `3` |
| `locale` | `string` | `'en-US'` |

#### Returns

`string`

#### Defined in

[libs/TypedBigNumber.ts:215](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L215)

___

### toETH

▸ **toETH**(`useHaircut`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `useHaircut` | `boolean` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:360](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L360)

___

### toExactString

▸ **toExactString**(): `string`

#### Returns

`string`

#### Defined in

[libs/TypedBigNumber.ts:204](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L204)

___

### toExternalPrecision

▸ **toExternalPrecision**(): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:336](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L336)

___

### toHexString

▸ **toHexString**(): `string`

#### Returns

`string`

#### Defined in

[libs/TypedBigNumber.ts:170](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L170)

___

### toInternalPrecision

▸ **toInternalPrecision**(): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:317](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L317)

___

### toJSON

▸ **toJSON**(`_?`): `any`

#### Parameters

| Name | Type |
| :------ | :------ |
| `_?` | `string` |

#### Returns

`any`

#### Defined in

[libs/TypedBigNumber.ts:415](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L415)

___

### toNumber

▸ **toNumber**(): `number`

#### Returns

`number`

#### Defined in

[libs/TypedBigNumber.ts:158](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L158)

___

### toString

▸ **toString**(): `string`

#### Returns

`string`

#### Defined in

[libs/TypedBigNumber.ts:166](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L166)

___

### toUSD

▸ **toUSD**(): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:409](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L409)

___

### toUnderlying

▸ **toUnderlying**(`internalPrecision?`, `overrideRate?`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `internalPrecision` | `boolean` |
| `overrideRate?` | `BigNumber` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:271](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L271)

___

### from

▸ `Static` **from**(`value`, `type`, `symbol`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |
| `type` | [`BigNumberType`](../enums/index.BigNumberType.md) |
| `symbol` | `string` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:59](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L59)

___

### fromBalance

▸ `Static` **fromBalance**(`value`, `symbol`, `isInternal`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `any` |
| `symbol` | `string` |
| `isInternal` | `boolean` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:54](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L54)

___

### fromObject

▸ `Static` **fromObject**(`value`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `value` | `Object` |
| `value.bigNumberType` | [`BigNumberType`](../enums/index.BigNumberType.md) |
| `value.hex` | `string` |
| `value.symbol` | `string` |
| `value.type` | `string` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:65](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L65)

___

### getType

▸ `Static` **getType**(`symbol`, `isInternal`): [`ExternalUnderlying`](../enums/index.BigNumberType.md#externalunderlying) \| [`InternalUnderlying`](../enums/index.BigNumberType.md#internalunderlying) \| [`ExternalAsset`](../enums/index.BigNumberType.md#externalasset) \| [`InternalAsset`](../enums/index.BigNumberType.md#internalasset) \| [`nToken`](../enums/index.BigNumberType.md#ntoken) \| [`NOTE`](../enums/index.BigNumberType.md#note)

#### Parameters

| Name | Type |
| :------ | :------ |
| `symbol` | `string` |
| `isInternal` | `boolean` |

#### Returns

[`ExternalUnderlying`](../enums/index.BigNumberType.md#externalunderlying) \| [`InternalUnderlying`](../enums/index.BigNumberType.md#internalunderlying) \| [`ExternalAsset`](../enums/index.BigNumberType.md#externalasset) \| [`InternalAsset`](../enums/index.BigNumberType.md#internalasset) \| [`nToken`](../enums/index.BigNumberType.md#ntoken) \| [`NOTE`](../enums/index.BigNumberType.md#note)

#### Defined in

[libs/TypedBigNumber.ts:36](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L36)

___

### getZeroUnderlying

▸ `Static` **getZeroUnderlying**(`currencyId`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:30](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L30)

___

### max

▸ `Static` **max**(`a`, `b`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `a` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `b` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:69](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L69)

___

### min

▸ `Static` **min**(`a`, `b`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `a` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `b` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[libs/TypedBigNumber.ts:74](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/libs/TypedBigNumber.ts#L74)
