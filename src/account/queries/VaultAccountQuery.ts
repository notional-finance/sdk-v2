import { gql } from '@apollo/client';

export interface VaultAccountResponse {
  leveragedVaultAccounts: {
    id: string;
    lastUpdateTimestamp: number;
    leveragedVault: {
      vaultAddress: string;
    };
    maturity: number;
    vaultShares: string;
    primaryBorrowfCash: string;
    secondaryBorrowDebtShares: string[2];
  }[];
}

export const VaultAccountQuery = gql`
  query getVaultAccounts($id: String!) {
    leveragedVaultAccounts(where: { account: $id }) {
      id
      lastUpdateTimestamp
      leveragedVault {
        vaultAddress
      }
      maturity
      vaultShares
      primaryBorrowfCash
      secondaryBorrowDebtShares
    }
  }
`;
