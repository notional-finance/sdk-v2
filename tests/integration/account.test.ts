import { gql } from '@apollo/client/core';
import { BigNumber, ethers, PopulatedTransaction, Wallet } from 'ethers';
import { Account } from '../../src/account';
import { BASIS_POINT } from '../../src/config/constants';
import TypedBigNumber, { BigNumberType } from '../../src/libs/TypedBigNumber';
import Notional from '../../src/Notional';

const lastMinedBlock = gql`
  {
    _meta {
      block {
        number
      }
    }
  }
`;

const accountQuery = gql`
  {
    account(id: "0x628029b5b7574296365eef243f240af83ffa7111") {
      id
      nextSettleTime
      hasPortfolioAssetDebt
      hasCashDebt
      lastUpdateBlockNumber
      balances {
        id
        assetCashBalance
        nTokenBalance
        lastClaimTime
        lastClaimIntegralSupply
        currency {
          symbol
          underlyingSymbol
        }
      }
      portfolio {
        id
        currency {
          symbol
          underlyingSymbol
        }
        maturity
        settlementDate
        assetType
        notional
      }

      balanceChanges(orderBy: blockNumber, orderDirection: desc) {
        id
        blockNumber
        currency {
          symbol
          underlyingSymbol
        }
        assetCashBalanceBefore
        assetCashBalanceAfter
        assetCashValueUnderlyingBefore
        assetCashValueUnderlyingAfter
        nTokenBalanceBefore
        nTokenBalanceAfter
        nTokenValueAssetBefore
        nTokenValueAssetAfter
        nTokenValueUnderlyingBefore
        nTokenValueUnderlyingAfter
        lastClaimTimeBefore
        lastClaimTimeAfter
        lastClaimSupplyBefore
        lastClaimSupplyAfter
      }

      assetChanges(orderBy: blockNumber, orderDirection: desc) {
        id
        blockNumber
        currency {
          symbol
          underlyingSymbol
        }
        maturity
        assetType
        settlementDate
        notionalBefore
        notionalAfter
      }

      tradeHistory(orderBy: blockNumber, orderDirection: desc) {
        id
        currency {
          symbol
        }
        netUnderlyingCash
        netAssetCash
        netfCash
        tradeType
        market {
          id
          lastUpdateBlockNumber
        }
      }
    }
  }
`;

