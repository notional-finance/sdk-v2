# Class: Account

[index](../modules/index.md).Account

## Hierarchy

- `AccountRefresh`

  ↳ **`Account`**

## Table of contents

### Properties

- [address](index.Account.md#address)
- [eventEmitter](index.Account.md#eventemitter)

### Accessors

- [accountData](index.Account.md#accountdata)
- [lastUpdateBlockNumber](index.Account.md#lastupdateblocknumber)
- [lastUpdateTime](index.Account.md#lastupdatetime)
- [walletBalances](index.Account.md#walletbalances)

### Methods

- [destroy](index.Account.md#destroy)
- [enableRefresh](index.Account.md#enablerefresh)
- [fetchClaimableIncentives](index.Account.md#fetchclaimableincentives)
- [getAssetSummary](index.Account.md#getassetsummary)
- [getBalanceSummary](index.Account.md#getbalancesummary)
- [getNetCashAmount](index.Account.md#getnetcashamount)
- [hasAllowance](index.Account.md#hasallowance)
- [hasAllowanceAsync](index.Account.md#hasallowanceasync)
- [hasSufficientCash](index.Account.md#hassufficientcash)
- [refresh](index.Account.md#refresh)
- [refreshWalletBalances](index.Account.md#refreshwalletbalances)
- [sendTransaction](index.Account.md#sendtransaction)
- [setAllowance](index.Account.md#setallowance)
- [walletBalanceBySymbol](index.Account.md#walletbalancebysymbol)
- [load](index.Account.md#load)

## Properties

### address

• **address**: `string`

#### Inherited from

AccountRefresh.address

___

### eventEmitter

• **eventEmitter**: `EventEmitter`<`string` \| `symbol`, `any`\>

#### Inherited from

AccountRefresh.eventEmitter

#### Defined in

[account/AccountRefresh.ts:53](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AccountRefresh.ts#L53)

## Accessors

### accountData

• `get` **accountData**(): `undefined` \| [`AccountData`](index.AccountData.md)

#### Returns

`undefined` \| [`AccountData`](index.AccountData.md)

#### Inherited from

AccountRefresh.accountData

#### Defined in

[account/AccountRefresh.ts:70](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AccountRefresh.ts#L70)

___

### lastUpdateBlockNumber

• `get` **lastUpdateBlockNumber**(): `number`

#### Returns

`number`

#### Inherited from

AccountRefresh.lastUpdateBlockNumber

#### Defined in

[account/AccountRefresh.ts:62](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AccountRefresh.ts#L62)

___

### lastUpdateTime

• `get` **lastUpdateTime**(): `Date`

#### Returns

`Date`

#### Inherited from

AccountRefresh.lastUpdateTime

#### Defined in

[account/AccountRefresh.ts:66](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AccountRefresh.ts#L66)

___

### walletBalances

• `get` **walletBalances**(): [`WalletBalance`](../interfaces/index.WalletBalance.md)[]

#### Returns

[`WalletBalance`](../interfaces/index.WalletBalance.md)[]

#### Inherited from

AccountRefresh.walletBalances

#### Defined in

[account/AccountRefresh.ts:74](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AccountRefresh.ts#L74)

## Methods

### destroy

▸ **destroy**(): `void`

#### Returns

`void`

#### Inherited from

AccountRefresh.destroy

#### Defined in

[account/AccountRefresh.ts:104](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AccountRefresh.ts#L104)

___

### enableRefresh

▸ **enableRefresh**(`opts`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `opts` | `Object` |
| `opts.blockNativeSDK?` | `Blocknative` |
| `opts.pollingIntervalMs?` | `number` |

#### Returns

`void`

#### Inherited from

AccountRefresh.enableRefresh

#### Defined in

[account/AccountRefresh.ts:88](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AccountRefresh.ts#L88)

___

### fetchClaimableIncentives

▸ **fetchClaimableIncentives**(`account`, `blockTime?`): `Promise`<`BigNumber`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `account` | `string` |
| `blockTime` | `number` |

#### Returns

`Promise`<`BigNumber`\>

#### Defined in

[account/Account.ts:218](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/Account.ts#L218)

___

### getAssetSummary

▸ **getAssetSummary**(): `Promise`<{ `assetSummary`: [`AssetSummary`](account.AssetSummary.md)[] ; `tradeHistory`: [`TradeHistory`](../interfaces/index.TradeHistory.md)[]  }\>

Returns the tradeHistory and assetSummary for an account

#### Returns

`Promise`<{ `assetSummary`: [`AssetSummary`](account.AssetSummary.md)[] ; `tradeHistory`: [`TradeHistory`](../interfaces/index.TradeHistory.md)[]  }\>

#### Defined in

[account/Account.ts:75](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/Account.ts#L75)

___

### getBalanceSummary

▸ **getBalanceSummary**(): `Promise`<{ `balanceHistory`: [`BalanceHistory`](../interfaces/index.BalanceHistory.md)[] ; `balanceSummary`: [`BalanceSummary`](account.BalanceSummary.md)[]  }\>

Returns a summary of an account's balances with historical transactions and internal return rate

#### Returns

`Promise`<{ `balanceHistory`: [`BalanceHistory`](../interfaces/index.BalanceHistory.md)[] ; `balanceSummary`: [`BalanceSummary`](account.BalanceSummary.md)[]  }\>

#### Defined in

[account/Account.ts:61](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/Account.ts#L61)

___

### getNetCashAmount

▸ **getNetCashAmount**(`symbol`, `netCashRequiredInternal`): `Object`

Returns the amount of deposit required and the amount of cash balance that will be applied
to a given trade.

#### Parameters

| Name | Type |
| :------ | :------ |
| `symbol` | `string` |
| `netCashRequiredInternal` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `cashBalanceApplied` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `depositAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[account/Account.ts:94](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/Account.ts#L94)

___

### hasAllowance

▸ **hasAllowance**(`symbol`, `depositAmount`): `boolean`

Checks if the account has sufficient allowance for the deposit amount

#### Parameters

| Name | Type |
| :------ | :------ |
| `symbol` | `string` |
| `depositAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`boolean`

#### Defined in

[account/Account.ts:154](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/Account.ts#L154)

___

### hasAllowanceAsync

▸ **hasAllowanceAsync**(`symbol`, `depositAmount`): `Promise`<`boolean`\>

Checks if the account has sufficient allowance for the deposit amount

#### Parameters

| Name | Type |
| :------ | :------ |
| `symbol` | `string` |
| `depositAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`Promise`<`boolean`\>

#### Defined in

[account/Account.ts:167](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/Account.ts#L167)

___

### hasSufficientCash

▸ **hasSufficientCash**(`symbol`, `netCashRequiredInternal`, `useCashBalance?`): `boolean`

Determines if the account has sufficient cash to complete a given trade

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `symbol` | `string` | `undefined` | symbol of cash denomination |
| `netCashRequiredInternal` | [`TypedBigNumber`](index.TypedBigNumber.md) | `undefined` | the total amount of positive cash required to complete the transaction |
| `useCashBalance` | `boolean` | `true` | true if internal cash balances should be used to net off against the total (default: true) |

#### Returns

`boolean`

#### Defined in

[account/Account.ts:130](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/Account.ts#L130)

___

### refresh

▸ **refresh**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

AccountRefresh.refresh

#### Defined in

[account/AccountRefresh.ts:109](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AccountRefresh.ts#L109)

___

### refreshWalletBalances

▸ **refreshWalletBalances**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Inherited from

AccountRefresh.refreshWalletBalances

#### Defined in

[account/AccountRefresh.ts:128](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AccountRefresh.ts#L128)

___

### sendTransaction

▸ **sendTransaction**(`txn`): `Promise`<`TransactionResponse`\>

Sends a populated transaction

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txn` | `PopulatedTransaction` | a populated transaction |

#### Returns

`Promise`<`TransactionResponse`\>

a pending transaction object

#### Defined in

[account/Account.ts:193](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/Account.ts#L193)

___

### setAllowance

▸ **setAllowance**(`symbol`, `amount`, `overrides?`): `Promise`<`PopulatedTransaction`\>

Sets the ERC20 token allowance on the given symbol

#### Parameters

| Name | Type |
| :------ | :------ |
| `symbol` | `string` |
| `amount` | `BigNumber` |
| `overrides` | `Overrides` |

#### Returns

`Promise`<`PopulatedTransaction`\>

#### Defined in

[account/Account.ts:207](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/Account.ts#L207)

___

### walletBalanceBySymbol

▸ **walletBalanceBySymbol**(`symbol`): `undefined` \| [`WalletBalance`](../interfaces/index.WalletBalance.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `symbol` | `string` |

#### Returns

`undefined` \| [`WalletBalance`](../interfaces/index.WalletBalance.md)

#### Inherited from

AccountRefresh.walletBalanceBySymbol

#### Defined in

[account/AccountRefresh.ts:78](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/AccountRefresh.ts#L78)

___

### load

▸ `Static` **load**(`signer`, `provider`, `system`, `graphClient`): `Promise`<[`Account`](index.Account.md)\>

Loads an account object

#### Parameters

| Name | Type |
| :------ | :------ |
| `signer` | `string` \| `Signer` |
| `provider` | `JsonRpcBatchProvider` |
| `system` | [`System`](system.System.md) |
| `graphClient` | `default` |

#### Returns

`Promise`<[`Account`](index.Account.md)\>

#### Defined in

[account/Account.ts:32](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/account/Account.ts#L32)
