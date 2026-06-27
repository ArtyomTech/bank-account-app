import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { AccountService } from '../../core/services/account.service';
import {
  loadAccounts, loadAccountsFailure, loadAccountsSuccess,
  createAccount, createAccountSuccess, createAccountFailure,
} from './account.actions';

@Injectable()
export class AccountEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AccountService);

  loadAccounts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadAccounts),
      switchMap(({ userId }) =>
        this.api.getUserAccounts(userId).pipe(
          map((accounts) => loadAccountsSuccess({ accounts })),
          catchError((err) =>
            of(loadAccountsFailure({ error: err?.error?.message ?? err.message ?? 'Unknown error' })),
          ),
        ),
      ),
    ),
  );

  createAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(createAccount),
      switchMap(({ userId, currency }) =>
        this.api.createAccount(userId, currency).pipe(
          map((account) => createAccountSuccess({ account })),
          catchError((err) =>
            of(createAccountFailure({ error: err?.error?.message ?? err.message ?? 'Failed to create account' })),
          ),
        ),
      ),
    ),
  );
}
