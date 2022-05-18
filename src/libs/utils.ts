import {BigNumber} from 'ethers';
import {AssetType} from './types';

export function getNowSeconds() {
  if (process.env.NODE_ENV === 'development' && process.env.FAKE_TIME) {
    const ts = parseInt(process.env.FAKE_TIME, 10);
    return ts;
  }

  return Math.floor(new Date().getTime() / 1000);
}

export function convertAssetType(assetType: BigNumber) {
  const typeNum = assetType.toNumber();
  if (typeNum === 1) return AssetType.fCash;
  if (typeNum === 2) return AssetType.LiquidityToken_3Month;
  if (typeNum === 3) return AssetType.LiquidityToken_6Month;
  if (typeNum === 4) return AssetType.LiquidityToken_1Year;
  if (typeNum === 5) return AssetType.LiquidityToken_2Year;
  if (typeNum === 6) return AssetType.LiquidityToken_5Year;
  if (typeNum === 7) return AssetType.LiquidityToken_10Year;
  if (typeNum === 8) return AssetType.LiquidityToken_20Year;

  throw new Error('Unknown asset type');
}

export function assetTypeNum(assetType: AssetType) {
  switch (assetType) {
    case AssetType.fCash:
      return 1;
    case AssetType.LiquidityToken_3Month:
      return 2;
    case AssetType.LiquidityToken_6Month:
      return 3;
    case AssetType.LiquidityToken_1Year:
      return 4;
    case AssetType.LiquidityToken_2Year:
      return 5;
    case AssetType.LiquidityToken_5Year:
      return 6;
    case AssetType.LiquidityToken_10Year:
      return 7;
    case AssetType.LiquidityToken_20Year:
      return 8;
    default:
      throw Error('Unknown asset type');
  }
}
