import {
  Signer,
  Contract,
  ethers,
  BigNumber,
  constants,
} from 'ethers';
import {gql} from '@apollo/client/core';
import {
  SECONDS_PER_BLOCK,
  SECONDS_IN_DAY,
  SECONDS_IN_HOUR,
} from './config/constants';
import {ProposalStateEnum} from './libs/types';

/* typechain imports */
import {Governor} from './typechain/Governor';
import {NoteERC20} from './typechain/NoteERC20';
import GraphClient from './GraphClient';

/* ABI imports */
const GovernorABI = require('./abi/Governor.json');

const statuses = {
  0: 'pending',
  1: 'active',
  2: 'cancelled',
  3: 'defeated',
  4: 'succeeded',
  5: 'queued',
  6: 'executed',
};

export interface Delegate {
  id: string;
  lastUpdateBlockHash: string;
  lastUpdateBlockNumber: number;
  lastUpdateTimestamp: number;
  lastUpdateTransactionHash: string;
}

export interface Vote {
  id: string;
  lastUpdateBlockHash: string;
  lastUpdateBlockNumber: number;
  lastUpdateTimestamp: number;
  lastUpdateTransactionHash: string;
  delegate: Delegate;
  yesToProposal: boolean;
  votingPower: string;
}

export interface ProposalState {
  id: string;
  state: ProposalStateEnum;
  transactionHash: string;
  lastUpdateTimestamp: number;
}

export interface ProposalQueryType {
  id: string;
  startBlock: number;
  endBlock: number;
  targets: Array<string>;
  values: Array<string>;
  calldatas: Array<string>;
  proposer: Delegate;
  votes: Array<Vote>;
  history: Array<ProposalState>;
  lastUpdateBlockHash: string;
  lastUpdateBlockNumber: number;
  lastUpdateTimestamp: number;
  lastUpdateTransactionHash: string;
  isCancelled: boolean;
  isExecuted: boolean;
  createdAt: number;
}

export interface ProposalQueryResult {
  proposal: ProposalQueryType;
}

export interface AllProposalsQueryResult {
  proposals: ProposalQueryType[];
}

export interface AllDelegatesQueryResult {
  delegates: Array<{
    id: string,
    totalVotesCount: string,
    totalProposalsCount: string,
    votingWeight: string
  }>
}

function allProposalsQuery() {
  return gql(`{
    proposals {
      id
      startBlock
      endBlock
      votes {
        id
        yesToProposal
        votingPower
      }
      proposer {
        id
        lastUpdateBlockHash
        lastUpdateBlockNumber
        lastUpdateTimestamp
        lastUpdateTransactionHash
      }
      history
      targets
      values
      calldatas
      lastUpdateBlockHash
      lastUpdateBlockNumber
      lastUpdateTimestamp
      lastUpdateTransactionHash
      isCancelled
      isExecuted
      createdAt
    }
  }`);
}

function proposalQuery(id: string) {
  return gql(`{
    proposal(id: "${id}") {
      id
      startBlock
      endBlock
      votes {
        id
        yesToProposal
        delegate {
          id
        }
        votingPower
      }
      proposer {
        id
      }
      history {
        id
        state
        transactionHash
        lastUpdateTimestamp
      }
      targets
      values
      calldatas
      lastUpdateBlockHash
      lastUpdateBlockNumber
      lastUpdateTimestamp
      lastUpdateTransactionHash
      isCancelled
      isExecuted
      createdAt
    }
  }`);
}

function allDelegatesQuery(limit) {
  return gql(`{
    delegates(limit: ${limit}) {
      id
      votes {
        id
        yesToProposal
        lastUpdateTimestamp
        proposal {
          id
          isCancelled
          isQueued
          isExecuted
        }
      }
      proposals {
        id
      }
    }
  }`);
}

export default class Governance {
  constructor(
    private governorAddress: string,
    private noteERC20: NoteERC20,
    private signer: Signer,
    private provider: ethers.providers.Provider,
    private apolloClient: GraphClient,
  ) {}

  public getContract(signer = this.signer) {
    return new Contract(this.governorAddress, GovernorABI, signer) as Governor;
  }

  public async getProposalById(id: string) {
    const proposal = await this.apolloClient.apollo.query<ProposalQueryResult>({query: proposalQuery(id)});

    if (proposal.data?.proposal && !proposal.error) {
      return proposal.data.proposal;
    }
    return undefined;
  }

  public async getAllProposals() {
    const proposals = await this.apolloClient.apollo.query<AllProposalsQueryResult>({query: allProposalsQuery()});

    if (!proposals.error) {
      return proposals.data.proposals;
    }

    return undefined;
  }

