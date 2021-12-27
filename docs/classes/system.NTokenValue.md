# Class: NTokenValue

[system](../modules/system.md).NTokenValue

## Table of contents

### Constructors

- [constructor](system.NTokenValue.md#constructor)

### Methods

- [convertNTokenToInternalAsset](system.NTokenValue.md#convertntokentointernalasset)
- [getAssetFromRedeemNToken](system.NTokenValue.md#getassetfromredeemntoken)
- [getAssetRequiredToMintNToken](system.NTokenValue.md#getassetrequiredtomintntoken)
- [getClaimableIncentives](system.NTokenValue.md#getclaimableincentives)
- [getNTokenBlendedYield](system.NTokenValue.md#getntokenblendedyield)
- [getNTokenFactors](system.NTokenValue.md#getntokenfactors)
- [getNTokenIncentiveYield](system.NTokenValue.md#getntokenincentiveyield)
- [getNTokenPortfolio](system.NTokenValue.md#getntokenportfolio)
- [getNTokenRedeemFromAsset](system.NTokenValue.md#getntokenredeemfromasset)
- [getNTokenStatus](system.NTokenValue.md#getntokenstatus)
- [getNTokensToMint](system.NTokenValue.md#getntokenstomint)

## Constructors

### constructor

• **new NTokenValue**()

## Methods

### convertNTokenToInternalAsset

▸ `Static` **convertNTokenToInternalAsset**(`currencyId`, `nTokenBalance`, `useHaircut`): [`TypedBigNumber`](index.TypedBigNumber.md)

Converts an ntoken balance to internal asset denomination

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `nTokenBalance` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `useHaircut` | `boolean` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/NTokenValue.ts:51](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L51)

___

### getAssetFromRedeemNToken

▸ `Static` **getAssetFromRedeemNToken**(`currencyId`, `nTokenBalance`, `blockTime?`): [`TypedBigNumber`](index.TypedBigNumber.md)

Returns the amount of asset cash the account will receive from redeeming nTokens

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currencyId` | `number` |  |
| `nTokenBalance` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of nTokens to redeem |
| `blockTime` | `number` | - |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

a TypedBigNumber in internal asset denomination

#### Defined in

[system/NTokenValue.ts:172](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L172)

___

### getAssetRequiredToMintNToken

▸ `Static` **getAssetRequiredToMintNToken**(`currencyId`, `nTokenBalance`): [`TypedBigNumber`](index.TypedBigNumber.md)

Returns the amount of asset cash required to mint an nToken balance

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `nTokenBalance` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

amount of asset cash required to mint the nToken balance

#### Defined in

[system/NTokenValue.ts:92](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L92)

___

### getClaimableIncentives

▸ `Static` **getClaimableIncentives**(`currencyId`, `nTokenBalance`, `lastClaimTime`, `lastClaimIntegralSupply`, `currentTime?`): [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `nTokenBalance` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `lastClaimTime` | `number` |
| `lastClaimIntegralSupply` | `BigNumber` |
| `currentTime` | `number` |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/NTokenValue.ts:294](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L294)

___

### getNTokenBlendedYield

▸ `Static` **getNTokenBlendedYield**(`currencyId`): `number`

Returns the blended interest rate for an nToken as described here:
https://app.gitbook.com/@notional-finance/s/notional-v2/technical-topics/ntoken-blended-interest-rate

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`number`

a number that represents the blended annual interest rate

#### Defined in

[system/NTokenValue.ts:216](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L216)

___

### getNTokenFactors

▸ `Static` **getNTokenFactors**(`currencyId`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `assetSymbol` | `string` |
| `nToken` | [`nToken`](../interfaces/index.nToken.md) |
| `nTokenPV` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `totalSupply` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Defined in

[system/NTokenValue.ts:11](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L11)

___

### getNTokenIncentiveYield

▸ `Static` **getNTokenIncentiveYield**(`currencyId`): `number`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`number`

#### Defined in

[system/NTokenValue.ts:279](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L279)

___

### getNTokenPortfolio

▸ `Static` **getNTokenPortfolio**(`currencyId`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `cashBalance` | [`TypedBigNumber`](index.TypedBigNumber.md) |
| `cashGroup` | [`CashGroup`](system.CashGroup.md) |
| `fCash` | [`Asset`](../interfaces/index.Asset.md)[] |
| `liquidityTokens` | [`Asset`](../interfaces/index.Asset.md)[] |

#### Defined in

[system/NTokenValue.ts:30](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L30)

___

### getNTokenRedeemFromAsset

▸ `Static` **getNTokenRedeemFromAsset**(`currencyId`, `assetCashAmountInternal`, `blockTime?`, `precision?`): [`TypedBigNumber`](index.TypedBigNumber.md)

Returns the amount of nTokens required to withdraw some amount of cash

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `currencyId` | `number` |  |
| `assetCashAmountInternal` | [`TypedBigNumber`](index.TypedBigNumber.md) | amount of asset cash to be generated |
| `blockTime` | `number` | - |
| `precision` | `BigNumber` | amount of precision tolerance for the estimation in asset cash |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

an nToken amount

#### Defined in

[system/NTokenValue.ts:113](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L113)

___

### getNTokenStatus

▸ `Static` **getNTokenStatus**(`currencyId`): `NTokenStatus`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`NTokenStatus`

#### Defined in

[system/NTokenValue.ts:150](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L150)

___

### getNTokensToMint

▸ `Static` **getNTokensToMint**(`currencyId`, `assetCashAmountInternal`): [`TypedBigNumber`](index.TypedBigNumber.md)

Returns the amount of nTokens that will be minted as a result of deposited the amount of asset cash

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `assetCashAmountInternal` | [`TypedBigNumber`](index.TypedBigNumber.md) |

#### Returns

[`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/NTokenValue.ts:72](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/NTokenValue.ts#L72)
