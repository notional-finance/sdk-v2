import { expect } from 'chai';
import {
  BigNumber,
  Contract,
  // utils,
  // Wallet,
} from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ethers } from 'hardhat';
import { getAccount, setChainState } from './utils';
import { BalancerStablePool, BalancerVault, ERC20 } from '../../src/typechain';
import MetaStable2TokenAura from '../../src/vaults/strategy/balancer/MetaStable2TokenAura';
import MockSystem from '../mocks/MockSystem';
import { System } from '../../src/system';
import { VaultConfig } from '../../src/data';
import FixedPoint from '../../src/vaults/strategy/balancer/FixedPoint';
import { BASIS_POINT } from '../../src/config/constants';
import TypedBigNumber from '../../src/libs/TypedBigNumber';

const ERC20ABI = require('../../src/abi/ERC20.json');
const poolABI = require('../../src/abi/BalancerStablePool.json');
const BalancerVaultABI = require('../../src/abi/BalancerVault.json');

const forkedBlockNumber = 15521384;
const poolID = '0x32296969ef14eb0c6d29669c550d4a0449130230000200000000000000000080';

describe('balancer vault test', () => {
  let balancerVault: BalancerVault;
  let balancerPool: BalancerStablePool;
  let wethWhale: SignerWithAddress;
  let assets: string[];
  let balances: BigNumber[];
  let weth: ERC20;

  const system = new MockSystem();
  System.overrideSystem(system);
  MockSystem.overrideSystem(system);
  // after(() => {
  //   system.destroy();
  //   expect(() => System.getSystem()).toThrowError('System not initialized');
  // });
  const vault: VaultConfig = {
    vaultAddress: '0xabc',
    strategy: '0xstrat',
    name: 'Cross Currency',
    primaryBorrowCurrency: 1,
    minAccountBorrowSize: TypedBigNumber.fromBalance(1e8, 'ETH', true),
    minCollateralRatioBasisPoints: 2000 * BASIS_POINT,
    maxDeleverageCollateralRatioBasisPoints: 4000 * BASIS_POINT,
    feeRateBasisPoints: 20 * BASIS_POINT,
    liquidationRatePercent: 104,
    maxBorrowMarketIndex: 2,
    maxPrimaryBorrowCapacity: TypedBigNumber.fromBalance(10_000e8, 'ETH', true),
    totalUsedPrimaryBorrowCapacity: TypedBigNumber.fromBalance(0, 'ETH', true),
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
  let metaStable: MetaStable2TokenAura;

  system.setVault(vault);

  beforeEach(async () => {
    await setChainState(forkedBlockNumber);
    const [signer] = await ethers.getSigners();
    balancerVault = new Contract(
      '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      BalancerVaultABI,
      signer
    ) as BalancerVault;
    const [address] = await balancerVault.getPool(poolID);

    balancerPool = (await ethers.getContractAt(poolABI, address)) as BalancerStablePool;
    wethWhale = await getAccount('0xf04a5cc80b1e94c69b48f5ee68a08cd2f09a7c3e');
    ({ tokens: assets, balances } = await balancerVault.getPoolTokens(poolID));
    weth = (await ethers.getContractAt(ERC20ABI, assets[1])) as ERC20;

    await weth.connect(wethWhale).approve(balancerVault.address, ethers.constants.MaxUint256);

    const swapFeePercentage = FixedPoint.from(await balancerPool.getSwapFeePercentage());
    const scalingFactors = await balancerPool.getScalingFactors();
    const totalSupply = FixedPoint.from(await balancerPool.totalSupply());
    const { value } = await balancerPool.getAmplificationParameter();
    const amplificationParameter = FixedPoint.from(value);
    const [pairPrice, bptPrice] = (
      await balancerPool.getTimeWeightedAverage([
        {
          variable: 0,
          secs: 3600,
          ago: 0,
        },
        {
          variable: 1,
          secs: 3600,
          ago: 0,
        },
      ])
    ).map(FixedPoint.from);

    const initParams: typeof metaStable.initParams = {
      poolContext: {
        poolAddress: address,
        poolId: poolID,
        primaryTokenIndex: 1,
        tokenOutIndex: 0,
        balances: balances.map(FixedPoint.from),
      },
      scalingFactors: scalingFactors.map(FixedPoint.from),
      amplificationParameter,
      swapFeePercentage,
      totalSupply,
      oracleContext: {
        bptPrice,
        pairPrice,
      },
    };
    metaStable = new MetaStable2TokenAura(vault.vaultAddress, initParams);
  });

  it('calculates the appropriate bpt when joining', async () => {
    const { strategyTokens } = metaStable.getStrategyTokensGivenDeposit(
      100,
      TypedBigNumber.fromBalance(10e8, 'ETH', true),
      0
    );

    const userData = ethers.utils.defaultAbiCoder.encode(
      ['uint256', 'uint256[]', 'uint256'],
      [1, [ethers.utils.parseEther('0'), ethers.utils.parseEther('10')], 0]
    );
    await balancerVault.connect(wethWhale).joinPool(poolID, wethWhale.address, wethWhale.address, {
      assets,
      maxAmountsIn: [ethers.utils.parseEther('0'), ethers.utils.parseEther('10')],
      userData,
      fromInternalBalance: false,
    });

    const bptMinted = parseFloat(ethers.utils.formatUnits(await balancerPool.balanceOf(wethWhale.address), 18));
    expect(strategyTokens.toFloat()).to.be.closeTo(bptMinted, 0.005);
  });

  // −0.002822928523841216
  // −3.788725085793369041
  // it('calculates the appropriate tokens out when exiting', () => {});
});
