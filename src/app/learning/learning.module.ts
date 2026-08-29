import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { LearningComponent } from './learning.component';

const routes: Routes = [
  {
    path: '',
    component: LearningComponent,
  },
];

@NgModule({
  declarations: [LearningComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class LearningModule {}

