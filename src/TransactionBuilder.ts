import { Overrides, ethers, BigNumber, BytesLike } from 'ethers';
import TypedBigNumber, { BigNumberType } from './libs/TypedBigNumber';
import {
  DepositActionType,
  TokenType,
  BatchBalanceAndTradeAction,
  TradeActionType,
  Asset,
  Currency,
} from './libs/types';
import { getNowSeconds, populateTxnAndGas } from './libs/utils';
import { System, Market, CashGroup } from './system';

export default class TransactionBuilder {
  private async populateTxnAndGas(msgSender: string, methodName: string, methodArgs: any[]) {
    const proxy = System.getSystem().getNotionalProxy();
    return populateTxnAndGas(proxy, msgSender, methodName, methodArgs);
  }

  /**
   * Deposits an amount of the given token symbol
   *
   * @param address ethereum address to deposit to
   * @param symbol
   * @param amount
   * @param settleAssets true if the deposit should settle assets first (this does not occur by default)
   * @param overrides
   * @returns
   */
  public deposit(
    address: string,
    symbol: string,
    amount: TypedBigNumber,
    settleAssets: boolean,
    overrides = {} as Overrides
  ) {
    const currency = System.getSystem().getCurrencyBySymbol(symbol);
    const isUnderlying = currency.underlyingSymbol === symbol;
    amount.check(isUnderlying ? BigNumberType.ExternalUnderlying : BigNumberType.ExternalAsset, symbol);

    if (settleAssets) {
      // If asset settlement is required then we use batch balance action instead
      const action = {
        actionType: isUnderlying ? DepositActionType.DepositUnderlying : DepositActionType.DepositAsset,
        currencyId: currency.id,
        depositActionAmount: amount.n,
        withdrawAmountInternalPrecision: 0,
        withdrawEntireCashBalance: false,
        redeemToUnderlying: false,
      };

      if (isUnderlying && currency.tokenType === TokenType.cETH) {
        const ethOverrides = Object.assign(overrides, { value: amount.n }) as ethers.PayableOverrides;
        return this.populateTxnAndGas(address, 'batchBalanceAction', [address, [action], ethOverrides]);
      }

      return this.populateTxnAndGas(address, 'batchBalanceAction', [address, [action], overrides]);
    }

    if (isUnderlying && currency.tokenType === TokenType.cETH) {
      const ethOverrides = Object.assign(overrides, { value: amount.n }) as ethers.PayableOverrides;
      return this.populateTxnAndGas(address, 'depositUnderlyingToken', [address, currency.id, amount.n, ethOverrides]);
    }

    if (isUnderlying) {
      return this.populateTxnAndGas(address, 'depositUnderlyingToken', [address, currency.id, amount.n, overrides]);
    }

    return this.populateTxnAndGas(address, 'depositAssetToken', [address, currency.id, amount.n, overrides]);
  }

  /**
   * Withdraws an amount of cash from an account, converting from external underlying to asset if required.
   *
   * @param symbol
   * @param amountExternal
   * @param redeemToUnderlying
   * @param overrides
   * @returns
   */
  public withdraw(
    address: string,
    symbol: string,
    amountExternal: TypedBigNumber,
    redeemToUnderlying: boolean,
    overrides = {} as Overrides
  ) {
    const currency = System.getSystem().getCurrencyBySymbol(symbol);
    const withdrawAmount = amountExternal.toAssetCash().toInternalPrecision();
    withdrawAmount.check(BigNumberType.InternalAsset, currency.symbol);

    return this.populateTxnAndGas(address, 'withdraw', [currency.id, withdrawAmount.n, redeemToUnderlying, overrides]);
  }

