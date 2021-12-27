# Class: default

[index](../modules/index.md).default

Provides an abstraction layer for interacting with Notional contracts.

## Hierarchy

- `TransactionBuilder`

  ↳ **`default`**

## Table of contents

### Constructors

- [constructor](index.default.md#constructor)

### Properties

- [governance](index.default.md#governance)
- [graphClient](index.default.md#graphclient)
- [note](index.default.md#note)
- [provider](index.default.md#provider)
- [system](index.default.md#system)

### Methods

- [borrow](index.default.md#borrow)
- [claimIncentives](index.default.md#claimincentives)
- [deleverageNToken](index.default.md#deleveragentoken)
- [deposit](index.default.md#deposit)
- [getAccount](index.default.md#getaccount)
- [getAccountAssetSummaryFromGraph](index.default.md#getaccountassetsummaryfromgraph)
- [getAccountBalanceSummaryFromGraph](index.default.md#getaccountbalancesummaryfromgraph)
- [getAccountFromGraph](index.default.md#getaccountfromgraph)
- [getAccountsFromGraph](index.default.md#getaccountsfromgraph)
- [isNotionalContract](index.default.md#isnotionalcontract)
- [lend](index.default.md#lend)
- [mintNToken](index.default.md#mintntoken)
- [parseInput](index.default.md#parseinput)
- [redeemNToken](index.default.md#redeemntoken)
- [repayBorrow](index.default.md#repayborrow)
- [rollBorrow](index.default.md#rollborrow)
- [rollLend](index.default.md#rolllend)
- [withdraw](index.default.md#withdraw)
- [withdrawLend](index.default.md#withdrawlend)
- [load](index.default.md#load)

## Constructors

### constructor

• **new default**(`note`, `graphClient`, `governance`, `system`, `provider`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `note` | `NoteERC20` |
| `graphClient` | `default` |
| `governance` | `default` |
| `system` | [`System`](system.System.md) |
| `provider` | `Provider` |

#### Overrides

TransactionBuilder.constructor

#### Defined in

[Notional.ts:46](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/Notional.ts#L46)

## Properties

### governance

• **governance**: `default`

___

### graphClient

• **graphClient**: `default`

___

### note

• **note**: `NoteERC20`

___

### provider

• **provider**: `Provider`

___

### system

• **system**: [`System`](system.System.md)

#### Inherited from

TransactionBuilder.system

## Methods

### borrow

▸ **borrow**(`address`, `borrowCurrencySymbol`, `borrowfCashAmount`, `marketIndex`, `maxSlippage`, `withdrawAmountInternalPrecision`, `withdrawEntireCashBalance`, `redeemToUnderlying`, `collateral`, `overrides?`): `Promise`<`PopulatedTransaction`\>

Returns a populated borrow transaction

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` |  |
| `borrowCurrencySymbol` | `string` |  |
| `borrowfCashAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of fCash to borrow, will be converted to a positive number |
| `marketIndex` | `number` | index of the market to borrow on |
| `maxSlippage` | `number` | maximum annualized rate to borrow at (or will fail) |
| `withdrawAmountInternalPrecision` | [`TypedBigNumber`](index.TypedBigNumber.md) | how much to withdraw from the borrow currency |
| `withdrawEntireCashBalance` | `boolean` | true if the account will withdraw the entire cash balance |
| `redeemToUnderlying` | `boolean` | true if will redeem the cash to underlying asset |
| `collateral` | { `amount`: [`TypedBigNumber`](index.TypedBigNumber.md) ; `mintNToken`: `boolean` ; `symbol`: `string`  }[] | a list of collateral types to deposit |
| `overrides` | `Overrides` |  |

#### Returns

`Promise`<`PopulatedTransaction`\>

#### Inherited from

TransactionBuilder.borrow

#### Defined in

[TransactionBuilder.ts:222](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L222)

___

### claimIncentives

▸ **claimIncentives**(`address`, `overrides?`): `Promise`<`PopulatedTransaction`\>

Claims incentives for the account

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `overrides` | `Overrides` |

#### Returns

`Promise`<`PopulatedTransaction`\>

#### Inherited from

TransactionBuilder.claimIncentives

#### Defined in

[TransactionBuilder.ts:203](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L203)

___

### deleverageNToken

▸ **deleverageNToken**(`address`, `repayAsset`, `redeemNTokenAmount`, `lendfCashAmount`, `minLendSlippage`, `overrides?`): `Promise`<`PopulatedTransaction`\>

Deleverages a leveraged nToken position, redeems nTokens and repays a borrow
using the cash from the nToken redemption.

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `repayAsset` | [`Asset`](../interfaces/index.Asset.md) |
| `redeemNTokenAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `lendfCashAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `minLendSlippage` | `number` |
| `overrides` | `Overrides` |

#### Returns

`Promise`<`PopulatedTransaction`\>

#### Inherited from

TransactionBuilder.deleverageNToken

#### Defined in

[TransactionBuilder.ts:464](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L464)

___

### deposit

▸ **deposit**(`address`, `symbol`, `amount`, `settleAssets`, `overrides?`): `Promise`<`PopulatedTransaction`\>

Deposits an amount of the given token symbol

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` | ethereum address to deposit to |
| `symbol` | `string` |  |
| `amount` | [`TypedBigNumber`](index.TypedBigNumber.md) |  |
| `settleAssets` | `boolean` | true if the deposit should settle assets first (this does not occur by default) |
| `overrides` | `Overrides` |  |

#### Returns

`Promise`<`PopulatedTransaction`\>

#### Inherited from

TransactionBuilder.deposit

#### Defined in

[TransactionBuilder.ts:42](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L42)

___

### getAccount

▸ **getAccount**(`address`): `Promise`<[`Account`](index.Account.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` \| `Signer` |

#### Returns

`Promise`<[`Account`](index.Account.md)\>

#### Defined in

[Notional.ts:127](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/Notional.ts#L127)

___

### getAccountAssetSummaryFromGraph

▸ **getAccountAssetSummaryFromGraph**(`address`, `accountData`): `Promise`<{ `assetSummary`: [`AssetSummary`](account.AssetSummary.md)[] ; `tradeHistory`: [`TradeHistory`](../interfaces/index.TradeHistory.md)[]  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `accountData` | [`AccountData`](index.AccountData.md) |

#### Returns

`Promise`<{ `assetSummary`: [`AssetSummary`](account.AssetSummary.md)[] ; `tradeHistory`: [`TradeHistory`](../interfaces/index.TradeHistory.md)[]  }\>

#### Defined in

[Notional.ts:140](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/Notional.ts#L140)

___

### getAccountBalanceSummaryFromGraph

▸ **getAccountBalanceSummaryFromGraph**(`address`, `accountData`): `Promise`<{ `balanceHistory`: [`BalanceHistory`](../interfaces/index.BalanceHistory.md)[] ; `balanceSummary`: [`BalanceSummary`](account.BalanceSummary.md)[]  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `accountData` | [`AccountData`](index.AccountData.md) |

#### Returns

`Promise`<{ `balanceHistory`: [`BalanceHistory`](../interfaces/index.BalanceHistory.md)[] ; `balanceSummary`: [`BalanceSummary`](account.BalanceSummary.md)[]  }\>

#### Defined in

[Notional.ts:136](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/Notional.ts#L136)

___

### getAccountFromGraph

▸ **getAccountFromGraph**(`address`): `Promise`<[`AccountData`](index.AccountData.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |

#### Returns

`Promise`<[`AccountData`](index.AccountData.md)\>

#### Defined in

[Notional.ts:144](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/Notional.ts#L144)

___

### getAccountsFromGraph

▸ **getAccountsFromGraph**(`pageSize`, `pageNumber`): `Promise`<`Map`<`string`, [`AccountData`](index.AccountData.md)\>\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `pageSize` | `number` |
| `pageNumber` | `number` |

#### Returns

`Promise`<`Map`<`string`, [`AccountData`](index.AccountData.md)\>\>

#### Defined in

[Notional.ts:148](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/Notional.ts#L148)

___

### isNotionalContract

▸ **isNotionalContract**(`counterparty`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `counterparty` | `string` |

#### Returns

`boolean`

#### Defined in

[Notional.ts:173](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/Notional.ts#L173)

___

### lend

▸ **lend**(`address`, `lendCurrencySymbol`, `depositAmount`, `lendfCashAmount`, `marketIndex`, `minSlippage`, `withdrawAmountInternalPrecision`, `withdrawEntireCashBalance`, `redeemToUnderlying`, `overrides?`): `Promise`<`PopulatedTransaction`\>

Returns a lend trade

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` |  |
| `lendCurrencySymbol` | `string` |  |
| `depositAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of cash to deposit for lending |
| `lendfCashAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) | fCash amount to lend |
| `marketIndex` | `number` | market index to lend in |
| `minSlippage` | `number` | minimum annualized rate to lend at |
| `withdrawAmountInternalPrecision` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of cash to withdraw |
| `withdrawEntireCashBalance` | `boolean` | set this to true to withdraw any residuals back to the wallet |
| `redeemToUnderlying` | `boolean` | set this to true to redeem residuals in the underlying |
| `overrides` | `Overrides` |  |

#### Returns

`Promise`<`PopulatedTransaction`\>

#### Inherited from

TransactionBuilder.lend

#### Defined in

[TransactionBuilder.ts:299](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L299)

___

### mintNToken

▸ **mintNToken**(`address`, `symbol`, `amount`, `convertCash`, `_overrides?`): `Promise`<`PopulatedTransaction`\>

Mints nTokens given the amount of cash to deposit

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` |  |
| `symbol` | `string` |  |
| `amount` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of cash to deposit into nToken |
| `convertCash` | `boolean` | true if should use existing cash balance instead |
| `_overrides` | `Overrides` |  |

#### Returns

`Promise`<`PopulatedTransaction`\>

#### Inherited from

TransactionBuilder.mintNToken

#### Defined in

[TransactionBuilder.ts:117](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L117)

___

### parseInput

▸ **parseInput**(`input`, `symbol`, `isInternal`): `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `input` | `string` |
| `symbol` | `string` |
| `isInternal` | `boolean` |

#### Returns

`undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[Notional.ts:152](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/Notional.ts#L152)

___

### redeemNToken

▸ **redeemNToken**(`address`, `currencyId`, `amount`, `withdrawAmountInternalPrecision`, `withdrawEntireCashBalance`, `redeemToUnderlying`, `overrides?`): `Promise`<`PopulatedTransaction`\>

Redeems nTokens via batchBalanceAction meaning that there cannot be residuals.

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `currencyId` | `number` |
| `amount` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `withdrawAmountInternalPrecision` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `withdrawEntireCashBalance` | `boolean` |
| `redeemToUnderlying` | `boolean` |
| `overrides` | `Overrides` |

#### Returns

`Promise`<`PopulatedTransaction`\>

#### Inherited from

TransactionBuilder.redeemNToken

#### Defined in

[TransactionBuilder.ts:167](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L167)

___

### repayBorrow

▸ **repayBorrow**(`address`, `asset`, `repayCurrencySymbol`, `repayNotionalAmount`, `depositAmount`, `minLendSlippage`, `overrides?`): `Promise`<`PopulatedTransaction`\>

Repays a debt asset by lending on the corresponding market. The account pays cash and the net negative
fCash position will be reduced.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` |  |
| `asset` | [`Asset`](../interfaces/index.Asset.md) | asset to repay |
| `repayCurrencySymbol` | `string` | - |
| `repayNotionalAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of fCash to repay |
| `depositAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of cash to deposit to repay |
| `minLendSlippage` | `number` |  |
| `overrides` | `Overrides` |  |

#### Returns

`Promise`<`PopulatedTransaction`\>

populated transaction

#### Inherited from

TransactionBuilder.repayBorrow

#### Defined in

[TransactionBuilder.ts:424](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L424)

___

### rollBorrow

▸ **rollBorrow**(`address`, `asset`, `rollToMarketIndex`, `minLendSlippageTolerance`, `maxBorrowSlippageTolerance`, `overrides?`): `Promise`<{ `maxBorrowSlippage`: `number` ; `populatedTransaction`: `Promise`<`PopulatedTransaction`\>  }\>

Moves a borrow from one maturity to another by borrowing in the new maturity and using the
resulting cash to lend an offsetting position in the current maturity. Due to slippage this will
result in some residual balances which are unavoidable.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` |  |
| `asset` | [`Asset`](../interfaces/index.Asset.md) |  |
| `rollToMarketIndex` | `number` |  |
| `minLendSlippageTolerance` | `number` | the maximum basis points from the mid rate that lending can slip (negative) |
| `maxBorrowSlippageTolerance` | `number` | the maximum basis points from the mid rate that borrowing can slip (positive) |
| `overrides` | `Overrides` |  |

#### Returns

`Promise`<{ `maxBorrowSlippage`: `number` ; `populatedTransaction`: `Promise`<`PopulatedTransaction`\>  }\>

#### Inherited from

TransactionBuilder.rollBorrow

#### Defined in

[TransactionBuilder.ts:350](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L350)

___

### rollLend

▸ **rollLend**(`address`, `asset`, `rollToMarketIndex`, `minLendSlippageTolerance`, `maxBorrowSlippageTolerance`, `overrides?`): `Promise`<{ `minLendSlippage`: `number` ; `populatedTransaction`: `Promise`<`PopulatedTransaction`\>  }\>

Moves a lending asset from one maturity to another by borrowing from the current market and using the cash to lend
in the roll to market.

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `asset` | [`Asset`](../interfaces/index.Asset.md) |
| `rollToMarketIndex` | `number` |
| `minLendSlippageTolerance` | `number` |
| `maxBorrowSlippageTolerance` | `number` |
| `overrides` | `Overrides` |

#### Returns

`Promise`<{ `minLendSlippage`: `number` ; `populatedTransaction`: `Promise`<`PopulatedTransaction`\>  }\>

#### Inherited from

TransactionBuilder.rollLend

#### Defined in

[TransactionBuilder.ts:506](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L506)

___

### withdraw

▸ **withdraw**(`address`, `symbol`, `amountExternal`, `redeemToUnderlying`, `overrides?`): `Promise`<`PopulatedTransaction`\>

Withdraws an amount of cash from an account, converting from external underlying to asset if required.

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `string` |
| `symbol` | `string` |
| `amountExternal` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `redeemToUnderlying` | `boolean` |
| `overrides` | `Overrides` |

#### Returns

`Promise`<`PopulatedTransaction`\>

#### Inherited from

TransactionBuilder.withdraw

#### Defined in

[TransactionBuilder.ts:93](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L93)

___

### withdrawLend

▸ **withdrawLend**(`address`, `asset`, `withdrawNotionalAmount`, `maxBorrowSlippage`, `withdrawEntireCashBalance`, `redeemToUnderlying`, `overrides?`): `Promise`<`PopulatedTransaction`\>

Withdraws a lending asset from the market by issuing a borrow transaction. The account receives cash and the
net fCash position will be reduced.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `string` |  |
| `asset` | [`Asset`](../interfaces/index.Asset.md) | selected asset for withdraw |
| `withdrawNotionalAmount` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of fCash to withdraw |
| `maxBorrowSlippage` | `number` |  |
| `withdrawEntireCashBalance` | `boolean` |  |
| `redeemToUnderlying` | `boolean` |  |
| `overrides` | `Overrides` |  |

#### Returns

`Promise`<`PopulatedTransaction`\>

#### Inherited from

TransactionBuilder.withdrawLend

#### Defined in

[TransactionBuilder.ts:585](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/TransactionBuilder.ts#L585)

___

### load

▸ `Static` **load**(`chainId`, `provider`, `refreshDataInterval?`, `dataSourceType?`): `Promise`<[`default`](index.default.md)\>

Creates a new instance of the Notional SDK.

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `chainId` | `number` | `undefined` | the name of the network to connect to |
| `provider` | `Provider` | `undefined` | the signer to use to interact with the contract |
| `refreshDataInterval` | `number` | `CACHE_DATA_REFRESH_INTERVAL` | - |
| `dataSourceType` | `DataSourceType` | `DataSourceType.Cache` | - |

#### Returns

`Promise`<[`default`](index.default.md)\>

#### Defined in

[Notional.ts:63](https://github.com/notional-finance/sdk-v2/blob/a03fc9c/src/Notional.ts#L63)
