import { Component, input, output } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { ApplicationStatus } from '../../../../core/models/application.model';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { ApplicationStatFilter } from '../application-stat-filter.model';

@Component({
  selector: 'application-filters',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    ActionButtonComponent,
  ],
  templateUrl: './application-filters.component.html',
  styleUrl: './application-filters.component.scss',
})
export class ApplicationFiltersComponent {
  readonly searchControl = input.required<FormControl<string>>();
  readonly statusControl = input.required<FormControl<ApplicationStatus | ''>>();
  readonly statuses = input.required<ApplicationStatus[]>();
  readonly simulatingExpiry = input(false);
  readonly activeStatFilter = input<ApplicationStatFilter>('all');

  readonly simulateExpiry = output<void>();
  readonly clearStatFilter = output<void>();
}
