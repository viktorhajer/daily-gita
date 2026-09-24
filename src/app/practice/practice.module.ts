import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { MultipleChoiceComponent } from './multiple-choice/multiple-choice.component';
import { PracticeComponent } from './practice.component';
import { TroubleshooterComponent } from './troubleshooter/troubleshooter.component';
import { WordCompletionComponent } from './word-completion/word-completion.component';

const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    component: PracticeComponent,
  },
  {
    path: 'word-completion',
    component: WordCompletionComponent,
  },
  {
    path: 'word-completion/:chapter/:index',
    component: WordCompletionComponent,
  },
  {
    path: 'multiple-choice',
    component: MultipleChoiceComponent,
  },
  {
    path: 'multiple-choice/:chapter/:index',
    component: MultipleChoiceComponent,
  },
  {
    path: 'troubleshooter',
    component: TroubleshooterComponent,
  },
  {
    path: ':chapter/:index',
    redirectTo: 'word-completion/:chapter/:index',
  },
];

@NgModule({
  declarations: [PracticeComponent, WordCompletionComponent, MultipleChoiceComponent],
  imports: [FormsModule, SharedModule, RouterModule.forChild(routes)],
})
export class PracticeModule {}


