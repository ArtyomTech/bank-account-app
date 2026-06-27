import { createAction, props } from '@ngrx/store';

export const setUser = createAction('[User] Set User', props<{ userId: string; token: string; firstName: string; lastName: string }>());
export const clearUser = createAction('[User] Clear User');
export const login = createAction('[User] Login', props<{ email: string; password: string }>());
export const register = createAction(
  '[User] Register',
  props<{ firstName: string; lastName: string; email: string; password: string }>()
);
export const authFailure = createAction('[User] Auth Failure', props<{ error: string }>());

// Keep legacy alias so existing dispatches keep working during migration
export const setUserId = setUser;
export const createUser = register;
export const createUserFailure = authFailure;
