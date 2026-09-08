import { ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';

import { SlokaModel } from '../model/sloka.model';
import { ApplicationStateService } from '../services/application-state.service';
import { SlokaService } from '../services/sloka.service';

@Component({
  selector: 'app-chapters',
  standalone: false,
  templateUrl: './chapters.component.html',
  styleUrl: './chapters.component.scss',
})
export class ChaptersComponent implements OnDestroy {
  private readonly autoRotateIntervalMs = 6000;
  readonly slokaService = inject(SlokaService);
  private readonly appStateService = inject(ApplicationStateService);
  private readonly cdr = inject(ChangeDetectorRef);

  texts = this.slokaService.texts;
  chapter: string | null = null;
  filteredTexts: SlokaModel[] = [];
  currentIndex = 0;
  text = '';
  sloka: SlokaModel | null = null;
  isAutoRotating = false;

  private autoRotateIntervalId: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy() {
    this.stopAutoRotate();
  }

  showPrevious() {
    this.rotateText(-1);
  }

  showNext() {
    this.rotateText(1);
  }

  setChapter(chapter: string) {
    if (this.chapter === chapter) {
      return;
    }

    this.stopAutoRotate();
    this.chapter = chapter;
    this.applyChapterFilter(true);
  }

  showChapterSelector() {
    this.stopAutoRotate();
    this.resetSelection();
  }

  startAutoRotate() {
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

  private rotateText(direction: -1 | 1) {
    if (!this.filteredTexts.length) {
      return;
    }

    this.currentIndex =
      (this.currentIndex + direction + this.filteredTexts.length) % this.filteredTexts.length;
    this.syncActiveText();
  }

  private applyChapterFilter(resetIndex: boolean) {
    if (!this.chapter) {
      this.resetSelection();
      return;
    }

    this.filteredTexts = this.texts.filter((sloka) => sloka.chapter.toString() === this.chapter);

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
    this.sloka = activeSloka ?? null;
    if (activeSloka) {
      this.slokaService.lastViewedSloka = activeSloka;
    }
  }

  private resetSelection() {
    this.chapter = null;
    this.filteredTexts = [];
    this.currentIndex = 0;
    this.text = '';
    this.sloka = null;
  }
}




