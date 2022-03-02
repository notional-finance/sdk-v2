import {BigNumber, providers} from 'ethers';
import {ethers} from 'hardhat';
import BalancerPool from '../../src/staking/BalancerPool';
import {getAccount, setChainState} from './utils';
import {System} from '../../src/system';
import MockSystem from '../mocks/MockSystem';
import {ERC20} from '../../src/typechain/ERC20';
import {TypedBigNumber} from '../../src';

const factoryABI = require('./balancer/poolFactory.json');
const poolABI = require('../../src/abi/BalancerPool.json');
const ERC20ABI = require('../../src/abi/ERC20.json');

const forkedBlockNumber = 14191580;

describe('staking test', () => {
  const system = new MockSystem();
  System.overrideSystem(system);

  it('allows entering the pool with minimal slippage', async () => {
    await setChainState(forkedBlockNumber);
    const [signer] = await ethers.getSigners();
    const pool2TokensFactory = await ethers.getContractAt(factoryABI, '0xA5bf2ddF098bb0Ef6d120C98217dD6B141c74EE0');
    const assets = ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xCFEAead4947f0705A14ec42aC3D44129E1Ef3eD5'];
    const txn = await (
      await pool2TokensFactory
        .connect(signer)
        .create(
          'Staked NOTE Weighted Pool',
          'sNOTE-BPT',
          assets,
          [ethers.utils.parseEther('0.2'), ethers.utils.parseEther('0.8')],
          ethers.utils.parseEther('0.005'),
          true,
          signer.address,
        )
    ).wait();
    const poolAddress = txn.events.find((e) => e.event === 'PoolCreated').args[0];
    const pool = await ethers.getContractAt(poolABI, poolAddress);
    const poolId = await pool.getPoolId();

    let balancerPool = await BalancerPool.load(poolId, signer.provider as providers.JsonRpcProvider);
    const initialBalances = [ethers.utils.parseEther('10'), BigNumber.from(100e8)];
    let userData = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256[]'], [0, initialBalances]);
    const noteWhale = await getAccount('0x22341fB5D92D3d801144aA5A925F401A91418A05');
    const wethWhale = await getAccount('0x6555e1cc97d3cba6eaddebbcd7ca51d75771e0b8');
    const weth = (await ethers.getContractAt(ERC20ABI, assets[0])) as ERC20;
    const note = (await ethers.getContractAt(ERC20ABI, assets[1])) as ERC20;
    await weth.connect(wethWhale).transfer(noteWhale.address, ethers.utils.parseEther('1000'));
    await weth.connect(noteWhale).approve(balancerPool.vault.address, ethers.constants.MaxUint256);
    await note.connect(noteWhale).approve(balancerPool.vault.address, ethers.constants.MaxUint256);

    // Initialize the pool
    await balancerPool.vault.connect(noteWhale).joinPool(poolId, noteWhale.address, noteWhale.address, {
      assets,
      maxAmountsIn: initialBalances,
      userData,
      fromInternalBalance: false,
    });

    // Reload the balancer pool
    balancerPool = await BalancerPool.load(poolId, signer.provider as JsonRpcProvider);

    // Attempt to join the pool, calculate the BPT minted
    const noteIn = TypedBigNumber.fromBalance(0, 'NOTE', false);
    const ethIn = TypedBigNumber.fromBalance(ethers.utils.parseEther('10'), 'ETH', false);
    const expectedBPT = balancerPool.getExpectedBPT(noteIn, ethIn);

    userData = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256[]'], [1, [ethIn.n, noteIn.n]]);
    const balanceBefore = await pool.balanceOf(noteWhale.address);
    await balancerPool.vault.connect(noteWhale).joinPool(poolId, noteWhale.address, noteWhale.address, {
      assets,
      maxAmountsIn: [ethers.utils.parseEther('10000'), ethers.utils.parseEther('10000')],
      userData,
      fromInternalBalance: false,
    });
    const balanceAfter = await pool.balanceOf(noteWhale.address);
    const diff = balanceAfter.sub(balanceBefore);
    console.log(expectedBPT.toString());
    console.log(diff.toString());
    console.log(
      'error factor: ',
      1 - parseFloat(ethers.utils.formatUnits(expectedBPT, 18)) / parseFloat(ethers.utils.formatUnits(diff, 18)),
    );
  });

  it('calculates the proper price impact of a trade', async () => {
    await setChainState(forkedBlockNumber);
  });
});
