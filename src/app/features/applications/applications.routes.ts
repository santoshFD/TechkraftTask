import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { draftWizardCanDeactivate } from '../../core/guards/draft-wizard.guard';

/**
 * Standalone route tree: each screen is a lazy-loaded component (no NgModule).
 * Imported via `loadChildren` in app.routes — valid without a feature module.
 */
export const APPLICATION_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/application-dashboard.component').then((m) => m.ApplicationDashboardComponent),
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard(['SALES', 'ADMIN'])],
    canDeactivate: [draftWizardCanDeactivate],
    loadComponent: () =>
      import('./wizard/application-wizard.component').then((m) => m.ApplicationWizardComponent),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./detail/application-detail.component').then((m) => m.ApplicationDetailComponent),
  },
];
