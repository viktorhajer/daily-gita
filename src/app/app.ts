import { Component, OnInit, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { ApplicationStateService } from './services/application-state.service';
import { SlokaService } from './services/sloka.service';

const IMAGE_ASSETS = [
  'assets/images/decoration_icon_lotus.png',
  'assets/images/decoration_icon_main.png',
  'assets/images/guidance_menu_icon.png',
  'assets/images/icon_sprites.png',
  'assets/images/library_menu_icon.png',
  'assets/images/mind_menu_icon.png',
  'assets/images/practice_menu_icon.png',
  'assets/images/welcome_bottom.png',
  'assets/images/welcome_top_left.png',
  'assets/images/welcome_top_right.png',
];

@Component({
  selector: 'app-root',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  readonly appStateService = inject(ApplicationStateService);
  readonly router = inject(Router);
  private readonly slokaService = inject(SlokaService);

  readonly isLoading = signal(true);

  ngOnInit(): void {
    const imagePromises = IMAGE_ASSETS.map(
      (src) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = src;
        })
    );

    Promise.all([this.slokaService.load(), ...imagePromises]).finally(() => {
      this.isLoading.set(false);
    });
  }
}