  /**
   * Mints nTokens given the amount of cash to deposit
   *
   * @param address
   * @param symbol
   * @param amount amount of cash to deposit into nToken
   * @param convertCash true if should use existing cash balance instead
   * @param _overrides
   * @returns
   */
  public mintNToken(
    address: string,
    symbol: string,
    amount: TypedBigNumber,
    convertCash: boolean,
    _overrides = {} as Overrides
  ) {
    const currency = System.getSystem().getCurrencyBySymbol(symbol);
    const isUnderlying = currency.underlyingSymbol === symbol;
    let actionType: DepositActionType;
    let overrides = _overrides;
    if (convertCash) {
      amount.check(BigNumberType.InternalAsset, currency.symbol);
      actionType = DepositActionType.ConvertCashToNToken;
    } else if (isUnderlying && currency.tokenType === TokenType.cETH) {
      amount.check(BigNumberType.ExternalUnderlying, currency.underlyingSymbol);
      actionType = DepositActionType.DepositUnderlyingAndMintNToken;
      overrides = Object.assign(overrides, { value: amount.n }) as ethers.PayableOverrides;
    } else if (isUnderlying) {
      amount.check(BigNumberType.ExternalUnderlying, currency.underlyingSymbol);
      actionType = DepositActionType.DepositUnderlyingAndMintNToken;
    } else {
      amount.check(BigNumberType.ExternalAsset, currency.symbol);
      actionType = DepositActionType.DepositAssetAndMintNToken;
    }

    const action = {
      actionType,
      currencyId: currency.id,
      depositActionAmount: amount.n,
      withdrawAmountInternalPrecision: 0,
      withdrawEntireCashBalance: false,
      redeemToUnderlying: false,
    };

    return this.populateTxnAndGas(address, 'batchBalanceAction', [address, [action], overrides]);
  }

  /**
   * Redeems nTokens via batchBalanceAction meaning that there cannot be residuals.
   *
   * @param address
   * @param currencyId
   * @param amount
   * @param withdrawAmountInternalPrecision
   * @param withdrawEntireCashBalance
   * @param redeemToUnderlying
   * @param overrides
   * @returns
   */
  public redeemNToken(
    address: string,
    currencyId: number,
    amount: TypedBigNumber,
    withdrawAmountInternalPrecision: TypedBigNumber,
    withdrawEntireCashBalance: boolean,
    redeemToUnderlying: boolean,
    overrides = {} as Overrides
  ) {
    const currency = System.getSystem().getCurrencyById(currencyId);
    const nToken = System.getSystem().getNToken(currency.id);
    amount.check(BigNumberType.nToken, nToken?.symbol);
    withdrawAmountInternalPrecision.check(BigNumberType.InternalAsset, currency.symbol);

    return this.populateTxnAndGas(address, 'batchBalanceAction', [
      address,
      [
        {
          actionType: DepositActionType.RedeemNToken,
          currencyId,
          depositActionAmount: amount.n,
          withdrawAmountInternalPrecision: withdrawAmountInternalPrecision.n,
          withdrawEntireCashBalance,
          redeemToUnderlying,
        },
      ],
      overrides,
    ]);
  }

  /**
   * Claims incentives for the account
   *
   * @param overrides
   * @returns
   */
  public claimIncentives(address: string, overrides = {} as Overrides) {
    return this.populateTxnAndGas(address, 'nTokenClaimIncentives', [overrides]);
  }

