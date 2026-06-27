import { createSelector } from '@ngrx/store';
import { accountsFeature } from './account.reducer';

export const {
  selectAll: selectAllAccounts,
  selectEntities: selectAccountEntities,
  selectLoading: selectAccountsLoading,
  selectError: selectAccountsError,
  selectCreatingAccount,
  selectCreateError,
} = accountsFeature;

export const selectAccountById = (id: string) =>
  createSelector(selectAccountEntities, (entities) => entities[id] ?? null);