function sleep(ms) {
  // eslint-disable-next-line no-promise-executor-return
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Account Integration Test', () => {
  let provider: ethers.providers.JsonRpcProvider;
  let signer: Wallet;
  let notional: Notional;
  let account: Account;
  let graphResultBefore: any;
  const transactions: {
    label: string;
    transaction?: PopulatedTransaction;
    transactionFn?: (account: Account) => Promise<PopulatedTransaction>;
    validateGraphRequest: (result: any, receipt: ethers.providers.TransactionReceipt) => void;
  }[] = [];

  beforeAll(async (done) => {
    provider = new ethers.providers.JsonRpcProvider('http://localhost:8545');
    signer = new Wallet('0x014dd03d25050b6bccba0c6470b3f0225890704cd41609af6ae3c93ded44e13e', provider);
    notional = await Notional.load(1337, provider);
    account = await notional.getAccount(signer);
    graphResultBefore = await notional.graphClient.queryOrThrow(accountQuery);
    done();
  });

  afterAll(() => {
    account.destroy();
    notional.system.destroy();
  });

  it('loads an account', () => {
    expect(account).toBeDefined();
  });

  it('end to end transactions test', async (done) => {
    transactions.push({
      label: 'deposit asset',
      transaction: await notional.deposit(
        account.address,
        'cDAI',
        TypedBigNumber.from(100e8, BigNumberType.ExternalAsset, 'cDAI', notional.system),
        false
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);

        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cDAI').assetCashBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cDAI').assetCashBalance
        );
        expect(balanceAfter.sub(balanceBefore).toNumber()).toEqual(100e8);
      },
    });

    transactions.push({
      label: 'deposit underlying',
      transaction: await notional.deposit(
        account.address,
        'DAI',
        TypedBigNumber.from(
          ethers.constants.WeiPerEther.mul(100),
          BigNumberType.ExternalUnderlying,
          'DAI',
          notional.system
        ),
        false
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);

        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cDAI').assetCashBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cDAI').assetCashBalance
        );
        expect(balanceAfter.sub(balanceBefore).toNumber()).toEqual(5000e8);
      },
    });

    transactions.push({
      label: 'deposit eth underlying',
      transaction: await notional.deposit(
        account.address,
        'ETH',
        TypedBigNumber.from(
          ethers.constants.WeiPerEther.mul(2),
          BigNumberType.ExternalUnderlying,
          'ETH',
          notional.system
        ),
        false
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);

        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cETH').assetCashBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cETH').assetCashBalance
        );
        expect(balanceAfter.sub(balanceBefore).toNumber()).toEqual(100e8);
      },
    });

    transactions.push({
      label: 'withdraw eth asset',
      transaction: await notional.withdraw(
        account.address,
        'cETH',
        TypedBigNumber.from(BigNumber.from(50e8), BigNumberType.ExternalAsset, 'cETH', notional.system),
        false
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);

        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cETH').assetCashBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cETH').assetCashBalance
        );
        expect(balanceBefore.sub(balanceAfter).toNumber()).toEqual(50e8);
      },
    });

    transactions.push({
      label: 'withdraw eth underlying',
      transaction: await notional.withdraw(
        account.address,
        'ETH',
        TypedBigNumber.from(ethers.constants.WeiPerEther, BigNumberType.ExternalUnderlying, 'ETH', notional.system),
        true
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);

        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cETH').assetCashBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cETH').assetCashBalance
        );
        expect(balanceBefore.sub(balanceAfter).toNumber()).toEqual(50e8);
      },
    });

    transactions.push({
      label: 'mint ntoken, deposit eth underlying',
      transaction: await notional.mintNToken(
        account.address,
        'ETH',
        TypedBigNumber.from(ethers.constants.WeiPerEther, BigNumberType.ExternalUnderlying, 'ETH', notional.system),
        false
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);
        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cETH').nTokenBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cETH').nTokenBalance
        );
        expect(balanceAfter.sub(balanceBefore).toNumber()).toEqual(50e8);
      },
    });

    transactions.push({
      label: 'mint ntoken, deposit asset',
      transaction: await notional.mintNToken(
        account.address,
        'cDAI',
        TypedBigNumber.from(5000e8, BigNumberType.ExternalAsset, 'cDAI', notional.system),
        false
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);
        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cDAI').nTokenBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cDAI').nTokenBalance
        );
        expect(balanceAfter.sub(balanceBefore).toNumber()).toEqual(5000e8);
      },
    });

    transactions.push({
      label: 'mint ntoken, convert cash',
      transaction: await notional.mintNToken(
        account.address,
        'cDAI',
        TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI', notional.system),
        true
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);
        const cashBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cDAI').assetCashBalance
        );
        const cashAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cDAI').assetCashBalance
        );
        expect(cashAfter.sub(cashBefore).toNumber()).toEqual(-5000e8);

        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cDAI').nTokenBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cDAI').nTokenBalance
        );
        expect(balanceAfter.sub(balanceBefore).toNumber()).toEqual(5000e8);
      },
    });

    transactions.push({
      label: 'redeem ntoken',
      transaction: await notional.redeemNToken(
        account.address,
        2,
        TypedBigNumber.from(5000e8, BigNumberType.nToken, 'nDAI', notional.system),
        TypedBigNumber.from(5000e8, BigNumberType.InternalAsset, 'cDAI', notional.system),
        false,
        false
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);
        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cDAI').nTokenBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cDAI').nTokenBalance
        );
        expect(balanceAfter.sub(balanceBefore).toNumber()).toEqual(-5000e8);
      },
    });

    transactions.push({
      label: 'lend, deposit underlying',
      transaction: await notional.lend(
        account.address,
        'USDC',
        TypedBigNumber.from(200e6, BigNumberType.ExternalUnderlying, 'USDC', notional.system),
        TypedBigNumber.from(100e8, BigNumberType.InternalUnderlying, 'USDC', notional.system),
        1,
        0,
        TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cUSDC', notional.system),
        true,
        true
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.assetChanges[0].blockNumber).toEqual(receipt.blockNumber);
        const assetBefore: any = graphResultBefore.account.portfolio.find((b) => b.currency.symbol === 'cUSDC');
        const assetAfter: any = result.account.portfolio.find((b) => b.currency.symbol === 'cUSDC');
        expect(
          BigNumber.from(assetAfter.notional)
            .sub(assetBefore?.notional || 0)
            .toNumber()
        ).toEqual(100e8);
      },
    });

    transactions.push({
      label: 'lend, deposit asset',
      transaction: await notional.lend(
        account.address,
        'cUSDC',
        TypedBigNumber.from(10000e8, BigNumberType.ExternalAsset, 'cUSDC', notional.system),
        TypedBigNumber.from(100e8, BigNumberType.InternalUnderlying, 'USDC', notional.system),
        1,
        0,
        TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cUSDC', notional.system),
        true,
        true
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.assetChanges[0].blockNumber).toEqual(receipt.blockNumber);
        const assetBefore: any = graphResultBefore.account.portfolio.find((b) => b.currency.symbol === 'cUSDC');
        const assetAfter: any = result.account.portfolio.find((b) => b.currency.symbol === 'cUSDC');
        expect(
          BigNumber.from(assetAfter.notional)
            .sub(assetBefore?.notional || 0)
            .toNumber()
        ).toEqual(100e8);
      },
    });

    transactions.push({
      label: 'borrow, deposit underlying collateral',
      transaction: await notional.borrow(
        account.address,
        'DAI',
        TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI', notional.system),
        1,
        1e9,
        TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI', notional.system),
        true,
        true,
        [
          {
            symbol: 'ETH',
            amount: TypedBigNumber.from(
              ethers.constants.WeiPerEther,
              BigNumberType.ExternalUnderlying,
              'ETH',
              notional.system
            ),
            mintNToken: false,
          },
        ]
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.assetChanges[0].blockNumber).toEqual(receipt.blockNumber);
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);

        const assetBefore: any = graphResultBefore.account.portfolio.find((b) => b.currency.symbol === 'cDAI');
        const assetAfter: any = result.account.portfolio.find((b) => b.currency.symbol === 'cDAI');
        expect(
          BigNumber.from(assetAfter.notional)
            .sub(assetBefore?.notional || 0)
            .toNumber()
        ).toEqual(-100e8);

        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cETH').assetCashBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cETH').assetCashBalance
        );
        expect(balanceAfter.sub(balanceBefore).toNumber()).toEqual(50e8);
      },
    });

    transactions.push({
      label: 'borrow, deposit asset collateral',
      transaction: await notional.borrow(
        account.address,
        'DAI',
        TypedBigNumber.from(-100e8, BigNumberType.InternalUnderlying, 'DAI', notional.system),
        1,
        1e9,
        TypedBigNumber.from(0, BigNumberType.InternalAsset, 'cDAI', notional.system),
        true,
        true,
        [
          {
            symbol: 'cUSDC',
            amount: TypedBigNumber.from(5000e8, BigNumberType.ExternalAsset, 'cUSDC', notional.system),
            mintNToken: false,
          },
        ]
      ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.assetChanges[0].blockNumber).toEqual(receipt.blockNumber);
        expect(result.account.balanceChanges[0].blockNumber).toEqual(receipt.blockNumber);

        const assetBefore: any = graphResultBefore.account.portfolio.find((b) => b.currency.symbol === 'cDAI');
        const assetAfter: any = result.account.portfolio.find((b) => b.currency.symbol === 'cDAI');
        expect(
          BigNumber.from(assetAfter.notional)
            .sub(assetBefore?.notional || 0)
            .toNumber()
        ).toEqual(-100e8);

        const balanceBefore = BigNumber.from(
          graphResultBefore.account.balances.find((b) => b.currency.symbol === 'cUSDC').assetCashBalance
        );
        const balanceAfter = BigNumber.from(
          result.account.balances.find((b) => b.currency.symbol === 'cUSDC').assetCashBalance
        );
        expect(balanceAfter.sub(balanceBefore).toNumber()).toEqual(5000e8);
      },
    });

    transactions.push({
      label: 'roll borrow',
      transactionFn: async (acct) =>
        (
          await notional.rollBorrow(
            acct.address,
            acct.accountData!.portfolio.find((a) => a.currencyId === 2)!,
            2,
            -50 * BASIS_POINT,
            50 * BASIS_POINT
          )
        ).populatedTransaction,
      validateGraphRequest: (result, receipt) => {
        expect(result.account.assetChanges[0].blockNumber).toEqual(receipt.blockNumber);
        const assetBefore: any = graphResultBefore.account.portfolio.find((b) => b.currency.symbol === 'cDAI');
        const assetAfter: any = result.account.portfolio.find((b) => b.currency.symbol === 'cDAI');
        expect(assetAfter.maturity).toBeGreaterThan(assetBefore.maturity);
      },
    });

    transactions.push({
      label: 'repay borrow',
      transactionFn: async (acct) =>
        notional.repayBorrow(
          account.address,
          acct.accountData!.portfolio.find((a) => a.currencyId === 2)!,
          'DAI',
          acct.accountData!.portfolio.find((a) => a.currencyId === 2)!.notional.abs(),
          TypedBigNumber.from(
            ethers.constants.WeiPerEther.mul(200),
            BigNumberType.ExternalUnderlying,
            'DAI',
            notional.system
          ),
          0
        ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.assetChanges[0].blockNumber).toEqual(receipt.blockNumber);
        const assetAfter: any = result.account.portfolio.find((b) => b.currency.symbol === 'cDAI');
        expect(assetAfter).toBeUndefined();
      },
    });

    transactions.push({
      label: 'roll lend',
      transactionFn: async (acct) =>
        (
          await notional.rollLend(
            acct.address,
            acct.accountData!.portfolio.find((a) => a.currencyId === 3)!,
            2,
            -50 * BASIS_POINT,
            50 * BASIS_POINT
          )
        ).populatedTransaction,
      validateGraphRequest: (result, receipt) => {
        expect(result.account.assetChanges[0].blockNumber).toEqual(receipt.blockNumber);
        const assetBefore: any = graphResultBefore.account.portfolio.find((b) => b.currency.symbol === 'cUSDC');
        const assetAfter: any = result.account.portfolio.find((b) => b.currency.symbol === 'cUSDC');
        expect(assetAfter.maturity).toBeGreaterThan(assetBefore.maturity);
      },
    });

    transactions.push({
      label: 'withdraw lend',
      transactionFn: async (acct) =>
        notional.withdrawLend(
          acct.address,
          acct.accountData!.portfolio.find((a) => a.currencyId === 3)!,
          acct.accountData!.portfolio.find((a) => a.currencyId === 3)!.notional.abs(),
          1e9,
          true,
          true
        ),
      validateGraphRequest: (result, receipt) => {
        expect(result.account.assetChanges[0].blockNumber).toEqual(receipt.blockNumber);
        const assetAfter: any = result.account.portfolio.find((b) => b.currency.symbol === 'cUSDC');
        expect(assetAfter).toBeUndefined();
      },
    });

    /* eslint-disable */
    for (const t of transactions) {
      const { label, transaction, transactionFn, validateGraphRequest } = t;
      let resp: ethers.providers.TransactionResponse;
      if (transaction) {
        resp = await account.sendTransaction(transaction);
      } else if (transactionFn) {
        resp = await account.sendTransaction(await transactionFn(account));
      } else {
        throw Error('unspecified transaction');
      }

      const receipt = await resp.wait();
      let graphLastBlock: any;
      do {
        await sleep(1000);
        graphLastBlock = await notional.graphClient.queryOrThrow(lastMinedBlock);
        console.log(
          `Pending graph update for ${label}, ${receipt.blockNumber} at ${graphLastBlock._meta.block.number}`
        );
      } while (graphLastBlock._meta.block.number < receipt.blockNumber);

      const graphResultAfter: any = await notional.graphClient.queryOrThrow(accountQuery);
      console.log(`Validating transaction ${label}`);
      validateGraphRequest(graphResultAfter, receipt);

      graphResultBefore = graphResultAfter;
      await account.refresh();
    }
    /* eslint-enable */

    done();
  }, 100000);
});
