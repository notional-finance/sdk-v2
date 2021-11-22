import {
  BigNumber, constants, ethers, utils,
} from 'ethers';
import GraphClient from '../../src/GraphClient';
import TypedBigNumber, {BigNumberType} from '../../src/libs/TypedBigNumber';
import MockSystem from '../mocks/MockSystem';
import Notional from '../../src/Notional';
import {NoteERC20} from '../../src/typechain/NoteERC20';
import Governance from '../../src/Governance';

describe('Typed Big Number', () => {
  const provider = new ethers.providers.JsonRpcBatchProvider('http://localhost:8545');
  const system = new MockSystem();
  const notional = new Notional(
    ({} as unknown) as NoteERC20,
    ({} as unknown) as GraphClient,
    ({} as unknown) as Governance,
    system,
    provider,
  );
  afterAll(() => system.destroy());

  it('does not allow arithmetic of two different types', () => {
    const t1 = TypedBigNumber.from(100, BigNumberType.ExternalAsset, 'DAI');
    const t2 = TypedBigNumber.from(100, BigNumberType.ExternalUnderlying, 'DAI');
    expect(() => {
      t1.add(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.sub(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.eq(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.lt(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.lte(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.gt(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.gte(t2);
    }).toThrowError(TypeError);
  });

  it('does not allow adding of two different currencies', () => {
    const t1 = TypedBigNumber.from(100, BigNumberType.ExternalAsset, 'cDAI');
    const t2 = TypedBigNumber.from(100, BigNumberType.ExternalAsset, 'cUSDC');
    expect(() => {
      t1.add(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.sub(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.eq(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.lt(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.lte(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.gt(t2);
    }).toThrowError(TypeError);
    expect(() => {
      t1.gte(t2);
    }).toThrowError(TypeError);
  });

  it('converts to internal precision', () => {
    const ethInput = notional.parseInput('1.123456789', 'ETH', false)!;
    expect(ethInput.isExternalPrecision()).toBe(true);
    expect(ethInput.toInternalPrecision().toString()).toEqual(BigNumber.from(1.12345678e8).toString());

    const usdcInput = TypedBigNumber.from(1.123456e6, BigNumberType.ExternalUnderlying, 'USDC');
    expect(usdcInput.toInternalPrecision().toString()).toEqual(BigNumber.from(1.123456e8).toString());
  });

  it('converts to external precision', () => {
    const ethInput = notional.parseInput('1.12345678', 'ETH', true)!;
    expect(ethInput.isInternalPrecision()).toBe(true);
    expect(ethInput.toExternalPrecision().toString()).toEqual(utils.parseEther('1.12345678').toString());
  });

  it('parses input strings', () => {
    const ethInput = notional.parseInput('1.1', 'ETH', true);
    expect(ethInput!.toString()).toEqual(BigNumber.from(1.1e8).toString());

    const ethInputExternal = notional.parseInput('1', 'ETH', false);
    expect(ethInputExternal!.toString()).toEqual(BigNumber.from(constants.WeiPerEther).toString());

    const cETHInput = notional.parseInput('1.1', 'cETH', true);
    expect(cETHInput!.toString()).toEqual(BigNumber.from(1.1e8).toString());

    const usdcInput = notional.parseInput('1.1', 'USDC', false);
    expect(usdcInput!.toString()).toEqual(BigNumber.from(1.1e6).toString());

    const invalidInput = notional.parseInput('', 'cETH', true);
    expect(invalidInput).toBeUndefined();
  });

  it('converts internal assets to internal underlying', () => {
    const cDAI = notional.parseInput('50', 'cDAI', true)!;
    const DAI = cDAI?.toUnderlying();
    expect(DAI.symbol).toEqual('DAI');
    expect(DAI.toString()).toEqual(BigNumber.from(1e8).toString());
    expect(DAI.isUnderlying()).toBe(true);
    expect(DAI.isAssetCash()).toBe(false);
    expect(DAI.isInternalPrecision()).toBe(true);
    expect(DAI.isExternalPrecision()).toBe(false);
  });

  it('converts external assets to external underlying', () => {
    // this is parsed as external asset
    const cDAI = notional.parseInput('50', 'cDAI', false)!;
    const DAI = cDAI?.toUnderlying();
    expect(DAI.symbol).toEqual('DAI');
    expect(DAI.toString()).toEqual(utils.parseEther('1').toString());
    expect(DAI.isUnderlying()).toBe(true);
    expect(DAI.isAssetCash()).toBe(false);
    expect(DAI.isExternalPrecision()).toBe(true);
    expect(DAI.isInternalPrecision()).toBe(false);
  });

  it('converts internal underlying to internal asset', () => {
    const DAI = notional.parseInput('3', 'DAI', true)!;
    const cDAI = DAI.toAssetCash();
    expect(cDAI.symbol).toEqual('cDAI');
    expect(cDAI.toString()).toEqual(BigNumber.from(150e8).toString());
    expect(cDAI.isAssetCash()).toBe(true);
    expect(cDAI.isUnderlying()).toBe(false);
    expect(cDAI.isInternalPrecision()).toBe(true);
    expect(cDAI.isExternalPrecision()).toBe(false);
  });

  it('converts external underlying to external asset', () => {
    const DAI = notional.parseInput('3', 'DAI', false)!;
    const cDAI = DAI.toAssetCash();
    expect(cDAI.symbol).toEqual('cDAI');
    expect(cDAI.toString()).toEqual(BigNumber.from(150e8).toString());
    expect(cDAI.isAssetCash()).toBe(true);
    expect(cDAI.isUnderlying()).toBe(false);
    expect(cDAI.isInternalPrecision()).toBe(false);
    expect(cDAI.isExternalPrecision()).toBe(true);
  });

  it('converts to eth values without haircuts', () => {
    const ethValue = TypedBigNumber.from(1e8, BigNumberType.InternalUnderlying, 'DAI').toETH(false);
    expect(ethValue.symbol).toEqual('ETH');
    expect(ethValue.toString()).toEqual(BigNumber.from(0.01e8).toString());

    const daiValue = TypedBigNumber.from(50e8, BigNumberType.InternalAsset, 'cDAI').toETH(false);
    expect(daiValue.toString()).toEqual(BigNumber.from(0.01e8).toString());
  });

  it('converts to eth values with haircuts', () => {
    const usdtValue = TypedBigNumber.from(1e8, BigNumberType.InternalUnderlying, 'USDT').toETH(true);
    expect(usdtValue.toString()).toEqual(BigNumber.from(0).toString());

    const daiValue = TypedBigNumber.from(1e8, BigNumberType.InternalUnderlying, 'DAI').toETH(true);
    expect(daiValue.toString()).toEqual(BigNumber.from(0.0095e8).toString());

    const cDaiValue = TypedBigNumber.from(50e8, BigNumberType.InternalAsset, 'cDAI').toETH(true);
    expect(cDaiValue.toString()).toEqual(BigNumber.from(0.0095e8).toString());
  });

  it('converts to eth values with buffers', () => {
    const ethValue = TypedBigNumber.from(-1e8, BigNumberType.InternalUnderlying, 'USDT').toETH(true);
    expect(ethValue.toString()).toEqual(BigNumber.from(-0.0105e8).toString());
  });

  it('converts to NOTE to other currencies', () => {
    const noteTokens = TypedBigNumber.fromBalance(1e8, 'NOTE', true);
    expect(noteTokens.toETH(false).toString()).toEqual(BigNumber.from(0.0175e8).toString());
    expect(noteTokens.toETH(false).fromETH(3).toString()).toEqual(BigNumber.from(1.75e8).toString());
  });
});
