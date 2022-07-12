import { BigNumber, ethers } from 'ethers';
import { fetch as crossFetch } from 'cross-fetch';

const NOTE_PRICE_URL = 'https://api.coingecko.com/api/v3/coins/notional-finance/market_chart?vs_currency=usd&days=1';
const EXCHANGE_RATE_API = 'https://v6.exchangerate-api.com/v6/a68cdd30d4083fe1be69a4d4/latest/USD';
const SUPPORTED_RATES = ['EUR', 'JPY', 'CNY'];

// Converts a decimal value to Wei BigNumber
function convertToWei(val: number) {
  // Convert USD Price to BigNumber in 18 decimals, uses the first 8 decimals of the
  // avgUSDPrice, using 18 decimals will overflow in javascript math
  return BigNumber.from(Math.floor(val * 10 ** 8))
    .mul(ethers.constants.WeiPerEther)
    .div(10 ** 8);
}

async function getExchangeRateData(symbols: string[], _fetch: any) {
  const resp = await (await _fetch(EXCHANGE_RATE_API)).json();
  return symbols.reduce((obj, s) => {
    const ret = obj;
    if (resp.conversion_rates[s]) {
      ret[s] = convertToWei(resp.conversion_rates[s]);
    }
    return ret;
  }, {});
}

// Returns the 24 hour avg of the USD price
async function getCoingeckoUSDPrice(url: string, _fetch: any) {
  const resp = (await (await _fetch(url)).json()) as { prices: [number, number][] };
  const sortedPrices: Array<[number, number]> = resp.prices.sort(([a], [b]) => a - b);
  let avgUSDPrice: number;
  if (sortedPrices.length === 1) {
    // eslint-disable-next-line prefer-destructuring
    [, avgUSDPrice] = sortedPrices[0];
  } else {
    const timeRange = sortedPrices[sortedPrices.length - 1][0] - sortedPrices[0][0];

    // Gets a weighted average of the price
    avgUSDPrice =
      sortedPrices.reduce((weightedNum, [time, price], i) => {
        // Reached end of list, don't use price
        if (i === sortedPrices.length - 1) return weightedNum;
        return weightedNum + (sortedPrices[i + 1][0] - time) * price;
      }, 0) / timeRange;
  }

  return convertToWei(avgUSDPrice);
}

export default async function getUSDPriceData(skipFetchSetup: boolean): Promise<Record<string, BigNumber>> {
  const _fetch = skipFetchSetup ? fetch : crossFetch;
  const NOTE = await getCoingeckoUSDPrice(NOTE_PRICE_URL, _fetch);
  const EX_RATES = await getExchangeRateData(SUPPORTED_RATES, _fetch);
  return {
    NOTE,
    ...EX_RATES,
  };
}
