import {
  BigNumber, BigNumberish, constants, Signer, utils,
} from 'ethers';
import {BytesLike} from '@ethersproject/bytes';
import {DEFAULT_ORDER_EXPIRATION} from '../config/constants';
import {ExchangeV3} from '../typechain/ExchangeV3';

const assetProxyInterface = new utils.Interface([
  'function ERC20Token(address tokenAddress)',
]);

const tokens = require('../config/tokens.json');

export default class Order {
  public takerAddress: string;
  public feeRecipientAddress: string;
  public senderAddress: string;
  public makerFee: BigNumberish;
  public takerFee: BigNumberish;
  public salt: BigNumberish;
  public makerAssetData: BytesLike;
  public takerAssetData: BytesLike;
  public makerFeeAssetData: BytesLike;
  public takerFeeAssetData: BytesLike;
  public expirationTimeSeconds: BigNumberish;

  constructor(
    public chainId: number,
    public makerAddress: string,
    public makerAssetAmount: BigNumberish,
    public takerAssetAmount: BigNumberish,
  ) {
    this.takerAddress = constants.AddressZero;
    this.feeRecipientAddress = constants.AddressZero;
    this.senderAddress = constants.AddressZero;
    this.makerFee = BigNumber.from('0');
    this.takerFee = BigNumber.from('0');
    const expiration = Date.now() + DEFAULT_ORDER_EXPIRATION;
    this.expirationTimeSeconds = BigNumber.from(expiration.toString());
    this.salt = BigNumber.from(Date.now().toString());
    this.makerAssetData = assetProxyInterface.encodeFunctionData('ERC20Token', [
      makerAddress,
    ]);
    this.takerAssetData = assetProxyInterface.encodeFunctionData('ERC20Token', [
      tokens[chainId.toString()].weth,
    ]);
    this.makerFeeAssetData = '0x';
    this.takerFeeAssetData = '0x';
  }

  public async hash(exchange: ExchangeV3) {
    const info = await exchange.callStatic.getOrderInfo(this);
    return info.orderHash;
  }

  public async sign(exchange: ExchangeV3, signer: Signer) {
    const hash = await this.hash(exchange);
    const signature = await signer.signMessage(utils.arrayify(hash));
    return `${signature}07`;
  }
}
