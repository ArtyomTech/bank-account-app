import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/home' },
  {
    path: 'home',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'accounts/:accountId',
    loadComponent: () =>
      import('./features/account-overview/account-overview.component').then(
        (m) => m.AccountOverviewComponent,
      ),
  },
  {
    path: 'accounts/:accountId/transactions/:transactionId',
    loadComponent: () =>
      import('./features/transaction-overview/transaction-overview.component').then(
        (m) => m.TransactionOverviewComponent,
      ),
  },
  { path: '**', redirectTo: '/home' },
];
