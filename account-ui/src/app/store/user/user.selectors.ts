import { userFeature } from './user.reducer';

export const {
  selectUserId,
  selectToken,
  selectFirstName,
  selectLastName,
  selectLoading: selectCreating,
  selectError: selectUserError,
} = userFeature;
