import { Signer, Contract, ethers, VoidSigner, utils, BigNumber } from 'ethers';
import { System } from './system';
import GraphClient from './data/GraphClient';
import { Account, AccountData, AccountGraphLoader } from './account';

// eslint-disable import/no-named-as-default import/no-named-as-default-member
import TransactionBuilder from './TransactionBuilder';
import TypedBigNumber, { BigNumberType } from './libs/TypedBigNumber';
import { CACHE_DATA_REFRESH_INTERVAL, INTERNAL_TOKEN_DECIMAL_PLACES } from './config/constants';

/* typechain imports */
import {
  NoteERC20,
  ERC20,
  Notional as NotionalProxyTypechain,
  SNOTE,
  Governor,
  TreasuryManager,
  BalancerPool,
  BalancerVault,
  ExchangeV3,
} from './typechain';
import { Contracts } from '.';

interface Addresses {
  airdrop: string;
  governor: string;
  note: string;
  notional: string;
  sNOTE: string;
  balancerVault: string;
  balancerPool: string;
  treasury: string;
  weth: string;
  exchangeV3?: string;
  comp?: string;
}

/* ABI imports */
const NoteERC20ABI = require('./abi/NoteERC20.json');
const NotionalABI = require('./abi/Notional.json');
const BalancerVaultABI = require('./abi/BalancerVault.json');
const BalancerPoolABI = require('./abi/BalancerPool.json');
const sNOTEABI = require('./abi/sNOTE.json');
const ERC20ABI = require('./abi/ERC20.json');
const GovernorABI = require('./abi/Governor.json');
const TreasuryManagerABI = require('./abi/TreasuryManager.json');
const ExchangeV3ABI = require('./abi/ExchangeV3.json');

/* Endpoints */
const kovanAddresses = require('./config/kovan.json');
const goerliAddresses = require('./config/goerli.json');
const mainnetAddresses = require('./config/mainnet.json');
const graphEndpoints = require('./config/graph.json');
const cacheEndpoint = require('./config/cache.json');

/**
 * Provides an abstraction layer for interacting with Notional contracts.
 */
export default class Notional extends TransactionBuilder {
  constructor(
    // Core Contracts
    public note: NoteERC20,
    public graphClient: GraphClient,
    public system: System,
    public provider: ethers.providers.Provider,
    public contracts: Contracts
  ) {
    super();
  }

  public static getContracts(addresses: Addresses, signer: Signer): Contracts {
    return {
      notionalProxy: new Contract(addresses.notional, NotionalABI, signer) as NotionalProxyTypechain,
      sNOTE: new Contract(addresses.sNOTE, sNOTEABI, signer) as SNOTE,
      note: new Contract(addresses.note, NoteERC20ABI, signer) as NoteERC20,
      governor: new Contract(addresses.governor, GovernorABI, signer) as Governor,
      treasury: new Contract(addresses.treasury, TreasuryManagerABI, signer) as TreasuryManager,
      balancerVault: new Contract(addresses.balancerVault, BalancerVaultABI, signer) as BalancerVault,
      balancerPool: new Contract(addresses.balancerPool, BalancerPoolABI, signer) as BalancerPool,
      exchangeV3: addresses.exchangeV3
        ? (new Contract(addresses.exchangeV3, ExchangeV3ABI, signer) as ExchangeV3)
        : null,
      weth: new Contract(addresses.weth, ERC20ABI, signer) as ERC20,
      comp: addresses.comp ? (new Contract(addresses.comp, ERC20ABI, signer) as ERC20) : null,
    };
  }

