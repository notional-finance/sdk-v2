// import hre, { ethers, network } from 'hardhat';
import hre from 'hardhat';
import { setChainState } from './utils';
const forkedBlockNumber = 14191580;

describe('hardhat test', () => {
  it('runs successfully', async () => {
    await setChainState(hre, forkedBlockNumber);
  });
});
