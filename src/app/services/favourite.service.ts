import { Injectable } from '@angular/core';
import { SlokaModel } from '../model/sloka.model';

@Injectable({
  providedIn: 'root',
})
export class FavouriteService {
  private readonly storageKey = 'daily-gita.favourites';

  favourites: string[] = [];

  constructor() {
    this.favourites = this.loadFavourites();
  }

  isFavourite(sloka: SlokaModel): boolean {
    return this.favourites.some((fav) => fav === sloka.chapter + '.' + sloka.index);
  }

  toggle(sloka: SlokaModel | null) {
    if (!sloka) {
      return;
    }

    if (this.isFavourite(sloka)) {
      this.favourites = this.favourites.filter((f) => f !== sloka.chapter + '.' + sloka.index);
    } else {
      this.favourites.push(sloka.chapter + '.' + sloka.index);
    }

    this.persistFavourites();
  }

  private loadFavourites(): string[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }

      const validated = parsed.filter((item): item is string => typeof item === 'string');
      return Array.from(new Set(validated));
    } catch {
      return [];
    }
  }

  private persistFavourites() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.favourites));
    } catch {
      // Ignore storage write failures (e.g. private mode or quota issues).
    }
  }
}
