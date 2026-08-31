import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SharedModule } from '../shared/shared.module';
import { LibraryComponent } from './library.component';

const routes: Routes = [
  {
    path: '',
    component: LibraryComponent,
  },
];

@NgModule({
  declarations: [LibraryComponent],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class LibraryModule {}




