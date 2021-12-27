import {ethers, Wallet} from 'ethers';
import Notional from '../../src/Notional';

const abiDecoder = require('abi-decoder');
const localAddresses = require('config/addresses.local.json');
const GovernorABI = require('../../src/abi/Governor.json');

abiDecoder.addABI(GovernorABI);
let currentProposalId = null;

async function mineBlock(provider: ethers.providers.Web3Provider, timeOffset: number) {
  const now = Math.floor(new Date().getTime() / 1000);
  await provider.send('evm_mine', [now + timeOffset]);
  return now + timeOffset;
}

describe('Notional SDK', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: Wallet;
  let notional: Notional;
  let governor;
  let note;
  let noteTokenAbiEncoding;
  let targets;
  let values;
  let calldatas;

  beforeEach(async () => {
    provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    signer = new Wallet('0x014dd03d25050b6bccba0c6470b3f0225890704cd41609af6ae3c93ded44e13e', provider);
    notional = await Notional.load(1337, provider);
    governor = notional.governance.getContract();
    note = notional.note;
    /* encoding of a sample proposal */
    noteTokenAbiEncoding = note.interface.encodeFunctionData('transfer', [
      '0xae03e188d39FbEd3CAf9C7E5F22057Fa411800e8',
      '99999',
    ]);
    targets = [localAddresses.note];
    values = [0];
    calldatas = [noteTokenAbiEncoding];
    await mineBlock(provider as ethers.providers.Web3Provider, 0);
  });

  describe('Governance Contract', () => {
    it('should allow someone to create a proposal', async () => {
      await note.delegate(signer.address);
      const txnResp = await (await governor.propose(targets, values, calldatas)).wait();
      const proposalId = abiDecoder.decodeLogs(txnResp.logs)[0].events[0].value;
      currentProposalId = proposalId; /* set current provider ID so you can cancel proposal in afterEach */
      const proposal = await governor.proposals(proposalId);
      expect(proposal.operationHash).toBeDefined();
    });

    it('should allow someone to cast a vote for a proposal', async () => {
      await note.delegate(signer.address);
      const proposeTxnResp = await (await governor.propose(targets, values, calldatas)).wait();
      const proposalId = abiDecoder.decodeLogs(proposeTxnResp.logs)[0].events[0].value;
      currentProposalId = proposalId; /* set current provider ID so you can cancel proposal in afterEach */
      await mineBlock(provider as ethers.providers.Web3Provider, 1);
      const castVoteTxnResp = await (await governor.castVote(proposalId, true)).wait();
      const eventData = abiDecoder.decodeLogs(castVoteTxnResp.logs)[0].events;
      const voterAddress = eventData[0].value;
      const voteCount = eventData[3].value;
      expect(voterAddress.toUpperCase()).toBe(signer.address.toUpperCase());
      expect(voteCount).toBe('4400000000000000'); /* denominated in 8 decimal places */
    });

    it('should allow a proposal to be officially executed', async () => {
      await note.delegate(signer.address);
      const proposeTxnResp = await (await governor.propose(targets, values, calldatas)).wait();
      const proposalId = abiDecoder.decodeLogs(proposeTxnResp.logs)[0].events[0].value;
      await mineBlock(provider as ethers.providers.Web3Provider, 1);
      await governor.castVote(proposalId, true);
      const votingPeriodBlocks = await governor.votingPeriodBlocks();
      const minDelay = await governor.getMinDelay();

      /* votingPeriodBlocks - 3 days or 10 blocks */
      for (let i = 0; i < votingPeriodBlocks; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await mineBlock(provider as ethers.providers.Web3Provider, i);
      }

      await governor.queueProposal(proposalId, targets, values, calldatas);
      await mineBlock(provider as ethers.providers.Web3Provider, minDelay * 2);
      await governor.executeProposal(proposalId, targets, values, calldatas);
      expect((await note.balanceOf('0xae03e188d39FbEd3CAf9C7E5F22057Fa411800e8')).toNumber()).toEqual(99999);
    });

    afterEach(async () => {
      if (currentProposalId !== null) {
        await governor.cancelProposal(currentProposalId);
        currentProposalId = null;
      }
    });
  });
});
