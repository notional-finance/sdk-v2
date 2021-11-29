import fs from 'fs';
import EventEmitter from 'eventemitter3';
import Cache from '../../src/system/datasource/Cache';
import {System, CashGroup, Market} from '../../src/system';
import {SystemEvents} from '../../src';
import MockSystem from '../mocks/MockSystem';

describe('Cache Refresh', () => {
  const system = new MockSystem();
  System.overrideSystem(system);
  afterAll(() => system.destroy());
  const eventEmitter = new EventEmitter();
  const cashGroups = new Map<number, CashGroup>();
  cashGroups.set(
    1,
    new CashGroup(
      2,
      1500,
      5000000,
      50,
      100000000,
      100000000,
      [95, 90],
      [18000000000, 18000000000],
      [
        new Market(1, 1, 1640736000, 18000000000, 5000000, 50, 1500, 'cETH', 'ETH'),
        new Market(1, 2, 1648512000, 18000000000, 5000000, 50, 1500, 'cETH', 'ETH'),
      ],
    ),
  );
  const cache: Cache = new Cache(1, cashGroups, eventEmitter, 10000);
  const mockResult = fs.readFileSync(`${__dirname}/../mocks/MockCacheResult.json`).toString();
  const mockSetETHRateProvider = jest.fn(() => {});
  System.overrideSystem({
    getCurrencyBySymbol: () => ({id: 1}),
    setETHRateProvider: mockSetETHRateProvider,
  } as unknown as System);

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
      expect(cashGroups.get(1)!.markets.length).toBe(2);
      expect(cashGroups.get(1)!.markets[1].totalfCashDisplayString).toBe('180.621');
      expect(mockSetETHRateProvider.mock.calls.length).toBe(1);
      const calls = mockSetETHRateProvider.mock.calls[0] as any[];
      expect(calls[1].noteUSDPrice.toString()).toBe('13171509610000000000');
      done();
    });
  });

  it('should emit events', (done) => {
    eventEmitter.on(SystemEvents.DATA_REFRESH, () => {
      expect(true).toBe(true);
      done();
    });
    cache.refreshData();
  });
});
