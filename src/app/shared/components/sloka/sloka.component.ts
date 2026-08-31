import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
} from '@angular/core';
import { SlokaModel } from '../../../model/sloka.model';

@Component({
  selector: 'app-sloka',
  standalone: false,
  templateUrl: './sloka.component.html',
  styleUrl: './sloka.component.scss',
})
export class SlokaComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() sloka: SlokaModel | null = null;
  @Input() text = '';

  displayedText = '';
  displayedSloka: SlokaModel | null = null;
  isVisible = false;
  isExiting = false;
  isTransitioning = false;

  private readonly animationDuration = 500;
  private readonly cdr = inject(ChangeDetectorRef);
  private transitionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private enterCompletionTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private enterFrameId: number | null = null;
  private pendingText: string | null = null;
  private pendingSloka: SlokaModel | null = null;
  private hasViewInitialized = false;

  ngAfterViewInit() {
    this.hasViewInitialized = true;
    this.displayedText = this.text ?? '';
    this.displayedSloka = this.sloka ?? null;
    this.animateIn();
  }

  ngOnDestroy() {
    this.clearScheduledAnimation();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes['text'] && !changes['sloka']) {
      return;
    }

    const nextText = this.text ?? '';
    const nextSloka = this.sloka ?? null;

    if (!this.hasViewInitialized) {
      this.displayedText = nextText;
      this.displayedSloka = nextSloka;
      return;
    }

    if (nextText === this.displayedText && nextSloka === this.displayedSloka) {
      return;
    }

    this.pendingText = nextText;
    this.pendingSloka = nextSloka;

    if (!this.isTransitioning) {
      this.startExitThenEnter();
    }
  }

  private startExitThenEnter() {
    if (!this.hasPendingChange()) {
      return;
    }

    if (!this.displayedText) {
      this.applyPendingChange();
      this.animateIn();
      return;
    }

    this.clearScheduledAnimation();
    this.isTransitioning = true;
    this.isExiting = true;
    this.isVisible = false;
    this.cdr.detectChanges();

    this.transitionTimeoutId = setTimeout(() => {
      this.transitionTimeoutId = null;
      this.applyPendingChange();
      this.isExiting = false;
      this.animateIn();
    }, this.animationDuration);
  }

  private animateIn() {
    this.clearScheduledAnimation();
    this.isExiting = false;
    this.isTransitioning = true;
    this.isVisible = false;

    this.enterFrameId = requestAnimationFrame(() => {
      this.isVisible = true;
      this.enterFrameId = null;
      this.cdr.detectChanges();

      this.enterCompletionTimeoutId = setTimeout(() => {
        this.isTransitioning = false;
        this.enterCompletionTimeoutId = null;
        this.cdr.detectChanges();

        if (this.hasPendingChange()) {
          this.startExitThenEnter();
        }
      }, this.animationDuration);
    });
  }

  private hasPendingChange() {
    return this.pendingText !== null || this.pendingSloka !== null;
  }

  private applyPendingChange() {
    if (!this.hasPendingChange()) {
      return;
    }

    this.displayedText = this.pendingText ?? this.displayedText;
    this.displayedSloka = this.pendingSloka ?? this.displayedSloka;
    this.pendingText = null;
    this.pendingSloka = null;
  }

  private clearScheduledAnimation() {
    if (this.transitionTimeoutId !== null) {
      clearTimeout(this.transitionTimeoutId);
      this.transitionTimeoutId = null;
    }

    if (this.enterCompletionTimeoutId !== null) {
      clearTimeout(this.enterCompletionTimeoutId);
      this.enterCompletionTimeoutId = null;
    }

    if (this.enterFrameId !== null) {
      cancelAnimationFrame(this.enterFrameId);
      this.enterFrameId = null;
    }
  }
}
