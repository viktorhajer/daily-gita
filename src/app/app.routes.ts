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
	path: 'learning',
	loadChildren: () => import('./learning/learning.module').then((m) => m.LearningModule),
  },
  {
	path: 'explore',
	loadChildren: () => import('./explore/explore.module').then((m) => m.ExploreModule),
  },
];
