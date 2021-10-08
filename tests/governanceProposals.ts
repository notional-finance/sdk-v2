/* eslint-disable */
import { BigNumber, ethers, Wallet } from 'ethers';
import Notional from '../src/Notional';
import { Governor } from '../src/typechain/Governor';
import { NoteERC20 } from '../src/typechain/NoteERC20';
import testAccountPrivateKeys from './testAccounts';

const abiDecoder = require('abi-decoder');
const localAddresses = require('../src/config/addresses.local.json');
const GovernorABI = require('../src/abi/Governor.json');

abiDecoder.addABI(GovernorABI);

async function mineBlock(provider: ethers.providers.Web3Provider, timeOffset: number) {
  const now = Math.floor(new Date().getTime() / 1000);
  await provider.send('evm_mine', [now + timeOffset]);
  return now + timeOffset;
}

async function setupProposers(note: NoteERC20, initialHolder: Wallet) {
  const accounts: Wallet[] = [];
  const initialBalance = BigNumber.from(1_100_000).mul(100000000);
  for (let i = 0; i < 7; i++) {
    const acct = new Wallet(testAccountPrivateKeys[i + 1], initialHolder.provider);
    // Transfer sufficient votes to propose
    await note.connect(initialHolder).transfer(acct.address, initialBalance);
    // Delegate back to self
    await note.connect(acct).delegate(acct.address);
    accounts.push(acct);
  }

  return accounts;
}

function getProposal(note: NoteERC20) {
  /* encoding of a sample proposal to transfer NOTE tokens */
  const noteTokenAbiEncoding = note.interface.encodeFunctionData('transfer', [localAddresses.governor, 1000]);

  return {
    targets: [localAddresses.note],
    values: [0],
    calldatas: [noteTokenAbiEncoding],
  };
}

async function createProposal(proposer: Wallet, governor: Governor, note: NoteERC20) {
  const { targets, values, calldatas } = getProposal(note);
  const txnRecpt = await (await governor.connect(proposer).propose(targets, values, calldatas)).wait();
  if (!txnRecpt.status) console.log('transaction failed');

  return governor.proposalCount();
}

async function main() {
  const provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
  const initialHolder = new Wallet('0x014dd03d25050b6bccba0c6470b3f0225890704cd41609af6ae3c93ded44e13e', provider);
  const notional = await Notional.load(1337, provider);
  const governor = notional.governance.getContract();
  const { note } = notional;

  const proposers = await setupProposers(note, initialHolder);
  const minDelay = (await governor.getMinDelay()).toNumber();

  console.log('Min Delay Seconds: ', minDelay);
  console.log('Voting Delay Blocks: ', await governor.votingDelayBlocks());
  console.log('Voting Period Blocks: ', await governor.votingPeriodBlocks());
  console.log('Guardian Address: ', await governor.guardian());

  // Cancelled
  const cancelledProposalId = await createProposal(proposers[0], governor, note);
  await governor.connect(initialHolder).cancelProposal(cancelledProposalId);
  console.log(`Cancelled proposal: ${cancelledProposalId}, state id ${await governor.state(cancelledProposalId)}`);

  // Votable Proposals
  const defeatedProposalId = await createProposal(proposers[1], governor, note);
  const succeededProposalId = await createProposal(proposers[2], governor, note);
  const queuedProposalId = await createProposal(proposers[3], governor, note);
  const executedProposalId = await createProposal(proposers[4], governor, note);
  // Mine a block to enable voting
  await mineBlock(provider as ethers.providers.Web3Provider, 1);

  // Defeated
  await governor.connect(initialHolder).castVote(defeatedProposalId, false);

  // Succeeded
  await governor.connect(initialHolder).castVote(succeededProposalId, true);

  // Queued
  await governor.connect(initialHolder).castVote(queuedProposalId, true);

  // Executed
  await governor.connect(initialHolder).castVote(executedProposalId, true);

  for (let i = 0; i < 10; i++) {
    // Mine blocks to get past the voting period
    await mineBlock(provider as ethers.providers.Web3Provider, 1);
  }

  const { targets, values, calldatas } = getProposal(note);
  await governor.connect(initialHolder).queueProposal(queuedProposalId, targets, values, calldatas);
  await governor.connect(initialHolder).queueProposal(executedProposalId, targets, values, calldatas);
  await mineBlock(provider as ethers.providers.Web3Provider, minDelay + 100);
  await governor.connect(initialHolder).executeProposal(executedProposalId, targets, values, calldatas);

  console.log(`Defeated proposal: ${defeatedProposalId}, state id ${await governor.state(defeatedProposalId)}`);
  console.log(`Succeeded proposal: ${succeededProposalId}, state id ${await governor.state(succeededProposalId)}`);
  console.log(`Queued proposal: ${queuedProposalId}, state id ${await governor.state(queuedProposalId)}`);
  console.log(`Executed proposal: ${executedProposalId}, state id ${await governor.state(executedProposalId)}`);

  // Active
  const activeProposalId = await createProposal(proposers[5], governor, note);
  await mineBlock(provider as ethers.providers.Web3Provider, 1);
  // Pending
  const pendingProposalId = await createProposal(proposers[6], governor, note);
  console.log(`Active proposal: ${activeProposalId}, state id ${await governor.state(activeProposalId)}`);
  console.log(`Pending proposal: ${pendingProposalId}, state id ${await governor.state(pendingProposalId)}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
