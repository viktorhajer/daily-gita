import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ModalComponent } from './components/modal/modal.component';
import { SlokaComponent } from './components/sloka/sloka.component';

@NgModule({
  declarations: [SlokaComponent, ModalComponent],
  imports: [CommonModule],
  exports: [CommonModule, SlokaComponent, ModalComponent],
})
export class SharedModule {}
