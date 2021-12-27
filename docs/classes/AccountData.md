# Class: AccountData

## Table of contents

### Properties

- [accountBalances](AccountData.md#accountbalances)
- [bitmapCurrencyId](AccountData.md#bitmapcurrencyid)
- [hasAssetDebt](AccountData.md#hasassetdebt)
- [hasCashDebt](AccountData.md#hascashdebt)
- [isCopy](AccountData.md#iscopy)
- [nextSettleTime](AccountData.md#nextsettletime)
- [portfolio](AccountData.md#portfolio)

### Methods

- [bufferedCollateralRatio](AccountData.md#bufferedcollateralratio)
- [cashBalance](AccountData.md#cashbalance)
- [collateralRatio](AccountData.md#collateralratio)
- [getFreeCollateral](AccountData.md#getfreecollateral)
- [getHash](AccountData.md#gethash)
- [getLiquidationPrice](AccountData.md#getliquidationprice)
- [loanToValueRatio](AccountData.md#loantovalueratio)
- [nTokenBalance](AccountData.md#ntokenbalance)
- [updateAsset](AccountData.md#updateasset)
- [updateBalance](AccountData.md#updatebalance)
- [copyAccountData](AccountData.md#copyaccountdata)
- [emptyAccountData](AccountData.md#emptyaccountdata)
- [load](AccountData.md#load)
- [loadFromBlockchain](AccountData.md#loadfromblockchain)
- [parseBalancesFromBlockchain](AccountData.md#parsebalancesfromblockchain)
- [parsePortfolioFromBlockchain](AccountData.md#parseportfoliofromblockchain)

## Properties

### accountBalances

• **accountBalances**: [`Balance`](../interfaces/Balance.md)[]

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

• **portfolio**: [`Asset`](../interfaces/Asset.md)[]

## Methods

### bufferedCollateralRatio

▸ **bufferedCollateralRatio**(): ``null`` \| `number`

Calculates a buffered collateral ratio, this uses the net value of currencies in the free collateral figure
after applying buffers and haircuts. An account is liquidatable when this is below 100.

#### Returns

``null`` \| `number`

#### Defined in

[account/AccountData.ts:425](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L425)

___

### cashBalance

▸ **cashBalance**(`currencyId`): `undefined` \| [`TypedBigNumber`](TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`undefined` \| [`TypedBigNumber`](TypedBigNumber.md)

#### Defined in

[account/AccountData.ts:56](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L56)

___

### collateralRatio

▸ **collateralRatio**(): ``null`` \| `number`

Calculates a collateral ratio, this uses the net value of currencies in the free collateral figure without
applying any buffers or haircuts. This is used as a user friendly way of showing free collateral.

#### Returns

``null`` \| `number`

#### Defined in

[account/AccountData.ts:416](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L416)

___

### getFreeCollateral

▸ **getFreeCollateral**(): `Object`

Returns components of the free collateral figure for this account.

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `netETHCollateral` | [`TypedBigNumber`](TypedBigNumber.md) |
| `netETHCollateralWithHaircut` | [`TypedBigNumber`](TypedBigNumber.md) |
| `netETHDebt` | [`TypedBigNumber`](TypedBigNumber.md) |
| `netETHDebtWithBuffer` | [`TypedBigNumber`](TypedBigNumber.md) |
| `netUnderlyingAvailable` | `Map`<`number`, [`TypedBigNumber`](TypedBigNumber.md)\> |

#### Defined in

[account/AccountData.ts:365](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L365)

___

### getHash

▸ **getHash**(): `string`

#### Returns

`string`

#### Defined in

[account/AccountData.ts:64](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L64)

___

### getLiquidationPrice

▸ **getLiquidationPrice**(`collateralId`, `debtCurrencyId`): ``null`` \| [`TypedBigNumber`](TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `collateralId` | `number` |
| `debtCurrencyId` | `number` |

#### Returns

``null`` \| [`TypedBigNumber`](TypedBigNumber.md)

#### Defined in

[account/AccountData.ts:369](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L369)

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
| `totalETHDebts` | [`TypedBigNumber`](TypedBigNumber.md) |
| `totalETHValue` | [`TypedBigNumber`](TypedBigNumber.md) |

#### Defined in

[account/AccountData.ts:233](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L233)

___

### nTokenBalance

▸ **nTokenBalance**(`currencyId`): `undefined` \| [`TypedBigNumber`](TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`undefined` \| [`TypedBigNumber`](TypedBigNumber.md)

#### Defined in

[account/AccountData.ts:60](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L60)

___

### updateAsset

▸ **updateAsset**(`asset`): `void`

Updates the portfolio in place, can only be done on copied account data objects, will throw an error if assets
exceed the maximum number of slots

#### Parameters

| Name | Type |
| :------ | :------ |
| `asset` | [`Asset`](../interfaces/Asset.md) |

#### Returns

`void`

#### Defined in

[account/AccountData.ts:217](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L217)

___

### updateBalance

▸ **updateBalance**(`currencyId`, `netCashChange`, `netNTokenChange?`): `void`

Updates a balance in place, can only be done on copied account data objects, will throw an error if balances
exceed the maximum number of slots.

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `netCashChange` | [`TypedBigNumber`](TypedBigNumber.md) |
| `netNTokenChange?` | [`TypedBigNumber`](TypedBigNumber.md) |

#### Returns

`void`

#### Defined in

[account/AccountData.ts:200](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L200)

___

### copyAccountData

▸ `Static` **copyAccountData**(`accountData?`): [`AccountData`](AccountData.md)

Copies an account data object for simulation

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountData?` | [`AccountData`](AccountData.md) |

#### Returns

[`AccountData`](AccountData.md)

an account data object that is mutable

#### Defined in

[account/AccountData.ts:88](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L88)

___

### emptyAccountData

▸ `Static` **emptyAccountData**(): [`AccountData`](AccountData.md)

#### Returns

[`AccountData`](AccountData.md)

#### Defined in

[account/AccountData.ts:79](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L79)

___

### load

▸ `Static` **load**(`nextSettleTime`, `hasCashDebt`, `hasAssetDebt`, `bitmapCurrencyId`, `balances`, `portfolio`): `Promise`<[`AccountData`](AccountData.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `nextSettleTime` | `number` |
| `hasCashDebt` | `boolean` |
| `hasAssetDebt` | `boolean` |
| `bitmapCurrencyId` | `undefined` \| `number` |
| `balances` | [`Balance`](../interfaces/Balance.md)[] |
| `portfolio` | [`Asset`](../interfaces/Asset.md)[] |

#### Returns

`Promise`<[`AccountData`](AccountData.md)\>

#### Defined in

[account/AccountData.ts:165](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L165)

___

### loadFromBlockchain

▸ `Static` **loadFromBlockchain**(`result`): `Promise`<[`AccountData`](AccountData.md)\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `result` | `GetAccountResult` |

#### Returns

`Promise`<[`AccountData`](AccountData.md)\>

#### Defined in

[account/AccountData.ts:147](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L147)

___

### parseBalancesFromBlockchain

▸ `Static` **parseBalancesFromBlockchain**(`accountBalances`): [`Balance`](../interfaces/Balance.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `accountBalances` | `BalanceResult`[] |

#### Returns

[`Balance`](../interfaces/Balance.md)[]

#### Defined in

[account/AccountData.ts:128](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L128)

___

### parsePortfolioFromBlockchain

▸ `Static` **parsePortfolioFromBlockchain**(`portfolio`): [`Asset`](../interfaces/Asset.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `portfolio` | `AssetResult`[] |

#### Returns

[`Asset`](../interfaces/Asset.md)[]

#### Defined in

[account/AccountData.ts:104](https://github.com/notional-finance/sdk-v2/blob/20a2e58/src/account/AccountData.ts#L104)
