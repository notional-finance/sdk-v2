import fs from 'fs';
import EventEmitter from 'eventemitter3';
import Cache from '../../src/system/datasource/Cache';
import {System} from '../../src/system';

describe('Cache Refresh', () => {
  const eventEmitter = new EventEmitter();
  const cache: Cache = new Cache(eventEmitter, 10000);
  const mockResult = fs.readFileSync(`${__dirname}/../mocks/MockCacheResult.json`).toString();
  System.overrideSystem(({
    getCurrencyBySymbol: () => ({id: 1}),
  } as unknown) as System);

  beforeEach(() => {
    jest.spyOn(cache, 'getCacheData').mockResolvedValue(mockResult);
  });

  it('should return cached data', (done) => {
    cache.refreshData().then(() => {
      console.log(cache.nTokenfCash);
      done();
    });
  });
});
