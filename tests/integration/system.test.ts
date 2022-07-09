import { ethers } from 'ethers';
import { DEFAULT_DATA_REFRESH_INTERVAL } from '../../src/config/constants';
import { getNowSeconds } from '../../src/libs/utils';
import Notional from '../../src/Notional';
import { SystemEvents } from '../../src/system/System';

describe('System Integration Test', () => {
  let provider: ethers.providers.JsonRpcProvider;

  beforeEach(async () => {
    provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  });

  it('gets the initial configuration data', async (done) => {
    const notional = await Notional.load(1337, provider);
    notional.system.eventEmitter.addListener(SystemEvents.DATA_REFRESH, () => {
      expect(notional.system.lastUpdateBlockNumber).toBeGreaterThan(1);
      notional.system.destroy();
      done();
    });
  });

  it('refreshes data on a set interval', async (done) => {
    const notional = await Notional.load(1337, provider);
    let counter = 0;
    const initialTime = getNowSeconds();
    notional.system.eventEmitter.addListener(SystemEvents.DATA_REFRESH, () => {
      counter += 1;
      if (counter === 2) {
        expect(getNowSeconds()).toBeCloseTo(initialTime + DEFAULT_DATA_REFRESH_INTERVAL / 1000);
        notional.system.destroy();
        done();
      }
    });
  }, 20000);
});
