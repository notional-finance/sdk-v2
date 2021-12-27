# Class: AccountGraphLoader

[account](../modules/account.md).AccountGraphLoader

## Table of contents

### Constructors

- [constructor](account.AccountGraphLoader.md#constructor)

### Methods

- [getAssetSummary](account.AccountGraphLoader.md#getassetsummary)
- [getBalanceSummary](account.AccountGraphLoader.md#getbalancesummary)
- [load](account.AccountGraphLoader.md#load)
- [loadBatch](account.AccountGraphLoader.md#loadbatch)
- [parseBalance](account.AccountGraphLoader.md#parsebalance)

## Constructors

### constructor

• **new AccountGraphLoader**()

## Methods

### getAssetSummary

▸ `Static` **getAssetSummary**(`address`, `accountData`, `graphClient`): `Promise`<{ `assetSummary`: [`AssetSummary`](account.AssetSummary.md)[] ; `tradeHistory`: [`TradeHistory`](../interfaces/index.TradeHistory.md)[]  }\>

Returns the tradeHistory and assetSummary for an account

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `accountData` | [`AccountData`](index.AccountData.md) |
| `graphClient` | `default` |

#### Returns

`Promise`<{ `assetSummary`: [`AssetSummary`](account.AssetSummary.md)[] ; `tradeHistory`: [`TradeHistory`](../interfaces/index.TradeHistory.md)[]  }\>

#### Defined in

[account/AccountGraphLoader.ts:219](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountGraphLoader.ts#L219)

___

### getBalanceSummary

▸ `Static` **getBalanceSummary**(`address`, `accountData`, `graphClient`): `Promise`<{ `balanceHistory`: [`BalanceHistory`](../interfaces/index.BalanceHistory.md)[] ; `balanceSummary`: [`BalanceSummary`](account.BalanceSummary.md)[]  }\>

Returns a summary of an account's balances with historical transactions and internal return rate

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `accountData` | [`AccountData`](index.AccountData.md) |
| `graphClient` | `default` |

#### Returns

`Promise`<{ `balanceHistory`: [`BalanceHistory`](../interfaces/index.BalanceHistory.md)[] ; `balanceSummary`: [`BalanceSummary`](account.BalanceSummary.md)[]  }\>

#### Defined in

[account/AccountGraphLoader.ts:210](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountGraphLoader.ts#L210)

___

### load

▸ `Static` **load**(`graphClient`, `address`): `Promise`<[`AccountData`](index.AccountData.md)\>

Loads a single account

#### Parameters

| Name | Type |
| :------ | :------ |
| `graphClient` | `default` |
| `address` | `string` |

#### Returns

`Promise`<[`AccountData`](index.AccountData.md)\>

AccountData instance for requested account

#### Defined in

[account/AccountGraphLoader.ts:231](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountGraphLoader.ts#L231)

___

### loadBatch

▸ `Static` **loadBatch**(`graphClient`, `pageSize`, `pageNumber`): `Promise`<`Map`<`string`, [`AccountData`](index.AccountData.md)\>\>

Loads multiple accounts in a single query.

#### Parameters

| Name | Type |
| :------ | :------ |
| `graphClient` | `default` |
| `pageSize` | `number` |
| `pageNumber` | `number` |

#### Returns

`Promise`<`Map`<`string`, [`AccountData`](index.AccountData.md)\>\>

#### Defined in

[account/AccountGraphLoader.ts:187](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountGraphLoader.ts#L187)

___

### parseBalance

▸ `Static` **parseBalance**(`balance`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `balance` | `BalanceResponse` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `cashBalance` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `currencyId` | `number` |
| `lastClaimIntegralSupply` | `BigNumber` |
| `lastClaimTime` | `BigNumber` |
| `nTokenBalance` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[account/AccountGraphLoader.ts:125](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountGraphLoader.ts#L125)