  public async getUserVotingPower(userAddress: string, isProposalView: boolean, proposalId: string) {
    let userVotingPowerString: string = '';

    if (isProposalView && proposalId) {
      const proposal = await this.apolloClient.apollo.query<ProposalQueryResult>({query: proposalQuery(proposalId)});

      if (proposal?.data?.proposal && !proposal.error) {
        const proposalStartBlock: number = proposal.data.proposal.startBlock;

        // getPriorVotes() can revert if the current block is less than the proposal start block.
        // If that happens, userVotingPower has not been determined yet and we return an empty string.
        const userVotingPower: BigNumber = await this.noteERC20.getPriorVotes(userAddress, proposalStartBlock);
        userVotingPowerString = ethers.utils.formatUnits(userVotingPower, 8);
      }
    } else {
      /* Function getCurrentVotes() returns an account's voting power  */
      const userVotingPower = await this.noteERC20.getCurrentVotes(userAddress);
      userVotingPowerString = ethers.utils.formatUnits(userVotingPower, 8);
    }

    return userVotingPowerString;
  }

  public async getDaysLeftToVote(proposal: any) {
    const currentBlockNumber: number = await this.provider.getBlockNumber();
    let displayString;

    if (currentBlockNumber && proposal) {
      /*
        proposal.startBlock is the block number where voting for a proposal starts.
        proposal.endBlock is the block number where voting for a proposal ends.
        It currently takes 13 seconds to mine a block on Ethereum.
        To get seconds, multiply X block number by 13 to get remaining seconds,
        and then divide by 86,400 (seconds in 1 day) to get the remaining X days.
      */

      /* If current block number less than a proposal's start block = Voting has not begun yet */
      if (currentBlockNumber < proposal.startBlock) {
        const secondsLeftToVote: number = (proposal.startBlock - currentBlockNumber) * SECONDS_PER_BLOCK;

        /* SECONDS_IN_DAY = 86,400 */
        const daysUntilVotingStarts: number = Math.floor(Math.abs(secondsLeftToVote / SECONDS_IN_DAY));
        const daysUntilVotingStartsText: string = daysUntilVotingStarts === 1 ? 'day' : 'days';

        /* SECONDS_IN_HOUR = 3600 */
        const hoursUntilVotingStarts: number = Math.floor(Math.abs(
          (secondsLeftToVote % SECONDS_IN_DAY) / SECONDS_IN_HOUR,
        ));
        const hoursUntilVotingStartsText: string = hoursUntilVotingStarts === 1 ? 'hour' : 'hours';

        displayString = `
          ${daysUntilVotingStarts} ${daysUntilVotingStartsText}
          ${hoursUntilVotingStarts} ${hoursUntilVotingStartsText}
        `;
      }

      /*
        If the current block number is greater than or equal to a proposal's start block,
        and the current block number is less than a proposal's end block,
        that means voting is in session.
      */
      if ((currentBlockNumber >= proposal.startBlock) && (currentBlockNumber < proposal.endBlock)) {
        const secondsLeftToVote: number = (proposal.endBlock - currentBlockNumber) * SECONDS_PER_BLOCK;

        /* SECONDS_IN_DAY = 86,000 */
        const daysLeftToVote: number = Math.floor(secondsLeftToVote / SECONDS_IN_DAY);
        const daysLeftToVoteText: string = daysLeftToVote === 1 ? 'day' : 'days';

        /* SECONDS_IN_HOUR = 3600 */
        const hoursLeftToVote: number = Math.floor((secondsLeftToVote % SECONDS_IN_DAY) / SECONDS_IN_HOUR);
        const hoursLeftToVoteText: string = hoursLeftToVote === 1 ? 'hour' : 'hours';

        displayString = `
          ${daysLeftToVote} ${daysLeftToVoteText}
          ${hoursLeftToVote} ${hoursLeftToVoteText}
        `;
      }

      /* If current block number is greater than a proposal's end block = Voting has ended */
      if (currentBlockNumber > proposal.endBlock) {
        displayString = 'Voting has ended';
      }
    }

    return displayString;
  }

