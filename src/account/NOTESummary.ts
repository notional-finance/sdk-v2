import {gql} from '@apollo/client/core';
import {BigNumber} from 'ethers';
import {ReturnsBreakdown, TransactionHistory, TypedBigNumber} from '..';
import {INTERNAL_TOKEN_PRECISION, NOTE_CURRENCY_ID} from '../config/constants';
import GraphClient from '../GraphClient';
import {getNowSeconds} from '../libs/utils';
import {StakedNote} from '../staking';
import {NTokenValue} from '../system';
import Account from './Account';
import AccountData from './AccountData';

interface StakedNoteHistoryQueryResult {
  stakedNoteChanges: {
    id: string;
    blockNumber: number;
    transactionHash: string;
    timestamp: number;
    sNOTEAmountBefore: string;
    sNOTEAmountAfter: string;
    bptClaimBefore: string;
    bptClaimAfter: string;
    wethAmountBefore: string;
    wethAmountAfter: string;
    noteAmountBefore: string;
    noteAmountAfter: string;
  }[];
}

interface StakedNoteHistory {
  id: string;
  blockNumber: number;
  transactionHash: string;
  blockTime: Date;
  sNOTEAmountBefore: TypedBigNumber;
  sNOTEAmountAfter: TypedBigNumber;
  bptClaimBefore: BigNumber;
  bptClaimAfter: BigNumber;
  wethAmountBefore: TypedBigNumber;
  wethAmountAfter: TypedBigNumber;
  noteAmountBefore: TypedBigNumber;
  noteAmountAfter: TypedBigNumber;
}

export default class NOTESummary {
  private static historyQuery(address: string) {
    return gql`{
        stakedNoteChanges (
          where: {account: "${address.toLowerCase()}"},
          orderBy: blockNumber,
          orderDirection: asc
        ) {
        id
        blockNumber
        transactionHash
        timestamp
        sNOTEAmountBefore
        sNOTEAmountAfter
        bptClaimBefore
        bptClaimAfter
        wethAmountBefore
        wethAmountAfter
        noteAmountBefore
        noteAmountAfter
      }
    }`;
  }

  public static async fetchHistory(address: string, graphClient: GraphClient): Promise<StakedNoteHistory[]> {
    const queryResult = await graphClient.queryOrThrow<StakedNoteHistoryQueryResult>(NOTESummary.historyQuery(address));

    return queryResult.stakedNoteChanges.map((r) => ({
      id: r.id,
      blockNumber: r.blockNumber,
      transactionHash: r.transactionHash,
      blockTime: new Date(r.timestamp * 1000),
      sNOTEAmountBefore: TypedBigNumber.fromBalance(r.sNOTEAmountBefore, 'sNOTE', false),
      sNOTEAmountAfter: TypedBigNumber.fromBalance(r.sNOTEAmountAfter, 'sNOTE', false),
      wethAmountBefore: TypedBigNumber.fromBalance(r.wethAmountBefore, 'WETH', false),
      wethAmountAfter: TypedBigNumber.fromBalance(r.wethAmountAfter, 'WETH', false),
      noteAmountBefore: TypedBigNumber.fromBalance(r.noteAmountBefore, 'NOTE', false),
      noteAmountAfter: TypedBigNumber.fromBalance(r.noteAmountAfter, 'NOTE', false),
      bptClaimBefore: BigNumber.from(r.bptClaimBefore),
      bptClaimAfter: BigNumber.from(r.bptClaimAfter),
    }));
  }

  public static async build(account: Account, graphClient: GraphClient) {
    return new NOTESummary(
      account.walletBalanceBySymbol('NOTE')?.balance || TypedBigNumber.fromBalance(0, 'NOTE', false),
      account.walletBalanceBySymbol('sNOTE')?.balance || TypedBigNumber.fromBalance(0, 'sNOTE', false),
      account.accountData || AccountData.emptyAccountData(),
      await NOTESummary.fetchHistory(account.address, graphClient),
    );
  }

  constructor(
    private NOTEBalance: TypedBigNumber,
    private sNOTEBalance: TypedBigNumber,
    private accountData: AccountData,
    public stakedNoteHistory: StakedNoteHistory[],
  ) {}

  /**
   * @returns Total value of Staked NOTE in NOTE terms.
   */
  public getStakedNoteValue(): TypedBigNumber {
    const {ethClaim, noteClaim} = StakedNote.getRedemptionValue(this.sNOTEBalance);
    return ethClaim.toInternalPrecision().fromETH(NOTE_CURRENCY_ID, false).add(noteClaim);
  }

  /**
   * @returns Total NOTE value of sNOTE, NOTE and unclaimed NOTE.
   */
  public getTotalNoteValue(): TypedBigNumber {
    const {unclaimedNOTE} = this.getUnclaimedNOTE();
    return this.getStakedNoteValue().add(this.NOTEBalance).add(unclaimedNOTE);
  }

  public getReturnsSummary(): ReturnsBreakdown[] {
    const returnsBreakdown: ReturnsBreakdown[] = [];

    if (this.sNOTEBalance.isPositive()) {
      const {interestEarned, realizedYield} = this.getStakedNoteReturns();
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

    const {unclaimedNOTE, rateOfChangePerSecond} = this.getUnclaimedNOTE();
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

  public getTradeHistory(): TransactionHistory[] {
    return this.stakedNoteHistory.map((h) => {
      let txnType: string = 'unknown';
      if (h.sNOTEAmountBefore.lt(h.sNOTEAmountAfter)) {
        txnType = 'Stake NOTE';
      } else if (h.sNOTEAmountBefore.gt(h.sNOTEAmountAfter)) {
        txnType = 'Unstake NOTE';
      }

      return {
        txnType,
        time: h.blockTime,
        transactionHash: h.transactionHash,
        amount: h.sNOTEAmountAfter.sub(h.sNOTEAmountBefore).abs(),
      };
    });
  }

  private getStakedNoteReturns() {
    const currentStakedNoteValue = this.getStakedNoteValue();
    // prettier-ignore
    const totalETHJoined = this.stakedNoteHistory
    // prettier-ignore
      .reduce((v, {wethAmountBefore, wethAmountAfter}) => v.add(wethAmountAfter.sub(wethAmountBefore)),
        TypedBigNumber.fromBalance(0, 'WETH', false));
    // prettier-ignore
    const totalNOTEJoined = this.stakedNoteHistory
    // prettier-ignore
      .reduce((v, {noteAmountBefore, noteAmountAfter}) => v.add(noteAmountAfter.sub(noteAmountBefore)),
        TypedBigNumber.fromBalance(0, 'NOTE', false));

    const noteAmountJoined = totalETHJoined.fromETH(NOTE_CURRENCY_ID, false).add(totalNOTEJoined);
    const interestEarned = currentStakedNoteValue.sub(noteAmountJoined);

    // The yield here is calculated as an absolute rate of return (not annualized)
    const realizedYield = ((currentStakedNoteValue.n.div(noteAmountJoined.n).toNumber() - INTERNAL_TOKEN_PRECISION)
        / INTERNAL_TOKEN_PRECISION)
      * 100;

    return {interestEarned, realizedYield};
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
            startingTime,
          ),
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
            startingTime + 300,
          ),
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
