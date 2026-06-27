import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { selectUserId, selectFirstName, selectLastName } from './store/user/user.selectors';
import { clearUser } from './store/user/user.actions';

@Component({
  selector: 'app-root',
  imports: [
    RouterLink,
    RouterOutlet,
    AsyncPipe,
    NzIconModule,
    NzLayoutModule,
    NzMenuModule,
    NzButtonModule,
    NzDropDownModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly store = inject(Store);
  isCollapsed = false;
  userId$ = this.store.select(selectUserId);
  fullName$ = combineLatest([
    this.store.select(selectFirstName),
    this.store.select(selectLastName),
  ]).pipe(map(([first, last]) => (first && last) ? `${first} ${last}` : null));

  switchUser(): void {
    this.store.dispatch(clearUser());
  }
}
