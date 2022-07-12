import { BigNumber } from 'ethers';
import { fetch as crossFetch } from 'cross-fetch';
import EventEmitter from 'eventemitter3';
import { IAggregator } from '../typechain/IAggregator';
import { System } from '.';
import { SystemEvents } from '..';

// This uses a hardcoded price for the NOTE token, in the future we will upgrade this to get the
// price from some other price oracle
export default class NoteETHRateProvider {
  private coinGeckoURL = 'https://api.coingecko.com/api/v3/coins/notional-finance/market_chart?vs_currency=usd&days=1';

  private _noteUSDPrice: BigNumber = BigNumber.from(0);

  private noteRefreshInterval?: NodeJS.Timeout;

  private fetch: any;

  get noteUSDPrice() {
    return this._noteUSDPrice;
  }

  constructor(
    price?: BigNumber,
    refreshOpts?: {
      notePriceRefreshIntervalMS: number;
      eventEmitter: EventEmitter;
    },
    skipFetchSetup = false
  ) {
    if (price) {
      this._noteUSDPrice = price;
    } else if (refreshOpts) {
      // Fetch price initially immediately
      setTimeout(async () => {
        await this.fetchUSDPrice();
      });

      const { notePriceRefreshIntervalMS, eventEmitter } = refreshOpts;
      // Interval will update on the refresh cycle
      this.noteRefreshInterval = setInterval(async () => {
        await this.fetchUSDPrice();
        eventEmitter.emit(SystemEvents.NOTE_PRICE_UPDATE);
      }, notePriceRefreshIntervalMS);
    }

    if (skipFetchSetup) {
      this.fetch = fetch;
    } else {
      this.fetch = crossFetch;
    }
  }

  public destroy() {
    if (this.noteRefreshInterval) clearInterval(this.noteRefreshInterval);
  }

  private async fetchUSDPrice() {
    try {
      const resp = (await (await this.fetch(this.coinGeckoURL)).json()) as { prices: [number, number][] };
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

      // Convert USD Price to BigNumber in 18 decimals, uses the first 8 decimals of the avgUSDPrice,
      // using 18 decimals will overflow in javascript math
      this._noteUSDPrice = BigNumber.from(Math.floor(avgUSDPrice * 10 ** 8)).mul(10 ** 10);
    } catch (e) {
      console.error(e);
    }
  }

  public getETHRate() {
    const USDC = 3;
    // This will throw an error of system is not initialized
    const system = System.getSystem();
    // Use USD as a basis for the NOTE price
    const { rateDecimalPlaces, latestRate } = system.getETHRate(USDC);
    const ethRateConfig = {
      rateOracle: null as unknown as IAggregator,
      rateDecimalPlaces: rateDecimalPlaces || 18,
      mustInvert: false,
      buffer: 100,
      haircut: 100,
    };

    const rateDecimals = BigNumber.from(10).pow(rateDecimalPlaces);
    return {
      ethRateConfig,
      ethRate: BigNumber.from(latestRate.mul(this.noteUSDPrice).div(rateDecimals)),
    };
  }
}
