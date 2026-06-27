import { createAction, props } from '@ngrx/store';
import { Transaction } from '../../core/models';

export const loadTransactions = createAction(
  '[Transactions] Load',
  props<{ accountId: string; page: number; size: number }>(),
);
export const loadTransactionsSuccess = createAction(
  '[Transactions] Load Success',
  props<{ accountId: string; transactions: Transaction[]; totalPages: number; page: number }>(),
);
export const loadTransactionsFailure = createAction(
  '[Transactions] Load Failure',
  props<{ accountId: string; error: string }>(),
);

export const deposit = createAction(
  '[Transactions] Deposit',
  props<{ accountId: string; amount: number; description?: string }>(),
);
export const depositSuccess = createAction(
  '[Transactions] Deposit Success',
  props<{ accountId: string; transaction: Transaction }>(),
);
export const depositFailure = createAction(
  '[Transactions] Deposit Failure',
  props<{ accountId: string; error: string }>(),
);

export const withdraw = createAction(
  '[Transactions] Withdraw',
  props<{ accountId: string; amount: number; description?: string }>(),
);
export const withdrawSuccess = createAction(
  '[Transactions] Withdraw Success',
  props<{ accountId: string; transaction: Transaction }>(),
);
export const withdrawFailure = createAction(
  '[Transactions] Withdraw Failure',
  props<{ accountId: string; error: string }>(),
);

export const exchange = createAction(
  '[Transactions] Exchange',
  props<{ sourceAccountId: string; targetAccountId: string; amount: number }>(),
);
export const exchangeSuccess = createAction(
  '[Transactions] Exchange Success',
  props<{ sourceAccountId: string; targetAccountId: string; sourceTransaction: Transaction; targetTransaction: Transaction }>(),
);
export const exchangeFailure = createAction(
  '[Transactions] Exchange Failure',
  props<{ sourceAccountId: string; error: string }>(),
);
