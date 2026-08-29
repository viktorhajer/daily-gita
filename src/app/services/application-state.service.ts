import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ApplicationStateService {
  readonly hideMainMenu = signal(false);

  setMainMenuHidden(hidden: boolean) {
    this.hideMainMenu.set(hidden);
  }
}

