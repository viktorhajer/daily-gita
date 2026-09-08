import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';

import { ApplicationStateService } from '../services/application-state.service';
import { SlokaService } from '../services/sloka.service';
import { SlokaModel } from '../model/sloka.model';

@Component({
  selector: 'app-guidance',
  standalone: false,
  templateUrl: './guidance.component.html',
  styleUrl: './guidance.component.scss',
})
export class GuidanceComponent implements OnInit, OnDestroy {
  private readonly autoRotateIntervalMs = 6000;
  readonly slokaService = inject(SlokaService);
  private readonly appStateService = inject(ApplicationStateService);
  private readonly cdr = inject(ChangeDetectorRef);
  private currentRandomIndex = -1;
  private autoRotateIntervalId: ReturnType<typeof setInterval> | null = null;

  text = '';
  sloka: SlokaModel | null = null;
  isAutoRotating = false;

  ngOnInit() {
    this.showRandomSloka();
  }

  ngOnDestroy() {
    this.stopAutoRotate();
  }

  showRandomSloka() {
    if (!this.slokaService.texts.length) {
      this.text = '';
      this.sloka = null;
      this.currentRandomIndex = -1;
      return;
    }

    let randomIndex = Math.floor(Math.random() * this.slokaService.texts.length);
    if (this.slokaService.texts.length >= 2) {
      while (randomIndex === this.currentRandomIndex) {
        randomIndex = Math.floor(Math.random() * this.slokaService.texts.length);
      }
    }

    const randomSloka = this.slokaService.texts[randomIndex];
    this.text = randomSloka?.content ?? '';
    this.sloka = randomSloka ?? '';
    this.currentRandomIndex = randomIndex;
    if (randomSloka) {
      this.slokaService.lastViewedSloka = randomSloka;
    }
  }

  startAutoRotate() {
    if (this.isAutoRotating || this.slokaService.texts.length < 2) {
      return;
    }

    this.isAutoRotating = true;
    this.appStateService.setMainMenuHidden(true);
    this.autoRotateIntervalId = setInterval(() => {
      this.showRandomSloka();
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
}

