import { ApplicationConfig, isDevMode, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
import { icons } from './icons-provider';
import { provideNzIcons } from 'ng-zorro-antd/icon';
import { en_US, provideNzI18n } from 'ng-zorro-antd/i18n';
import { registerLocaleData } from '@angular/common';
import en from '@angular/common/locales/en';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { provideEchartsCore } from 'ngx-echarts';

import { userFeature } from './store/user/user.reducer';
import { accountsFeature } from './store/accounts/account.reducer';
import { transactionsFeature } from './store/transactions/transaction.reducer';
import { AccountEffects } from './store/accounts/account.effects';
import { TransactionEffects } from './store/transactions/transaction.effects';
import { UserEffects } from './store/user/user.effects';

import { authInterceptor } from './core/interceptors/auth.interceptor';

registerLocaleData(en);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideNzIcons(icons),
    provideNzI18n(en_US),
    provideStore({
      [userFeature.name]: userFeature.reducer,
      [accountsFeature.name]: accountsFeature.reducer,
      [transactionsFeature.name]: transactionsFeature.reducer,
    }),
    provideEffects([AccountEffects, TransactionEffects, UserEffects]),
    provideStoreDevtools({ maxAge: 25, logOnly: !isDevMode() }),
    provideEchartsCore({ echarts: () => import('echarts') }),
  ],
};
