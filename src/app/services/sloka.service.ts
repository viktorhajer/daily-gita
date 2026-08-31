import { Injectable } from '@angular/core';

import { SlokaModel } from '../model/sloka.model';

@Injectable({
  providedIn: 'root',
})
export class SlokaService {
  readonly texts: SlokaModel[] = [
    {
      chapter: 1,
      index: 11,
      categories: ['Reménytelenség', 'Halál'],
      content:
        'A Magasztos Úr szólt: A ‘Védikus tudás szavaival szólsz, mégis oly dolgok fölött bánkódsz, melyek fölött nem volna szabad. Aki valóban bölcs, az nem kesereg sem élő, sem halott felett.',
    }
  ];

  get categories(): string[] {
    const categoriesSet = new Set<string>();
    this.texts.forEach((text) => {
      text.categories?.forEach((category) => categoriesSet.add(category));
    });
    return Array.from(categoriesSet);
  }
}

