import {assetTypeNum, getNowSeconds} from '../libs/utils';
import {AssetType} from '../libs/types';
import {
  PERCENTAGE_BASIS, RATE_PRECISION, SECONDS_IN_QUARTER, SECONDS_IN_YEAR,
} from '../config/constants';
import {Market} from '.';
import TypedBigNumber from '../libs/TypedBigNumber';

export default class CashGroup {
  private _blockSupplyRate?: number;

  public get blockSupplyRate() {
    return this._blockSupplyRate;
  }

  public getMarket(marketIndex: number): Market {
    return this.markets[marketIndex - 1];
  }

  public setBlockSupplyRate(rate: number | undefined) {
    this._blockSupplyRate = rate;
  }

  constructor(
    public maxMarketIndex: number,
    public rateOracleTimeWindowSeconds: number,
    public totalFeeBasisPoints: number,
    public reserveFeeSharePercent: number,
    public debtBufferBasisPoints: number,
    public fCashHaircutBasisPoints: number,
    public liquidityTokenHaircutsPercent: number[],
    public rateScalars: number[],
    public markets: Market[],
  ) {}

  /**
   * Copies a cash group object for simulation
   * @param cashGroup
   * @returns a cash group object that is mutable
   */
  public static copy(cashGroup: CashGroup) {
    const copy = new CashGroup(
      cashGroup.maxMarketIndex,
      cashGroup.rateOracleTimeWindowSeconds,
      cashGroup.totalFeeBasisPoints,
      cashGroup.reserveFeeSharePercent,
      cashGroup.debtBufferBasisPoints,
      cashGroup.fCashHaircutBasisPoints,
      [...cashGroup.liquidityTokenHaircutsPercent],
      [...cashGroup.rateScalars],
      cashGroup.markets.map(Market.copy),
    );
    // This causes some race conditions if blockSupplyRate is undefined
    copy.setBlockSupplyRate(cashGroup.blockSupplyRate);

    return copy;
  }

  public static getTimeReference(timestamp = getNowSeconds()) {
    return timestamp - (timestamp % SECONDS_IN_QUARTER);
  }

  public static getMarketMaturityLengthSeconds(marketIndex: number) {
    if (marketIndex === 1) return SECONDS_IN_QUARTER;
    if (marketIndex === 2) return 2 * SECONDS_IN_QUARTER;
    if (marketIndex === 3) return SECONDS_IN_YEAR;
    if (marketIndex === 4) return 2 * SECONDS_IN_YEAR;
    if (marketIndex === 5) return 5 * SECONDS_IN_YEAR;
    if (marketIndex === 6) return 10 * SECONDS_IN_YEAR;
    if (marketIndex === 7) return 20 * SECONDS_IN_YEAR;

    return 0;
  }

  public static isIdiosyncratic(maturity: number, blockTime = getNowSeconds()) {
    try {
      // If this throws an error then it is idiosyncratic
      CashGroup.getMarketIndexForMaturity(maturity, blockTime);
      return false;
    } catch {
      return true;
    }
  }

  public static getMarketIndexForMaturity(maturity: number, blockTime = getNowSeconds()) {
    for (let i = 1; i <= 7; i += 1) {
      if (maturity === CashGroup.getMaturityForMarketIndex(i, blockTime)) return i;
    }

    throw new Error('Maturity does not correspond to market index');
  }

  public static getSettlementDate(assetType: AssetType, maturity: number) {
    if (assetType === AssetType.fCash) return maturity;
    // settlementDate = maturity - marketLength + 90 days
    const marketLength = CashGroup.getMarketMaturityLengthSeconds(assetTypeNum(assetType) - 1);
    return maturity - marketLength + SECONDS_IN_QUARTER;
  }

  public static getMaturityForMarketIndex(marketIndex: number, blockTime = getNowSeconds()) {
    const tRef = CashGroup.getTimeReference(blockTime);
    return tRef + this.getMarketMaturityLengthSeconds(marketIndex);
  }

  public maxActiveMaturity() {
    const tRef = CashGroup.getTimeReference();
    return tRef + CashGroup.getMarketMaturityLengthSeconds(this.maxMarketIndex);
  }

  public getOracleRate(
    maturity: number,
    blockTime = getNowSeconds(),
    marketOverrides?: Market[],
    blockSupplyRateOverride?: number,
  ) {
    const markets = marketOverrides || this.markets;
    const blockSupplyRate = blockSupplyRateOverride || this.blockSupplyRate;
    const index = markets.findIndex((m) => m.maturity >= maturity);
    if (index === -1) throw new Error('Invalid maturity');
    if (markets[index].maturity === maturity) return markets[index].marketOracleRate(blockTime);

    // This is an idiosyncratic maturity
    const longMaturity = markets[index].maturity;
    const longRate = markets[index].marketOracleRate(blockTime);
    let shortRate: number;
    let shortMaturity: number;
    if (index === 0) {
      // Block supply rate may be zero
      if (blockSupplyRate === null || blockSupplyRate === undefined) {
        throw Error('Block supply rate not found in getOracleRate');
      }

      shortMaturity = blockTime;
      shortRate = blockSupplyRate;
    } else {
      shortMaturity = markets[index - 1].maturity;
      shortRate = markets[index - 1].marketOracleRate(blockTime);
    }

    return Math.trunc(
      ((longRate - shortRate) * (maturity - shortMaturity)) / (longMaturity - shortMaturity) + shortRate,
    );
  }

  public getfCashPresentValueUnderlyingInternal(
    maturity: number,
    notional: TypedBigNumber,
    useHaircut: boolean,
    blockTime = getNowSeconds(),
    marketOverrides?: Market[],
    blockSupplyRateOverride?: number,
  ): TypedBigNumber {
    let oracleRate = this.getOracleRate(maturity, blockTime, marketOverrides, blockSupplyRateOverride);
    if (useHaircut && notional.isNegative()) {
      oracleRate -= this.debtBufferBasisPoints;
      if (oracleRate < 0) oracleRate = 0;
    } else if (useHaircut) {
      oracleRate += this.fCashHaircutBasisPoints;
    }

    const timeToMaturity = maturity - blockTime;
    if (timeToMaturity < 0) return notional;

    const exponent = -Math.trunc((oracleRate * timeToMaturity) / SECONDS_IN_YEAR) / RATE_PRECISION;
    const discountFactor = Math.trunc(Math.exp(exponent) * RATE_PRECISION);

    return notional.scale(discountFactor, RATE_PRECISION);
  }

  public getLiquidityTokenValue(
    assetType: AssetType,
    tokens: TypedBigNumber,
    useHaircut: boolean,
    marketOverrides?: Market[],
  ): {
      fCashClaim: TypedBigNumber;
      assetCashClaim: TypedBigNumber;
    } {
    const index = assetTypeNum(assetType) - 2;
    const markets = marketOverrides || this.markets;
    const fCashClaim = markets[index].market.totalfCash.scale(
      tokens.n,
      markets[index].market.totalLiquidity.n,
    );
    const assetCashClaim = markets[index].market.totalAssetCash.scale(
      tokens.n,
      markets[index].market.totalLiquidity.n,
    );

    if (useHaircut) {
      return {
        fCashClaim: fCashClaim.scale(this.liquidityTokenHaircutsPercent[index], PERCENTAGE_BASIS),
        assetCashClaim: assetCashClaim.scale(this.liquidityTokenHaircutsPercent[index], PERCENTAGE_BASIS),
      };
    }

    return {fCashClaim, assetCashClaim};
  }
}
