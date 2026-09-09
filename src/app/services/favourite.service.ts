import { Injectable } from '@angular/core';
import { SlokaModel } from '../model/sloka.model';

@Injectable({
  providedIn: 'root',
})
export class FavouriteService {

  favourites: string[] = [];

  isFavourite(sloka: SlokaModel): boolean {
    return this.favourites.some(fav => fav === sloka.chapter+'.'+sloka.index);
  }

  toggle(sloka: SlokaModel | null) {
    if (!sloka) {
      return;
    }
    if (this.isFavourite(sloka)) {
      this.favourites = this.favourites.filter(f => f !== sloka.chapter+'.'+sloka.index);
    } else {
      this.favourites.push(sloka.chapter+'.'+sloka.index);
    }
  }
}