  public getProposalVotePercentages(totalVotesForProposal: any) {
    let yesNumerator: BigNumber = BigNumber.from(0);
    let noNumerator: BigNumber = BigNumber.from(0);
    let yesToProposalPercent: number = 0;
    let noToProposalPercent: number = 0;
    let totalVotingPower: BigNumber = BigNumber.from(0);

    if (totalVotesForProposal && totalVotesForProposal.length) {
      for (let i = 0; i < totalVotesForProposal.length; i += 1) {
        const vote: Vote = totalVotesForProposal[i];
        totalVotingPower = totalVotingPower.add(vote.votingPower);

        if (vote.yesToProposal === true || vote.yesToProposal === false) {
          if (vote.yesToProposal) {
            yesNumerator = yesNumerator.add(vote.votingPower);
          } else {
            noNumerator = noNumerator.add(vote.votingPower);
          }
        }
      }

      /*
        BigNumber is a fixed point number not floating point number.  So it's alway an integer.
        So, you need to multiply 1000 to give you additional zeroes to divide by.
        Then we divide by votingPower to create the percentage.
        Then divide by 10 at the end because we want 1 decimal point.
        In the end, we want two digits and 1 decimal point.
      */
      yesToProposalPercent = yesNumerator.mul(1000).div(totalVotingPower).toNumber() / 10;
      noToProposalPercent = noNumerator.mul(1000).div(totalVotingPower).toNumber() / 10;
    }

    return {
      yesToProposalPercent,
      noToProposalPercent,
    };
  }

  public async getAllVotersForProposal(proposalId: string) {
    const proposal = await this.apolloClient.apollo.query<ProposalQueryResult>({query: proposalQuery(proposalId)});
    const yesVoters: Array<{voterAddress: string, voterVotingPower: string}> = [];
    const noVoters: Array<{voterAddress: string, voterVotingPower: string}> = [];
    let proposalVotes: any = [];

    if (proposal?.data?.proposal && !proposal.error) {
      proposalVotes = proposal.data.proposal.votes;
    }

    for (let i = 0; i < proposalVotes.length; i += 1) {
      const vote = proposalVotes[i];

      if (vote.yesToProposal) {
        yesVoters.push({
          voterAddress: vote.delegate.id,
          voterVotingPower: vote.votingPower,
        });
      } else {
        noVoters.push({
          voterAddress: vote.delegate.id,
          voterVotingPower: vote.votingPower,
        });
      }
    }

    return {
      yesVoters,
      noVoters,
    };
  }

  /*
    getProposalState: Return state of proposal
    i.e. "pending", "active", "cancelled", "defeated", "succeeded", "queued", "executed"
  */
  public async getProposalState(proposalId: string) {
    const contract = this.getContract();
    const proposalStateNumber: number = await contract.state(proposalId);
    const currentProposalState: string = statuses[proposalStateNumber];
    return currentProposalState;
  }

  public async castVote(proposalId: string, yesToProposal: boolean) {
    const contract = this.getContract();
    const populatedTransaction = contract.populateTransaction.castVote(proposalId, yesToProposal);
    return populatedTransaction;
  }

  public createProposal(newProposal: any) {
    const {
      contractAddress,
      contractValue,
      callDatas,
    } = newProposal;
    const contractValueBigNumber = contractValue ? BigNumber.from(contractValue) : 0;
    const callDatasValue = callDatas || '0x';
    const contract = this.getContract();
    const populatedTransaction = contract.populateTransaction.propose(
      [contractAddress], [contractValueBigNumber], [callDatasValue],
    );
    return populatedTransaction;
  }

  public async getAccountVotingWeight(userAddress: string, isProposalView: boolean, proposalId: string) {
    let allUserVotes: any;
    let userVotingWeight: number = 0;

    if (isProposalView && proposalId) {
      const proposal = await this.apolloClient.apollo.query<ProposalQueryResult>({query: proposalQuery(proposalId)});
      const proposalStartBlock: number = proposal.data.proposal.startBlock;

      /* Function getPriorVotes() returns an account's voting power prior to a given block */
      allUserVotes = await this.noteERC20.getPriorVotes(userAddress, proposalStartBlock);
    } else {
      /* Function getCurrentVotes() returns an account's voting power  */
      allUserVotes = await this.noteERC20.getCurrentVotes(userAddress);
    }

    userVotingWeight = allUserVotes.mul(10000).div(BigNumber.from(10).pow(16)).toNumber().toFixed(2) / 100;
    return userVotingWeight;
  }

  public async getDelegatee(walletAddress: string) {
    const delegatee = await this.noteERC20.delegates(walletAddress);

    if (delegatee === constants.AddressZero) { return ''; }
    return delegatee;
  }

  public async delegateVotes(newDelegateeAddress: string) {
    const populatedTransaction = this.noteERC20.populateTransaction.delegate(newDelegateeAddress);
    return populatedTransaction;
  }

  public async getAllVoters(limit: number) {
    const allVoters = await this.apolloClient.apollo.query<AllDelegatesQueryResult>({query: allDelegatesQuery(limit)});

    if (allVoters.data?.delegates?.length) {
      return allVoters.data.delegates;
    }

    return [];
  }
}
