import {
  BigNumber, BigNumberish, constants, Signer, utils,
} from 'ethers';
import {BytesLike} from '@ethersproject/bytes';
import {DEFAULT_ORDER_EXPIRATION} from '../config/constants';
import {ExchangeV3} from '../typechain/ExchangeV3';

const assetProxyInterface = new utils.Interface(['function ERC20Token(address tokenAddress)']);

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
    public ts: number,
    public makerAddress: string,
    makerTokenAddress: string,
    public wethAddress: string,
    public makerAssetAmount: BigNumberish,
    public takerAssetAmount: BigNumberish,
  ) {
    this.takerAddress = constants.AddressZero;
    this.feeRecipientAddress = constants.AddressZero;
    this.senderAddress = constants.AddressZero;
    this.makerFee = BigNumber.from('0');
    this.takerFee = BigNumber.from('0');
    const expiration = ts + DEFAULT_ORDER_EXPIRATION;
    this.expirationTimeSeconds = BigNumber.from(expiration.toString());
    this.salt = BigNumber.from(ts.toString());
    this.makerAssetData = assetProxyInterface.encodeFunctionData('ERC20Token', [makerTokenAddress]);
    this.takerAssetData = assetProxyInterface.encodeFunctionData('ERC20Token', [wethAddress]);
    this.makerFeeAssetData = assetProxyInterface.encodeFunctionData('ERC20Token', [makerTokenAddress]);
    this.takerFeeAssetData = assetProxyInterface.encodeFunctionData('ERC20Token', [wethAddress]);
  }

  public async hash(exchange: ExchangeV3) {
    const info = await exchange.callStatic.getOrderInfo(this);
    return info.orderHash;
  }

  public async sign(exchange: ExchangeV3, signer: Signer) {
    const hash = await this.hash(exchange);
    const signature = await signer.signMessage(utils.arrayify(hash));
    // Signature type 7 = wallet signature verification
    // https://github.com/0xProject/0x-protocol-specification/blob/master/v3/v3-specification.md#wallet
    return `${signature}07`;
  }
}
