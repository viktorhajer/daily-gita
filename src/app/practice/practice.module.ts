import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { WordCompletionComponent } from './word-completion.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: WordCompletionComponent,
  },
  {
    path: ':chapter/:index',
    component: WordCompletionComponent,
  },
];

@NgModule({
  declarations: [WordCompletionComponent],
  imports: [FormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class PracticeModule {}


