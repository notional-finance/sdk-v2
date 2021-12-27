# Class: System

[system](../modules/system.md).System

## Table of contents

### Constructors

- [constructor](system.System.md#constructor)

### Properties

- [dataSource](system.System.md#datasource)
- [dataSourceType](system.System.md#datasourcetype)
- [eventEmitter](system.System.md#eventemitter)
- [refreshConfigurationDataIntervalMs](system.System.md#refreshconfigurationdataintervalms)
- [refreshIntervalMS](system.System.md#refreshintervalms)

### Accessors

- [lastUpdateBlockNumber](system.System.md#lastupdateblocknumber)
- [lastUpdateTimestamp](system.System.md#lastupdatetimestamp)

### Methods

- [clearAssetRateProviders](system.System.md#clearassetrateproviders)
- [clearETHRateProviders](system.System.md#clearethrateproviders)
- [clearMarketProviders](system.System.md#clearmarketproviders)
- [destroy](system.System.md#destroy)
- [getAllCurrencies](system.System.md#getallcurrencies)
- [getAssetRate](system.System.md#getassetrate)
- [getCashGroup](system.System.md#getcashgroup)
- [getCurrencyById](system.System.md#getcurrencybyid)
- [getCurrencyBySymbol](system.System.md#getcurrencybysymbol)
- [getETHProvider](system.System.md#getethprovider)
- [getETHRate](system.System.md#getethrate)
- [getMarkets](system.System.md#getmarkets)
- [getNToken](system.System.md#getntoken)
- [getNTokenAssetCashPV](system.System.md#getntokenassetcashpv)
- [getNTokenIncentiveFactors](system.System.md#getntokenincentivefactors)
- [getNTokenPortfolio](system.System.md#getntokenportfolio)
- [getNTokenTotalSupply](system.System.md#getntokentotalsupply)
- [getNotionalProxy](system.System.md#getnotionalproxy)
- [getTradableCurrencies](system.System.md#gettradablecurrencies)
- [getUnderlyingSymbol](system.System.md#getunderlyingsymbol)
- [isTradable](system.System.md#istradable)
- [setAssetRateProvider](system.System.md#setassetrateprovider)
- [setETHRateProvider](system.System.md#setethrateprovider)
- [setMarketProvider](system.System.md#setmarketprovider)
- [setNTokenAssetCashPVProvider](system.System.md#setntokenassetcashpvprovider)
- [settlePortfolioAsset](system.System.md#settleportfolioasset)
- [getSystem](system.System.md#getsystem)
- [load](system.System.md#load)
- [overrideSystem](system.System.md#overridesystem)

## Constructors

### constructor

• **new System**(`data`, `chainId`, `graphClient`, `notionalProxy`, `batchProvider`, `dataSourceType`, `refreshIntervalMS`, `refreshConfigurationDataIntervalMs?`)

#### Parameters

| Name | Type |
| :------ | :------ |
| `data` | `SystemQueryResult` |
| `chainId` | `number` |
| `graphClient` | `default` |
| `notionalProxy` | `Notional` |
| `batchProvider` | `JsonRpcBatchProvider` |
| `dataSourceType` | `DataSourceType` |
| `refreshIntervalMS` | `number` |
| `refreshConfigurationDataIntervalMs?` | `number` |

#### Defined in

[system/System.ts:252](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L252)

## Properties

### dataSource

• **dataSource**: `DataSource`

#### Defined in

[system/System.ts:222](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L222)

___

### dataSourceType

• **dataSourceType**: `DataSourceType`

___

### eventEmitter

• **eventEmitter**: `EventEmitter`<`string` \| `symbol`, `any`\>

#### Defined in

[system/System.ts:214](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L214)

___

### refreshConfigurationDataIntervalMs

• `Optional` **refreshConfigurationDataIntervalMs**: `number`

___

### refreshIntervalMS

• **refreshIntervalMS**: `number`

## Accessors

### lastUpdateBlockNumber

• `get` **lastUpdateBlockNumber**(): `number`

#### Returns

`number`

#### Defined in

[system/System.ts:224](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L224)

___

### lastUpdateTimestamp

• `get` **lastUpdateTimestamp**(): `Date`

#### Returns

`Date`

#### Defined in

[system/System.ts:228](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L228)

## Methods

### clearAssetRateProviders

▸ **clearAssetRateProviders**(): `void`

#### Returns

`void`

#### Defined in

[system/System.ts:536](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L536)

___

### clearETHRateProviders

▸ **clearETHRateProviders**(): `void`

#### Returns

`void`

#### Defined in

[system/System.ts:540](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L540)

___

### clearMarketProviders

▸ **clearMarketProviders**(): `void`

#### Returns

`void`

#### Defined in

[system/System.ts:532](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L532)

___

### destroy

▸ **destroy**(): `void`

#### Returns

`void`

#### Defined in

[system/System.ts:299](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L299)

___

### getAllCurrencies

▸ **getAllCurrencies**(): [`Currency`](../interfaces/index.Currency.md)[]

#### Returns

[`Currency`](../interfaces/index.Currency.md)[]

#### Defined in

[system/System.ts:438](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L438)

___

### getAssetRate

▸ **getAssetRate**(`currencyId`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `assetRate` | `undefined` \| `BigNumber` |
| `underlyingDecimalPlaces` | `undefined` \| `number` |

#### Defined in

[system/System.ts:487](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L487)

___

### getCashGroup

▸ **getCashGroup**(`currencyId`): [`CashGroup`](system.CashGroup.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

[`CashGroup`](system.CashGroup.md)

#### Defined in

[system/System.ts:467](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L467)

___

### getCurrencyById

▸ **getCurrencyById**(`id`): [`Currency`](../interfaces/index.Currency.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `number` |

#### Returns

[`Currency`](../interfaces/index.Currency.md)

#### Defined in

[system/System.ts:452](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L452)

___

### getCurrencyBySymbol

▸ **getCurrencyBySymbol**(`symbol`): [`Currency`](../interfaces/index.Currency.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `symbol` | `string` |

#### Returns

[`Currency`](../interfaces/index.Currency.md)

#### Defined in

[system/System.ts:446](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L446)

___

### getETHProvider

▸ **getETHProvider**(`currencyId`): `undefined` \| `IETHRateProvider`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`undefined` \| `IETHRateProvider`

#### Defined in

[system/System.ts:494](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L494)

___

### getETHRate

▸ **getETHRate**(`currencyId`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `ethRate` | `undefined` \| `BigNumber` |
| `ethRateConfig` | `undefined` \| [`EthRate`](../interfaces/index.EthRate.md) |

#### Defined in

[system/System.ts:498](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L498)

___

### getMarkets

▸ **getMarkets**(`currencyId`): [`Market`](system.Market.md)[]

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

[`Market`](system.Market.md)[]

#### Defined in

[system/System.ts:476](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L476)

___

### getNToken

▸ **getNToken**(`currencyId`): `undefined` \| [`nToken`](../interfaces/index.nToken.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`undefined` \| [`nToken`](../interfaces/index.nToken.md)

#### Defined in

[system/System.ts:483](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L483)

___

### getNTokenAssetCashPV

▸ **getNTokenAssetCashPV**(`currencyId`): `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/System.ts:508](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L508)

___

### getNTokenIncentiveFactors

▸ **getNTokenIncentiveFactors**(`currencyId`): `undefined` \| [`IncentiveFactors`](../interfaces/index.IncentiveFactors.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`undefined` \| [`IncentiveFactors`](../interfaces/index.IncentiveFactors.md)

#### Defined in

[system/System.ts:528](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L528)

___

### getNTokenPortfolio

▸ **getNTokenPortfolio**(`currencyId`): `Object`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`Object`

| Name | Type |
| :------ | :------ |
| `cashBalance` | `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md) |
| `fCash` | `undefined` \| [`Asset`](../interfaces/index.Asset.md)[] |
| `liquidityTokens` | `undefined` \| [`Asset`](../interfaces/index.Asset.md)[] |

#### Defined in

[system/System.ts:520](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L520)

___

### getNTokenTotalSupply

▸ **getNTokenTotalSupply**(`currencyId`): `undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`undefined` \| [`TypedBigNumber`](index.TypedBigNumber.md)

#### Defined in

[system/System.ts:516](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L516)

___

### getNotionalProxy

▸ **getNotionalProxy**(): `Notional`

#### Returns

`Notional`

#### Defined in

[system/System.ts:434](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L434)

___

### getTradableCurrencies

▸ **getTradableCurrencies**(): [`Currency`](../interfaces/index.Currency.md)[]

#### Returns

[`Currency`](../interfaces/index.Currency.md)[]

#### Defined in

[system/System.ts:442](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L442)

___

### getUnderlyingSymbol

▸ **getUnderlyingSymbol**(`id`): `string`

#### Parameters

| Name | Type |
| :------ | :------ |
| `id` | `number` |

#### Returns

`string`

#### Defined in

[system/System.ts:458](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L458)

___

### isTradable

▸ **isTradable**(`currencyId`): `boolean`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |

#### Returns

`boolean`

#### Defined in

[system/System.ts:463](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L463)

___

### setAssetRateProvider

▸ **setAssetRateProvider**(`currencyId`, `provider`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `provider` | ``null`` \| `IAssetRateProvider` |

#### Returns

`void`

#### Defined in

[system/System.ts:544](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L544)

___

### setETHRateProvider

▸ **setETHRateProvider**(`currencyId`, `provider`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `provider` | ``null`` \| `IETHRateProvider` |

#### Returns

`void`

#### Defined in

[system/System.ts:560](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L560)

___

### setMarketProvider

▸ **setMarketProvider**(`marketKey`, `provider`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `marketKey` | `string` |
| `provider` | ``null`` \| `IMarketProvider` |

#### Returns

`void`

#### Defined in

[system/System.ts:552](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L552)

___

### setNTokenAssetCashPVProvider

▸ **setNTokenAssetCashPVProvider**(`currencyId`, `provider`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `currencyId` | `number` |
| `provider` | ``null`` \| `INTokenAssetCashPVProvider` |

#### Returns

`void`

#### Defined in

[system/System.ts:568](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L568)

___

### settlePortfolioAsset

▸ **settlePortfolioAsset**(`asset`, `currentTime?`): `Promise`<{ `assetCash`: [`TypedBigNumber`](index.TypedBigNumber.md) ; `fCashAsset`: `undefined` = undefined } \| { `assetCash`: [`TypedBigNumber`](index.TypedBigNumber.md) = assetCashClaim; `fCashAsset`: { `assetType`: [`AssetType`](../enums/index.AssetType.md) = AssetType.fCash; `currencyId`: `number` = asset.currencyId; `hasMatured`: `boolean` = false; `isIdiosyncratic`: `boolean` ; `maturity`: `number` = asset.maturity; `notional`: [`TypedBigNumber`](index.TypedBigNumber.md) = fCashClaim; `settlementDate`: `number` = asset.maturity }  }\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `asset` | [`Asset`](../interfaces/index.Asset.md) |
| `currentTime` | `number` |

#### Returns

`Promise`<{ `assetCash`: [`TypedBigNumber`](index.TypedBigNumber.md) ; `fCashAsset`: `undefined` = undefined } \| { `assetCash`: [`TypedBigNumber`](index.TypedBigNumber.md) = assetCashClaim; `fCashAsset`: { `assetType`: [`AssetType`](../enums/index.AssetType.md) = AssetType.fCash; `currencyId`: `number` = asset.currencyId; `hasMatured`: `boolean` = false; `isIdiosyncratic`: `boolean` ; `maturity`: `number` = asset.maturity; `notional`: [`TypedBigNumber`](index.TypedBigNumber.md) = fCashClaim; `settlementDate`: `number` = asset.maturity }  }\>

#### Defined in

[system/System.ts:577](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L577)

___

### getSystem

▸ `Static` **getSystem**(): [`System`](system.System.md)

#### Returns

[`System`](system.System.md)

#### Defined in

[system/System.ts:232](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L232)

___

### load

▸ `Static` **load**(`graphClient`, `notionalProxy`, `batchProvider`, `chainId`, `refreshDataSource`, `refreshIntervalMS?`, `refreshConfigurationDataIntervalMs?`): `Promise`<[`System`](system.System.md)\>

#### Parameters

| Name | Type | Default value |
| :------ | :------ | :------ |
| `graphClient` | `default` | `undefined` |
| `notionalProxy` | `Notional` | `undefined` |
| `batchProvider` | `JsonRpcBatchProvider` | `undefined` |
| `chainId` | `number` | `undefined` |
| `refreshDataSource` | `any` | `undefined` |
| `refreshIntervalMS` | `number` | `DEFAULT_DATA_REFRESH_INTERVAL` |
| `refreshConfigurationDataIntervalMs` | `number` | `DEFAULT_CONFIGURATION_REFRESH_INTERVAL` |

#### Returns

`Promise`<[`System`](system.System.md)\>

#### Defined in

[system/System.ts:304](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L304)

___

### overrideSystem

▸ `Static` **overrideSystem**(`system`): `void`

#### Parameters

| Name | Type |
| :------ | :------ |
| `system` | [`System`](system.System.md) |

#### Returns

`void`

#### Defined in

[system/System.ts:237](https://github.com/notional-finance/sdk-v2/blob/fc3a95f/src/system/System.ts#L237)
