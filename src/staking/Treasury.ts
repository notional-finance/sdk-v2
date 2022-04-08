import {Signer} from 'ethers';
import axios from 'axios';
import {gql} from '@apollo/client/core';
import {BigNumberType, TypedBigNumber} from '..';
import {System} from '../system';
import {populateTxnAndGas} from '../libs/utils';
import {TreasuryManager} from '../typechain/TreasuryManager';
import Order from './Order';

const ORDER_URL = 'https://api.0x.org/sra/v3/orders';

const reserveQuery = gql`
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
`;

interface ReserveQueryResult {
  cashGroups: {
    currency: {id: string},
    reserveBuffer: string,
    reserveBalance: string
  }[],
  compbalance: {
    id: string;
    value: string;
  }
}

export default class Treasury {
  constructor(public treasuryManager: TreasuryManager, public manager: string) {}

  private async populateTxnAndGas(msgSender: string, methodName: string, methodArgs: any[]) {
    return populateTxnAndGas(this.treasuryManager, msgSender, methodName, methodArgs);
  }

  public async getReserveData() {
    const system = System.getSystem();
    const results = await system.graphClient.queryOrThrow<ReserveQueryResult>(reserveQuery);
    const reserveResults = await Promise.all(results.cashGroups.map(async (r) => {
      const currency = system.getCurrencyById(Number(r.currency.id));
      const underlyingSymbol = system.getUnderlyingSymbol(currency.id);
      const reserveBuffer = TypedBigNumber.fromBalance(r.reserveBuffer, currency.symbol, true).toExternalPrecision();
      const reserveBalance = TypedBigNumber.fromBalance(r.reserveBalance, currency.symbol, true).toExternalPrecision();
      const b = await (currency.underlyingContract || currency.contract).balanceOf(this.treasuryManager.address);
      const treasuryBalance = TypedBigNumber.fromBalance(b, underlyingSymbol, false);

      return {
        symbol: underlyingSymbol,
        reserveBuffer,
        reserveBalance,
        treasuryBalance,
      };
    }));

    const noteReserve = await system.getNOTE().balanceOf(this.treasuryManager.address).then((b) => ({
      symbol: 'NOTE',
      reserveBuffer: TypedBigNumber.fromBalance(0, 'NOTE', false),
      reserveBalance: TypedBigNumber.fromBalance(0, 'NOTE', false),
      treasuryBalance: TypedBigNumber.fromBalance(b, 'NOTE', false),
    }));

    // const compReserve = system.getCOMP().balanceOf(this.treasuryManager.address).then((b) => {
    //   return {
    //     symbol: 'COMP',
    //     reserveBuffer: TypedBigNumber.fromBalance(0, 'NOTE', false),
    //     reserveBalance: TypedBigNumber.fromBalance(0, 'NOTE', false),
    //     treasuryBalance: TypedBigNumber.fromBalance(b, 'NOTE', false)
    //   }
    // })

    return reserveResults.push(noteReserve);
  }

  /** Manager Methods */
  public async harvestAssetsFromNotional(currencyIds: number[]) {
    return this.populateTxnAndGas(this.manager, 'harvestAssetsFromNotional', currencyIds);
  }

  public async harvestCOMPFromNotional(currencyIds: number[]) {
    const system = System.getSystem();
    const cTokens = currencyIds.map((c) => system.getCurrencyById(c).contract.address);
    return this.populateTxnAndGas(this.manager, 'harvestCOMPFromNotional', cTokens);
  }

  public async investIntoStakedNOTE(noteAmount: TypedBigNumber, ethAmount: TypedBigNumber) {
    noteAmount.check(BigNumberType.NOTE, 'NOTE');
    ethAmount.check(BigNumberType.ExternalUnderlying, 'ETH');
    if (!ethAmount.isWETH) throw Error('Input is not WETH');
    return this.populateTxnAndGas(this.manager, 'investIntoSNOTE', [noteAmount, ethAmount]);
  }

  public async claimCOMP() {
    const system = System.getSystem();
    system
      .getTreasuryManager()
      .harvestCOMPFromNotional([
        system.getCurrencyBySymbol('ETH').contract.address,
        system.getCurrencyBySymbol('DAI').contract.address,
        system.getCurrencyBySymbol('USDC').contract.address,
        system.getCurrencyBySymbol('WBTC').contract.address,
      ]);
  }

  public async submit0xLimitOrder(
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
