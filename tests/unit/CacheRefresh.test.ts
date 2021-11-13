import fs from 'fs';
import EventEmitter from 'eventemitter3';
import Cache from '../../src/system/datasource/Cache';
import {System} from '../../src/system';
import { CashGroup } from '../../src/system';
import { SystemEvents } from '../../src';

describe('Cache Refresh', () => {
  const eventEmitter = new EventEmitter();
  const cashGroups = new Map<number, CashGroup>();
  const cache: Cache = new Cache(1, cashGroups, eventEmitter, 10000);
  const mockResult = fs.readFileSync(`${__dirname}/../mocks/MockCacheResult.json`).toString();
  System.overrideSystem(({
    getCurrencyBySymbol: () => ({id: 1}),
  } as unknown) as System);

  beforeEach(() => {
    jest.spyOn(cache, 'getCacheData').mockResolvedValue(mockResult);
  });

  it('should store cached data', (done) => {
    cache.refreshData().then(() => {
      expect(cache.ethRateData.size).toBe(5);
      expect(cache.assetRateData.size).toBe(5);
      expect(cache.nTokenAssetCashPV.size).toBe(5);
      expect(cache.nTokenTotalSupply.size).toBe(5);
      expect(cache.nTokenIncentiveFactors.size).toBe(5);
      expect(cache.nTokenCashBalance.size).toBe(5);
      expect(cache.nTokenLiquidityTokens.size).toBe(5);
      expect(cache.nTokenfCash.size).toBe(5);
      done();
    });
  });

  it('should emit events', (done) => {
    eventEmitter.on(SystemEvents.DATA_REFRESH, () => {
      expect(true).toBe(true)
      done()
    })
    cache.refreshData()
  })
});
