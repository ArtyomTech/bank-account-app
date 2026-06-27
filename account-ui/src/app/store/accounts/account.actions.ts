import { createAction, props } from '@ngrx/store';
import { Account } from '../../core/models';

export const loadAccounts = createAction('[Accounts] Load', props<{ userId: string }>());
export const loadAccountsSuccess = createAction(
  '[Accounts] Load Success',
  props<{ accounts: Account[] }>(),
);
export const loadAccountsFailure = createAction(
  '[Accounts] Load Failure',
  props<{ error: string }>(),
);

export const createAccount = createAction(
  '[Accounts] Create',
  props<{ userId: string; currency: string }>(),
);
export const createAccountSuccess = createAction(
  '[Accounts] Create Success',
  props<{ account: Account }>(),
);
export const createAccountFailure = createAction(
  '[Accounts] Create Failure',
  props<{ error: string }>(),
);
export const updateAccountBalance = createAction(
  '[Accounts] Update Balance',
  props<{ accountId: string; balance: number }>(),
);
