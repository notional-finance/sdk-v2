import {BigNumber, BigNumberish, BytesLike} from 'ethers';
import TypedBigNumber from './TypedBigNumber';
import {AssetRateAggregator} from '../typechain/AssetRateAggregator';
import {BalancerPool} from '../typechain/BalancerPool';
import {BalancerVault} from '../typechain/BalancerVault';
import {ERC20} from '../typechain/ERC20';
import {Governor} from '../typechain/Governor';
import {IAggregator} from '../typechain/IAggregator';
import {NoteERC20} from '../typechain/NoteERC20';
import {NTokenERC20} from '../typechain/NTokenERC20';
import {SNOTE} from '../typechain/SNOTE';
import {TreasuryManager} from '../typechain/TreasuryManager';
import {Notional as NotionalProxyTypechain} from '../typechain/Notional';
import {ExchangeV3} from '../typechain/ExchangeV3';

export enum NTokenStatus {
  Ok = 'Ok',
  MarketsNotInitialized = 'MarketsNotInitialized',
  nTokenHasResidual = 'nTokenHasResidual',
}

export enum TokenType {
  UnderlyingToken = 'UnderlyingToken',
  cToken = 'cToken',
  cETH = 'cETH',
  Ether = 'Ether',
  NonMintable = 'NonMintable',
}

export enum ProposalStateEnum {
  PENDING = 'PENDING',
  CANCELLED = 'CANCELLED',
  QUEUED = 'QUEUED',
  EXECUTED = 'EXECUTED',
}

export enum TradeType {
  Lend = 'Lend',
  Borrow = 'Borrow',
  AddLiquidity = 'AddLiquidity',
  RemoveLiquidity = 'RemoveLiquidity',
  PurchaseNTokenResidual = 'PurchaseNTokenResidual',
  SettleCashDebt = 'SettleCashDebt',
}

export enum AssetType {
  fCash = 'fCash',
  LiquidityToken_3Month = 'LiquidityToken_3Month',
  LiquidityToken_6Month = 'LiquidityToken_6Month',
  LiquidityToken_1Year = 'LiquidityToken_1Year',
  LiquidityToken_2Year = 'LiquidityToken_2Year',
  LiquidityToken_5Year = 'LiquidityToken_5Year',
  LiquidityToken_10Year = 'LiquidityToken_10Year',
  LiquidityToken_20Year = 'LiquidityToken_20Year',
}

export interface WalletBalance {
  lastUpdateBlockNumber: number;
  lastUpdateTime: Date;
  currencyId: number;
  symbol: string;
  isUnderlying: boolean;
  balance: TypedBigNumber;
  allowance: TypedBigNumber;
}

export interface Currency {
  id: number;
  name: string;
  symbol: string;
  decimals: BigNumber;
  decimalPlaces: number;
  contract: ERC20;
  tokenType: TokenType;
  underlyingName?: string;
  underlyingSymbol?: string;
  underlyingDecimals?: BigNumber;
  underlyingDecimalPlaces?: number;
  underlyingContract?: ERC20;
  nTokenSymbol?: string;
  hasTransferFee: boolean;
}

// This is a cut down version of the interface returned from typechain
export interface Balance {
  currencyId: number;
  cashBalance: TypedBigNumber;
  nTokenBalance: TypedBigNumber | undefined;
  lastClaimTime: BigNumber;
  lastClaimIntegralSupply: BigNumber;
}

export interface Asset {
  currencyId: number;
  maturity: number;
  assetType: AssetType;
  notional: TypedBigNumber;
  hasMatured: boolean;
  settlementDate: number;
  isIdiosyncratic: boolean;
}

export enum TradeActionType {
  Lend,
  Borrow,
  AddLiquidity,
  RemoveLiquidity,
  PurchaseNTokenResidual,
  SettleCashDebt,
}

