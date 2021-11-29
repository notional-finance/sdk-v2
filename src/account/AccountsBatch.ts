// prettier-ignore
import {
  BigNumber,
} from 'ethers';
import {gql} from '@apollo/client/core';

import {CashGroup, System} from '../system';
import GraphClient from '../GraphClient';
import TypedBigNumber, {BigNumberType} from '../libs/TypedBigNumber';
import {getNowSeconds} from '../libs/utils';
import AccountData from './AccountData';
import {AssetType} from '../libs/types';

const accountsQuery = gql`
  query getAccounts($pageSize: Int!, $pageNumber: Int!) {
    accounts(first: $pageSize, skip: $pageNumber) {
      id
      nextSettleTime
      hasCashDebt
      hasPortfolioAssetDebt
      assetBitmapCurrency {
        id
      }
      balances {
        currency {
          id
          symbol
        }
        assetCashBalance
        nTokenBalance
        lastClaimTime
        lastClaimIntegralSupply
      }
      portfolio {
        currency {
          id
          symbol
        }
        settlementDate
        maturity
        assetType
        notional
      }
    }
  }
`;

interface AssetResponse {
  currency: {
    id: string;
    symbol: string;
  };
  settlementDate: string;
  maturity: number;
  assetType: string;
  notional: number;
}

interface BalanceResponse {
  currency: {
    id: string;
    symbol: string;
  };
  assetCashBalance: string;
  nTokenBalance: string;
  lastClaimTime: number;
  lastClaimIntegralSupply: string;
}

interface AccountsQueryResponse {
  accounts: {
    id: string;
    nextSettleTime: number;
    hasCashDebt: boolean;
    hasPortfolioAssetDebt: boolean;
    assetBitmapCurrency: {
      id: string;
    } | null;
    balances: BalanceResponse[];
    portfolio: AssetResponse[];
  }[];
}

export default class AccountsBatch {
  public static parseBalance(balance: BalanceResponse) {
    const currencyId = Number(balance.currency.id);
    const currency = System.getSystem().getCurrencyById(currencyId);

    if (!currency) {
      throw Error(`Currency ${currencyId} cannot be found.`);
    }

    if (!currency.nTokenSymbol) {
      throw Error(`Currency ${currencyId} does not have a nToken.`);
    }

    const cashBalance = TypedBigNumber.fromBalance(balance.assetCashBalance, currency.symbol, true);
    const nTokenBalance = TypedBigNumber.fromBalance(balance.nTokenBalance, currency.nTokenSymbol, true);
    const lastClaimTime = BigNumber.from(balance.lastClaimTime);
    const lastClaimIntegralSupply = BigNumber.from(balance.lastClaimIntegralSupply);

    return {
      currencyId,
      cashBalance,
      nTokenBalance,
      lastClaimTime,
      lastClaimIntegralSupply,
    };
  }

  static parseAsset(asset: AssetResponse) {
    const currencyId = Number(asset.currency.id);
    const {maturity} = asset;
    const assetType = asset.assetType as AssetType;
    const currency = System.getSystem().getCurrencyById(currencyId);

    if (!currency || !currency.underlyingSymbol) {
      throw Error(`Invalid currency ${currencyId}.`);
    }

    const notional =
      assetType === AssetType.fCash
        ? TypedBigNumber.from(asset.notional, BigNumberType.InternalUnderlying, currency.underlyingSymbol)
        : TypedBigNumber.from(asset.notional, BigNumberType.LiquidityToken, currency.symbol);

    const hasMatured = maturity < getNowSeconds();
    const settlementDate = Number(asset.settlementDate);
    const isIdiosyncratic = CashGroup.isIdiosyncratic(maturity);
    return {
      currencyId,
      maturity,
      assetType,
      notional,
      hasMatured,
      settlementDate,
      isIdiosyncratic,
    };
  }

  /**
   * Loads an account object
   *
   * @param signer
   * @param provider
   * @param system
   * @returns
   */
  public static async load(graphClient: GraphClient, pageSize: number, pageNumber: number) {
    const response = await graphClient.queryOrThrow<AccountsQueryResponse>(accountsQuery, {pageSize, pageNumber});
    const accounts = new Map<string, AccountData>();
    response.accounts.forEach(async (account) => {
      // Ideally, all settlement rates and markets that may be concerned by these accounts would be pre-loaded
      // and these Promises could be avoided. Optimization will be needed once there are many settled markets.
      // eslint-disable-next-line no-await-in-loop
      const accountData = await AccountData.load(
        account.nextSettleTime,
        account.hasCashDebt,
        account.hasPortfolioAssetDebt,
        Number(account.assetBitmapCurrency?.id),
        account.balances.map(AccountsBatch.parseBalance),
        account.portfolio.map(AccountsBatch.parseAsset),
      );
      accounts.set(account.id, accountData);
    });
    return accounts;
  }
}
