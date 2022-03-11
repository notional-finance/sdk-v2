import {BigNumberish, Signer} from 'ethers';
import axios from 'axios';
import {TypedBigNumber} from '..';
import {System} from '../system';
import {populateTxnAndGas} from '../libs/utils';
import {TreasuryManager} from '../typechain/TreasuryManager';
import Order from './Order';

const ORDER_URL = 'https://api.0x.org/sra/v3/orders';

export default class Treasury {
  constructor(public treasuryManager: TreasuryManager, public manager: string) { }

  private async populateTxnAndGas(msgSender: string, methodName: string, methodArgs: any[]) {
    return populateTxnAndGas(this.treasuryManager, msgSender, methodName, methodArgs);
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
    return this.populateTxnAndGas(this.manager, 'investIntoSNOTE', [noteAmount, ethAmount]);
  }

  public async claimCOMP() {
    const system = System.getSystem();
    system.getTreasuryManager().harvestCOMPFromNotional([
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
    makerAmount: BigNumberish,
    takerAmount: BigNumberish,
  ) {
    // takerTokenAddress is hardcoded to WETH
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
      makerAmount,
      takerAmount,
    );
    const signature = await order.sign(exchange, signer);
    return axios.post(ORDER_URL, [{
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
    }]);
  }
}
