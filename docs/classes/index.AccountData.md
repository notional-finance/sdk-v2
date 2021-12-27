# Class: AccountData

[index](../modules/index.md).AccountData

## Table of contents

### Properties

- [accountBalances](index.AccountData.md#accountbalances)
- [bitmapCurrencyId](index.AccountData.md#bitmapcurrencyid)
- [hasAssetDebt](index.AccountData.md#hasassetdebt)
- [hasCashDebt](index.AccountData.md#hascashdebt)
- [isCopy](index.AccountData.md#iscopy)
- [nextSettleTime](index.AccountData.md#nextsettletime)
- [portfolio](index.AccountData.md#portfolio)

### Methods

- [bufferedCollateralRatio](index.AccountData.md#bufferedcollateralratio)
- [cashBalance](index.AccountData.md#cashbalance)
- [collateralRatio](index.AccountData.md#collateralratio)
- [getFreeCollateral](index.AccountData.md#getfreecollateral)
- [getHash](index.AccountData.md#gethash)
- [getLiquidationPrice](index.AccountData.md#getliquidationprice)
- [loanToValueRatio](index.AccountData.md#loantovalueratio)
- [nTokenBalance](index.AccountData.md#ntokenbalance)
- [updateAsset](index.AccountData.md#updateasset)
- [updateBalance](index.AccountData.md#updatebalance)
- [copyAccountData](index.AccountData.md#copyaccountdata)
- [emptyAccountData](index.AccountData.md#emptyaccountdata)
- [load](index.AccountData.md#load)
- [loadFromBlockchain](index.AccountData.md#loadfromblockchain)
- [parseBalancesFromBlockchain](index.AccountData.md#parsebalancesfromblockchain)
- [parsePortfolioFromBlockchain](index.AccountData.md#parseportfoliofromblockchain)

## Properties

### accountBalances

• **accountBalances**: [`Balance`](../interfaces/index.Balance.md)[]

___

### bitmapCurrencyId

• **bitmapCurrencyId**: `undefined` \| `number`

___

### hasAssetDebt

• **hasAssetDebt**: `boolean`

___

### hasCashDebt

• **hasCashDebt**: `boolean`

___

### isCopy

• **isCopy**: `boolean`

___

### nextSettleTime

• **nextSettleTime**: `number`

___

### portfolio

• **portfolio**: [`Asset`](../interfaces/index.Asset.md)[]

## Methods

### bufferedCollateralRatio

▸ **bufferedCollateralRatio**(): ``null`` \| `number`

Calculates a buffered collateral ratio, this uses the net value of currencies in the free collateral figure
after applying buffers and haircuts. An account is liquidatable when this is below 100.

#### Returns

``null`` \| `number`

#### Defined in

[account/AccountData.ts:425](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L425)

___

### cashBalance

▸ **cashBalance**(`currencyId`): `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[account/AccountData.ts:56](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L56)

___

### collateralRatio

▸ **collateralRatio**(): ``null`` \| `number`

Calculates a collateral ratio, this uses the net value of currencies in the free collateral figure without
applying any buffers or haircuts. This is used as a user friendly way of showing free collateral.

#### Returns

``null`` \| `number`

#### Defined in

[account/AccountData.ts:416](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L416)

___

### getFreeCollateral

▸ **getFreeCollateral**(): `Object`

Returns components of the free collateral figure for this account.

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `netETHCollateral` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netETHCollateralWithHaircut` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netETHDebt` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netETHDebtWithBuffer` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netUnderlyingAvailable` | `Map`<`number`, [`TypedBigNumber`](index.TypedBigNumber.md)\> |

#### Defined in

[account/AccountData.ts:365](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L365)

___

### getHash

▸ **getHash**(): `string`

#### Returns

`string`

#### Defined in

[account/AccountData.ts:64](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L64)

___

### getLiquidationPrice

▸ **getLiquidationPrice**(`collateralId`, `debtCurrencyId`): ``null`` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `collateralId` | `number` |
| `debtCurrencyId` | `number` |

#### Returns

``null`` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[account/AccountData.ts:369](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L369)

___

### loanToValueRatio

▸ **loanToValueRatio**(): `Object`

Calculates loan to value ratio. A loan to value ratio is the total value of debts in ETH divided by
the total value of collateral in ETH. It does not use any net currency values.

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `haircutLoanToValue` | ``null`` \| `number` |
| `loanToValue` | ``null`` \| `number` |
| `maxLoanToValue` | ``null`` \| `number` |
| `totalETHDebts` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `totalETHValue` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[account/AccountData.ts:233](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L233)

___

### nTokenBalance

▸ **nTokenBalance**(`currencyId`): `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[account/AccountData.ts:60](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L60)

___

### updateAsset

▸ **updateAsset**(`asset`): `void`

Updates the portfolio in place, can only be done on copied account data objects, will throw an error if assets
exceed the maximum number of slots

#### Parameters

| Name | Type |
| :------ | :------ |
| `asset` | [`Asset`](../interfaces/index.Asset.md) |

#### Returns

`void`

#### Defined in

[account/AccountData.ts:217](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L217)

___

### updateBalance

▸ **updateBalance**(`currencyId`, `netCashChange`, `netNTokenChange?`): `void`

Updates a balance in place, can only be done on copied account data objects, will throw an error if balances
exceed the maximum number of slots.

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `netCashChange` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netNTokenChange?` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

`void`

#### Defined in

[account/AccountData.ts:200](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L200)

___

### copyAccountData

▸ `Static` **copyAccountData**(`accountData?`): [`AccountData`](index.AccountData.md)

Copies an account data object for simulation

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountData?` | [`AccountData`](index.AccountData.md) |

#### Returns

[`AccountData`](index.AccountData.md)

an account data object that is mutable

#### Defined in

[account/AccountData.ts:88](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L88)

___

### emptyAccountData

▸ `Static` **emptyAccountData**(): [`AccountData`](index.AccountData.md)

#### Returns

[`AccountData`](index.AccountData.md)

#### Defined in

[account/AccountData.ts:79](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L79)

___

### load

▸ `Static` **load**(`nextSettleTime`, `hasCashDebt`, `hasAssetDebt`, `bitmapCurrencyId`, `balances`, `portfolio`): `Promise`<[`AccountData`](index.AccountData.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `nextSettleTime` | `number` |
| `hasCashDebt` | `boolean` |
| `hasAssetDebt` | `boolean` |
| `bitmapCurrencyId` | `undefined` \| `number` |
| `balances` | [`Balance`](../interfaces/index.Balance.md)[] |
| `portfolio` | [`Asset`](../interfaces/index.Asset.md)[] |

#### Returns

`Promise`<[`AccountData`](index.AccountData.md)\>

#### Defined in

[account/AccountData.ts:165](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L165)

___

### loadFromBlockchain

▸ `Static` **loadFromBlockchain**(`result`): `Promise`<[`AccountData`](index.AccountData.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | `GetAccountResult` |

#### Returns

`Promise`<[`AccountData`](index.AccountData.md)\>

#### Defined in

[account/AccountData.ts:147](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L147)

___

### parseBalancesFromBlockchain

▸ `Static` **parseBalancesFromBlockchain**(`accountBalances`): [`Balance`](../interfaces/index.Balance.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountBalances` | `BalanceResult`[] |

#### Returns

[`Balance`](../interfaces/index.Balance.md)[]

#### Defined in

[account/AccountData.ts:128](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L128)

___

### parsePortfolioFromBlockchain

▸ `Static` **parsePortfolioFromBlockchain**(`portfolio`): [`Asset`](../interfaces/index.Asset.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `portfolio` | `AssetResult`[] |

#### Returns

[`Asset`](../interfaces/index.Asset.md)[]

#### Defined in

[account/AccountData.ts:104](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/account/AccountData.ts#L104)
