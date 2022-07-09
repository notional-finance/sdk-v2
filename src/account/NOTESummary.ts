import { gql } from '@apollo/client/core';
import { ReturnsBreakdown, TransactionHistory, TypedBigNumber } from '..';
import { INTERNAL_TOKEN_PRECISION, NOTE_CURRENCY_ID } from '../config/constants';
import GraphClient from '../GraphClient';
import { getNowSeconds } from '../libs/utils';
import { StakedNote } from '../staking';
import { NTokenValue } from '../system';
import Account from './Account';
import AccountData from './AccountData';

interface StakedNoteQueryResult {
  stakedNoteBalance: {
    id: string;
    sNOTEBalance: string;
    ethAmountJoined: string;
    noteAmountJoined: string;
    ethAmountRedeemed: string;
    noteAmountRedeemed: string;

    stakedNoteChanges: {
      blockNumber: number;
      transactionHash: string;
      timestamp: number;
      sNOTEAmountBefore: string;
      sNOTEAmountAfter: string;
      ethAmountChange: string;
      noteAmountChange: string;
    }[];
  };
}

interface StakedNoteHistory {
  ethAmountJoined: TypedBigNumber;
  noteAmountJoined: TypedBigNumber;
  ethAmountRedeemed: TypedBigNumber;
  noteAmountRedeemed: TypedBigNumber;

  transactions: {
    blockNumber: number;
    transactionHash: string;
    blockTime: Date;
    sNOTEAmountBefore: TypedBigNumber;
    sNOTEAmountAfter: TypedBigNumber;
    ethAmountChange: TypedBigNumber;
    noteAmountChange: TypedBigNumber;
  }[];
}

export default class NOTESummary {
  private static historyQuery(address: string) {
    return gql`{
        stakedNoteBalance (
          id: "${address.toLowerCase()}",
        ) {
        sNOTEBalance
        ethAmountJoined
        noteAmountJoined
        ethAmountRedeemed
        noteAmountRedeemed
        
        stakedNoteChanges {
          id
          blockNumber
          transactionHash
          timestamp
          sNOTEAmountBefore
          sNOTEAmountAfter
          ethAmountChange
          noteAmountChange
        }
      }
    }`;
  }

  public static async fetchHistory(address: string, graphClient: GraphClient): Promise<StakedNoteHistory> {
    const result = await graphClient.queryOrThrow<StakedNoteQueryResult>(NOTESummary.historyQuery(address));
    if (result.stakedNoteBalance === null) {
      // Handle the case where the user has not staked
      return {
        transactions: [],
        ethAmountJoined: TypedBigNumber.fromBalance(0, 'ETH', false),
        ethAmountRedeemed: TypedBigNumber.fromBalance(0, 'ETH', false),
        noteAmountJoined: TypedBigNumber.fromBalance(0, 'NOTE', false),
        noteAmountRedeemed: TypedBigNumber.fromBalance(0, 'NOTE', false),
      };
    }

    const history = result.stakedNoteBalance.stakedNoteChanges
      .map((r) => ({
        blockNumber: r.blockNumber,
        transactionHash: r.transactionHash,
        blockTime: new Date(r.timestamp * 1000),
        sNOTEAmountBefore: TypedBigNumber.fromBalance(r.sNOTEAmountBefore, 'sNOTE', false),
        sNOTEAmountAfter: TypedBigNumber.fromBalance(r.sNOTEAmountAfter, 'sNOTE', false),
        ethAmountChange: TypedBigNumber.fromBalance(r.ethAmountChange, 'ETH', false),
        noteAmountChange: TypedBigNumber.fromBalance(r.noteAmountChange, 'NOTE', false),
      }))
      .sort((a, b) => b.blockNumber - a.blockNumber); // sorts descending

    return {
      transactions: history,
      ethAmountJoined: TypedBigNumber.fromBalance(result.stakedNoteBalance.ethAmountJoined, 'ETH', false),
      ethAmountRedeemed: TypedBigNumber.fromBalance(result.stakedNoteBalance.ethAmountRedeemed, 'ETH', false),
      noteAmountJoined: TypedBigNumber.fromBalance(result.stakedNoteBalance.noteAmountJoined, 'NOTE', false),
      noteAmountRedeemed: TypedBigNumber.fromBalance(result.stakedNoteBalance.noteAmountRedeemed, 'NOTE', false),
    };
  }

  public static async build(account: Account, graphClient: GraphClient) {
    return new NOTESummary(
      account.walletBalanceBySymbol('NOTE')?.balance || TypedBigNumber.fromBalance(0, 'NOTE', false),
      account.walletBalanceBySymbol('sNOTE')?.balance || TypedBigNumber.fromBalance(0, 'sNOTE', false),
      account.accountData || AccountData.emptyAccountData(),
      await NOTESummary.fetchHistory(account.address, graphClient)
    );
  }

  constructor(
    private NOTEBalance: TypedBigNumber,
    private sNOTEBalance: TypedBigNumber,
    private accountData: AccountData,
    public stakedNoteHistory: StakedNoteHistory
  ) {}

  /**
   * @returns Total value of Staked NOTE in NOTE terms.
   */
  public getStakedNoteValue(): TypedBigNumber {
    if (this.sNOTEBalance.isZero()) return TypedBigNumber.fromBalance(0, 'NOTE', false);
    const { ethClaim, noteClaim } = StakedNote.getRedemptionValue(this.sNOTEBalance);
    return ethClaim.toInternalPrecision().fromETH(NOTE_CURRENCY_ID, false).add(noteClaim);
  }

