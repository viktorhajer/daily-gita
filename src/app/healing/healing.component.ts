import { Component, inject } from '@angular/core';
import { SlokaModel } from '../model/sloka.model';
import { SlokaService } from '../services/sloka.service';

@Component({
  selector: 'app-healing',
  standalone: false,
  templateUrl: './healing.component.html',
  styleUrl: './healing.component.scss',
})
export class HealingComponent {
  readonly slokaService = inject(SlokaService);

  texts = this.slokaService.texts;
  category = this.slokaService.categories[0] ?? '';
  filteredTexts: SlokaModel[] = [];

  currentIndex = 0;
  text = '';
  index = '';

  constructor() {
    this.applyCategoryFilter(true);
  }

  showPrevious() {
    this.rotateText(-1);
  }

  showNext() {
    this.rotateText(1);
  }

  setCategory(category: string) {
    if (this.category === category) {
      return;
    }

    this.category = category;
    this.applyCategoryFilter(true);
  }

  private rotateText(direction: -1 | 1) {
    if (!this.filteredTexts.length) {
      return;
    }

    this.currentIndex =
      (this.currentIndex + direction + this.filteredTexts.length) % this.filteredTexts.length;
    this.syncActiveText();
  }

  private applyCategoryFilter(resetIndex: boolean) {
    this.filteredTexts = this.texts.filter((sloka) => sloka.categories?.includes(this.category));

    if (!this.filteredTexts.length) {
      this.currentIndex = 0;
      this.text = '';
      this.index = '';
      return;
    }

    if (resetIndex || this.currentIndex >= this.filteredTexts.length) {
      this.currentIndex = 0;
    }

    this.syncActiveText();
  }

  private syncActiveText() {
    const activeSloka = this.filteredTexts[this.currentIndex];
    this.text = activeSloka?.content ?? '';
    this.index = activeSloka?.index ?? '';
  }
}
