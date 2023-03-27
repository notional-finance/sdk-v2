import { Signer, Contract, ethers, VoidSigner, utils, BigNumber } from 'ethers';
import { System } from './system';
import Governance from './Governance';
import GraphClient from './GraphClient';
import { Account, AccountData, AccountGraphLoader } from './account';

import { SystemEvents } from './system/System';
// eslint-disable import/no-named-as-default import/no-named-as-default-member
import TransactionBuilder from './TransactionBuilder';
import TypedBigNumber, { BigNumberType } from './libs/TypedBigNumber';
import {
  CACHE_DATA_REFRESH_INTERVAL,
  DEFAULT_CONFIGURATION_REFRESH_INTERVAL,
  INTERNAL_TOKEN_DECIMAL_PLACES,
  LOCAL_DATA_REFRESH_INTERVAL,
} from './config/constants';
import { DataSourceType } from './system/datasource';

/* typechain imports */
import { NoteERC20 } from './typechain/NoteERC20';
import { ERC20 } from './typechain/ERC20';
import { Notional as NotionalProxyTypechain } from './typechain/Notional';
import { SNOTE } from './typechain/SNOTE';
import { Governor } from './typechain/Governor';
import { TreasuryManager } from './typechain/TreasuryManager';
import { BalancerPool } from './typechain/BalancerPool';
import { BalancerVault } from './typechain/BalancerVault';
import { ExchangeV3 } from './typechain/ExchangeV3';
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
const goerliAddresses = require('./config/goerli.json');
const mainnetAddresses = require('./config/mainnet.json');
const graphEndpoints = require('./config/graph.json');

const SUBGRAPH_API_KEY = process.env.NX_SUBGRAPH_API_KEY;

/**
 * Provides an abstraction layer for interacting with Notional contracts.
 */
export default class Notional extends TransactionBuilder {
  constructor(
    // Core Contracts
    public note: NoteERC20,
    public graphClient: GraphClient,
    public governance: Governance,
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
    dataSourceType = DataSourceType.Cache,
    skipFetchSetup = false,
    configRefreshInterval = DEFAULT_CONFIGURATION_REFRESH_INTERVAL
  ) {
    let addresses: Addresses;
    let graphEndpoint: string;
    let pollInterval: number;

    switch (chainId) {
      case 1:
        addresses = mainnetAddresses;
        graphEndpoint = graphEndpoints['mainnet:http'].replace('[apiKey]', SUBGRAPH_API_KEY);
        pollInterval = Number(graphEndpoints['mainnet:poll']);
        break;
      case 5:
        addresses = goerliAddresses;
        graphEndpoint = graphEndpoints['goerli:http'];
        pollInterval = Number(graphEndpoints['goerli:poll']);
        break;
      case 1337:
        addresses = mainnetAddresses;
        graphEndpoint = graphEndpoints['mainnet:http'].replace('[apiKey]', SUBGRAPH_API_KEY);
        pollInterval = Number(graphEndpoints['local:poll']);
        // eslint-disable-next-line no-param-reassign
        refreshDataInterval = LOCAL_DATA_REFRESH_INTERVAL;
        // eslint-disable-next-line no-param-reassign
        dataSourceType = DataSourceType.Blockchain;
        break;
      default:
        throw new Error(`Undefined chainId: ${chainId}`);
    }

    const signer = new VoidSigner(ethers.constants.AddressZero, provider);
    const contracts = Notional.getContracts(addresses, signer);
    const graphClient = new GraphClient(graphEndpoint, pollInterval, skipFetchSetup);
    const governance = new Governance(addresses.governor, contracts.note, signer, provider, graphClient) as Governance;
    const system = await System.load(
      graphClient,
      contracts,
      signer.provider as ethers.providers.JsonRpcBatchProvider,
      chainId,
      dataSourceType,
      refreshDataInterval,
      configRefreshInterval,
      skipFetchSetup
    );

    // await for the first data refresh before returning
    // TODO: maybe move this code somewhere else so that we don't have to wait for paint
    await new Promise<void>((resolve) => {
      system.eventEmitter.once(SystemEvents.DATA_REFRESH, () => {
        resolve();
      });
    });

    return new Notional(contracts.note, graphClient, governance, system, provider, contracts);
  }

  public destroy() {
    this.system.destroy();
  }

  public async getAccount(address: string | Signer) {
    return Account.load(address, this.provider as ethers.providers.JsonRpcBatchProvider, this.system, this.graphClient);
  }

  public async getAccountBalanceSummaryFromGraph(address: string, accountData: AccountData) {
    return AccountGraphLoader.getBalanceSummary(address, accountData, this.graphClient);
  }

  public async getAccountAssetSummaryFromGraph(address: string, accountData: AccountData) {
    return AccountGraphLoader.getAssetSummary(address, accountData, this.graphClient);
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
          ? currency.decimalPlaces
          : currency.underlyingDecimalPlaces || currency.decimalPlaces;
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
      counterparty === this.system.getNotionalProxy().address ||
      counterparty === this.governance.getContract().address ||
      counterparty === this.note.address
    );
  }
}