  public static getChainConfig(chainId: number) {
    switch (chainId) {
      case 1:
        return {
          addresses: mainnetAddresses,
          graphEndpoint: graphEndpoints['mainnet:http'],
          pollInterval: Number(graphEndpoints['mainnet:poll']),
          cacheUrl: cacheEndpoint['mainnet:http'],
        };
      case 5:
        return {
          addresses: goerliAddresses,
          graphEndpoint: graphEndpoints['goerli:http'],
          pollInterval: Number(graphEndpoints['goerli:poll']),
          cacheUrl: cacheEndpoint['goerli:http'],
        };
      case 42:
        return {
          addresses: kovanAddresses,
          graphEndpoint: graphEndpoints['kovan:http'],
          pollInterval: Number(graphEndpoints['kovan:poll']),
          cacheUrl: cacheEndpoint['kovan:http'],
        };
      case 1337:
        return {
          addresses: mainnetAddresses,
          graphEndpoint: graphEndpoints['mainnet:http'],
          pollInterval: Number(graphEndpoints['local:poll']),
          cacheUrl: cacheEndpoint['mainnet:http'],
        };
      default:
        throw new Error(`Undefined chainId: ${chainId}`);
    }
  }

  /**
   * Creates a new instance of the Notional SDK.
   *
   * @param chainId the name of the network to connect to
   * @param provider the signer to use to interact with the contract
   */
  public static async load(
    chainId: number,
    provider: ethers.providers.Provider,
    refreshDataInterval = CACHE_DATA_REFRESH_INTERVAL,
    skipFetchSetup = false
  ) {
    const { addresses, graphEndpoint, pollInterval, cacheUrl } = this.getChainConfig(chainId);

    const signer = new VoidSigner(ethers.constants.AddressZero, provider);
    const contracts = Notional.getContracts(addresses, signer);
    const graphClient = new GraphClient(graphEndpoint, pollInterval, skipFetchSetup);
    const system = await System.load(
      cacheUrl,
      graphClient,
      contracts,
      signer.provider as ethers.providers.JsonRpcBatchProvider,
      refreshDataInterval,
      skipFetchSetup
    );

    return new Notional(contracts.note, graphClient, system, provider, contracts);
  }

  public destroy() {
    this.system.destroy();
  }

  public async getAccount(address: string | Signer) {
    return Account.load(address, this.provider as ethers.providers.JsonRpcBatchProvider, this.system, this.graphClient);
  }

  public async getAccountBalanceSummaryFromGraph(address: string, accountData: AccountData) {
    return AccountGraphLoader.getBalanceSummary(address, accountData);
  }

  public async getAccountAssetSummaryFromGraph(address: string, accountData: AccountData) {
    return AccountGraphLoader.getAssetSummary(address, accountData);
  }

  public async getAccountFromGraph(address: string) {
    return AccountGraphLoader.load(this.graphClient, address);
  }

  public async getAccountsFromGraph() {
    return AccountGraphLoader.loadBatch(this.graphClient);
  }

  public parseInput(input: string, symbol: string, isInternal: boolean) {
    const bnType = TypedBigNumber.getType(symbol, isInternal);
    let decimalPlaces: number;
    if (isInternal) {
      decimalPlaces = INTERNAL_TOKEN_DECIMAL_PLACES;
    } else if (symbol === 'WETH' || symbol === 'sNOTE') {
      // This is External WETH or sNOTE (neither are in System as currencies)
      decimalPlaces = 18;
    } else {
      const currency = this.system.getCurrencyBySymbol(symbol);
      decimalPlaces =
        bnType === BigNumberType.ExternalAsset
          ? currency.assetDecimalPlaces
          : currency.underlyingDecimalPlaces || currency.assetDecimalPlaces;
    }

    try {
      const value = utils.parseUnits(input.replace(/,/g, ''), decimalPlaces);
      return TypedBigNumber.from(BigNumber.from(value), bnType, symbol);
    } catch {
      return undefined;
    }
  }

  public isNotionalContract(counterparty: string) {
    return (
      counterparty === this.contracts.notionalProxy.address ||
      counterparty === this.note.address ||
      counterparty === this.contracts.sNOTE.address
    );
  }
}
