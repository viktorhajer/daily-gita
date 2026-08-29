import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SlokaComponent } from './components/sloka/sloka.component';

@NgModule({
  declarations: [SlokaComponent],
  imports: [CommonModule],
  exports: [CommonModule, SlokaComponent],
})
export class SharedModule {}

