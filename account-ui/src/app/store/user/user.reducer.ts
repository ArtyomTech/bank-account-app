import { createFeature, createReducer, on } from '@ngrx/store';
import { authFailure, clearUser, register, login, setUser } from './user.actions';

const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('bankUserId') : null;
const storedToken = typeof window !== 'undefined' ? localStorage.getItem('bankToken') : null;
const storedFirstName = typeof window !== 'undefined' ? localStorage.getItem('bankFirstName') : null;
const storedLastName = typeof window !== 'undefined' ? localStorage.getItem('bankLastName') : null;

interface UserState {
  userId: string | null;
  token: string | null;
  firstName: string | null;
  lastName: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: UserState = {
  userId: storedUserId,
  token: storedToken,
  firstName: storedFirstName,
  lastName: storedLastName,
  loading: false,
  error: null,
};

export const userFeature = createFeature({
  name: 'user',
  reducer: createReducer(
    initialState,
    on(setUser, (state, { userId, token, firstName, lastName }) => ({ ...state, userId, token, firstName, lastName, loading: false, error: null })),
    on(clearUser, (state) => ({ ...state, userId: null, token: null, firstName: null, lastName: null, error: null })),
    on(login, (state) => ({ ...state, loading: true, error: null })),
    on(register, (state) => ({ ...state, loading: true, error: null })),
    on(authFailure, (state, { error }) => ({ ...state, loading: false, error })),
  ),
});

