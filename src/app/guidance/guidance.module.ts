import { NgModule } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { GuidanceComponent } from './guidance.component';

const routes: Routes = [
  {
    path: '',
    component: GuidanceComponent,
  },
];

@NgModule({
  declarations: [GuidanceComponent],
  imports: [SharedModule, RouterModule.forChild(routes), RouterLink, RouterLinkActive],
})
export class GuidanceModule {}