export enum DepositActionType {
  None,
  DepositAsset,
  DepositUnderlying,
  DepositAssetAndMintNToken,
  DepositUnderlyingAndMintNToken,
  RedeemNToken,
  ConvertCashToNToken,
}

export interface BatchBalanceAction {
  actionType: DepositActionType;
  currencyId: BigNumberish;
  depositActionAmount: BigNumberish;
  withdrawAmountInternalPrecision: BigNumberish;
  withdrawEntireCashBalance: boolean;
  redeemToUnderlying: boolean;
}

export interface BatchBalanceAndTradeAction {
  actionType: DepositActionType;
  currencyId: BigNumberish;
  depositActionAmount: BigNumberish;
  withdrawAmountInternalPrecision: BigNumberish;
  withdrawEntireCashBalance: boolean;
  redeemToUnderlying: boolean;
  trades: BytesLike[];
}

export interface TradeHistory {
  id: string;
  blockNumber: number;
  transactionHash: string;
  blockTime: Date;
  currencyId: number;
  tradeType: TradeType;
  settlementDate: BigNumber | null;
  maturityLength: number | null;
  maturity: BigNumber;
  netAssetCash: TypedBigNumber;
  netUnderlyingCash: TypedBigNumber;
  netfCash: TypedBigNumber;
  netLiquidityTokens: TypedBigNumber | null;
  tradedInterestRate: number;
}

export interface BalanceHistory {
  id: string;
  blockNumber: number;
  blockTime: Date;

  currencyId: number;
  tradeType: string;
  assetCashBalanceBefore: TypedBigNumber;
  assetCashBalanceAfter: TypedBigNumber;
  assetCashValueUnderlyingBefore: TypedBigNumber;
  assetCashValueUnderlyingAfter: TypedBigNumber;

  nTokenBalanceBefore?: TypedBigNumber;
  nTokenBalanceAfter?: TypedBigNumber;
  nTokenValueUnderlyingBefore?: TypedBigNumber;
  nTokenValueUnderlyingAfter?: TypedBigNumber;
  nTokenValueAssetBefore?: TypedBigNumber;
  nTokenValueAssetAfter?: TypedBigNumber;
  totalUnderlyingValueChange: TypedBigNumber;
}

export interface EthRate {
  rateOracle: IAggregator;
  rateDecimalPlaces: number;
  mustInvert: boolean;
  buffer: number;
  haircut: number;
}

export interface AssetRate {
  rateAdapter: AssetRateAggregator;
  underlyingDecimalPlaces: number;
}

// eslint-disable-next-line @typescript-eslint/naming-convention
export interface nToken {
  name: string;
  symbol: string;
  incentiveEmissionRate: BigNumber;
  pvHaircutPercentage: number;
  depositShares: BigNumber[];
  leverageThresholds: BigNumber[];
  contract: NTokenERC20;
}

export interface IncentiveFactors {
  integralTotalSupply: BigNumber;
  lastSupplyChangeTime: BigNumber;
}

export interface SettlementMarket {
  settlementDate: number;
  totalfCash: TypedBigNumber;
  totalAssetCash: TypedBigNumber;
  totalLiquidity: TypedBigNumber;
}

export interface StakedNoteParameters {
  poolId: string;
  coolDownTimeInSeconds: number;
  redeemWindowSeconds: number;
  ethBalance: TypedBigNumber;
  noteBalance: TypedBigNumber;
  balancerPoolTotalSupply: BigNumber;
  sNOTEBptBalance: BigNumber;
  swapFee: BigNumber;
  sNOTETotalSupply: TypedBigNumber;
}

export interface Contracts {
  notionalProxy: NotionalProxyTypechain;
  sNOTE: SNOTE;
  note: NoteERC20;
  governor: Governor;
  treasury: TreasuryManager;
  balancerVault: BalancerVault;
  balancerPool: BalancerPool;
  exchangeV3: ExchangeV3 | null;
  weth: ERC20;
}
