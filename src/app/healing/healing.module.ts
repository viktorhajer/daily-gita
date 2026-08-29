import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { HealingComponent } from './healing.component';

const routes: Routes = [
  {
    path: '',
    component: HealingComponent,
  },
];

@NgModule({
  declarations: [HealingComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class HealingModule {}


