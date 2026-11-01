import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, forkJoin } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { ApplicationApiService } from '../../../core/services/application-api.service';
import { Sort } from '@angular/material/sort';
import {
  ApplicationDashboardStats,
  ApplicationListItem,
  ApplicationListSortField,
  ApplicationSortDirection,
  ApplicationStatus,
} from '../../../core/models/application.model';
import { AuthService } from '../../../core/auth/auth.service';
import { ActionButtonComponent } from '../../../shared/components/action-button/action-button.component';
import { ApplicationStatusOverviewComponent } from '../shared/application-status-overview/application-status-overview.component';
import { ApplicationFiltersComponent } from '../shared/application-filters/application-filters.component';
import { ApplicationListTableComponent } from '../shared/application-list-table/application-list-table.component';
import { ApplicationStatFilter } from '../shared/application-stat-filter.model';
import {
  canCreateApplication,
  dashboardHeading,
  listViewRoleForUserRole,
} from '../../../core/auth/application-role.util';
import { DraftDeleteDialogComponent } from '../../../shared/components/draft-delete-dialog/draft-delete-dialog.component';

@Component({
  selector: 'application-dashboard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    ActionButtonComponent,
    ApplicationStatusOverviewComponent,
    ApplicationFiltersComponent,
    ApplicationListTableComponent,
  ],
  templateUrl: './application-dashboard.component.html',
  styleUrl: './application-dashboard.component.scss',
})
export class ApplicationDashboardComponent {
  private readonly api = inject(ApplicationApiService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);

  readonly statuses: ApplicationStatus[] = ['DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED'];
  readonly pageSizeOptions = [5, 10, 25];

  readonly items = signal<ApplicationListItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(0);
  readonly pageSize = signal(10);
  readonly loading = signal(false);
  readonly retrying = signal(false);
  readonly error = signal<string | null>(null);
  readonly creating = signal(false);
  readonly createError = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly deleteError = signal<string | null>(null);
  readonly simulatingExpiry = signal(false);
  readonly stats = signal<ApplicationDashboardStats | null>(null);
  readonly activeStatFilter = signal<ApplicationStatFilter>('all');
  readonly sortBy = signal<ApplicationListSortField>('updatedAt');
  readonly sortDirection = signal<ApplicationSortDirection>('desc');

  readonly listViewRole = computed(() => listViewRoleForUserRole(this.auth.role()));
  readonly heading = computed(() => dashboardHeading(this.auth.role()));
  readonly canCreate = computed(() => canCreateApplication(this.auth.role()));

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly statusControl = new FormControl<ApplicationStatus | ''>('', { nonNullable: true });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.page.set(0);
        this.load();
      });
    this.statusControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.page.set(0);
      this.syncStatFilterFromStatus();
      this.load();
    });
    this.load();
  }

  load(isRetry = false): void {
    if (isRetry) {
      this.retrying.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);

    forkJoin({
      list: this.api.list({
        page: this.page(),
        pageSize: this.pageSize(),
        status: this.statusControl.value,
        search: this.searchControl.value,
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection(),
      }),
      stats: this.api.getStats(),
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.retrying.set(false);
        }),
      )
      .subscribe({
        next: ({ list, stats }) => {
          this.items.set(list.items);
          this.total.set(list.total);
          this.stats.set(stats);
        },
        error: () => {
          this.error.set('Unable to load applications. Please try again.');
        },
      });
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  onSort(event: Sort): void {
    const field = event.active as ApplicationListSortField;
    if (!field || !event.direction) {
      return;
    }
    this.sortBy.set(field);
    this.sortDirection.set(event.direction);
    this.page.set(0);
    this.load();
  }

  createApplication(): void {
    if (!this.canCreate()) {
      this.createError.set('Your role cannot create applications. Sign in as Sales or Admin.');
      return;
    }
    this.createError.set(null);
    this.creating.set(true);
    this.api
      .createDraft()
      .pipe(finalize(() => this.creating.set(false)))
      .subscribe({
        next: (app) => void this.router.navigate(['/applications', app.id, 'edit']),
        error: (err: unknown) => {
          if (err instanceof HttpErrorResponse && err.status === 403) {
            this.createError.set(
              'You do not have permission to create applications. Reviewer accounts can only review assigned work.',
            );
            return;
          }
          this.createError.set('Unable to create application. Please try again.');
        },
      });
  }

  simulateExpiry(): void {
    this.simulatingExpiry.set(true);
    this.api
      .simulateTokenExpiry()
      .pipe(finalize(() => this.simulatingExpiry.set(false)))
      .subscribe({
        next: () => this.load(),
      });
  }

  deleteDraft(row: ApplicationListItem): void {
    const label = row.legalName?.trim() || '(Untitled draft)';
    this.dialog
      .open(DraftDeleteDialogComponent, {
        width: '400px',
        data: { label },
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.deleteError.set(null);
        this.deletingId.set(row.id);
        this.api
          .deleteDraft(row.id)
          .pipe(finalize(() => this.deletingId.set(null)))
          .subscribe({
            next: () => {
              if (this.items().length === 1 && this.page() > 0) {
                this.page.update((p) => p - 1);
              }
              this.load();
            },
            error: (err: unknown) => {
              if (err instanceof HttpErrorResponse && err.status === 403) {
                this.deleteError.set('You do not have permission to delete this application.');
                return;
              }
              this.deleteError.set('Unable to delete application. Please try again.');
            },
          });
      });
  }

  applyStatFilter(filter: ApplicationStatFilter): void {
    this.activeStatFilter.set(filter);
    this.page.set(0);
    switch (filter) {
      case 'draft':
        this.statusControl.setValue('DRAFT', { emitEvent: false });
        break;
      case 'pending':
        this.statusControl.setValue('IN_REVIEW', { emitEvent: false });
        break;
      case 'completed':
        this.statusControl.setValue('APPROVED', { emitEvent: false });
        break;
      default:
        this.statusControl.setValue('', { emitEvent: false });
        break;
    }
    this.load();
  }

  private syncStatFilterFromStatus(): void {
    const status = this.statusControl.value;
    if (!status) {
      this.activeStatFilter.set('all');
    } else if (status === 'DRAFT') {
      this.activeStatFilter.set('draft');
    } else if (status === 'SUBMITTED' || status === 'IN_REVIEW') {
      this.activeStatFilter.set('pending');
    } else {
      this.activeStatFilter.set('completed');
    }
  }
}
