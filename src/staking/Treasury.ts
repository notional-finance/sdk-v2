import {BigNumber, Signer} from 'ethers';
import axios from 'axios';
import {gql} from '@apollo/client/core';
import {BigNumberType, TypedBigNumber} from '..';
import {System} from '../system';
import {populateTxnAndGas} from '../libs/utils';
import Order from './Order';

const ORDER_URL = 'https://api.0x.org/sra/v3/orders';

const reserveQuery = gql`{
  cashGroups {
    currency {
      id
    }
    reserveBuffer
    reserveBalance
  }
  compbalance(id: "tvl:19090") {
    id
    value
  }
}`;

const compReserveQuery = gql`
{
  tvlHistoricalDatas(orderBy:timestamp, orderDirection:desc, first: 1){
    compBalance {
      value
      usdValue
    }
  }
}`;

interface CompQueryResult {
  tvlHistoricalDatas: {
    compBalance: {
      value: string;
      usdValue: string;
    }
  }[]
}

interface ReserveQueryResult {
  cashGroups: {
    currency: {id: string},
    reserveBuffer?: string,
    reserveBalance: string
  }[],
  compbalance: {
    id: string;
    value: string;
  }
}

export default class Treasury {
  private static async populateTxnAndGas(msgSender: string, methodName: string, methodArgs: any[]) {
    const treasuryManager = System.getSystem().getTreasuryManager();
    return populateTxnAndGas(treasuryManager, msgSender, methodName, methodArgs);
  }

  public static async getManager() {
    const system = System.getSystem();
    const treasuryManager = system.getTreasuryManager();
    return treasuryManager.manager();
  }

  public static async getReserveData() {
    const system = System.getSystem();
    const treasuryManager = system.getTreasuryManager();
    const results = await system.graphClient.queryOrThrow<ReserveQueryResult>(reserveQuery);
    const reserveResults = await Promise.all(results.cashGroups.map(async (r) => {
      const currency = system.getCurrencyById(Number(r.currency.id));
      const underlyingSymbol = system.getUnderlyingSymbol(currency.id);
      const reserveBuffer = TypedBigNumber.fromBalance(
        r.reserveBuffer || 0, currency.symbol, true,
      ).toExternalPrecision();
      const reserveBalance = TypedBigNumber.fromBalance(r.reserveBalance, currency.symbol, true).toExternalPrecision();
      const b = await (currency.underlyingContract || currency.contract).balanceOf(treasuryManager.address);
      const treasuryBalance = TypedBigNumber.fromBalance(b, underlyingSymbol, false);

      return {
        symbol: underlyingSymbol,
        reserveBuffer,
        reserveBalance,
        treasuryBalance,
      };
    }));

    const noteReserve = await system.getNOTE().balanceOf(treasuryManager.address).then((b) => ({
      symbol: 'NOTE',
      reserveBuffer: TypedBigNumber.fromBalance(0, 'NOTE', false),
      reserveBalance: TypedBigNumber.fromBalance(0, 'NOTE', false),
      treasuryBalance: TypedBigNumber.fromBalance(b, 'NOTE', false),
    }));

    reserveResults.push(noteReserve);
    return reserveResults;
  }

  public static async getCompData() {
    const system = System.getSystem();
    const manager = await Treasury.getManager();
    const COMP = system.getCOMP();
    const compBalance = (await COMP?.balanceOf(manager)) || BigNumber.from(0);
    const results = await system.graphClient.queryOrThrow<CompQueryResult>(compReserveQuery);
    const reserveBalance = results.tvlHistoricalDatas.length
      ? BigNumber.from(results.tvlHistoricalDatas[0].compBalance.value)
      : BigNumber.from(0);
    const reserveValueUSD = results.tvlHistoricalDatas.length
      ? BigNumber.from(results.tvlHistoricalDatas[0].compBalance.usdValue)
      : BigNumber.from(0);

    return {
      symbol: 'COMP',
      reserveBuffer: BigNumber.from(0),
      reserveValueUSD,
      reserveBalance,
      treasuryBalance: compBalance,
    };
  }

  /** Manager Methods */
  public static async harvestAssetsFromNotional(currencyIds: number[]) {
    const manager = await Treasury.getManager();
    return Treasury.populateTxnAndGas(manager, 'harvestAssetsFromNotional', [currencyIds]);
  }

  public static async harvestCOMPFromNotional(currencyIds: number[]) {
    const system = System.getSystem();
    const manager = await Treasury.getManager();
    const cTokens = currencyIds.map((c) => system.getCurrencyById(c).contract.address);
    return Treasury.populateTxnAndGas(manager, 'harvestCOMPFromNotional', [cTokens]);
  }

  public static async investIntoStakedNOTE(noteAmount: TypedBigNumber, ethAmount: TypedBigNumber) {
    noteAmount.check(BigNumberType.NOTE, 'NOTE');
    ethAmount.check(BigNumberType.ExternalUnderlying, 'ETH');
    if (!ethAmount.isWETH) throw Error('Input is not WETH');

    const manager = await Treasury.getManager();
    return Treasury.populateTxnAndGas(manager, 'investWETHToBuyNOTE', [noteAmount, ethAmount]);
  }

  public static async submit0xLimitOrder(
    chainId: number,
    signer: Signer,
    symbol: string,
    makerAmount: TypedBigNumber,
    takerAmount: TypedBigNumber,
  ) {
    // takerTokenAddress is hardcoded to WETH
    if (!takerAmount.isWETH) throw Error('Taker amount is not WETH');
    if (makerAmount.type !== BigNumberType.ExternalUnderlying) throw Error('Maker amount is not external underlying');

    const system = System.getSystem();
    const makerTokenAddress = system.getCurrencyBySymbol(symbol).underlyingContract?.address;
    if (!makerTokenAddress) {
      throw new Error(`Invalid maker token ${symbol}`);
    }
    const exchange = system.getExchangeV3();
    if (!exchange) {
      throw new Error('Invalid exchange contract');
    }
    const order = new Order(
      chainId,
      Math.floor(Date.now() / 1000),
      system.getTreasuryManager().address,
      makerTokenAddress,
      system.getWETH().address,
      makerAmount.n,
      takerAmount.n,
    );
    const signature = await order.sign(exchange, signer);
    return axios.post(ORDER_URL, [
      {
        signature,
        senderAddress: order.senderAddress,
        makerAddress: order.makerAddress,
        takerAddress: order.takerAddress,
        makerFee: order.makerFee.toString(),
        takerFee: order.takerFee.toString(),
        makerAssetAmount: order.makerAssetAmount.toString(),
        takerAssetAmount: order.takerAssetAmount.toString(),
        makerAssetData: order.makerAssetData,
        takerAssetData: order.takerAssetData,
        salt: order.salt.toString(),
        exchangeAddress: exchange.address,
        feeRecipientAddress: order.feeRecipientAddress,
        expirationTimeSeconds: order.expirationTimeSeconds.toString(),
        makerFeeAssetData: order.makerFeeAssetData,
        chainId,
        takerFeeAssetData: order.takerFeeAssetData,
      },
    ]);
  }
}