  /**
   * Returns a populated borrow transaction
   *
   * @param address
   * @param borrowCurrencySymbol
   * @param borrowfCashAmount amount of fCash to borrow, will be converted to a positive number
   * @param marketIndex index of the market to borrow on
   * @param maxSlippage maximum annualized rate to borrow at (or will fail)
   * @param withdrawAmountInternalPrecision how much to withdraw from the borrow currency
   * @param withdrawEntireCashBalance  true if the account will withdraw the entire cash balance
   * @param redeemToUnderlying  true if will redeem the cash to underlying asset
   * @param collateral a list of collateral types to deposit
   * @param overrides
   * @returns
   */
  public borrow(
    address: string,
    borrowCurrencySymbol: string,
    borrowfCashAmount: TypedBigNumber,
    marketIndex: number,
    maxSlippage: number,
    withdrawAmountInternalPrecision: TypedBigNumber,
    withdrawEntireCashBalance: boolean,
    redeemToUnderlying: boolean,
    collateral: {
      symbol: string;
      amount: TypedBigNumber;
      mintNToken: boolean;
    }[],
    overrides = {} as Overrides
  ) {
    const actions: BatchBalanceAndTradeAction[] = [];
    const borrowCurrency = System.getSystem().getCurrencyBySymbol(borrowCurrencySymbol);
    let borrowOverrides = overrides;
    borrowfCashAmount.check(BigNumberType.InternalUnderlying, borrowCurrency.underlyingSymbol || borrowCurrency.symbol);
    withdrawAmountInternalPrecision.check(BigNumberType.InternalAsset, borrowCurrency.symbol);

    collateral
      .filter((c) => !c.amount.isZero())
      .forEach((c) => {
        const collateralCurrency = System.getSystem().getCurrencyBySymbol(c.symbol);
        const { actionType: collateralActionType, overrides: depositOverrides } = this.getDepositAction(
          c.symbol,
          collateralCurrency,
          c.amount,
          c.mintNToken,
          borrowOverrides
        );
        borrowOverrides = depositOverrides;

        actions.push({
          actionType: collateralActionType,
          currencyId: collateralCurrency.id,
          depositActionAmount: c.amount.n,
          withdrawAmountInternalPrecision: BigNumber.from(0),
          withdrawEntireCashBalance: false,
          redeemToUnderlying: false,
          trades: [],
        });
      });

    actions.push({
      actionType: DepositActionType.None,
      currencyId: borrowCurrency.id,
      depositActionAmount: BigNumber.from(0),
      withdrawAmountInternalPrecision: withdrawAmountInternalPrecision.n,
      withdrawEntireCashBalance,
      redeemToUnderlying,
      trades: [this.encodeTradeType(TradeActionType.Borrow, marketIndex, borrowfCashAmount.abs(), 0, maxSlippage)],
    });

    // Ensure that currency ids are sorted
    actions.sort((a, b) => Number(a.currencyId) - Number(b.currencyId));

    return this.populateTxnAndGas(address, 'batchBalanceAndTradeAction', [address, actions, borrowOverrides]);
  }

  /**
   * Returns a lend trade
   *
   * @param address
   * @param lendCurrencySymbol
   * @param depositAmount amount of cash to deposit for lending
   * @param lendfCashAmount fCash amount to lend
   * @param marketIndex market index to lend in
   * @param minSlippage minimum annualized rate to lend at
   * @param withdrawAmountInternalPrecision amount of cash to withdraw
   * @param withdrawEntireCashBalance set this to true to withdraw any residuals back to the wallet
   * @param redeemToUnderlying set this to true to redeem residuals in the underlying
   * @param overrides
   * @returns
   */
  public async lend(
    address: string,
    lendCurrencySymbol: string,
    depositAmount: TypedBigNumber,
    lendfCashAmount: TypedBigNumber,
    marketIndex: number,
    minSlippage: number,
    withdrawAmountInternalPrecision: TypedBigNumber,
    withdrawEntireCashBalance: boolean,
    redeemToUnderlying: boolean,
    overrides = {} as Overrides
  ) {
    const currency = System.getSystem().getCurrencyBySymbol(lendCurrencySymbol);
    lendfCashAmount.check(BigNumberType.InternalUnderlying, currency.underlyingSymbol || currency.symbol);
    withdrawAmountInternalPrecision.check(BigNumberType.InternalAsset, currency.symbol);

    const { actionType, overrides: lendOverrides } = this.getDepositAction(
      lendCurrencySymbol,
      currency,
      depositAmount,
      false,
      overrides
    );

    const lendAction = {
      actionType,
      currencyId: currency.id,
      depositActionAmount: depositAmount.n,
      withdrawAmountInternalPrecision: withdrawAmountInternalPrecision.n,
      withdrawEntireCashBalance,
      redeemToUnderlying,
      trades: [this.encodeTradeType(TradeActionType.Lend, marketIndex, lendfCashAmount, minSlippage, 0)],
    };

    return this.populateTxnAndGas(address, 'batchBalanceAndTradeAction', [address, [lendAction], lendOverrides]);
  }

