import { inject, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { authFailure, clearUser, login, register, setUser } from './user.actions';

@Injectable()
export class UserEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AuthService);

  login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(login),
      switchMap(({ email, password }) =>
        this.api.login(email, password).pipe(
          map((res) => setUser({ userId: res.userId, token: res.token, firstName: res.firstName, lastName: res.lastName })),
          catchError((err) =>
            of(authFailure({ error: err?.error?.message ?? err.message ?? 'Login failed' })),
          ),
        ),
      ),
    ),
  );

  register$ = createEffect(() =>
    this.actions$.pipe(
      ofType(register),
      switchMap(({ firstName, lastName, email, password }) =>
        this.api.register(firstName, lastName, email, password).pipe(
          map((res) => setUser({ userId: res.userId, token: res.token, firstName: res.firstName, lastName: res.lastName })),
          catchError((err) =>
            of(authFailure({ error: err?.error?.message ?? err.message ?? 'Registration failed' })),
          ),
        ),
      ),
    ),
  );

  persistUser$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(setUser),
        tap(({ userId, token, firstName, lastName }) => {
          localStorage.setItem('bankUserId', userId);
          localStorage.setItem('bankToken', token);
          localStorage.setItem('bankFirstName', firstName);
          localStorage.setItem('bankLastName', lastName);
        }),
      ),
    { dispatch: false },
  );

  clearUser$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(clearUser),
        tap(() => {
          localStorage.removeItem('bankUserId');
          localStorage.removeItem('bankToken');
          localStorage.removeItem('bankFirstName');
          localStorage.removeItem('bankLastName');
        }),
      ),
    { dispatch: false },
  );
}

