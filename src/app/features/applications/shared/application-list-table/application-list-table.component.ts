import { DatePipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import {
  ApplicationListSortField,
  ApplicationSortDirection,
} from '../../../../core/models/application.model';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ApplicationListItem } from '../../../../core/models/application.model';
import { ActionButtonComponent } from '../../../../shared/components/action-button/action-button.component';
import { TablePaginationComponent } from '../../../../shared/components/table-pagination/table-pagination.component';
import { ApplicationListViewRole } from '../../../../core/auth/application-role.util';
import { AppRbacDirective } from '../../../../shared/directives/app-rbac.directive';

@Component({
  selector: 'application-list-table',
  standalone: true,
  imports: [
    DatePipe,
    RouterLink,
    MatTableModule,
    MatSortModule,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    ActionButtonComponent,
    TablePaginationComponent,
    AppRbacDirective,
  ],
  templateUrl: './application-list-table.component.html',
  styleUrl: './application-list-table.component.scss',
})
export class ApplicationListTableComponent {
  readonly items = input.required<ApplicationListItem[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly retrying = input(false);

  readonly total = input.required<number>();
  readonly pageIndex = input(0);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25]);

  readonly sortActive = input<ApplicationListSortField>('updatedAt');
  readonly sortDirection = input<ApplicationSortDirection>('desc');
  readonly listViewRole = input<ApplicationListViewRole>('sales');

  readonly retry = output<void>();
  readonly pageChange = output<PageEvent>();
  readonly sortChange = output<Sort>();
  readonly deleteDraft = output<ApplicationListItem>();

  readonly deletingId = input<string | null>(null);

  readonly displayedColumns = computed(() => {
    const view = this.listViewRole();
    const base = ['legalName', 'status'] as string[];
    if (view === 'sales') {
      return [...base, 'assignedReviewerName', 'updatedAt', 'actions'];
    }
    if (view === 'reviewer') {
      return [...base, 'createdByName', 'updatedAt', 'actions'];
    }
    return [...base, 'createdByName', 'assignedReviewerName', 'updatedAt', 'actions'];
  });
}