  /**
   * Returns a batch lend trade (more gas efficient than lend)
   *
   * @param address
   * @param lendCurrencySymbol
   * @param lendfCashAmount fCash amount to lend
   * @param marketIndex market index to lend in
   * @param minSlippage minimum annualized rate to lend at
   * @param overrides
   * @returns
   */
  public async batchLend(
    address: string,
    lendCurrencySymbol: string,
    lendfCashAmount: TypedBigNumber,
    marketIndex: number,
    minSlippage: number,
    overrides = {} as Overrides
  ) {
    if (lendCurrencySymbol === 'ETH') throw Error('ETH cannot be used in batchLend');
    const currency = System.getSystem().getCurrencyBySymbol(lendCurrencySymbol);
    lendfCashAmount.check(BigNumberType.InternalUnderlying, currency.underlyingSymbol || currency.symbol);

    const batchLendAction = {
      currencyId: currency.id,
      depositUnderlying: currency.underlyingSymbol === lendCurrencySymbol,
      trades: [this.encodeTradeType(TradeActionType.Lend, marketIndex, lendfCashAmount, minSlippage, 0)],
    };

    return this.populateTxnAndGas(address, 'batchLend', [address, [batchLendAction], overrides]);
  }

  /**
   * Moves a borrow from one maturity to another by borrowing in the new maturity and using the
   * resulting cash to lend an offsetting position in the current maturity. Due to slippage this will
   * result in some residual balances which are unavoidable.
   *
   * @param address
   * @param asset
   * @param rollToMarketIndex
   * @param borrowfCashAmount
   * @param minLendSlippageTolerance the maximum basis points from the mid rate that lending can slip (negative)
   * @param maxBorrowSlippageTolerance the maximum basis points from the mid rate that borrowing can slip (positive)
   * @param overrides
   * @returns
   */
  public async rollBorrow(
    address: string,
    asset: Asset,
    rollToMarketIndex: number,
    minLendSlippageTolerance: number,
    maxBorrowSlippageTolerance: number,
    overrides = {} as Overrides
  ) {
    if (asset.notional.isPositive() || asset.maturity < getNowSeconds()) throw new Error('Cannot roll borrow asset');
    const currentMarketIndex = CashGroup.getMarketIndexForMaturity(asset.maturity);
    const cashGroup = System.getSystem().getCashGroup(asset.currencyId);
    const assetMarket = cashGroup.getMarket(currentMarketIndex);
    const rollToMarket = cashGroup.getMarket(rollToMarketIndex);

    let { netCashToAccount: netCashRequiredToLend } = assetMarket.getCashAmountGivenfCashAmount(asset.notional.neg());
    const { exchangeRatePostSlippage: lendExchangeRatePostSlippage, annualizedRate: minLendSlippage } =
      Market.getSlippageRate(
        asset.notional.neg(),
        netCashRequiredToLend,
        assetMarket.maturity,
        minLendSlippageTolerance
      );
    // This is the maximum amount of cash required to lend at the worst case lending slippage, account must
    // borrow this much cash from the rollToMarket. Residuals will be left in the cash balance.
    // Returns a postitive number
    netCashRequiredToLend = Market.cashFromExchangeRate(lendExchangeRatePostSlippage, asset.notional).abs();
    let borrowfCashAmount = rollToMarket.getfCashAmountGivenCashAmount(netCashRequiredToLend);
    const { netCashToAccount: netCashFromBorrow } = rollToMarket.getCashAmountGivenfCashAmount(borrowfCashAmount);
    const { exchangeRatePostSlippage: borrowExchangeRatePostSlippage, annualizedRate: maxBorrowSlippage } =
      Market.getSlippageRate(borrowfCashAmount, netCashFromBorrow, rollToMarket.maturity, maxBorrowSlippageTolerance);
    // This is the amount of fCash required to generate sufficient cash after accounting for slippage
    // Returns a positive number
    borrowfCashAmount = Market.fCashFromExchangeRate(borrowExchangeRatePostSlippage, netCashFromBorrow);

    const rollBorrowAction = {
      actionType: DepositActionType.None,
      currencyId: asset.currencyId,
      depositActionAmount: BigNumber.from(0),
      withdrawAmountInternalPrecision: BigNumber.from(0),
      // This may leave the residual in the cash balance, do not withdraw by default because we don't know what the
      // residual is and the account may have previous cash balances that we do not want to withdraw.
      withdrawEntireCashBalance: false,
      redeemToUnderlying: false,
      trades: [
        this.encodeTradeType(TradeActionType.Lend, currentMarketIndex, asset.notional.abs(), minLendSlippage, 0),
        this.encodeTradeType(TradeActionType.Borrow, rollToMarketIndex, borrowfCashAmount.abs(), 0, maxBorrowSlippage),
      ],
    };

    const populatedTransaction = this.populateTxnAndGas(address, 'batchBalanceAndTradeAction', [
      address,
      [rollBorrowAction],
      overrides,
    ]);

    return { populatedTransaction, maxBorrowSlippage };
  }

