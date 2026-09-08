import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { PracticeComponent } from './practice.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: PracticeComponent,
  },
  {
    path: ':chapter/:index',
    component: PracticeComponent,
  },
];

@NgModule({
  declarations: [PracticeComponent],
  imports: [FormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class PracticeModule {}


