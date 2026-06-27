import { createEntityAdapter, EntityState } from '@ngrx/entity';
import { createFeature, createReducer, on } from '@ngrx/store';
import { Account } from '../../core/models';
import {
  loadAccounts, loadAccountsFailure, loadAccountsSuccess,
  createAccount, createAccountSuccess, createAccountFailure,
  updateAccountBalance,
} from './account.actions';

export const adapter = createEntityAdapter<Account>();

export interface AccountsState extends EntityState<Account> {
  loading: boolean;
  error: string | null;
  creatingAccount: boolean;
  createError: string | null;
}

const initialState: AccountsState = adapter.getInitialState({
  loading: false,
  error: null,
  creatingAccount: false,
  createError: null,
});

export const accountsFeature = createFeature({
  name: 'accounts',
  reducer: createReducer(
    initialState,
    on(loadAccounts, (state) => ({ ...state, loading: true, error: null })),
    on(loadAccountsSuccess, (state, { accounts }) =>
      adapter.setAll(accounts, { ...state, loading: false }),
    ),
    on(loadAccountsFailure, (state, { error }) => ({ ...state, loading: false, error })),
    on(createAccount, (state) => ({ ...state, creatingAccount: true, createError: null })),
    on(createAccountSuccess, (state, { account }) =>
      adapter.addOne(account, { ...state, creatingAccount: false }),
    ),
    on(createAccountFailure, (state, { error }) => ({ ...state, creatingAccount: false, createError: error })),
    on(updateAccountBalance, (state, { accountId, balance }) =>
      adapter.updateOne({ id: accountId, changes: { balance } }, state),
    ),
  ),
  extraSelectors: ({ selectAccountsState }) => adapter.getSelectors(selectAccountsState),
});
