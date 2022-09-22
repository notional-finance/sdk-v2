//import { expect } from 'chai';
import {
  BigNumber,
  Contract,
  // utils,
  // Wallet,
} from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { getAccount, setChainState } from './utils';
import { BalancerLinearPool, BalancerBoostedPool, BalancerVault, ERC20 } from '../../src/typechain';
import MockSystem from '../mocks/MockSystem';
import { System } from '../../src/system';
import { VaultConfig } from '../../src/data';
import FixedPoint from '../../src/vaults/strategy/balancer/FixedPoint';
import { BASIS_POINT } from '../../src/config/constants';
import TypedBigNumber from '../../src/libs/TypedBigNumber';
import Boosted3TokenAuraVault from '../../src/vaults/strategy/balancer/Boosted3TokenAuraVault';

const ERC20ABI = require('../../src/abi/ERC20.json');
const poolABI = require('../../src/abi/BalancerBoostedPool.json');
const linearPoolABI = require('../../src/abi/BalancerLinearPool.json');
const BalancerVaultABI = require('../../src/abi/BalancerVault.json');

const forkedBlockNumber = 15521384;

describe('balancer Boosted vault test', () => {
  const poolID = '0x7b50775383d3d6f0215a8f290f2c9e2eebbeceb20000000000000000000000fe';
  let balancerVault: BalancerVault;
  let balancerPool: BalancerBoostedPool;
  let daiLinearPool: BalancerLinearPool;
  let daiWhale: SignerWithAddress;
  let baseAssets: string[];
  let baseBalances: BigNumber[];
  let underlyingBalances: BigNumber[];
  let dai: ERC20;

  const system = new MockSystem();
  System.overrideSystem(system);
  MockSystem.overrideSystem(system);
  const vault: VaultConfig = {
    vaultAddress: '0xabc',
    strategy: '0xstrat',
    name: 'Cross Currency',
    primaryBorrowCurrency: 2,
    minAccountBorrowSize: TypedBigNumber.fromBalance(1e8, 'DAI', true),
    minCollateralRatioBasisPoints: 2000 * BASIS_POINT,
    maxDeleverageCollateralRatioBasisPoints: 4000 * BASIS_POINT,
    feeRateBasisPoints: 20 * BASIS_POINT,
    liquidationRatePercent: 104,
    maxBorrowMarketIndex: 3,
    maxPrimaryBorrowCapacity: TypedBigNumber.fromBalance(10_000e8, 'DAI', true),
    totalUsedPrimaryBorrowCapacity: TypedBigNumber.fromBalance(0, 'DAI', true),
    enabled: true,
    allowRollPosition: false,
    onlyVaultEntry: false,
    onlyVaultExit: false,
    onlyVaultRoll: false,
    onlyVaultDeleverage: false,
    onlyVaultSettle: false,
    allowsReentrancy: true,
    vaultStates: [],
  };
  let boosted: Boosted3TokenAuraVault;

  beforeEach(async () => {
    await setChainState(forkedBlockNumber);
    const [signer] = await ethers.getSigners();
    balancerVault = new Contract(
      '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      BalancerVaultABI,
      signer
    ) as BalancerVault;
    const [address] = await balancerVault.getPool(poolID);

    balancerPool = (await ethers.getContractAt(poolABI, address)) as BalancerBoostedPool;
    daiWhale = await getAccount('0xf04a5cc80b1e94c69b48f5ee68a08cd2f09a7c3e');
    ({ tokens: baseAssets, balances: baseBalances } = await balancerVault.getPoolTokens(poolID));
    daiLinearPool = (await ethers.getContractAt(linearPoolABI, baseAssets[2])) as BalancerLinearPool;
    ({ balances: underlyingBalances } = await balancerVault.getPoolTokens(await daiLinearPool.getPoolId()));
    dai = (await ethers.getContractAt(ERC20ABI, await daiLinearPool.getMainToken())) as ERC20;

    await dai.connect(daiWhale).approve(balancerVault.address, ethers.constants.MaxUint256);

    const { lowerTarget, upperTarget } = await daiLinearPool.getTargets();

    const initParams: typeof boosted.initParams = {
      underlyingPoolContext: {
        mainTokenIndex: (await daiLinearPool.getMainIndex()).toNumber(),
        wrappedTokenIndex: (await daiLinearPool.getWrappedIndex()).toNumber(),
        balances: underlyingBalances.map(FixedPoint.from),
      },
      underlyingPoolScalingFactors: (await daiLinearPool.getScalingFactors()).map(FixedPoint.from),
      underlyingPoolTotalSupply: FixedPoint.from(await daiLinearPool.getVirtualSupply()),
      underlyingPoolParams: {
        fee: FixedPoint.from(await daiLinearPool.getSwapFeePercentage()),
        lowerTarget: FixedPoint.from(lowerTarget),
        upperTarget: FixedPoint.from(upperTarget),
      },
      basePoolContext: {
        poolAddress: address,
        poolId: poolID,
        primaryTokenIndex: 1,
        tokenOutIndex: 0,
        balances: baseBalances.map(FixedPoint.from),
      },
      basePoolScalingFactors: (await balancerPool.getScalingFactors()).map(FixedPoint.from),
      basePoolAmp: FixedPoint.from((await balancerPool.getAmplificationParameter()).value),
      basePoolFee: FixedPoint.from(await balancerPool.getSwapFeePercentage()),
      basePoolTotalSupply: FixedPoint.from(await balancerPool.getVirtualSupply()),
    };
    boosted = new Boosted3TokenAuraVault(vault.vaultAddress, initParams);
  });

  it('calculates the appropriate bpt when joining', async () => {
    const { strategyTokens } = boosted.getStrategyTokensGivenDeposit(
      100,
      TypedBigNumber.fromBalance(1000e8, 'DAI', true),
      0
    );

    console.log(strategyTokens.toString());
  });
});