  /**
   * @returns Total NOTE value of sNOTE, NOTE and unclaimed NOTE.
   */
  public getTotalNoteValue(): TypedBigNumber {
    const { unclaimedNOTE } = this.getUnclaimedNOTE();
    return this.getStakedNoteValue().add(this.NOTEBalance).add(unclaimedNOTE);
  }

  public getReturnsBreakdown(): ReturnsBreakdown[] {
    const returnsBreakdown: ReturnsBreakdown[] = [];

    if (this.sNOTEBalance.isPositive()) {
      const { interestEarned, realizedYield } = this.getStakedNoteReturns();
      returnsBreakdown.push({
        source: 'sNOTE',
        balance: this.sNOTEBalance,
        value: this.getStakedNoteValue(),
        interestEarned,
        realizedYield,
      });
    }

    if (this.NOTEBalance.isPositive()) {
      returnsBreakdown.push({
        source: 'NOTE',
        balance: this.NOTEBalance,
        value: this.NOTEBalance,
      });
    }

    const { unclaimedNOTE, rateOfChangePerSecond } = this.getUnclaimedNOTE();
    if (unclaimedNOTE.isPositive()) {
      returnsBreakdown.push({
        source: 'Unclaimed NOTE',
        balance: unclaimedNOTE,
        value: unclaimedNOTE,
        rateOfChangePerSecond,
      });
    }

    return returnsBreakdown;
  }

  public getTransactionHistory(): TransactionHistory[] {
    return this.stakedNoteHistory.transactions.map((h) => {
      let txnType = 'unknown';
      if (h.sNOTEAmountBefore.lt(h.sNOTEAmountAfter)) {
        txnType = 'Stake NOTE';
      } else if (h.sNOTEAmountBefore.gt(h.sNOTEAmountAfter)) {
        txnType = 'Unstake NOTE';
      }

      return {
        txnType,
        timestampMS: h.blockTime.getTime(),
        transactionHash: h.transactionHash,
        amount: h.sNOTEAmountAfter.sub(h.sNOTEAmountBefore).abs(),
      };
    });
  }

  private getStakedNoteReturns() {
    const currentStakedNoteValue = this.getStakedNoteValue();
    if (currentStakedNoteValue.isZero()) {
      return { interestEarned: undefined, realizedYield: undefined };
    }

    const { ethAmountJoined, ethAmountRedeemed, noteAmountJoined, noteAmountRedeemed } = this.stakedNoteHistory;

    const amountJoinedInNote = ethAmountJoined.fromETH(NOTE_CURRENCY_ID, false).add(noteAmountJoined);
    const amountRedeemedInNote = ethAmountRedeemed.fromETH(NOTE_CURRENCY_ID, false).add(noteAmountRedeemed);

    // If amountJoinedInNote > amountRedeemedInNote then the user has both principal and interest in the token
    // If amountJoinedInNote < amountRedeemedInNote then the user has no principal and only interest in the token

    // If currentStakedNoteValue - netCostBasis > 0 then the user has interest earned
    // If currentStakedNoteValue - netCostBasis < 0 then the user has redeemed all their value

    const netCostBasis = amountJoinedInNote.sub(amountRedeemedInNote);
    const interestEarned = currentStakedNoteValue.sub(netCostBasis);
    let realizedYield: number | undefined;

    if (interestEarned.isNegative()) {
      // It doesn't make sense for interest earned to be negative (since all the FX is done at current rates),
      // so we return undefined here
      return { interestEarned: undefined, realizedYield: undefined };
    }

    if (netCostBasis.isPositive()) {
      // The yield here is calculated as an absolute rate of return (not annualized)
      realizedYield =
        ((currentStakedNoteValue.n.div(netCostBasis.n).toNumber() - INTERNAL_TOKEN_PRECISION) /
          INTERNAL_TOKEN_PRECISION) *
        100;
    }

    return { interestEarned, realizedYield };
  }

  private getUnclaimedNOTE() {
    const startingTime = getNowSeconds();
    const currentUnclaimedNOTE = this.accountData.accountBalances.reduce((note, balance) => {
      if (balance.nTokenBalance?.isPositive()) {
        return note.add(
          NTokenValue.getClaimableIncentives(
            balance.currencyId,
            balance.nTokenBalance,
            balance.lastClaimTime,
            balance.accountIncentiveDebt,
            startingTime
          )
        );
      }
      return note;
    }, TypedBigNumber.fromBalance(0, 'NOTE', false));

    const unclaimedNOTEIn5Min = this.accountData.accountBalances.reduce((note, balance) => {
      if (balance.nTokenBalance?.isPositive()) {
        return note.add(
          NTokenValue.getClaimableIncentives(
            balance.currencyId,
            balance.nTokenBalance,
            balance.lastClaimTime,
            balance.accountIncentiveDebt,
            startingTime + 300
          )
        );
      }
      return note;
    }, TypedBigNumber.fromBalance(0, 'NOTE', false));

    return {
      unclaimedNOTE: currentUnclaimedNOTE,
      rateOfChangePerSecond: unclaimedNOTEIn5Min.sub(currentUnclaimedNOTE).toNumber() / 300,
    };
  }
}