  /**
   * Repays a debt asset by lending on the corresponding market. The account pays cash and the net negative
   * fCash position will be reduced.
   *
   * @param address
   * @param asset asset to repay
   * @param repayNotionalAmount amount of fCash to repay
   * @param depositAmount amount of cash to deposit to repay
   * @param minLendSlippage
   * @param overrides
   * @returns populated transaction
   */
  public repayBorrow(
    address: string,
    asset: Asset,
    repayCurrencySymbol: string,
    repayNotionalAmount: TypedBigNumber,
    depositAmount: TypedBigNumber,
    minLendSlippage: number,
    overrides = {} as Overrides
  ) {
    if (asset.notional.isPositive() || asset.maturity < getNowSeconds()) throw new Error('Cannot repay borrow asset');
    const currentMarketIndex = CashGroup.getMarketIndexForMaturity(asset.maturity);
    const currency = System.getSystem().getCurrencyBySymbol(repayCurrencySymbol);
    if (currency.id !== asset.currencyId) throw new Error('Incorrect deposit currency for repay');

    return this.lend(
      address,
      repayCurrencySymbol,
      depositAmount,
      repayNotionalAmount,
      currentMarketIndex,
      minLendSlippage,
      depositAmount.toAssetCash(true).copy(0),
      false,
      false,
      overrides
    );
  }

  /**
   * Deleverages a leveraged nToken position, redeems nTokens and repays a borrow
   * using the cash from the nToken redemption.
   *
   * @param address
   * @param repayAsset
   * @param redeemNTokenAmount
   * @param lendfCashAmount
   * @param minLendSlippage
   * @param overrides
   * @returns
   */
  public deleverageNToken(
    address: string,
    repayAsset: Asset,
    redeemNTokenAmount: TypedBigNumber,
    lendfCashAmount: TypedBigNumber,
    minLendSlippage: number,
    overrides = {} as Overrides
  ) {
    if (repayAsset.notional.isPositive() || repayAsset.maturity < getNowSeconds()) {
      throw new Error('Cannot repay borrow asset');
    }
    if (repayAsset.currencyId !== redeemNTokenAmount.currencyId) {
      throw new Error('Currency mismatch');
    }
    const marketIndex = CashGroup.getMarketIndexForMaturity(repayAsset.maturity);
    const currency = System.getSystem().getCurrencyById(repayAsset.currencyId);

    const deleverageAction = {
      actionType: DepositActionType.RedeemNToken,
      currencyId: currency.id,
      depositActionAmount: redeemNTokenAmount.n,
      withdrawAmountInternalPrecision: TypedBigNumber.getZeroUnderlying(currency.id).n,
      withdrawEntireCashBalance: false,
      redeemToUnderlying: false,
      trades: [this.encodeTradeType(TradeActionType.Lend, marketIndex, lendfCashAmount, minLendSlippage, 0)],
    };

    return this.populateTxnAndGas(address, 'batchBalanceAndTradeAction', [address, [deleverageAction], overrides]);
  }

