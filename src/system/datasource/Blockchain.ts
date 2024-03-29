import { BigNumber, ethers } from 'ethers';
import EventEmitter from 'eventemitter3';
import { DataSource } from '.';
import TypedBigNumber, { BigNumberType } from '../../libs/TypedBigNumber';
import { ETHER_CURRENCY_ID } from '../../config/constants';
import { SystemEvents } from '../System';
import { AccountData } from '../../account';
import { AssetRate, Contracts, Currency, EthRate, nToken, StakedNoteParameters } from '../../libs/types';
import CashGroup from '../CashGroup';

export default class Blockchain extends DataSource {
  constructor(
    private contracts: Contracts,
    private batchProvider: ethers.providers.JsonRpcBatchProvider,
    protected currencies: Map<number, Currency>,
    protected ethRates: Map<number, EthRate>,
    protected assetRate: Map<number, AssetRate>,
    protected cashGroups: Map<number, CashGroup>,
    protected nTokens: Map<number, nToken>,
    protected eventEmitter: EventEmitter,
    public refreshIntervalMS: number
  ) {
    super(eventEmitter, refreshIntervalMS);
  }

  private async fetchSNOTEParameters(): Promise<StakedNoteParameters> {
    // eslint-disable-next-line
    const [poolId, balancerPoolTotalSupply, swapFee, coolDownTimeInSeconds, redeemWindowSeconds, sNOTETotalSupply] =
      await Promise.all([
        this.contracts.balancerPool.getPoolId(),
        this.contracts.balancerPool.totalSupply(),
        this.contracts.balancerPool.getSwapFeePercentage(),
        this.contracts.sNOTE.coolDownTimeInSeconds(),
        this.contracts.sNOTE.REDEEM_WINDOW_SECONDS(),
        this.contracts.sNOTE.totalSupply(),
      ]);
    const { tokens, balances } = await this.contracts.balancerVault.getPoolTokens(poolId);
    const noteIndex = tokens[0] === this.contracts.note.address ? 0 : 1;
    const ethIndex = noteIndex === 1 ? 0 : 1;
    const sNOTEBptBalance = await this.contracts.sNOTE.getPoolTokenShare(sNOTETotalSupply);

    return {
      poolId,
      coolDownTimeInSeconds,
      redeemWindowSeconds: redeemWindowSeconds.toNumber(),
      ethBalance: TypedBigNumber.fromBalance(balances[ethIndex], 'ETH', false),
      noteBalance: TypedBigNumber.fromBalance(balances[noteIndex], 'NOTE', false),
      balancerPoolTotalSupply,
      sNOTEBptBalance,
      swapFee,
      sNOTETotalSupply: TypedBigNumber.fromBalance(sNOTETotalSupply, 'sNOTE', false),
    };
  }

