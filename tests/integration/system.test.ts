import { ethers, VoidSigner } from 'ethers';
import Notional, { Contracts } from '../../src';
import GraphClient from '../../src/data/GraphClient';
import { decodeBinary, fetchAndEncodeSystem } from '../../src/data/SystemData';

require('dotenv').config();

const mainnetAddresses = require('../../src/config/mainnet.json');

const mainnetGraphEndpoint = 'https://api.thegraph.com/subgraphs/name/notional-finance/mainnet-v2';

describe('System Integration Test', () => {
  let provider: ethers.providers.JsonRpcBatchProvider;
  let contracts: Contracts;

  beforeEach(async () => {
    provider = new ethers.providers.JsonRpcBatchProvider(
      `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`
    );
    const signer = new VoidSigner(ethers.constants.AddressZero, provider);
    contracts = Notional.getContracts(mainnetAddresses, signer);
  });

  it('returns system configuration from the graph', async () => {
    const graphClient = new GraphClient(mainnetGraphEndpoint, 0, false);
    const { binary, json } = await fetchAndEncodeSystem(
      graphClient,
      provider,
      contracts,
      false,
      process.env.EXCHANGE_RATE_API || ''
    );

    decodeBinary(binary, provider);
    console.log(json);
  });
});