  /**
   * Moves a lending asset from one maturity to another by borrowing from the current market and using the cash to lend
   * in the roll to market.
   *
   * @param address
   * @param asset
   * @param rollToMarketIndex
   * @param minLendSlippageTolerance
   * @param maxBorrowSlippageTolerance
   * @param overrides
   * @returns
   */
  public async rollLend(
    address: string,
    asset: Asset,
    rollToMarketIndex: number,
    minLendSlippageTolerance: number,
    maxBorrowSlippageTolerance: number,
    overrides = {} as Overrides
  ) {
    if (asset.notional.isNegative() || asset.maturity < getNowSeconds()) throw new Error('Cannot roll lend asset');
    const currentMarketIndex = CashGroup.getMarketIndexForMaturity(asset.maturity);
    const cashGroup = System.getSystem().getCashGroup(asset.currencyId);
    const assetMarket = cashGroup.getMarket(currentMarketIndex);
    const rollToMarket = cashGroup.getMarket(rollToMarketIndex);

    // This gets the amount of cash generated by borrowing the fCash amount to net off the lending position.
    // Returns a positive number.
    let { netCashToAccount: netCashGeneratedByBorrow } = assetMarket.getCashAmountGivenfCashAmount(
      asset.notional.neg()
    );
    const { exchangeRatePostSlippage: borrowExchangeRatePostSlippage, annualizedRate: maxBorrowSlippage } =
      Market.getSlippageRate(
        asset.notional.neg(),
        netCashGeneratedByBorrow,
        assetMarket.maturity,
        maxBorrowSlippageTolerance
      );
    // Minimum amount of cash generated by borrowing during worst case slippage (this is a positive number)
    netCashGeneratedByBorrow = Market.cashFromExchangeRate(borrowExchangeRatePostSlippage, asset.notional);

    let lendfCashAmount = rollToMarket.getfCashAmountGivenCashAmount(netCashGeneratedByBorrow.neg());
    const { netCashToAccount: netCashRequiredToLend } = rollToMarket.getCashAmountGivenfCashAmount(lendfCashAmount);
    const { exchangeRatePostSlippage: lendExchangeRatePostSlippage, annualizedRate: minLendSlippage } =
      Market.getSlippageRate(lendfCashAmount, netCashRequiredToLend, rollToMarket.maturity, minLendSlippageTolerance);

    // This is the minimum amount of fCash that can be generated given the slippage to lending (this is a positive
    // amount)
    lendfCashAmount = Market.fCashFromExchangeRate(lendExchangeRatePostSlippage, netCashRequiredToLend).abs();

    const rollLendAction = {
      actionType: DepositActionType.None,
      currencyId: asset.currencyId,
      depositActionAmount: BigNumber.from(0),
      withdrawAmountInternalPrecision: BigNumber.from(0),
      // This may leave the residual in the cash balance, do not withdraw by default because we don't know what
      // the residual is and the account may have previous cash balances that we do not want to withdraw.
      withdrawEntireCashBalance: false,
      redeemToUnderlying: false,
      trades: [
        this.encodeTradeType(TradeActionType.Borrow, currentMarketIndex, asset.notional, 0, maxBorrowSlippage),
        this.encodeTradeType(TradeActionType.Lend, rollToMarketIndex, lendfCashAmount, minLendSlippage, 0),
      ],
    };

    const populatedTransaction = this.populateTxnAndGas(address, 'batchBalanceAndTradeAction', [
      address,
      [rollLendAction],
      overrides,
    ]);

    return { populatedTransaction, minLendSlippage };
  }