  async refreshData() {
    const promises = new Array<any>();
    promises.push(
      this.fetchSNOTEParameters().then((s) => {
        this.stakedNoteParameters = s;
      })
    );

    this.ethRates.forEach((e, k) => {
      if (k === ETHER_CURRENCY_ID) {
        // Set the eth rate for Ether as 1-1
        if (!this.ethRateData.has(1)) {
          this.ethRateData.set(k, BigNumber.from(ethers.constants.WeiPerEther));
        }
        return;
      }

      promises.push(
        e.rateOracle.latestAnswer().then((r) => {
          let rate = r;
          if (e.mustInvert) {
            const rateDecimals = BigNumber.from(10).pow(e.rateDecimalPlaces);
            rate = rateDecimals.mul(rateDecimals).div(r);
          }

          const typedRate = BigNumber.from(rate);

          if (!this.ethRateData.get(k)?.eq(typedRate)) {
            this.eventEmitter.emit(SystemEvents.ETH_RATE_UPDATE, k);
            this.ethRateData.set(k, typedRate);
          }
        })
      );
    });

    this.assetRate.forEach((a, k) => {
      if (a.rateAdapter.address === ethers.constants.AddressZero) return;
      // Uses static call to get a more accurate value
      promises.push(
        a.rateAdapter.callStatic.getExchangeRateStateful().then((r) => {
          const rate = BigNumber.from(r);
          if (!this.assetRateData.get(k)?.eq(rate)) {
            this.eventEmitter.emit(SystemEvents.ASSET_RATE_UPDATE, k);
            this.assetRateData.set(k, rate);
          }
        })
      );

      if (this.cashGroups.has(k)) {
        // It is possible to have an asset rate without a cash group (i.e. a non traded
        // cToken asset)
        promises.push(
          a.rateAdapter.getAnnualizedSupplyRate().then((r) => {
            if (this.cashGroups.get(k)!.blockSupplyRate !== r.toNumber()) {
              this.eventEmitter.emit(SystemEvents.BLOCK_SUPPLY_RATE_UPDATE, k);
              this.cashGroups.get(k)!.setBlockSupplyRate(r.toNumber());
            }
          })
        );
      }
    });

    this.nTokens.forEach((n, k) => {
      promises.push(
        n.contract.getPresentValueAssetDenominated().then((r) => {
          const { symbol } = this.currencies.get(k)!;
          const pv = TypedBigNumber.from(r, BigNumberType.InternalAsset, symbol);

          if (!this.nTokenAssetCashPV.get(k)?.eq(pv)) {
            this.eventEmitter.emit(SystemEvents.NTOKEN_PV_UPDATE, k);
            this.nTokenAssetCashPV.set(k, pv);
          }
        })
      );

      promises.push(
        this.contracts.notionalProxy
          .connect(this.batchProvider)
          .getNTokenAccount(n.contract.address)
          .then((r) => {
            const nTokenSymbol = this.nTokens.get(k)?.symbol;
            const { symbol } = this.currencies.get(k)!;
            if (!nTokenSymbol) throw Error(`unknown nToken ${k}`);
            const supply = TypedBigNumber.from(r.totalSupply, BigNumberType.nToken, nTokenSymbol);
            const cashBalance = TypedBigNumber.from(r.cashBalance, BigNumberType.InternalAsset, symbol);

            if (!this.nTokenTotalSupply.get(k)?.eq(supply)) {
              this.eventEmitter.emit(SystemEvents.NTOKEN_SUPPLY_UPDATE, k);
              this.nTokenTotalSupply.set(k, supply);
              this.nTokenIncentiveFactors.set(k, {
                accumulatedNOTEPerNToken: r.accumulatedNOTEPerNToken,
                lastAccumulatedTime: r.lastAccumulatedTime,
              });
            }

            if (!this.nTokenCashBalance.get(k)?.eq(cashBalance)) {
              this.eventEmitter.emit(SystemEvents.NTOKEN_ACCOUNT_UPDATE, k);
              this.nTokenCashBalance.set(k, cashBalance);
            }
          })
      );

      promises.push(
        this.contracts.notionalProxy.getNTokenPortfolio(n.contract.address).then((value) => {
          const { liquidityTokens, netfCashAssets } = value;
          this.nTokenLiquidityTokens.set(k, AccountData.parsePortfolioFromBlockchain(liquidityTokens));
          this.nTokenfCash.set(k, AccountData.parsePortfolioFromBlockchain(netfCashAssets));
          this.eventEmitter.emit(SystemEvents.NTOKEN_ACCOUNT_UPDATE, k);
        })
      );
    });

    this.cashGroups.forEach((c, k) => {
      promises.push(
        this.contracts.notionalProxy
          .connect(this.batchProvider)
          .getActiveMarkets(k)
          .then((m) => {
            m.forEach((v, i) => {
              const hasChanged = c.markets[i].setMarket(v);
              if (hasChanged) {
                this.eventEmitter.emit(SystemEvents.MARKET_UPDATE, c.markets[i].marketKey);
              }
            });
          })
      );
    });

    promises.push(
      this.batchProvider.getBlock('latest').then((b) => {
        this.lastUpdateBlockNumber = b.number;
        this.lastUpdateTimestamp = new Date(b.timestamp * 1000);
      })
    );

    await Promise.all(promises);
    this.eventEmitter.emit(SystemEvents.DATA_REFRESH);
  }
}
