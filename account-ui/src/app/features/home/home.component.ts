import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { Subject, combineLatest } from 'rxjs';
import { distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { createAccount, loadAccounts } from '../../store/accounts/account.actions';
import {
  selectAccountsError,
  selectAccountsLoading,
  selectAllAccounts,
  selectCreatingAccount,
  selectCreateError,
} from '../../store/accounts/account.selectors';
import { createUser, setUserId, login, register } from '../../store/user/user.actions';
import { selectCreating, selectUserId, selectUserError, selectFirstName, selectLastName } from '../../store/user/user.selectors';
import { Account } from '../../core/models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    NzCardModule,
    NzGridModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSpinModule,
    NzEmptyModule,
    NzTabsModule,
    NzAlertModule,
    NzStatisticModule,
    NzIconModule,
    NzTagModule,
    NzDividerModule,
    NzSelectModule,
    NzModalModule,
  ],
  templateUrl: './home.component.html',
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);
  private readonly modal = inject(NzModalService);

  userId$ = this.store.select(selectUserId);
  fullName$ = combineLatest([
    this.store.select(selectFirstName),
    this.store.select(selectLastName),
  ]).pipe(map(([first, last]) => (first && last) ? `${first} ${last}` : null));
  accounts$ = this.store.select(selectAllAccounts);
  loading$ = this.store.select(selectAccountsLoading);
  accountsError$ = this.store.select(selectAccountsError);
  creating$ = this.store.select(selectCreating);
  creatingAccount$ = this.store.select(selectCreatingAccount);
  createAccountError$ = this.store.select(selectCreateError);
  userError$ = this.store.select(selectUserError);

  signInForm!: ReturnType<FormBuilder['group']>;
  createForm!: ReturnType<FormBuilder['group']>;
  accountForm!: ReturnType<FormBuilder['group']>;

  readonly currencies = ['EUR', 'USD', 'SEK', 'GBP', 'VND'];

  private destroy$ = new Subject<void>();

  readonly currencyColors: Record<string, string> = {
    EUR: 'blue',
    USD: 'green',
    SEK: 'orange',
    GBP: 'purple',
    VND: 'red',
  };

  ngOnInit(): void {
    this.signInForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });
    this.createForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.maxLength(100)]],
      lastName: ['', [Validators.required, Validators.maxLength(100)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
    });
    this.accountForm = this.fb.group({
      currency: ['EUR', [Validators.required]],
    });

    // Auto-load accounts whenever userId becomes available / changes
    this.userId$
      .pipe(filter(Boolean), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((userId) => this.store.dispatch(loadAccounts({ userId })));
  }

  signIn(): void {
    if (this.signInForm.valid) {
      const { email, password } = this.signInForm.value;
      this.store.dispatch(login({ email: email!, password: password! }));
    }
  }

  createUserSubmit(): void {
    if (this.createForm.valid) {
      const { firstName, lastName, email, password } = this.createForm.value;
      this.store.dispatch(register({ firstName: firstName!, lastName: lastName!, email: email!, password: password! }));
    }
  }

  createAccountSubmit(userId: string): void {
    if (this.accountForm.invalid) return;
    const { currency } = this.accountForm.value;
    this.modal.confirm({
      nzTitle: 'Open New Account',
      nzContent: `Are you sure you want to open a new <b>${currency}</b> account?`,
      nzOkText: 'Open Account',
      nzOkType: 'primary',
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        this.store.dispatch(createAccount({ userId, currency: currency! }));
      },
    });
  }

  trackById(_: number, account: Account): string {
    return account.id;
  }

  formatBalance(balance: number, currency: string): string {
    return `${Number(balance).toFixed(2)} ${currency}`;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
