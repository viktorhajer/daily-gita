import { Injectable } from '@angular/core';

import { SlokaModel } from '../model/sloka.model';

@Injectable({
  providedIn: 'root',
})
export class SlokaService {
  readonly texts: SlokaModel[] = [
    {
      index: '1.2',
      categories: ['dharma', 'karma', 'action'],
      content:
        'Most zavarban vagyok a saját kötelességemet, Dharmámat illetően, s gyengeségem miatt elvesztettem a lélekjelenlétemet. Meghódolt tanítványként kérek menedéket Tőled, kérlek, oktass engem a cselekvés helyes módját illetően.',
    },
    {
      index: '1.56',
      categories: ['dharma', 'faith'],
      content: 'kérlek, oktass engem a cselekvés helyes módját illetően.'
    },
  ];

  get categories(): string[] {
    const categoriesSet = new Set<string>();
    this.texts.forEach((text) => {
      text.categories?.forEach((category) => categoriesSet.add(category));
    });
    return Array.from(categoriesSet);
  }
}

