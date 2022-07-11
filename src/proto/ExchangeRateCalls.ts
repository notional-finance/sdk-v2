import { BigNumber, ethers } from 'ethers';

const NOTE_PRICE_URL = 'https://api.coingecko.com/api/v3/coins/notional-finance/market_chart?vs_currency=usd&days=1';
const EXCHANGE_RATE_API = 'https://v6.exchangerate-api.com/v6/a68cdd30d4083fe1be69a4d4/latest/USD';
const SUPPORTED_RATES = ['EUR', 'JPY', 'CNY'];

export async function getUSDPriceData(): Promise<Record<string, BigNumber>> {
  const NOTE = await getCoingeckoUSDPrice(NOTE_PRICE_URL);
  const EX_RATES = await getExchangeRateData(SUPPORTED_RATES);
  return {
    NOTE: NOTE,
    ...EX_RATES,
  };
}

// Converts a decimal value to Wei BigNumber
function convertToWei(val: number) {
  // Convert USD Price to BigNumber in 18 decimals, uses the first 8 decimals of the
  // avgUSDPrice, using 18 decimals will overflow in javascript math
  return BigNumber.from(Math.floor(val * 10 ** 8))
    .mul(ethers.constants.WeiPerEther)
    .div(10 ** 8);
}

async function getExchangeRateData(symbols: string[]) {
  const resp = await (await fetch(EXCHANGE_RATE_API)).json();
  return symbols.reduce((obj, s) => {
    if (resp.conversion_rates[s]) {
      obj[s] = convertToWei(resp.conversion_rates[s]);
    }
    return obj;
  }, {});
}

// Returns the 24 hour avg of the USD price
async function getCoingeckoUSDPrice(url: string) {
  try {
    const resp = (await (await fetch(url)).json()) as { prices: [number, number][] };
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
  } catch (e) {
    throw e;
  }
}
