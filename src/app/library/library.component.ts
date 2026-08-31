import { ChangeDetectorRef, Component, inject, OnDestroy } from '@angular/core';

import { ApplicationStateService } from '../services/application-state.service';
import { SlokaService } from '../services/sloka.service';

@Component({
  selector: 'app-library',
  standalone: false,
  templateUrl: './library.component.html',
  styleUrl: './library.component.scss',
})
export class LibraryComponent implements OnDestroy {
  private readonly autoRotateIntervalMs = 6000;
  private readonly slokaService = inject(SlokaService);
  private readonly appStateService = inject(ApplicationStateService);
  private readonly cdr = inject(ChangeDetectorRef);

  texts = this.slokaService.texts;
  currentIndex = 0;
  text = this.texts[0].content ?? '';
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

  startAutoRotate() {
    if (this.isAutoRotating || this.texts.length < 2) {
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
    if (!this.texts.length) {
      return;
    }
    this.currentIndex = (this.currentIndex + direction + this.texts.length) % this.texts.length;
    this.text = this.texts[this.currentIndex].content ?? '';
  }
}



