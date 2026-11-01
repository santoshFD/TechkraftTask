import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApplicationApiService } from '../../../core/services/application-api.service';
import { MerchantApplication, ReviewerOption } from '../../../core/models/application.model';
import { AuthService } from '../../../core/auth/auth.service';
import {
  canEditDraftApplication,
  canManageAssignment,
  canRecordReview,
} from '../../../core/auth/application-role.util';
import { SensitiveFieldComponent } from '../../../shared/components/sensitive-field/sensitive-field.component';
import { ActionButtonComponent } from '../../../shared/components/action-button/action-button.component';
import { PageBackNavComponent } from '../../../shared/components/page-back-nav/page-back-nav.component';

@Component({
  selector: 'application-detail',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatCardModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    SensitiveFieldComponent,
    ActionButtonComponent,
    PageBackNavComponent,
  ],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApplicationApiService);
  private readonly fb = inject(FormBuilder);
  readonly auth = inject(AuthService);

  readonly application = signal<MerchantApplication | null>(null);
  readonly loading = signal(true);
  readonly retrying = signal(false);
  readonly error = signal<string | null>(null);
  readonly reviewing = signal(false);
  readonly assigning = signal(false);
  readonly reviewers = signal<ReviewerOption[]>([]);

  readonly reviewForm = this.fb.nonNullable.group({
    decision: ['APPROVE' as 'APPROVE' | 'REJECT', Validators.required],
    riskLevel: ['MEDIUM' as 'LOW' | 'MEDIUM' | 'HIGH', Validators.required],
    notes: ['', [Validators.required, Validators.minLength(5)]],
  });

  readonly assignmentControl = this.fb.control<string>('');

  readonly showReviewPanel = computed(() => {
    const app = this.application();
    if (!app) {
      return false;
    }
    return canRecordReview(this.auth.role(), {
      status: app.status,
      assignedReviewerId: app.assignedReviewerId,
      userId: this.auth.user()?.id,
    });
  });

  readonly showAssignmentPanel = computed(() => {
    const app = this.application();
    if (!app || !canManageAssignment(this.auth.role())) {
      return false;
    }
    return ['SUBMITTED', 'IN_REVIEW'].includes(app.status);
  });

  readonly reviewerContextLabel = computed(() => {
    const app = this.application();
    if (!app || !this.auth.hasRole('REVIEWER')) {
      return null;
    }
    if (app.assignedReviewerId === this.auth.user()?.id) {
      return 'This application is assigned to you for review.';
    }
    return 'This application is not assigned to you.';
  });

  private applicationId = '';

  ngOnInit(): void {
    this.applicationId = this.route.snapshot.paramMap.get('id') ?? '';
    this.load();
    if (canManageAssignment(this.auth.role())) {
      this.api.listReviewers().subscribe({
        next: (list) => this.reviewers.set(list),
        error: () => this.reviewers.set([]),
      });
    }
  }

  load(isRetry = false): void {
    if (isRetry) {
      this.retrying.set(true);
    } else {
      this.loading.set(true);
    }
    this.error.set(null);
    this.api
      .getById(this.applicationId)
      .pipe(
        finalize(() => {
          this.loading.set(false);
          this.retrying.set(false);
        }),
      )
      .subscribe({
        next: (app) => {
          this.application.set(app);
          this.assignmentControl.setValue(app.assignedReviewerId ?? '');
        },
        error: () => this.error.set('Unable to load application.'),
      });
  }

  canEditDraft(app: MerchantApplication): boolean {
    return canEditDraftApplication(this.auth.role(), {
      status: app.status,
      createdByUserId: app.createdByUserId,
      userId: this.auth.user()?.id,
    });
  }

  openEditor(id: string): void {
    void this.router.navigate(['/applications', id, 'edit']);
  }

  submitReview(): void {
    if (this.reviewForm.invalid) {
      return;
    }
    this.reviewing.set(true);
    this.api
      .review(this.applicationId, this.reviewForm.getRawValue())
      .pipe(finalize(() => this.reviewing.set(false)))
      .subscribe({
        next: (app) => this.application.set(app),
        error: () => undefined,
      });
  }

  saveAssignment(): void {
    const reviewerId = this.assignmentControl.value || null;
    this.assigning.set(true);
    this.api
      .assignReviewer(this.applicationId, { reviewerId })
      .pipe(finalize(() => this.assigning.set(false)))
      .subscribe({
        next: (app) => {
          this.application.set(app);
          this.assignmentControl.setValue(app.assignedReviewerId ?? '');
        },
        error: () => undefined,
      });
  }
}
