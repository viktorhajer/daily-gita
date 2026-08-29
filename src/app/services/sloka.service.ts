import { Injectable } from '@angular/core';

import { SlokaModel } from '../model/sloka.model';

@Injectable({
  providedIn: 'root',
})
export class SlokaService {
  readonly texts: SlokaModel[] = [
    {
      index: '2.11',
      categories: ['Reménytelenség', 'Halál'],
      content:
        'A Magasztos Úr szólt: A ‘Védikus tudás szavaival szólsz, mégis oly dolgok fölött bánkódsz, melyek fölött nem volna szabad. Aki valóban bölcs, az nem kesereg sem élő, sem halott felett.',
    },
    {
      index: '2.3',
      categories: ['Reménytelenség'],
      content:
        'Nem bukhat el gyáván (férfiatlanul) egy oly nagy harcos, mint te, ó Pártha! Ez nem méltó hozzád! Rázd le magadról a szív kicsinyes gyöngeségeit! Serkenj fel a harcra Parantapa (Ellenség ostora)!',
    },
    {
      index: '2.23',
      categories: ['Halál', 'Félelem'],
      content:
        'A lelket semmilyen fegyver nem képes megsebezni vagy széthasítani. Tűz nem égeti, víz nem nedvesítheti és szél sem száríthatja.',
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

