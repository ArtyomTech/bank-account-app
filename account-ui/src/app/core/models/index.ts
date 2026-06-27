export type Currency = 'EUR' | 'USD' | 'SEK' | 'GBP' | 'VND';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'EXCHANGE_IN' | 'EXCHANGE_OUT';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  currency: Currency;
  balance: number;
  createdAt: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  balanceAfter: number;
  description?: string;
  createdAt: string;
}

export interface TransactionPage {
  content: Transaction[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface BalanceResponse {
  accountId: string;
  currency: Currency;
  balance: number;
}

export interface AuthResponse {
  token: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ExchangeResponse {
  sourceTransaction: Transaction;
  targetTransaction: Transaction;
  exchangeRate: number;
}
