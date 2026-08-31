import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { MindComponent } from './mind.component';

const routes: Routes = [
  {
    path: '',
    component: MindComponent,
  },
];

@NgModule({
  declarations: [MindComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class MindModule {}



