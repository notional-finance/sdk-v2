import {BigNumber, ethers} from 'ethers';
import {TypedBigNumber, BigNumberType} from '../../src';
import {SECONDS_IN_YEAR} from '../../src/config/constants';
import {getNowSeconds} from '../../src/libs/utils';
import {Market, CashGroup} from '../../src/system';
import Blockchain from '../../src/system/datasource/Blockchain';

export default class MockCache extends Blockchain {
  async refreshData() {
    this.ethRates.forEach((_, k) => {
      if (k === 1) {
        this.ethRateData.set(k, BigNumber.from(ethers.constants.WeiPerEther));
      } else {
        const r = BigNumber.from(ethers.constants.WeiPerEther).div(100);
        this.ethRateData.set(k, r);
      }
    });

    this.assetRate.forEach((a, k) => {
      if (a.rateAdapter.address === ethers.constants.AddressZero) return;
      // Uses static call to get a more accurate value
      let r: BigNumber;
      if (k === 1 || k === 2) {
        r = BigNumber.from('200000000000000000000000000');
      } else if (k === 3 || k === 4) {
        r = BigNumber.from('200000000000000');
      } else {
        r = BigNumber.from('20000000000000000');
      }
      this.assetRateData.set(k, r);

      const supplyRate = BigNumber.from(0.05e9);
      this.cashGroups.get(k)!.setBlockSupplyRate(supplyRate);
    });

    /* eslint-disable @typescript-eslint/no-unused-vars */
    this.nTokens.forEach((_, k) => {
      const {symbol} = this.currencies.get(k)!;
      const nTokenSymbol = this.nTokens.get(k)?.symbol;
      if (nTokenSymbol) {
        const pv = TypedBigNumber.from(ethers.constants.WeiPerEther, BigNumberType.InternalAsset, symbol);
        const supply = TypedBigNumber.from(
          ethers.constants.WeiPerEther.mul(2),
          BigNumberType.nToken,
          nTokenSymbol,
        );
        this.nTokenAssetCashPV.set(k, pv);
        this.nTokenTotalSupply.set(k, supply);
        this.nTokenIncentiveFactors.set(k, {
          integralTotalSupply: BigNumber.from(0),
          lastSupplyChangeTime: BigNumber.from(getNowSeconds() - SECONDS_IN_YEAR),
        });
        this.nTokenCashBalance.set(k, pv);
        this.nTokenLiquidityTokens.set(k, []);
        this.nTokenfCash.set(k, []);
      }
    });

    this.cashGroups.forEach((c, k) => {
      const lastImpliedRate = BigNumber.from(0.1e9);
      const oracleRate = BigNumber.from(0.09e9);
      const v = {
        totalAssetCash: BigNumber.from(5000e8),
        totalLiquidity: BigNumber.from(5000e8),
        totalfCash: BigNumber.from(100e8),
        previousTradeTime: BigNumber.from(getNowSeconds() - 60 * 5),
        lastImpliedRate,
        oracleRate,
      };
      const markets = new Array<Market>();
      const tRef = CashGroup.getTimeReference(getNowSeconds());
      const currency = this.currencies.get(k)!;

      for (let i = 1; i <= 2; i += 1) {
        const market = new Market(
          1,
          i,
          CashGroup.getMaturityForMarketIndex(i, tRef),
          c.rateScalars[i - 1],
          c.totalFeeBasisPoints,
          c.reserveFeeSharePercent,
          c.rateOracleTimeWindowSeconds,
          currency.symbol,
          currency.underlyingSymbol || currency.symbol,
        );

        market.setMarket(v);
        markets.push(market);
      }
      // eslint-disable-next-line no-param-reassign
      c.markets = markets;
    });
    /* eslint-enable @typescript-eslint/no-unused-vars */
  }
}
