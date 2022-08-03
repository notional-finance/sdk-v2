import { BigNumber } from 'ethers';
import { parseEther } from 'ethers/lib/utils';
import { fetch as crossFetch } from 'cross-fetch';

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
  buyAmount: BigNumber;
  sellAmount: BigNumber;
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

const RequiredEstimates = {
  mainnet: [
    {
      // USDC
      buyToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      // DAI
      sellToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
      // 100_000, 10_000_000
      sellRanges: [parseEther('100000'), parseEther('10000000')],
    },
  ],
};

const fetchTradingEstimate = async (
  buyToken: string,
  sellToken: string,
  sellRanges: BigNumber[],
  network: NETWORKS,
  _fetch: any
): Promise<EstimateResult> => {
  const zeroExUrl = apiUrl[network];

  const estimates = (
    await Promise.all(
      sellRanges.map(async (a) => {
        try {
          console.log('fetching once');
          const resp = await _fetch(
            `${zeroExUrl}/swap/v1/price?sellToken=${sellToken}&buyToken=${buyToken}&sellAmount=${a.toString()}`
          );
          const v: SwapResponse = await resp.json();
          return {
            price: BigNumber.from(Math.floor(Number(v.price) * 1e8)),
            estimatedPriceImpact: BigNumber.from(Math.floor(Number(v.price) * 1e8)),
            buyAmount: BigNumber.from(v.buyAmount),
            sellAmount: BigNumber.from(v.sellAmount),
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
  ).filter((r): r is Estimate => !!r);

  return {
    network,
    buyTokenAddress: buyToken,
    sellTokenAddress: sellToken,
    estimates,
  };
};

export function getTradingEstimates(network: string, skipFetchSetup: boolean) {
  const _fetch = skipFetchSetup ? fetch : crossFetch;
  return Promise.all<EstimateResult[]>(
    RequiredEstimates[network].map(({ buyToken, sellToken, sellRanges }) =>
      fetchTradingEstimate(buyToken, sellToken, sellRanges, network as NETWORKS, _fetch)
    )
  );
}
