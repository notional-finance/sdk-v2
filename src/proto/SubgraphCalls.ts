import { gql } from '@apollo/client/core';
import { BigNumber } from 'ethers';
import { TokenType } from '..';
import GraphClient from '../GraphClient';

const systemConfigurationQuery = gql`
  {
    currencies {
      id
      tokenAddress
      tokenType
      decimals
      name
      symbol
      underlyingName
      underlyingSymbol
      underlyingDecimals
      underlyingTokenAddress
      hasTransferFee
      ethExchangeRate {
        rateOracle
        rateDecimalPlaces
        mustInvert
        buffer
        haircut
      }
      assetExchangeRate {
        rateAdapterAddress
        underlyingDecimalPlaces
      }
      cashGroup {
        maxMarketIndex
        rateOracleTimeWindowSeconds
        totalFeeBasisPoints
        reserveFeeSharePercent
        debtBufferBasisPoints
        fCashHaircutBasisPoints
        liquidityTokenHaircutsPercent
        rateScalars
      }
      nToken {
        tokenAddress
        name
        symbol
        decimals
        depositShares
        leverageThresholds
        incentiveEmissionRate
        pvHaircutPercentage
      }
      incentiveMigration {
        migrationEmissionRate
        finalIntegralTotalSupply
        migrationTime
      }
    }
  }
`;

interface SystemQueryResult {
  currencies: {
    id: string;
    tokenAddress: string;
    tokenType: string;
    decimals: string;
    name: string;
    symbol: string;
    underlyingName: string | null;
    underlyingSymbol: string | null;
    underlyingDecimals: string | null;
    underlyingTokenAddress: string | null;
    hasTransferFee: boolean;
    ethExchangeRate: {
      rateOracle: string;
      rateDecimalPlaces: number;
      mustInvert: boolean;
      buffer: number;
      haircut: number;
    };
    assetExchangeRate: {
      rateAdapterAddress: string;
      underlyingDecimalPlaces: number;
    } | null;
    cashGroup: {
      maxMarketIndex: number;
      rateOracleTimeWindowSeconds: number;
      totalFeeBasisPoints: number;
      reserveFeeSharePercent: number;
      debtBufferBasisPoints: number;
      fCashHaircutBasisPoints: number;
      liquidityTokenHaircutsPercent: number[];
      rateScalars: number[];
    } | null;
    nToken: {
      tokenAddress: string;
      name: string;
      symbol: string;
      decimals: string;
      depositShares: number[] | null;
      leverageThresholds: number[] | null;
      incentiveEmissionRate: string | null;
      pvHaircutPercentage: number | null;
    } | null;
    incentiveMigration: {
      migrationEmissionRate: string;
      finalIntegralTotalSupply: string;
      migrationTime: string;
    } | null;
  }[];
}

export interface CurrencyConfig {
  currencyId: number;
  tokenAddress: string;
  tokenType: TokenType;
  decimalPlaces: number;
  name: string;
  symbol: string;
  underlyingName: string | null;
  underlyingSymbol: string | null;
  underlyingDecimalPlaces: number | null;
  underlyingTokenAddress: string | null;
  hasTransferFee: boolean;
  ethExchangeRate: {
    rateOracle: string;
    rateDecimalPlaces: number;
    mustInvert: boolean;
    buffer: number;
    haircut: number;
  };
  assetExchangeRate: {
    rateAdapterAddress: string;
    underlyingDecimalPlaces: number;
  } | null;
  cashGroup: {
    maxMarketIndex: number;
    rateOracleTimeWindowSeconds: number;
    totalFeeBasisPoints: number;
    reserveFeeSharePercent: number;
    debtBufferBasisPoints: number;
    fCashHaircutBasisPoints: number;
    liquidityTokenHaircutsPercent: number[];
    rateScalars: number[];
  } | null;
  nToken: {
    tokenAddress: string;
    name: string;
    symbol: string;
    depositShares: number[] | null;
    leverageThresholds: number[] | null;
    incentiveEmissionRate: BigNumber | null;
    pvHaircutPercentage: number | null;
  } | null;
  incentiveMigration: {
    migrationEmissionRate: BigNumber;
    finalIntegralTotalSupply: BigNumber;
    migrationTime: BigNumber;
  } | null;
}

export async function getSystemConfig(graphClient: GraphClient): Promise<CurrencyConfig[]> {
  const data = await graphClient.queryOrThrow<SystemQueryResult>(systemConfigurationQuery);
  return data.currencies
    .slice()
    .sort((a, b) => Number(a.id) - Number(b.id))
    .map((c) => {
      return {
        ...c,
        currencyId: Number(c.id),
        tokenType: c.tokenType as TokenType,
        decimalPlaces: Math.log10(Number(c.decimals)),
        underlyingDecimalPlaces: Math.log10(Number(c.underlyingDecimals ?? 1)),
        nToken: {
          ...c.nToken,
          incentiveEmissionRate: BigNumber.from(c.nToken?.incentiveEmissionRate || 0),
        },
        incentiveMigration: c.incentiveMigration
          ? {
              emissionRate: BigNumber.from(c.incentiveMigration.migrationEmissionRate),
              integralTotalSupply: BigNumber.from(c.incentiveMigration.finalIntegralTotalSupply),
              migrationTime: BigNumber.from(c.incentiveMigration.migrationTime).toNumber(),
            }
          : null,
      } as CurrencyConfig;
    });
}
