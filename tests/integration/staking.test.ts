import {expect} from 'chai';
import {BigNumber, Contract} from 'ethers';
import {SignerWithAddress} from '@nomiclabs/hardhat-ethers/signers';
import {ethers} from 'hardhat';
import {getAccount, setChainState} from './utils';
import {System} from '../../src/system';
import MockSystem from '../mocks/MockSystem';
import {ERC20} from '../../src/typechain/ERC20';
import {TypedBigNumber} from '../../src';
import {BalancerVault} from '../../src/typechain/BalancerVault';
import {BalancerPool} from '../../src/typechain/BalancerPool';
import {StakedNote} from '../../src/staking';

const factoryABI = require('./balancer/poolFactory.json');
const poolABI = require('../../src/abi/BalancerPool.json');
const BalancerVaultABI = require('../../src/abi/BalancerVault.json');
const ERC20ABI = require('../../src/abi/ERC20.json');

const forkedBlockNumber = 14191580;

describe('staking test', () => {
  const system = new MockSystem();
  let balancerVault: BalancerVault;
  let balancerPool: BalancerPool;
  let assets: string[];
  let poolId: string;
  let noteWhale: SignerWithAddress;
  let wethWhale: SignerWithAddress;
  System.overrideSystem(system);

  beforeEach(async () => {
    await setChainState(forkedBlockNumber);
    const [signer] = await ethers.getSigners();
    balancerVault = new Contract(
      '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      BalancerVaultABI,
      signer,
    ) as BalancerVault;
    assets = ['0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', '0xCFEAead4947f0705A14ec42aC3D44129E1Ef3eD5'];
    const pool2TokensFactory = await ethers.getContractAt(factoryABI, '0xA5bf2ddF098bb0Ef6d120C98217dD6B141c74EE0');
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
    balancerPool = (await ethers.getContractAt(poolABI, poolAddress)) as BalancerPool;
    poolId = await balancerPool.getPoolId();
    const initialBalances = [ethers.utils.parseEther('10'), BigNumber.from(100e8)];
    const userData = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256[]'], [0, initialBalances]);
    noteWhale = await getAccount('0x22341fB5D92D3d801144aA5A925F401A91418A05');
    wethWhale = await getAccount('0x6555e1cc97d3cba6eaddebbcd7ca51d75771e0b8');
    const weth = (await ethers.getContractAt(ERC20ABI, assets[0])) as ERC20;
    const note = (await ethers.getContractAt(ERC20ABI, assets[1])) as ERC20;
    await weth.connect(wethWhale).transfer(noteWhale.address, ethers.utils.parseEther('1000'));
    await weth.connect(noteWhale).approve(balancerVault.address, ethers.constants.MaxUint256);
    await note.connect(noteWhale).approve(balancerVault.address, ethers.constants.MaxUint256);

    // Initialize the pool
    await balancerVault.connect(noteWhale).joinPool(poolId, noteWhale.address, noteWhale.address, {
      assets,
      maxAmountsIn: initialBalances,
      userData,
      fromInternalBalance: false,
    });
    const totalSupply = await balancerPool.totalSupply();

    system.setStakedNoteParameters({
      poolId,
      coolDownTimeInSeconds: 100,
      redeemWindowSeconds: 500,
      ethBalance: TypedBigNumber.fromBalance(initialBalances[0], 'ETH', false),
      noteBalance: TypedBigNumber.fromBalance(initialBalances[1], 'NOTE', false),
      totalSupply,
      sNOTEBptBalance: BigNumber.from('0'),
      swapFee: ethers.utils.parseEther('0.005'),
    });
  });

  async function joinPool(noteIn: TypedBigNumber, ethIn: TypedBigNumber) {
    const userData = ethers.utils.defaultAbiCoder.encode(['uint256', 'uint256[]'], [1, [ethIn.n, noteIn.n]]);
    await balancerVault.connect(noteWhale).joinPool(poolId, noteWhale.address, noteWhale.address, {
      assets,
      maxAmountsIn: [ethers.utils.parseEther('10000'), ethers.utils.parseEther('10000')],
      userData,
      fromInternalBalance: false,
    });

    const {balances} = await balancerVault.getPoolTokens(poolId);
    const totalSupply = await balancerPool.totalSupply();
    system.setStakedNoteParameters({
      poolId,
      coolDownTimeInSeconds: 100,
      redeemWindowSeconds: 500,
      ethBalance: TypedBigNumber.fromBalance(balances[0], 'ETH', false),
      noteBalance: TypedBigNumber.fromBalance(balances[1], 'NOTE', false),
      totalSupply,
      sNOTEBptBalance: BigNumber.from('0'),
      swapFee: ethers.utils.parseEther('0.005'),
    });
  }

  it('allows entering the pool with minimal slippage', async () => {
    // Attempt to join the pool, calculate the BPT minted
    const noteIn = TypedBigNumber.fromBalance(0, 'NOTE', false);
    const ethIn = TypedBigNumber.fromBalance(ethers.utils.parseEther('10'), 'ETH', false);
    const expectedBPT = StakedNote.getExpectedBPT(noteIn, ethIn);
    const balanceBefore = await balancerPool.balanceOf(noteWhale.address);

    await joinPool(noteIn, ethIn);
    const balanceAfter = await balancerPool.balanceOf(noteWhale.address);
    const diff = balanceAfter.sub(balanceBefore);
    const errorFactor = 1 - (
      parseFloat(ethers.utils.formatUnits(expectedBPT, 18))
        / parseFloat(ethers.utils.formatUnits(diff, 18))
    );
    expect(errorFactor).to.be.lessThan(1e-12);
  });

  it('doubling eth in pool doubles NOTE price', async () => {
    const noteIn = TypedBigNumber.fromBalance(0, 'NOTE', false);
    const ethIn = TypedBigNumber.fromBalance(ethers.utils.parseEther('10'), 'ETH', false);
    const spotPriceBefore = StakedNote.getSpotPrice();
    const expectedPrice = StakedNote.getExpectedPriceImpact(noteIn, ethIn);
    await joinPool(noteIn, ethIn);
    const spotPriceAfter = StakedNote.getSpotPrice();
    // eslint-disable-next-line no-underscore-dangle
    expect(spotPriceAfter._hex).to.equal(expectedPrice._hex);
    expect(spotPriceAfter.div(spotPriceBefore).toNumber()).to.equal(2);
  });

  it('doubling NOTE in pool halves NOTE price', async () => {
    const noteIn = TypedBigNumber.fromBalance(100e8, 'NOTE', false);
    const ethIn = TypedBigNumber.fromBalance(ethers.utils.parseEther('0'), 'ETH', false);
    const spotPriceBefore = StakedNote.getSpotPrice();
    const expectedPrice = StakedNote.getExpectedPriceImpact(noteIn, ethIn);
    await joinPool(noteIn, ethIn);
    const spotPriceAfter = StakedNote.getSpotPrice();
    // eslint-disable-next-line no-underscore-dangle
    expect(spotPriceAfter._hex).to.equal(expectedPrice._hex);
    expect(spotPriceBefore.div(spotPriceAfter).toNumber()).to.equal(2);
  });

  it('adding optimal eth amount does not move price', async () => {
    const noteIn = TypedBigNumber.fromBalance(100e8, 'NOTE', false);
    const ethIn = StakedNote.getOptimumETHForNOTE(noteIn);
    const spotPriceBefore = StakedNote.getSpotPrice();
    const expectedPrice = StakedNote.getExpectedPriceImpact(noteIn, ethIn);
    // eslint-disable-next-line no-underscore-dangle
    expect(spotPriceBefore._hex).to.equal(expectedPrice._hex);
    await joinPool(noteIn, ethIn);
    const spotPriceAfter = StakedNote.getSpotPrice();
    // eslint-disable-next-line no-underscore-dangle
    expect(spotPriceAfter._hex).to.equal(spotPriceBefore._hex);
  });
});
