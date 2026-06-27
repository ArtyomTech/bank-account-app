import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Account, ExchangeResponse, Transaction } from '../models';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly base = '/api';

  constructor(private http: HttpClient) {}

  createAccount(userId: string, currency: string): Observable<Account> {
    return this.http.post<Account>(`${this.base}/users/${userId}/accounts`, { currency });
  }

  getUserAccounts(userId: string): Observable<Account[]> {
    return this.http.get<Account[]>(`${this.base}/users/${userId}/accounts`);
  }

  deposit(accountId: string, amount: number, description?: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.base}/accounts/${accountId}/deposit`, { amount, description });
  }

  withdraw(accountId: string, amount: number, description?: string): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.base}/accounts/${accountId}/withdraw`, { amount, description });
  }

  exchange(sourceAccountId: string, targetAccountId: string, amount: number): Observable<ExchangeResponse> {
    return this.http.post<ExchangeResponse>(`${this.base}/accounts/exchange`, { sourceAccountId, targetAccountId, amount });
  }
}
