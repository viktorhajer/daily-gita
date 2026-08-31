import { Routes } from '@angular/router';

export const routes: Routes = [
  {
	path: 'healing',
	loadChildren: () => import('./healing/healing.module').then((m) => m.HealingModule),
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
	path: 'explore',
	loadChildren: () => import('./explore/explore.module').then((m) => m.ExploreModule),
  },
];
