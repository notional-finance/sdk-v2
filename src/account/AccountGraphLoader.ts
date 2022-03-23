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
import BalanceSummary from './BalanceSummary';
import AssetSummary from './AssetSummary';

const accountsQuery = gql`
  query batchQuery($pageSize: Int!, $lastID: String) {
    batch: accounts(
      first: $pageSize,
      where: { id_gt: $lastID },
      orderBy: id, orderDirection: asc
    ) {
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
        accountIncentiveDebt
        didMigrateIncentives
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

const accountQuery = gql`
  query getAccount($id: String!) {
    account(id: $id) {
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
        accountIncentiveDebt
        didMigrateIncentives
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
  maturity: string;
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
  accountIncentiveDebt: string;
  didMigrateIncentives: boolean;
}

interface AccountResponse {
  id: string;
  nextSettleTime: number;
  hasCashDebt: boolean;
  hasPortfolioAssetDebt: boolean;
  assetBitmapCurrency: {
    id: string;
  } | null;
  balances: BalanceResponse[];
  portfolio: AssetResponse[];
}

type AccountQueryResponse = {account: AccountResponse};

export default class AccountGraphLoader {
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
    const accountIncentiveDebt = balance.didMigrateIncentives
      ? BigNumber.from(balance.accountIncentiveDebt)
      : BigNumber.from(balance.lastClaimIntegralSupply);

    return {
      currencyId,
      cashBalance,
      nTokenBalance,
      lastClaimTime,
      accountIncentiveDebt,
    };
  }

  private static parseAsset(asset: AssetResponse) {
    const currencyId = Number(asset.currency.id);
    const maturity = Number(asset.maturity);
    const assetType = asset.assetType as AssetType;
    const currency = System.getSystem().getCurrencyById(currencyId);

    if (!currency || !currency.underlyingSymbol) {
      throw Error(`Invalid currency ${currencyId}.`);
    }

    const notional = assetType === AssetType.fCash
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
   * Loads multiple accounts in a single query.
   *
   * @param graphClient
   * @param pageSize
   * @param pageNumber
   * @returns
   */
  public static async loadBatch(graphClient: GraphClient) {
    const response = await graphClient.batchQuery(accountsQuery) as AccountResponse[];
    const accounts = new Map<string, AccountData>();
    await Promise.all(response.map(async (account) => {
      const accountData = await AccountData.load(
        account.nextSettleTime,
        account.hasCashDebt,
        account.hasPortfolioAssetDebt,
        account.assetBitmapCurrency?.id ? Number(account.assetBitmapCurrency.id) : undefined,
        account.balances.map(AccountGraphLoader.parseBalance),
        account.portfolio.map(AccountGraphLoader.parseAsset),
      );
      return accounts.set(account.id, accountData);
    }));
    return accounts;
  }

  /**
   * Returns a summary of an account's balances with historical transactions and internal return rate
   */
  public static async getBalanceSummary(address: string, accountData: AccountData, graphClient: GraphClient) {
    const balanceHistory = await BalanceSummary.fetchBalanceHistory(address, graphClient);
    const balanceSummary = BalanceSummary.build(accountData, balanceHistory);
    return {balanceHistory, balanceSummary};
  }

  /**
   * Returns the tradeHistory and assetSummary for an account
   */
  public static async getAssetSummary(address: string, accountData: AccountData, graphClient: GraphClient) {
    const tradeHistory = await AssetSummary.fetchTradeHistory(address, graphClient);
    const assetSummary = AssetSummary.build(accountData, tradeHistory);
    return {tradeHistory, assetSummary};
  }

  /**
   * Loads a single account
   * @param graphClient
   * @param address
   * @returns AccountData instance for requested account
   */
  public static async load(graphClient: GraphClient, address: string) {
    const lowerCaseAddress = address.toLowerCase(); // Account id in subgraph is in lower case.
    const {account} = await graphClient.queryOrThrow<AccountQueryResponse>(accountQuery, {id: lowerCaseAddress});

    const balances = account.balances.map(AccountGraphLoader.parseBalance);
    const portfolio = account.portfolio.map(AccountGraphLoader.parseAsset);

    return AccountData.load(
      account.nextSettleTime,
      account.hasCashDebt,
      account.hasPortfolioAssetDebt,
      account.assetBitmapCurrency?.id ? Number(account.assetBitmapCurrency?.id) : undefined,
      balances,
      portfolio,
    );
  }
}
