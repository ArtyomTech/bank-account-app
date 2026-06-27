import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, Subject } from 'rxjs';
import { map, take, takeUntil } from 'rxjs/operators';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';

import { loadTransactions, deposit, withdraw, exchange } from '../../store/transactions/transaction.actions';
import {
  selectTransactionsForAccount,
  TransactionEntry,
} from '../../store/transactions/transaction.selectors';
import { selectAccountById, selectAllAccounts } from '../../store/accounts/account.selectors';
import { Account, Transaction } from '../../core/models';
import { BalanceChartComponent } from './balance-chart/balance-chart.component';

@Component({
  selector: 'app-account-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    BalanceChartComponent,
    NzCardModule,
    NzGridModule,
    NzListModule,
    NzTagModule,
    NzSpinModule,
    NzStatisticModule,
    NzButtonModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzDividerModule,
    NzEmptyModule,
    NzAlertModule,
    NzTabsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzSelectModule,
  ],
  templateUrl: './account-overview.component.html',
})
export class AccountOverviewComponent implements OnInit, OnDestroy {
  accountId!: string;
  account$!: Observable<Account | null>;
  txState$!: Observable<TransactionEntry>;

  moneyMode: 'deposit' | 'withdraw' | 'exchange' = 'deposit';
  moneyForm!: ReturnType<FormBuilder['group']>;
  exchangeForm!: ReturnType<FormBuilder['group']>;
  otherAccounts$!: Observable<Account[]>;

  private observer?: IntersectionObserver;
  private scrollContainer?: HTMLDivElement;
  private destroy$ = new Subject<void>();

  @ViewChild('txScrollContainer')
  set txScrollContainerRef(ref: ElementRef<HTMLDivElement> | undefined) {
    if (ref) this.scrollContainer = ref.nativeElement;
  }

  @ViewChild('scrollSentinel')
  set scrollSentinel(ref: ElementRef<HTMLDivElement> | undefined) {
    if (ref && !this.observer) {
      this.observer = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) this.loadMore(); },
        { root: this.scrollContainer, rootMargin: '120px' },
      );
      this.observer.observe(ref.nativeElement);
    }
  }

  readonly txTypeColors: Record<string, string> = {
    DEPOSIT: 'success',
    WITHDRAWAL: 'error',
    EXCHANGE_IN: 'processing',
    EXCHANGE_OUT: 'warning',
  };

  readonly txTypeIcons: Record<string, string> = {
    DEPOSIT: 'arrow-down',
    WITHDRAWAL: 'arrow-up',
    EXCHANGE_IN: 'swap',
    EXCHANGE_OUT: 'swap',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private fb: FormBuilder,
    private modal: NzModalService,
  ) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.params['accountId'];
    this.account$ = this.store.select(selectAccountById(this.accountId));
    this.txState$ = this.store.select(selectTransactionsForAccount(this.accountId));
    this.otherAccounts$ = this.store.select(selectAllAccounts).pipe(
      map((accounts) => accounts.filter((a) => a.id !== this.accountId)),
    );

    this.moneyForm = this.fb.group({
      amount: [null, [Validators.required, Validators.min(0.01)]],
      description: [''],
    });
    this.exchangeForm = this.fb.group({
      targetAccountId: [null, [Validators.required]],
      amount: [null, [Validators.required, Validators.min(0.01)]],
    });
    // Navigate home if account is not loaded
    this.account$.pipe(take(1)).subscribe((acc) => {
      if (!acc) {
        this.router.navigate(['/home']);
        return;
      }
    });

    // Load first page of transactions if not yet loaded
    this.txState$.pipe(take(1)).subscribe((state) => {
      if (state.page === -1) {
        this.store.dispatch(loadTransactions({ accountId: this.accountId, page: 0, size: 10 }));
      }
    });
  }

  loadMore(): void {
    this.txState$.pipe(take(1)).subscribe((state) => {
      if (state.hasMore && !state.loading) {
        this.store.dispatch(
          loadTransactions({ accountId: this.accountId, page: state.page + 1, size: 10 }),
        );
      }
    });
  }

  onTabChange(index: number): void {
    this.moneyMode = (['deposit', 'withdraw', 'exchange'] as const)[index];
    this.moneyForm.reset();
    this.exchangeForm.reset();
  }

  submitExchange(otherAccounts: Account[]): void {
    if (this.exchangeForm.invalid) return;
    const { targetAccountId, amount } = this.exchangeForm.value;
    const target = otherAccounts.find((a) => a.id === targetAccountId);
    this.modal.confirm({
      nzTitle: 'Confirm Exchange',
      nzContent: `Exchange <b>${Number(amount).toFixed(2)}</b> to <b>${target?.currency ?? ''}</b> account?`,
      nzOkText: 'Exchange',
      nzOkType: 'primary',
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        this.store.dispatch(exchange({ sourceAccountId: this.accountId, targetAccountId, amount }));
        this.exchangeForm.reset();
      },
    });
  }

  submitMoney(): void {
    if (this.moneyForm.invalid) return;
    const { amount, description } = this.moneyForm.value;
    const desc = description?.trim() || undefined;
    const isDeposit = this.moneyMode === 'deposit';
    const action = isDeposit ? 'Deposit' : 'Withdraw';
    this.modal.confirm({
      nzTitle: `Confirm ${action}`,
      nzContent: `Are you sure you want to <b>${action.toLowerCase()} ${Number(amount).toFixed(2)}</b>?`,
      nzOkText: action,
      nzOkType: isDeposit ? 'primary' : 'default',
      nzOkDanger: !isDeposit,
      nzCancelText: 'Cancel',
      nzOnOk: () => {
        if (isDeposit) {
          this.store.dispatch(deposit({ accountId: this.accountId, amount, description: desc }));
        } else {
          this.store.dispatch(withdraw({ accountId: this.accountId, amount, description: desc }));
        }
        this.moneyForm.reset();
      },
    });
  }

  navigateToTransaction(tx: Transaction): void {
    this.router.navigate(['/accounts', this.accountId, 'transactions', tx.id]);
  }

  trackById(_: number, tx: Transaction): string {
    return tx.id;
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
