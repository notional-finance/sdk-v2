import {
  BigNumber, BigNumberish, constants, utils,
} from 'ethers';
import {BytesLike} from '@ethersproject/bytes';

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
  public takerAssetData: BytesLike;
  public makerFeeAssetData: BytesLike;
  public takerFeeAssetData: BytesLike;

  constructor(
    public chainId: number,
    public makerAddress: string,
    public makerAssetAmount: BigNumberish,
    public takerAssetAmount: BigNumberish,
    public expirationTimeSeconds: BigNumberish,
    public makerAssetData: BytesLike,
  ) {
    this.takerAddress = constants.AddressZero;
    this.feeRecipientAddress = constants.AddressZero;
    this.senderAddress = constants.AddressZero;
    this.makerFee = BigNumber.from(0);
    this.takerFee = BigNumber.from(0);
    this.salt = BigNumber.from(Date.now());
    this.takerAssetData = assetProxyInterface.encodeFunctionData('ERC20Token', [
      tokens[chainId.toString()].weth,
    ]);
    this.makerFeeAssetData = '0x';
    this.takerFeeAssetData = '0x';
  }
}
