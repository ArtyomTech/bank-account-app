import { createFeature, createReducer, on } from '@ngrx/store';
import { Transaction } from '../../core/models';
import {
  loadTransactions,
  loadTransactionsFailure,
  loadTransactionsSuccess,
  deposit, depositSuccess, depositFailure,
  withdraw, withdrawSuccess, withdrawFailure,
  exchange, exchangeSuccess, exchangeFailure,
} from './transaction.actions';

export interface TransactionEntry {
  items: Transaction[];
  page: number;       // -1 = never loaded
  totalPages: number;
  hasMore: boolean;
  loading: boolean;
  submitting: boolean;
  submitError: string | null;
}

interface TransactionsState {
  byAccountId: Record<string, TransactionEntry>;
}

const initialState: TransactionsState = { byAccountId: {} };

const entryNotLoaded = (): TransactionEntry => ({
  items: [],
  page: -1,
  totalPages: 0,
  hasMore: true,
  loading: false,
  submitting: false,
  submitError: null,
});

export const transactionsFeature = createFeature({
  name: 'transactions',
  reducer: createReducer(
    initialState,
    on(loadTransactions, (state, { accountId }) => ({
      ...state,
      byAccountId: {
        ...state.byAccountId,
        [accountId]: {
          ...(state.byAccountId[accountId] ?? entryNotLoaded()),
          loading: true,
        },
      },
    })),
    on(loadTransactionsSuccess, (state, { accountId, transactions, totalPages, page }) => {
      const existing = state.byAccountId[accountId] ?? entryNotLoaded();
      return {
        ...state,
        byAccountId: {
          ...state.byAccountId,
          [accountId]: {
            ...existing,
            items: page === 0 ? transactions : [...existing.items, ...transactions],
            page,
            totalPages,
            hasMore: page < totalPages - 1,
            loading: false,
          },
        },
      };
    }),
    on(loadTransactionsFailure, (state, { accountId }) => ({
      ...state,
      byAccountId: {
        ...state.byAccountId,
        [accountId]: {
          ...(state.byAccountId[accountId] ?? entryNotLoaded()),
          loading: false,
        },
      },
    })),
    on(deposit, withdraw, (state, { accountId }) => ({
      ...state,
      byAccountId: {
        ...state.byAccountId,
        [accountId]: {
          ...(state.byAccountId[accountId] ?? entryNotLoaded()),
          submitting: true,
          submitError: null,
        },
      },
    })),
    on(depositSuccess, withdrawSuccess, (state, { accountId, transaction }) => {
      const existing = state.byAccountId[accountId] ?? entryNotLoaded();
      return {
        ...state,
        byAccountId: {
          ...state.byAccountId,
          [accountId]: {
            ...existing,
            items: [transaction, ...existing.items],
            submitting: false,
            submitError: null,
          },
        },
      };
    }),
    on(depositFailure, withdrawFailure, (state, { accountId, error }) => ({
      ...state,
      byAccountId: {
        ...state.byAccountId,
        [accountId]: {
          ...(state.byAccountId[accountId] ?? entryNotLoaded()),
          submitting: false,
          submitError: error,
        },
      },
    })),
    on(exchange, (state, { sourceAccountId }) => ({
      ...state,
      byAccountId: {
        ...state.byAccountId,
        [sourceAccountId]: {
          ...(state.byAccountId[sourceAccountId] ?? entryNotLoaded()),
          submitting: true,
          submitError: null,
        },
      },
    })),
    on(exchangeSuccess, (state, { sourceAccountId, targetAccountId, sourceTransaction, targetTransaction }) => {
      const src = state.byAccountId[sourceAccountId] ?? entryNotLoaded();
      const tgt = state.byAccountId[targetAccountId] ?? entryNotLoaded();
      return {
        ...state,
        byAccountId: {
          ...state.byAccountId,
          [sourceAccountId]: { ...src, items: [sourceTransaction, ...src.items], submitting: false, submitError: null },
          [targetAccountId]: { ...tgt, items: [targetTransaction, ...tgt.items] },
        },
      };
    }),
    on(exchangeFailure, (state, { sourceAccountId, error }) => ({
      ...state,
      byAccountId: {
        ...state.byAccountId,
        [sourceAccountId]: {
          ...(state.byAccountId[sourceAccountId] ?? entryNotLoaded()),
          submitting: false,
          submitError: error,
        },
      },
    })),
  ),
});
