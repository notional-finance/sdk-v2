# Class: FreeCollateral

[index](../modules/index.md).FreeCollateral

## Table of contents

### Constructors

- [constructor](index.FreeCollateral.md#constructor)

### Methods

- [calculateBorrowRequirement](index.FreeCollateral.md#calculateborrowrequirement)
- [calculateCollateralRatio](index.FreeCollateral.md#calculatecollateralratio)
- [calculateTargetCollateral](index.FreeCollateral.md#calculatetargetcollateral)
- [getCashGroupValue](index.FreeCollateral.md#getcashgroupvalue)
- [getCurrencyComponents](index.FreeCollateral.md#getcurrencycomponents)
- [getFreeCollateral](index.FreeCollateral.md#getfreecollateral)
- [getNetfCashPositions](index.FreeCollateral.md#getnetfcashpositions)

## Constructors

### constructor

• **new FreeCollateral**()

## Methods

### calculateBorrowRequirement

▸ `Static` **calculateBorrowRequirement**(`collateralCurrencyId`, `_bufferedRatio`, `accountData`, `mintNTokenCollateral?`, `blockTime?`): `Object`

Calculates borrow requirements for a given amount of fCash and a target collateral ratio

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `collateralCurrencyId` | `number` | `undefined` | currency to collateralize this asset by |
| `_bufferedRatio` | `number` | `undefined` | - |
| `accountData` | [`AccountData`](index.AccountData.md) | `undefined` | account data object with borrow amounts applied |
| `mintNTokenCollateral` | `boolean` | `false` | true if collateral should be minted as nTokens |
| `blockTime` | `number` | `undefined` |  |

#### Returns

`Object`

  - minCollateral: minimum amount of collateral required for the borrow
  - targetCollateral: amount of collateral to reach the bufferedRatio
  - minCollateralRatio: minimum buffered/haircut collateral ratio
  - targetCollateralRatio: target buffered/haircut collateral ratio

| Name | Type |
| :------ | :------ |
| `minBufferedRatio` | ``null`` \| `number` |
| `minCollateral` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `minCollateralCopy` | [`AccountData`](index.AccountData.md) |
| `minCollateralRatio` | ``null`` \| `number` |
| `targetBufferedRatio` | ``null`` \| `number` |
| `targetCollateral` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `targetCollateralCopy` | [`AccountData`](index.AccountData.md) |
| `targetCollateralRatio` | ``null`` \| `number` |

#### Defined in

[system/FreeCollateral.ts:223](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/FreeCollateral.ts#L223)

___

### calculateCollateralRatio

▸ `Static` **calculateCollateralRatio**(`netETHCollateral`, `netETHDebt`): ``null`` \| `number`

Calculates a collateral ratio as a percentage. Collateral ratios can be null if ETH debt is zero. If using
buffered and haircut values then collateral ratios are liquidatable when they are below 100. There is no
upper bound to a collateral ratio figure. Collateral ratios use net debt values.

#### Parameters

| Name | Type |
| :------ | :------ |
| `netETHCollateral` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netETHDebt` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

``null`` \| `number`

collateral ratio scaled by 100 as a number

#### Defined in

[system/FreeCollateral.ts:446](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/FreeCollateral.ts#L446)

___

### calculateTargetCollateral

▸ `Static` **calculateTargetCollateral**(`netETHCollateralWithHaircut`, `netETHDebtWithBuffer`, `collateralCurrencyId`, `collateralNetAvailable`, `bufferedRatio`): `Object`

Returns the amount of target collateral required to achieve the given buffered ratio

#### Parameters

| Name | Type |
| :------ | :------ |
| `netETHCollateralWithHaircut` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netETHDebtWithBuffer` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `collateralCurrencyId` | `number` |
| `collateralNetAvailable` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `bufferedRatio` | `number` |

#### Returns

`Object`

minCollateral and targetCollateral in collateral currency asset cash denomination

| Name | Type |
| :------ | :------ |
| `minCollateral` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `targetCollateral` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[system/FreeCollateral.ts:324](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/FreeCollateral.ts#L324)

___

### getCashGroupValue

▸ `Static` **getCashGroupValue**(`currencyId`, `portfolio`, `blockTime?`, `marketOverrides?`, `haircut?`): [`TypedBigNumber`](index.TypedBigNumber.md)

Returns components of portfolio assets in a cash group

#### Parameters

| Name | Type | Default value | Description |
| :------ | :------ | :------ | :------ |
| `currencyId` | `number` | `undefined` |  |
| `portfolio` | [`Asset`](../interfaces/index.Asset.md)[] | `undefined` |  |
| `blockTime` | `number` | `undefined` |  |
| `marketOverrides?` | [`Market`](system.Market.md)[] | `undefined` | can be used to simulate different markets |
| `haircut` | `boolean` | `useHaircut` | can be set to false to simulate ntoken portfolio |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

 - liquidityTokenUnderlyingPV: present value of the liquidity token
 - fCashUnderlyingPV: present value of the underlying fcash

#### Defined in

[system/FreeCollateral.ts:180](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/FreeCollateral.ts#L180)

___

### getCurrencyComponents

▸ `Static` **getCurrencyComponents**(`currencyId`, `assetCashBalanceInternal`, `nTokenBalance`, `portfolio`, `blockTime?`): `Object`

Returns components of the currency available in a single currency

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `assetCashBalanceInternal` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `nTokenBalance` | `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md) |
| `portfolio` | [`Asset`](../interfaces/index.Asset.md)[] |
| `blockTime` | `number` |

#### Returns

`Object`

 - nTokenValue: nToken present value
 - liquidityTokenUnderlyingPV: present value of the liquidity token
 - fCashUnderlyingPV: present value of the underlying fcash

| Name | Type |
| :------ | :------ |
| `cashGroupPV` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `nTokenValue` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[system/FreeCollateral.ts:79](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/FreeCollateral.ts#L79)

___

### getFreeCollateral

▸ `Static` **getFreeCollateral**(`account`, `blockTime?`): `Object`

Returns components of the free collateral figure

#### Parameters

| Name | Type |
| :------ | :------ |
| `account` | [`AccountData`](index.AccountData.md) |
| `blockTime` | `number` |

#### Returns

`Object`

 - netETHCollateralWithHaircut: aggregate amount of collateral converted to ETH with haircuts applied
 - netETHCollateral: aggregate amount of collateral converted to ETH without haircuts
 - netETHDebt: aggregate amount of debt converted to ETH without buffers applied
 - netETHDebtWithBuffer: aggregate amount of debt converted to ETH with buffers applied
 - netUnderlyingAvailable: net amount of debt or collateral in each currency without haircuts or buffers applied

| Name | Type |
| :------ | :------ |
| `netETHCollateral` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netETHCollateralWithHaircut` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netETHDebt` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netETHDebtWithBuffer` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `netUnderlyingAvailable` | `Map`<`number`, [`TypedBigNumber`](index.TypedBigNumber.md)\> |

#### Defined in

[system/FreeCollateral.ts:26](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/FreeCollateral.ts#L26)

___

### getNetfCashPositions

▸ `Static` **getNetfCashPositions**(`currencyId`, `portfolio`, `marketOverrides?`, `haircut?`): `Object`

Returns the net fCash positions and cash claims from a portfolio

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `currencyId` | `number` | `undefined` |
| `portfolio` | [`Asset`](../interfaces/index.Asset.md)[] | `undefined` |
| `marketOverrides?` | [`Market`](system.Market.md)[] | `undefined` |
| `haircut` | `boolean` | `useHaircut` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `fCashAssets` | { `assetType`: [`AssetType`](../enums/index.AssetType.md) ; `currencyId`: `number` ; `hasMatured`: `boolean` ; `isIdiosyncratic`: `boolean` ; `maturity`: `number` ; `notional`: [`TypedBigNumber`](index.TypedBigNumber.md) ; `settlementDate`: `number`  }[] |
| `totalCashClaims` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[system/FreeCollateral.ts:120](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/FreeCollateral.ts#L120)
