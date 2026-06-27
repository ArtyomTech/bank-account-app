import { createSelector } from '@ngrx/store';
import { transactionsFeature, TransactionEntry } from './transaction.reducer';

export type { TransactionEntry } from './transaction.reducer';

export const { selectByAccountId } = transactionsFeature;

const emptyEntry = (): TransactionEntry => ({
  items: [],
  page: -1,
  totalPages: 0,
  hasMore: true,
  loading: false,
  submitting: false,
  submitError: null,
});

export const selectTransactionsForAccount = (accountId: string) =>
  createSelector(selectByAccountId, (byAccountId) => byAccountId[accountId] ?? emptyEntry());
