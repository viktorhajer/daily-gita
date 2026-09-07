import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { ChaptersComponent } from './chapters.component';

const routes: Routes = [
  {
    path: '',
    component: ChaptersComponent,
  },
];

@NgModule({
  declarations: [ChaptersComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class ChaptersModule {}





