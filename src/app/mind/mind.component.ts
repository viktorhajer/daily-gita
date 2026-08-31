import { AfterViewInit, Component, ElementRef, ViewChild, inject } from '@angular/core';
import { SlokaModel } from '../model/sloka.model';
import { SlokaService } from '../services/sloka.service';

@Component({
  selector: 'app-mind',
  standalone: false,
  templateUrl: './mind.component.html',
  styleUrl: './mind.component.scss',
})
export class MindComponent implements AfterViewInit {
  readonly slokaService = inject(SlokaService);

  @ViewChild('categoriesScroll') categoriesScrollEl!: ElementRef<HTMLDivElement>;

  texts = this.slokaService.texts;
  category = this.slokaService.categories[0] ?? '';
  filteredTexts: SlokaModel[] = [];

  currentIndex = 0;
  text = '';
  sloka: SlokaModel | null = null;

  canScrollLeft = false;
  canScrollRight = false;

  constructor() {
    this.applyCategoryFilter(true);
  }

  ngAfterViewInit() {
    setTimeout(() => this.updateScrollState());
  }

  updateScrollState() {
    const el = this.categoriesScrollEl?.nativeElement;
    if (!el) {
      return;
    }
    this.canScrollLeft = el.scrollLeft > 1;
    this.canScrollRight = el.scrollLeft + el.clientWidth < el.scrollWidth - 1;
  }

  scrollCategories(direction: 1 | -1) {
    const container = this.categoriesScrollEl.nativeElement;
    const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
    const containerRect = container.getBoundingClientRect();

    if (direction === 1) {
      const target = buttons.find((btn) => btn.getBoundingClientRect().right > containerRect.right + 1);
      if (target) {
        const rect = target.getBoundingClientRect();
        container.scrollBy({ left: rect.right - containerRect.right, behavior: 'smooth' });
      }
    } else {
      const target = [...buttons].reverse().find((btn) => btn.getBoundingClientRect().left < containerRect.left - 1);
      if (target) {
        const rect = target.getBoundingClientRect();
        container.scrollBy({ left: rect.left - containerRect.left, behavior: 'smooth' });
      }
    }
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
      this.sloka = null;
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
    this.sloka = activeSloka ?? '';
  }
}

