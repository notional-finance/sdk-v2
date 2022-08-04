import { BigNumber } from 'ethers';
import { parseUnits } from 'ethers/lib/utils';
import { fetch as crossFetch } from 'cross-fetch';
import TypedBigNumber, { BigNumberType } from '../../libs/TypedBigNumber';

const apiUrl = {
  mainnet: 'https://api.0x.org',
};

export type NETWORKS = keyof typeof apiUrl;
export type SOURCES =
  | '0x'
  | 'Balancer_V2'
  | 'Curve'
  | 'Curve_V2'
  | 'Lido'
  | 'MakerPsm'
  | 'SushiSwap'
  | 'Synthetix'
  | 'Uniswap_V2'
  | 'Uniswap_V3';

interface SwapResponse {
  buyTokenAddress: string;
  sellTokenAddress: string;
  price: string;
  estimatedPriceImpact: string;
  buyAmount: string;
  sellAmount: string;
  sources: {
    name: string;
    proportion: string;
  }[];
  sellTokenToEthRate: string;
  buyTokenToEthRate: string;
}

export interface Estimate {
  price: BigNumber;
  estimatedPriceImpact: BigNumber;
  buyAmount: TypedBigNumber;
  sellAmount: TypedBigNumber;
  sources: {
    name: string;
    proportion: number;
  }[];
}

export interface EstimateResult {
  network: NETWORKS;
  buyTokenAddress: string;
  sellTokenAddress: string;
  estimates: Estimate[];
}

interface Token {
  symbol: string;
  address: string;
  decimals: number;
}

const Tokens: Record<string, Token> = {
  USDC: {
    symbol: 'USDC',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    decimals: 6,
  },
  DAI: {
    symbol: 'DAI',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    decimals: 18,
  },
  ETH: {
    symbol: 'ETH',
    address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    decimals: 18,
  },
};

const RequiredEstimates: Record<NETWORKS, { buyToken: Token; sellToken: Token; sellRanges: number[] }[]> = {
  mainnet: [
    {
      buyToken: Tokens.USDC,
      sellToken: Tokens.DAI,
      sellRanges: [100_000, 10_000_000],
    },
    {
      buyToken: Tokens.DAI,
      sellToken: Tokens.USDC,
      sellRanges: [100_000, 10_000_000],
    },
    {
      buyToken: Tokens.ETH,
      sellToken: Tokens.DAI,
      sellRanges: [100_000, 10_000_000],
    },
  ],
};

const fetchTradingEstimate = async (
  buyToken: Token,
  sellToken: Token,
  sellRanges: number[],
  network: NETWORKS,
  _fetch: any
): Promise<EstimateResult> => {
  const zeroExUrl = apiUrl[network];

  const estimates = (
    await Promise.all(
      sellRanges.map(async (a) => {
        try {
          const sellAmountString = parseUnits(a.toString(), sellToken.decimals).toString();
          const resp = await _fetch(
            `${zeroExUrl}/swap/v1/price?sellToken=${sellToken.address}&buyToken=${buyToken.address}&sellAmount=${sellAmountString}`
          );
          const v: SwapResponse = await resp.json();
          return {
            price: BigNumber.from(Math.floor(Number(v.price) * 1e8)),
            estimatedPriceImpact: BigNumber.from(Math.floor(Number(v.price) * 1e8)),
            buyAmount: TypedBigNumber.from(
              v.buyAmount,
              BigNumberType.ExternalUnderlying,
              buyToken.symbol,
              buyToken.decimals
            ),
            sellAmount: TypedBigNumber.from(
              v.sellAmount,
              BigNumberType.ExternalUnderlying,
              sellToken.symbol,
              sellToken.decimals
            ),
            sources: v.sources
              .map(({ name, proportion }) => ({ name, proportion: Number(proportion) }))
              .filter(({ proportion }) => Number(proportion) > 0),
          };
        } catch (e) {
          console.error(e);
          return undefined;
        }
      })
    )
  )
    .filter((r): r is Estimate => !!r)
    .sort((a, b) => (a.sellAmount.lt(b.sellAmount) ? -1 : 1));

  return {
    network,
    buyTokenAddress: buyToken.address.toLowerCase(),
    sellTokenAddress: sellToken.address.toLowerCase(),
    estimates,
  };
};

export function getTradingEstimates(network: NETWORKS, skipFetchSetup: boolean) {
  const _fetch = skipFetchSetup ? fetch : crossFetch;
  return Promise.all(
    RequiredEstimates[network].map(({ buyToken, sellToken, sellRanges }) =>
      fetchTradingEstimate(buyToken, sellToken, sellRanges, network as NETWORKS, _fetch)
    )
  );
}
