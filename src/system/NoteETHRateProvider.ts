import {BigNumber} from 'ethers';
import {IAggregator} from '../typechain/IAggregator';
import System from './System';

// This uses a hardcoded price for the NOTE token, in the future we will upgrade this to get the
// price from some other price oracle
export default class NoteETHRateProvider {
  public getETHRate() {
    const USDC = 3;
    // This will throw an error of system is not initialized
    const system = System.getSystem();
    // Use USD as a basis for the NOTE price
    const {ethRateConfig: usdcRateConfig, ethRate: usdcETHRate} = system.getETHRate(USDC);
    const ethRateConfig = {
      rateOracle: null as unknown as IAggregator,
      rateDecimalPlaces: usdcRateConfig?.rateDecimalPlaces || 18,
      mustInvert: false,
      buffer: 100,
      haircut: 100,
    };

    if (!usdcETHRate || !usdcRateConfig) {
      return {ethRateConfig, ethRate: BigNumber.from(0)};
    }

    const rateDecimals = BigNumber.from(10).pow(usdcRateConfig.rateDecimalPlaces);
    // $1.75 in 18 decimal precision (rate precision)
    const notePriceUSD = BigNumber.from(175).mul(rateDecimals).div(100);

    return {
      ethRateConfig,
      ethRate: BigNumber.from(usdcETHRate.mul(notePriceUSD).div(rateDecimals)),
    };
  }
}
