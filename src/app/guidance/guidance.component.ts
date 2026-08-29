import { Component, inject, OnInit } from '@angular/core';

import { SlokaService } from '../services/sloka.service';

@Component({
  selector: 'app-guidance',
  standalone: false,
  templateUrl: './guidance.component.html',
  styleUrl: './guidance.component.scss',
})
export class GuidanceComponent implements OnInit {
  private readonly slokaService = inject(SlokaService);
  private currentRandomIndex = -1;

  text = '';
  index = '';

  ngOnInit() {
    this.showRandomSloka();
  }

  showRandomSloka() {
    if (!this.slokaService.texts.length) {
      this.text = '';
      this.index = '';
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
    this.index = randomSloka?.index ?? '';
    this.currentRandomIndex = randomIndex;
  }
}

