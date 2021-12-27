# Class: BalanceSummary

[account](../modules/account.md).BalanceSummary

## Table of contents

### Constructors

- [constructor](account.BalanceSummary.md#constructor)

### Properties

- [assetCashBalance](account.BalanceSummary.md#assetcashbalance)
- [assetCashValueUnderlying](account.BalanceSummary.md#assetcashvalueunderlying)
- [cTokenYield](account.BalanceSummary.md#ctokenyield)
- [claimableIncentives](account.BalanceSummary.md#claimableincentives)
- [currencyId](account.BalanceSummary.md#currencyid)
- [history](account.BalanceSummary.md#history)
- [maxWithdrawValueAssetCash](account.BalanceSummary.md#maxwithdrawvalueassetcash)
- [nTokenBalance](account.BalanceSummary.md#ntokenbalance)
- [nTokenTotalYield](account.BalanceSummary.md#ntokentotalyield)
- [nTokenValueUnderlying](account.BalanceSummary.md#ntokenvalueunderlying)
- [nTokenYield](account.BalanceSummary.md#ntokenyield)

### Accessors

- [assetCashBalanceDisplayString](account.BalanceSummary.md#assetcashbalancedisplaystring)
- [cTokenYieldDisplayString](account.BalanceSummary.md#ctokenyielddisplaystring)
- [isWithdrawable](account.BalanceSummary.md#iswithdrawable)
- [nTokenSymbol](account.BalanceSummary.md#ntokensymbol)
- [nTokenYieldDisplayString](account.BalanceSummary.md#ntokenyielddisplaystring)
- [symbol](account.BalanceSummary.md#symbol)
- [totalCTokenInterest](account.BalanceSummary.md#totalctokeninterest)
- [totalInterestAccrued](account.BalanceSummary.md#totalinterestaccrued)
- [totalNTokenInterest](account.BalanceSummary.md#totalntokeninterest)
- [totalUnderlyingValueDisplayString](account.BalanceSummary.md#totalunderlyingvaluedisplaystring)
- [totalYieldDisplayString](account.BalanceSummary.md#totalyielddisplaystring)
- [underlyingCashBalanceDisplayString](account.BalanceSummary.md#underlyingcashbalancedisplaystring)
- [underlyingSymbol](account.BalanceSummary.md#underlyingsymbol)

### Methods

- [getWithdrawAmounts](account.BalanceSummary.md#getwithdrawamounts)
- [build](account.BalanceSummary.md#build)
- [fetchBalanceHistory](account.BalanceSummary.md#fetchbalancehistory)
- [getTradeType](account.BalanceSummary.md#gettradetype)

## Constructors

### constructor

• **new BalanceSummary**(`currencyId`, `assetCashBalance`, `assetCashValueUnderlying`, `nTokenBalance`, `nTokenValueUnderlying`, `claimableIncentives`, `history`, `cTokenYield`, `nTokenYield`, `nTokenTotalYield`, `maxWithdrawValueAssetCash`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `assetCashBalance` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `assetCashValueUnderlying` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `nTokenBalance` | `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md) |
| `nTokenValueUnderlying` | `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md) |
| `claimableIncentives` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `history` | [`BalanceHistory`](../interfaces/index.BalanceHistory.md)[] |
| `cTokenYield` | `number` |
| `nTokenYield` | `number` |
| `nTokenTotalYield` | `number` |
| `maxWithdrawValueAssetCash` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[account/BalanceSummary.ts:173](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L173)

## Properties

### assetCashBalance

• **assetCashBalance**: [`TypedBigNumber`](index.TypedBigNumber.md)

___

### assetCashValueUnderlying

• **assetCashValueUnderlying**: [`TypedBigNumber`](index.TypedBigNumber.md)

___

### cTokenYield

• **cTokenYield**: `number`

___

### claimableIncentives

• **claimableIncentives**: [`TypedBigNumber`](index.TypedBigNumber.md)

___

### currencyId

• **currencyId**: `number`

___

### history

• **history**: [`BalanceHistory`](../interfaces/index.BalanceHistory.md)[]

___

### maxWithdrawValueAssetCash

• **maxWithdrawValueAssetCash**: [`TypedBigNumber`](index.TypedBigNumber.md)

___

### nTokenBalance

• **nTokenBalance**: `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

___

### nTokenTotalYield

• **nTokenTotalYield**: `number`

___

### nTokenValueUnderlying

• **nTokenValueUnderlying**: `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

___

### nTokenYield

• **nTokenYield**: `number`

## Accessors

### assetCashBalanceDisplayString

• `get` **assetCashBalanceDisplayString**(): `string`

#### Returns

`string`

#### Defined in

[account/BalanceSummary.ts:113](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L113)

___

### cTokenYieldDisplayString

• `get` **cTokenYieldDisplayString**(): `string`

#### Returns

`string`

#### Defined in

[account/BalanceSummary.ts:101](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L101)

___

### isWithdrawable

• `get` **isWithdrawable**(): `boolean`

#### Returns

`boolean`

#### Defined in

[account/BalanceSummary.ts:121](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L121)

___

### nTokenSymbol

• `get` **nTokenSymbol**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[account/BalanceSummary.ts:48](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L48)

___

### nTokenYieldDisplayString

• `get` **nTokenYieldDisplayString**(): `string`

#### Returns

`string`

#### Defined in

[account/BalanceSummary.ts:105](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L105)

___

### symbol

• `get` **symbol**(): `string`

#### Returns

`string`

#### Defined in

[account/BalanceSummary.ts:44](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L44)

___

### totalCTokenInterest

• `get` **totalCTokenInterest**(): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[account/BalanceSummary.ts:60](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L60)

___

### totalInterestAccrued

• `get` **totalInterestAccrued**(): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[account/BalanceSummary.ts:78](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L78)

___

### totalNTokenInterest

• `get` **totalNTokenInterest**(): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[account/BalanceSummary.ts:74](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L74)

___

### totalUnderlyingValueDisplayString

• `get` **totalUnderlyingValueDisplayString**(): `string`

#### Returns

`string`

#### Defined in

[account/BalanceSummary.ts:52](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L52)

___

### totalYieldDisplayString

• `get` **totalYieldDisplayString**(): `string`

#### Returns

`string`

#### Defined in

[account/BalanceSummary.ts:109](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L109)

___

### underlyingCashBalanceDisplayString

• `get` **underlyingCashBalanceDisplayString**(): `string`

#### Returns

`string`

#### Defined in

[account/BalanceSummary.ts:117](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L117)

___

### underlyingSymbol

• `get` **underlyingSymbol**(): `undefined` \| `string`

#### Returns

`undefined` \| `string`

#### Defined in

[account/BalanceSummary.ts:40](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L40)

## Methods

### getWithdrawAmounts

▸ **getWithdrawAmounts**(`withdrawAmountInternalAsset`, `preferCash`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `withdrawAmountInternalAsset` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `preferCash` | `boolean` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `cashWithdraw` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `nTokenRedeem` | `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[account/BalanceSummary.ts:126](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L126)

___

### build

▸ `Static` **build**(`accountData`, `balanceHistory`, `currentTime?`): [`BalanceSummary`](account.BalanceSummary.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountData` | [`AccountData`](index.AccountData.md) |
| `balanceHistory` | [`BalanceHistory`](../interfaces/index.BalanceHistory.md)[] |
| `currentTime` | `number` |

#### Returns

[`BalanceSummary`](account.BalanceSummary.md)[]

#### Defined in

[account/BalanceSummary.ts:327](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L327)

___

### fetchBalanceHistory

▸ `Static` **fetchBalanceHistory**(`address`, `graphClient`): `Promise`<[`BalanceHistory`](../interfaces/index.BalanceHistory.md)[]\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `graphClient` | `default` |

#### Returns

`Promise`<[`BalanceHistory`](../interfaces/index.BalanceHistory.md)[]\>

#### Defined in

[account/BalanceSummary.ts:242](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L242)

___

### getTradeType

▸ `Static` **getTradeType**(`assetCashBalanceBefore`, `assetCashBalanceAfter`, `nTokenBalanceBefore?`, `nTokenBalanceAfter?`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `assetCashBalanceBefore` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `assetCashBalanceAfter` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `nTokenBalanceBefore?` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `nTokenBalanceAfter?` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`string`

#### Defined in

[account/BalanceSummary.ts:219](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/BalanceSummary.ts#L219)
