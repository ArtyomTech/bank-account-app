import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TransactionPage } from '../models';

@Injectable({ providedIn: 'root' })
export class TransactionService {
  private readonly base = '/api';

  constructor(private http: HttpClient) {}

  getTransactionHistory(accountId: string, page: number, size: number): Observable<TransactionPage> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<TransactionPage>(`${this.base}/accounts/${accountId}/transactions`, { params });
  }
}
