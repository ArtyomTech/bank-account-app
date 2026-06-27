import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { take } from 'rxjs/operators';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBreadCrumbModule } from 'ng-zorro-antd/breadcrumb';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzResultModule } from 'ng-zorro-antd/result';

import { selectTransactionsForAccount } from '../../store/transactions/transaction.selectors';
import { loadTransactions } from '../../store/transactions/transaction.actions';
import { selectAccountById } from '../../store/accounts/account.selectors';
import { Account, Transaction } from '../../core/models';

@Component({
  selector: 'app-transaction-overview',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    NzCardModule,
    NzDescriptionsModule,
    NzButtonModule,
    NzTagModule,
    NzIconModule,
    NzBreadCrumbModule,
    NzSpinModule,
    NzDividerModule,
    NzResultModule,
  ],
  templateUrl: './transaction-overview.component.html',
})
export class TransactionOverviewComponent implements OnInit {
  accountId!: string;
  transactionId!: string;
  transaction: Transaction | null = null;
  account: Account | null = null;
  loading = true;
  exporting = false;

  readonly txTypeColors: Record<string, string> = {
    DEPOSIT: '#52c41a',
    WITHDRAWAL: '#ff4d4f',
    EXCHANGE_IN: '#1890ff',
    EXCHANGE_OUT: '#faad14',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.params['accountId'];
    this.transactionId = this.route.snapshot.params['transactionId'];

    // Load account info
    this.store
      .select(selectAccountById(this.accountId))
      .pipe(take(1))
      .subscribe((acc) => (this.account = acc));

    // Try to find transaction in state
    this.store
      .select(selectTransactionsForAccount(this.accountId))
      .pipe(take(1))
      .subscribe((state) => {
        const found = state.items.find((t) => t.id === this.transactionId);
        if (found) {
          this.transaction = found;
          this.loading = false;
        } else if (state.page === -1) {
          // Transactions not loaded yet — dispatch load and wait
          this.store.dispatch(
            loadTransactions({ accountId: this.accountId, page: 0, size: 50 }),
          );
          this.store.select(selectTransactionsForAccount(this.accountId)).subscribe((s) => {
            if (!s.loading) {
              this.transaction = s.items.find((t) => t.id === this.transactionId) ?? null;
              this.loading = false;
            }
          });
        } else {
          this.loading = false;
        }
      });
  }

  async exportPdf(): Promise<void> {
    if (!this.transaction) return;
    this.exporting = true;

    try {
      const [{ jsPDF }] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'), // side-effect: patches jsPDF.prototype
      ]);

      const tx = this.transaction;
      const doc = new jsPDF();

      const isCredit = tx.type === 'DEPOSIT' || tx.type === 'EXCHANGE_IN';
      const typeLabel = tx.type.replace('_', ' ');
      const sign = isCredit ? '+' : '-';
      const amountColor: [number, number, number] = isCredit ? [56, 158, 13] : [207, 19, 34];

      // Title bar
      doc.setFillColor(...(isCredit ? [246, 255, 237] : [255, 242, 240]) as [number, number, number]);
      doc.rect(0, 0, 210, 38, 'F');

      doc.setFontSize(22);
      doc.setTextColor(...amountColor);
      doc.text(typeLabel, 14, 16);

      doc.setFontSize(28);
      doc.setTextColor(...amountColor);
      doc.text(`${sign}${Number(tx.amount).toFixed(2)} ${tx.currency}`, 14, 30);

      doc.setFontSize(10);
      doc.setTextColor(120, 120, 120);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 36, { align: 'right' });

      // Details table — no header row
      (doc as any).autoTable({
        startY: 44,
        head: [],
        body: [
          ['Transaction ID', tx.id],
          ['Type', typeLabel],
          ['Amount', `${sign}${Number(tx.amount).toFixed(4)} ${tx.currency}`],
          ['Balance After', `${Number(tx.balanceAfter).toFixed(4)} ${tx.currency}`],
          ['Description', (tx.description ?? '\u2014').replace('\u2192', 'to')],
          ['Date & Time', new Date(tx.createdAt).toLocaleString()],
          ['Account ID', this.accountId],
        ],
        showHead: false,
        theme: 'grid',
        alternateRowStyles: { fillColor: [248, 250, 252] },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 45, textColor: [80, 80, 80] },
          1: { textColor: [30, 30, 30] },
        },
      });

      doc.save(`transaction-${tx.id.slice(0, 8)}.pdf`);
    } finally {
      this.exporting = false;
      this.cdr.detectChanges();
    }
  }

  goBack(): void {
    this.router.navigate(['/accounts', this.accountId]);
  }
}
