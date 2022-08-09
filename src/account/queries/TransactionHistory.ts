import { gql } from '@apollo/client/core';

export interface BalanceHistoryResponse {
  id: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  currency: {
    id: string;
  };
  assetCashBalanceBefore: string;
  assetCashBalanceAfter: string;
  assetCashValueUnderlyingBefore: string;
  assetCashValueUnderlyingAfter: string;
  nTokenBalanceBefore: string;
  nTokenBalanceAfter: string;
  nTokenValueUnderlyingBefore: string;
  nTokenValueUnderlyingAfter: string;
  nTokenValueAssetBefore: string;
  nTokenValueAssetAfter: string;
}

export interface TradeHistoryResponse {
  id: string;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
  currency: {
    id: string;
  };
  market: {
    marketIndex: number;
    maturity: number;
    settlementDate: number;
    marketMaturityLengthSeconds: number;
  } | null;
  tradeType: string;
  netAssetCash: string;
  netUnderlyingCash: string;
  netfCash: string;
  netLiquidityTokens: string | null;
  maturity: string;
}

export interface TransactionHistoryResponse {
  trades: TradeHistoryResponse[];
  balanceHistory: BalanceHistoryResponse[];
}

export const TransactionHistoryQuery = gql`
  query getTransactionHistory($id: String!) {
    trades(where: { account: $id }, orderBy: blockNumber, orderDirection: asc) {
      id
      blockNumber
      transactionHash
      timestamp
      currency {
        id
      }
      market {
        marketIndex
        maturity
        settlementDate
        marketMaturityLengthSeconds
      }
      tradeType
      netAssetCash
      netUnderlyingCash
      netfCash
      netLiquidityTokens
      maturity
    }

    balanceHistory(where: { account: $id }, orderBy: blockNumber, orderDirection: asc) {
      id
      blockNumber
      transactionHash
      timestamp
      currency {
        id
      }
      assetCashBalanceBefore
      assetCashBalanceAfter
      assetCashValueUnderlyingBefore
      assetCashValueUnderlyingAfter
      nTokenBalanceBefore
      nTokenBalanceAfter
      nTokenValueUnderlyingBefore
      nTokenValueUnderlyingAfter
      nTokenValueAssetBefore
      nTokenValueAssetAfter
    }
  }
`;
