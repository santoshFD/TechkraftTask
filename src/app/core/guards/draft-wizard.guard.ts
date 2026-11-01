import { CanDeactivateFn } from '@angular/router';
import { ApplicationWizardComponent } from '../../features/applications/wizard/application-wizard.component';

export const draftWizardCanDeactivate: CanDeactivateFn<ApplicationWizardComponent> = (component) =>
  component.confirmLeave();
