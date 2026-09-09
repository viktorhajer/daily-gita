import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';

import { SlokaModel } from '../model/sloka.model';
import { FavouriteService } from '../services/favourite.service';
import { SlokaService } from '../services/sloka.service';
import { ApplicationStateService } from '../services/application-state.service';

@Component({
  selector: 'app-favourite',
  standalone: false,
  templateUrl: './favourite.component.html',
  styleUrl: './favourite.component.scss',
})
export class FavouriteComponent implements OnInit, OnDestroy {
  readonly slokaService = inject(SlokaService);
  readonly favouriteService = inject(FavouriteService);
  private readonly appStateService = inject(ApplicationStateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly autoRotateIntervalMs = 6000;

  filteredTexts: SlokaModel[] = [];
  currentIndex = 0;
  text = '';
  sloka: SlokaModel | null = null;
  isAutoRotating = false;

  private autoRotateIntervalId: ReturnType<typeof setInterval> | null = null;

  async ngOnInit() {
    this.refreshFavouriteSelection(true);
  }

  ngOnDestroy() {
    this.stopAutoRotate();
  }

  showPrevious() {
    this.refreshFavouriteSelection(false);
    this.rotateText(-1);
  }

  showNext() {
    this.refreshFavouriteSelection(false);
    this.rotateText(1);
  }

  startAutoRotate() {
    this.refreshFavouriteSelection(false);
    if (this.isAutoRotating || this.filteredTexts.length < 2) {
      return;
    }

    this.isAutoRotating = true;
    this.appStateService.setMainMenuHidden(true);
    this.autoRotateIntervalId = setInterval(() => {
      this.showNext();
      this.cdr.detectChanges();
    }, this.autoRotateIntervalMs);
  }

  stopAutoRotate() {
    if (this.autoRotateIntervalId !== null) {
      clearInterval(this.autoRotateIntervalId);
      this.autoRotateIntervalId = null;
    }

    this.isAutoRotating = false;
    this.appStateService.setMainMenuHidden(false);
  }

  remove() {
    this.favouriteService.toggle(this.sloka);
    this.refreshFavouriteSelection(false);
  }

  private rotateText(direction: -1 | 1) {
    if (!this.filteredTexts.length) {
      return;
    }

    this.currentIndex =
      (this.currentIndex + direction + this.filteredTexts.length) % this.filteredTexts.length;
    this.syncActiveText();
  }

  private refreshFavouriteSelection(resetIndex: boolean) {
    const activeKey = this.sloka ? this.toFavouriteKey(this.sloka) : null;

    this.filteredTexts = this.slokaService.texts.filter((item) =>
      this.favouriteService.isFavourite(item)
    );

    if (!this.filteredTexts.length) {
      this.currentIndex = 0;
      this.text = '';
      this.sloka = null;
      return;
    }

    if (resetIndex) {
      this.currentIndex = 0;
    } else if (activeKey) {
      const activeIndex = this.filteredTexts.findIndex(
        (item) => this.toFavouriteKey(item) === activeKey
      );
      this.currentIndex = activeIndex >= 0 ? activeIndex : this.currentIndex;
    }

    if (this.currentIndex >= this.filteredTexts.length) {
      this.currentIndex = 0;
    }

    this.syncActiveText();
  }

  private syncActiveText() {
    const activeSloka = this.filteredTexts[this.currentIndex];
    this.text = activeSloka?.content ?? '';
    this.sloka = activeSloka ?? null;
    if (activeSloka) {
      this.slokaService.lastViewedSloka = activeSloka;
    }
  }

  private toFavouriteKey(sloka: SlokaModel) {
    return `${sloka.chapter}.${sloka.index}`;
  }
}