  /**
   * Withdraws a lending asset from the market by issuing a borrow transaction. The account receives cash and the
   * net fCash position will be reduced.
   *
   * @param address
   * @param asset selected asset for withdraw
   * @param withdrawNotionalAmount amount of fCash to withdraw
   * @param maxBorrowSlippage
   * @param withdrawEntireCashBalance
   * @param redeemToUnderlying
   * @param overrides
   * @returns
   */
  public withdrawLend(
    address: string,
    asset: Asset,
    withdrawNotionalAmount: TypedBigNumber,
    maxBorrowSlippage: number,
    withdrawEntireCashBalance: boolean,
    redeemToUnderlying: boolean,
    overrides = {} as Overrides
  ) {
    if (asset.notional.isNegative() || asset.maturity < getNowSeconds()) throw new Error('Cannot repay lend asset');
    const currentMarketIndex = CashGroup.getMarketIndexForMaturity(asset.maturity);
    const currency = System.getSystem().getCurrencyById(asset.currencyId);
    withdrawNotionalAmount.check(BigNumberType.InternalUnderlying, currency.underlyingSymbol || currency.symbol);

    const withdrawLendAction = {
      actionType: DepositActionType.None,
      currencyId: asset.currencyId,
      depositActionAmount: BigNumber.from(0),
      withdrawAmountInternalPrecision: BigNumber.from(0),
      withdrawEntireCashBalance,
      redeemToUnderlying,
      trades: [
        this.encodeTradeType(TradeActionType.Borrow, currentMarketIndex, withdrawNotionalAmount, 0, maxBorrowSlippage),
      ],
    };

    return this.populateTxnAndGas(address, 'batchBalanceAndTradeAction', [address, [withdrawLendAction], overrides]);
  }

  // Internal
  private getDepositAction(
    symbol: string,
    currency: Currency,
    amount: TypedBigNumber,
    mintNToken: boolean,
    overrides: Overrides
  ) {
    const isUnderlying = currency.underlyingSymbol === symbol;
    if (isUnderlying && currency.tokenType === TokenType.cETH) {
      amount.check(BigNumberType.ExternalUnderlying, 'ETH');
      return {
        actionType: mintNToken ? DepositActionType.DepositUnderlyingAndMintNToken : DepositActionType.DepositUnderlying,
        overrides: Object.assign(overrides, { value: amount.n }) as ethers.PayableOverrides,
      };
    }

    if (isUnderlying) {
      amount.check(BigNumberType.ExternalUnderlying, currency.underlyingSymbol || currency.symbol);
      return {
        actionType: mintNToken ? DepositActionType.DepositUnderlyingAndMintNToken : DepositActionType.DepositUnderlying,
        overrides,
      };
    }

    amount.check(BigNumberType.ExternalAsset, currency.symbol);
    return {
      actionType: mintNToken ? DepositActionType.DepositAssetAndMintNToken : DepositActionType.DepositAsset,
      overrides,
    };
  }

  private encodeTradeType(
    tradeActionType: TradeActionType,
    marketIndex: number,
    fCashAmount: TypedBigNumber,
    minSlippage: number,
    maxSlippage: number
  ): BytesLike {
    fCashAmount.checkType(BigNumberType.InternalUnderlying);
    switch (tradeActionType) {
      case TradeActionType.Lend:
        return ethers.utils.solidityPack(
          ['uint8', 'uint8', 'uint88', 'uint32', 'uint120'],
          [tradeActionType, marketIndex, fCashAmount, minSlippage, BigNumber.from(0)]
        );

      case TradeActionType.Borrow:
        return ethers.utils.solidityPack(
          ['uint8', 'uint8', 'uint88', 'uint32', 'uint120'],
          [tradeActionType, marketIndex, fCashAmount, maxSlippage, BigNumber.from(0)]
        );

      default:
        throw new Error('Unsupported trade type');
    }
  }
}
