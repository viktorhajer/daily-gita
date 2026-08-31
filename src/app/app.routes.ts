import { Routes } from '@angular/router';

export const routes: Routes = [
  {
	path: 'mind',
	loadChildren: () => import('./mind/mind.module').then((m) => m.MindModule),
  },
  {
	path: 'guidance',
	loadChildren: () => import('./guidance/guidance.module').then((m) => m.GuidanceModule),
  },
  {
	path: 'practice',
	loadChildren: () => import('./practice/practice.module').then((m) => m.PracticeModule),
  },
  {
	path: 'library',
	loadChildren: () => import('./library/library.module').then((m) => m.LibraryModule),
  },
];
