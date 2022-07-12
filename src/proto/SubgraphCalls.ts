import { gql } from '@apollo/client/core';
import { BigNumber } from 'ethers';
import { TokenType } from '..';
import GraphClient from '../GraphClient';
import { SerializedContract } from './SystemProto';

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
  id: number;
  assetName: string;
  assetSymbol: string;
  assetContract: SerializedContract;
  assetDecimals: BigNumber;
  assetDecimalPlaces: number;
  tokenType: TokenType;
  underlyingName: string | null;
  underlyingSymbol: string | null;
  underlyingDecimalPlaces: number | null;
  underlyingContract: SerializedContract | null;
  hasTransferFee: boolean;
  nTokenSymbol: string | null;
  ethExchangeRate: {
    rateOracle: SerializedContract;
    rateDecimalPlaces: number;
    mustInvert: boolean;
    buffer: number;
    haircut: number;
  };
  assetExchangeRate: {
    rateAdapter: SerializedContract;
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
    contract: SerializedContract;
    name: string;
    nTokenSymbol: string;
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
    .map(
      (c) =>
        ({
          ...c,
          id: Number(c.id),
          assetName: c.name,
          assetSymbol: c.symbol,
          assetDecimals: BigNumber.from(c.decimals),
          assetDecimalPlaces: Math.log10(Number(c.decimals)),
          assetContract: {
            _isSerializedContract: true,
            _address: c.tokenAddress,
            _abiName: 'ERC20',
          },
          tokenType: c.tokenType as TokenType,
          underlyingDecimals: c.underlyingDecimals ? BigNumber.from(c.underlyingDecimals) : undefined,
          underlyingDecimalPlaces: Math.log10(Number(c.underlyingDecimals ?? 1)),
          underlyingContract: c.underlyingTokenAddress
            ? {
                _isSerializedContract: true,
                _address: c.underlyingTokenAddress,
                _abiName: 'ERC20',
              }
            : {
                _isSerializedContract: false,
              },
          nTokenSymbol: c.nToken?.symbol,
          nToken: {
            ...c.nToken,
            contract: {
              _isSerializedContract: true,
              _address: c.nToken?.tokenAddress,
              _abiName: 'nTokenERC20',
            },
            nTokenSymbol: c.nToken?.symbol,
            incentiveEmissionRate: BigNumber.from(c.nToken?.incentiveEmissionRate || 0),
          },
          incentiveMigration: c.incentiveMigration
            ? {
                emissionRate: BigNumber.from(c.incentiveMigration.migrationEmissionRate),
                integralTotalSupply: BigNumber.from(c.incentiveMigration.finalIntegralTotalSupply),
                migrationTime: BigNumber.from(c.incentiveMigration.migrationTime).toNumber(),
              }
            : null,
          ethExchangeRate: {
            ...c.ethExchangeRate,
            rateOracle: {
              _isSerializedContract: true,
              _address: c.ethExchangeRate.rateOracle,
              _abiName: 'IAggregator',
            },
          },
          assetExchangeRate: c.assetExchangeRate
            ? {
                ...c.assetExchangeRate,
                rateAdapter: {
                  _isSerializedContract: true,
                  _address: c.assetExchangeRate?.rateAdapterAddress,
                  _abiName: 'AssetRateAggregator',
                },
              }
            : null,
        } as CurrencyConfig)
    );
}
