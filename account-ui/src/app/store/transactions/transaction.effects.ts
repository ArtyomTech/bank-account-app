import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, mergeMap, switchMap } from 'rxjs/operators';
import { AccountService } from '../../core/services/account.service';
import { TransactionService } from '../../core/services/transaction.service';
import {
  loadTransactions, loadTransactionsFailure, loadTransactionsSuccess,
  deposit, depositSuccess, depositFailure,
  withdraw, withdrawSuccess, withdrawFailure,
  exchange, exchangeSuccess, exchangeFailure,
} from './transaction.actions';
import { updateAccountBalance } from '../accounts/account.actions';

@Injectable()
export class TransactionEffects {
  private readonly actions$ = inject(Actions);
  private readonly accountApi = inject(AccountService);
  private readonly transactionApi = inject(TransactionService);

  loadTransactions$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadTransactions),
      switchMap(({ accountId, page, size }) =>
        this.transactionApi.getTransactionHistory(accountId, page, size).pipe(
          map((res) =>
            loadTransactionsSuccess({
              accountId,
              transactions: res.content,
              totalPages: res.totalPages,
              page: res.page,
            }),
          ),
          catchError((err) =>
            of(
              loadTransactionsFailure({
                accountId,
                error: err?.error?.message ?? err.message ?? 'Unknown error',
              }),
            ),
          ),
        ),
      ),
    ),
  );

  deposit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(deposit),
      mergeMap(({ accountId, amount, description }) =>
        this.accountApi.deposit(accountId, amount, description).pipe(
          mergeMap((tx) => of(
            depositSuccess({ accountId, transaction: tx }),
            updateAccountBalance({ accountId, balance: tx.balanceAfter }),
          )),
          catchError((err) =>
            of(depositFailure({ accountId, error: err?.error?.message ?? err.message ?? 'Deposit failed' })),
          ),
        ),
      ),
    ),
  );

  withdraw$ = createEffect(() =>
    this.actions$.pipe(
      ofType(withdraw),
      mergeMap(({ accountId, amount, description }) =>
        this.accountApi.withdraw(accountId, amount, description).pipe(
          mergeMap((tx) => of(
            withdrawSuccess({ accountId, transaction: tx }),
            updateAccountBalance({ accountId, balance: tx.balanceAfter }),
          )),
          catchError((err) =>
            of(withdrawFailure({ accountId, error: err?.error?.message ?? err.message ?? 'Withdrawal failed' })),
          ),
        ),
      ),
    ),
  );

  exchange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(exchange),
      mergeMap(({ sourceAccountId, targetAccountId, amount }) =>
        this.accountApi.exchange(sourceAccountId, targetAccountId, amount).pipe(
          mergeMap((res) => of(
            exchangeSuccess({ sourceAccountId, targetAccountId, sourceTransaction: res.sourceTransaction, targetTransaction: res.targetTransaction }),
            updateAccountBalance({ accountId: sourceAccountId, balance: res.sourceTransaction.balanceAfter }),
            updateAccountBalance({ accountId: targetAccountId, balance: res.targetTransaction.balanceAfter }),
          )),
          catchError((err) =>
            of(exchangeFailure({ sourceAccountId, error: err?.error?.message ?? err.message ?? 'Exchange failed' })),
          ),
        ),
      ),
    ),
  );
}
