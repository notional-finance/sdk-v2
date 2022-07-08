import Notional, { TypedBigNumber } from '../../src';
import { ethers } from 'hardhat';
import { getAccount, setChainState } from './utils';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { BigNumber } from 'ethers';

const forkedBlockNumber = 15104800;
const DAI_WHALE = "0x8B64fA5Fd129df9c755eB82dB1e16D6D0Bdf5Bc3"

describe('transactions', () => {
  let notional: Notional;
  let daiWhale: SignerWithAddress; 

  beforeEach(async () => {
    await setChainState(forkedBlockNumber);
    daiWhale = await getAccount(DAI_WHALE);

    if (notional === undefined) {
      const provider = new ethers.providers.JsonRpcBatchProvider("http://localhost:8545")
      notional = await Notional.load(1, provider)
    }
  })

  it('executes a batch lend transaction', async () => {
    const contract = notional.system.getCurrencyBySymbol("DAI").underlyingContract
    await contract?.connect(daiWhale).approve(notional.system.getNotionalProxy().address, ethers.constants.MaxUint256)
    const populatedTxn = await notional.batchLend(
      DAI_WHALE,
      "DAI",
      TypedBigNumber.fromBalance(10e8, "DAI", true),
      1,
      0
    )
    // Gas estimation inside hardhat is wrong
    populatedTxn.gasLimit = BigNumber.from(2_500_000)
    await daiWhale.sendTransaction(populatedTxn)
    const { portfolio } = await notional.system.getNotionalProxy().connect(daiWhale).getAccount(DAI_WHALE)
    console.log(portfolio)
  });
});
