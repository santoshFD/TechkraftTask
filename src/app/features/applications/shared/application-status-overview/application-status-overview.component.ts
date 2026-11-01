import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { ApplicationDashboardStats } from '../../../../core/models/application.model';
import { ApplicationStatFilter } from '../application-stat-filter.model';
import { ApplicationListViewRole } from '../../../../core/auth/application-role.util';

export interface StatusOverviewItem {
  key: ApplicationStatFilter;
  value: number;
  label: string;
  hint: string;
  icon: string;
  toneClass: string;
}

@Component({
  selector: 'application-status-overview',
  standalone: true,
  imports: [NgClass, MatCardModule, MatIconModule],
  templateUrl: './application-status-overview.component.html',
  styleUrl: './application-status-overview.component.scss',
})
export class ApplicationStatusOverviewComponent {
  readonly stats = input.required<ApplicationDashboardStats>();
  readonly activeFilter = input<ApplicationStatFilter>('all');
  readonly viewRole = input<ApplicationListViewRole>('sales');

  readonly filterChange = output<ApplicationStatFilter>();

  items(stats: ApplicationDashboardStats): StatusOverviewItem[] {
    const role = this.viewRole();
    const draftHint =
      role === 'sales' ? 'Your drafts not yet submitted' : role === 'reviewer' ? 'Not shown in your queue' : 'All drafts in the system';
    const pendingHint =
      role === 'reviewer'
        ? 'Waiting for your review decision'
        : role === 'admin'
          ? 'Submitted and in review — assign reviewers as needed'
          : 'Submitted and awaiting review';
    const completedHint =
      role === 'reviewer' ? 'Applications you approved or rejected' : 'Approved and rejected outcomes';

    return [
      {
        key: 'draft',
        value: stats.draft,
        label: 'Draft',
        hint: draftHint,
        icon: 'edit_note',
        toneClass: 'tone-draft',
      },
      {
        key: 'pending',
        value: stats.pendingReview,
        label: role === 'reviewer' ? 'My review queue' : 'Pending review',
        hint: pendingHint,
        icon: 'pending_actions',
        toneClass: 'tone-pending',
      },
      {
        key: 'completed',
        value: stats.completed,
        label: 'Decided',
        hint: completedHint,
        icon: 'task_alt',
        toneClass: 'tone-completed',
      },
    ];
  }

  select(filter: ApplicationStatFilter): void {
    this.filterChange.emit(filter);
  }
}
