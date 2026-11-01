import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  ViewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  Observable,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { MatStepper, MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { ApplicationApiService } from '../../../core/services/application-api.service';
import { MerchantApplication } from '../../../core/models/application.model';
import {
  ApplicationFormGroup,
  buildApplicationForm,
  formValueToPayload,
} from '../form/application-form.util';
import { hasMeaningfulDraftInput } from '../form/draft-input.util';
import {
  DraftLeaveDialogComponent,
  DraftLeaveDialogResult,
} from '../../../shared/components/draft-leave-dialog/draft-leave-dialog.component';
import { ActionButtonComponent } from '../../../shared/components/action-button/action-button.component';
import { PageBackNavComponent } from '../../../shared/components/page-back-nav/page-back-nav.component';
import { ApplicationFormBuilderComponent } from '../form/application-form-builder.component';
import {
  getWizardStepErrorSummaries,
  WIZARD_STEP_INDEX,
  WIZARD_STEP_INCOMPLETE_LABEL,
  WizardFormStep,
} from '../form/wizard-step-errors.util';
import { MatIconModule } from '@angular/material/icon';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

@Component({
  selector: 'application-wizard',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatCardModule,
    DatePipe,
    ActionButtonComponent,
    PageBackNavComponent,
    ApplicationFormBuilderComponent,
    MatIconModule,
  ],
  templateUrl: './application-wizard.component.html',
  styleUrl: './application-wizard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationWizardComponent {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly api = inject(ApplicationApiService);
  private readonly dialog = inject(MatDialog);

  /** JSON snapshot of last successful server save (for leave dialog / dirty check). */
  private readonly savedPayloadJson = signal<string | null>(null);

  readonly applicationId = toSignal(
    this.route.paramMap.pipe(map((params) => params.get('id') ?? '')),
    { initialValue: '' },
  );

  readonly loading = signal(true);
  readonly reloading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly saveState = signal<SaveState>('idle');
  readonly lastSavedAt = signal<Date | null>(null);
  readonly submitting = signal(false);
  readonly submitError = signal<string | null>(null);
  /** Steps where the user attempted Next/Submit and should see validation UI. */
  readonly validatedSteps = signal<ReadonlySet<WizardFormStep>>(new Set());
  readonly incompleteStepLabel = WIZARD_STEP_INCOMPLETE_LABEL;

  /** Root reactive form; set after draft loads. */
  readonly form = signal<ApplicationFormGroup | null>(null);

  readonly businessStep = computed(() => this.stepGroup('business'));
  readonly ownerStep = computed(() => this.stepGroup('owner'));
  readonly bankingStep = computed(() => this.stepGroup('banking'));

  @ViewChild('stepper') private stepper?: MatStepper;

  private loadSeq = 0;

  constructor() {
    effect(() => {
      const id = this.applicationId();
      if (!id) {
        untracked(() => {
          this.loading.set(false);
          this.loadError.set('Invalid application link.');
        });
        return;
      }
      // loadDraft mutates `form`; keep it out of this effect's dependencies.
      untracked(() => this.loadDraft(id, false));
    });

    effect((onCleanup) => {
      const fg = this.form();
      if (!fg) {
        return;
      }
      const statusSub = fg.statusChanges.subscribe(() => this.syncValidatedSteps(fg));
      const valueSub = fg.valueChanges.subscribe(() => this.syncValidatedSteps(fg));
      onCleanup(() => {
        statusSub.unsubscribe();
        valueSub.unsubscribe();
      });
    });

    effect((onCleanup) => {
      const fg = this.form();
      const id = this.applicationId();
      if (!fg || !id) {
        return;
      }
      const sub = fg.valueChanges
        .pipe(
          debounceTime(700),
          distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
          filter(() => hasMeaningfulDraftInput(formValueToPayload(fg))),
          tap(() => this.saveState.set('saving')),
          switchMap(() =>
            this.api.save(id, formValueToPayload(fg)).pipe(
              catchError(() => {
                this.saveState.set('error');
                return of(null);
              }),
            ),
          ),
          filter((res): res is MerchantApplication => res !== null),
        )
        .subscribe((saved) => {
          this.saveState.set('saved');
          this.lastSavedAt.set(new Date(saved.updatedAt));
          this.captureSavedSnapshot(fg);
        });
      onCleanup(() => sub.unsubscribe());
    });
  }

  reload(): void {
    const id = this.applicationId();
    if (id) {
      this.loadDraft(id, true);
    }
  }

  private loadDraft(id: string, isRetry: boolean): void {
    const seq = ++this.loadSeq;

    this.loadError.set(null);
    if (isRetry) {
      this.reloading.set(true);
    } else {
      this.loading.set(true);
    }
    this.form.set(null);

    this.api
      .getById(id)
      .pipe(
        finalize(() => {
          if (seq !== this.loadSeq) {
            return;
          }
          this.loading.set(false);
          this.reloading.set(false);
        }),
      )
      .subscribe({
        next: (app) => {
          if (seq !== this.loadSeq) {
            return;
          }
          if (app.status !== 'DRAFT') {
            void this.router.navigate(['/applications', app.id]);
            return;
          }
          try {
            this.form.set(
              buildApplicationForm(this.fb, app, {
                applicationId: id,
                api: this.api,
              }),
            );
            const loadedForm = this.form();
            if (loadedForm) {
              this.captureSavedSnapshot(loadedForm);
            }
          } catch {
            this.loadError.set('Unable to load draft.');
          }
        },
        error: (err: unknown) => {
          if (seq !== this.loadSeq) {
            return;
          }
          if (err instanceof HttpErrorResponse) {
            if (err.status === 404) {
              this.loadError.set(
                'This draft was not found. Create a new application from the dashboard or open an existing draft.',
              );
              return;
            }
            if (err.status === 403) {
              this.loadError.set('You do not have permission to edit this application.');
              return;
            }
          }
          this.loadError.set('Unable to load draft.');
        },
      });
  }

  onStepNext(step: WizardFormStep): void {
    const fg = this.form();
    if (!fg) {
      return;
    }
    const group = fg.get(step);
    if (!(group instanceof FormGroup)) {
      return;
    }
    group.markAllAsTouched();
    this.markStepValidated(step);
  }

  stepShowValidation(step: WizardFormStep): boolean {
    return this.validatedSteps().has(step);
  }

  stepHasError(step: WizardFormStep): boolean {
    if (!this.validatedSteps().has(step)) {
      return false;
    }
    const group = this.form()?.get(step);
    return group instanceof FormGroup && group.invalid;
  }

  stepControl(step: WizardFormStep): FormGroup {
    return this.form()!.get(step) as FormGroup;
  }

  private stepGroup(step: WizardFormStep): FormGroup | null {
    const fg = this.form();
    if (!fg) {
      return null;
    }
    const group = fg.get(step);
    return group instanceof FormGroup ? group : null;
  }

  private goToStep(step: WizardFormStep): void {
    const index = WIZARD_STEP_INDEX[step];
    if (this.stepper) {
      this.stepper.selectedIndex = index;
    }
  }

  private markStepValidated(step: WizardFormStep): void {
    this.validatedSteps.update((current) => {
      const next = new Set(current);
      next.add(step);
      return next;
    });
  }

  private markAllStepsValidated(): void {
    this.validatedSteps.set(new Set<WizardFormStep>(['business', 'owner', 'banking']));
  }

  /** Drop steps from validated set once they pass (keeps headers/fields quiet after fixes). */
  private syncValidatedSteps(fg: ApplicationFormGroup): void {
    this.validatedSteps.update((current) => {
      if (!current.size) {
        return current;
      }
      const next = new Set(current);
      for (const step of current) {
        const group = fg.get(step);
        if (group instanceof FormGroup && group.valid) {
          next.delete(step);
        }
      }
      return next.size === current.size ? current : next;
    });
  }

  private firstInvalidStep(fg: ApplicationFormGroup): WizardFormStep | null {
    const summaries = getWizardStepErrorSummaries(fg);
    return summaries[0]?.step ?? null;
  }

  submit(): void {
    const fg = this.form();
    const id = this.applicationId();
    if (!fg || !id) {
      return;
    }
    if (!hasMeaningfulDraftInput(formValueToPayload(fg))) {
      this.submitError.set('Enter at least one application field before submitting.');
      return;
    }
    if (fg.invalid) {
      fg.markAllAsTouched();
      this.markAllStepsValidated();
      const firstInvalid = this.firstInvalidStep(fg);
      if (firstInvalid) {
        this.goToStep(firstInvalid);
      }
      return;
    }
    this.submitting.set(true);
    this.submitError.set(null);
    this.api
      .save(id, formValueToPayload(fg))
      .pipe(
        switchMap(() => this.api.submit(id)),
        finalize(() => this.submitting.set(false)),
      )
      .subscribe({
        next: (app) => {
          this.captureSavedSnapshot(fg);
          void this.router.navigate(['/applications', app.id]);
        },
        error: (err: unknown) => {
          if (err instanceof HttpErrorResponse) {
            if (err.status === 403) {
              this.submitError.set(
                'You do not have permission to submit this application. Sign in as Sales (owner of the draft) or Admin.',
              );
              return;
            }
            if (err.status === 400) {
              this.submitError.set(err.error?.message ?? 'This application cannot be submitted.');
              return;
            }
          }
          this.submitError.set('Submission failed. Please try again.');
        },
      });
  }

  /** Used by `draftWizardCanDeactivate` when navigating away from the wizard. */
  confirmLeave(): Observable<boolean> {
    const fg = this.form();
    const id = this.applicationId();
    if (!fg || !id) {
      return of(true);
    }

    const payload = formValueToPayload(fg);
    const meaningful = hasMeaningfulDraftInput(payload);

    if (!meaningful) {
      return this.api.deleteDraft(id).pipe(
        map(() => true),
        catchError(() => of(true)),
      );
    }

    if (!this.isFormDirty(fg)) {
      return of(true);
    }

    return this.dialog
      .open(DraftLeaveDialogComponent, {
        width: '420px',
        data: { hasInput: meaningful },
      })
      .afterClosed()
      .pipe(
        switchMap((result: DraftLeaveDialogResult | undefined) => {
          if (result === 'cancel' || result === undefined) {
            return of(false);
          }
          if (result === 'discard') {
            return of(true);
          }
          return this.saveDraftNow(fg, id).pipe(
            map(() => true),
            catchError(() => of(false)),
          );
        }),
      );
  }

  private saveDraftNow(fg: ApplicationFormGroup, id: string): Observable<MerchantApplication> {
    return this.api.save(id, formValueToPayload(fg)).pipe(
      tap((saved) => {
        this.saveState.set('saved');
        this.lastSavedAt.set(new Date(saved.updatedAt));
        this.captureSavedSnapshot(fg);
      }),
    );
  }

  private captureSavedSnapshot(fg: ApplicationFormGroup): void {
    this.savedPayloadJson.set(JSON.stringify(formValueToPayload(fg)));
  }

  private isFormDirty(fg: ApplicationFormGroup): boolean {
    const saved = this.savedPayloadJson();
    const current = JSON.stringify(formValueToPayload(fg));
    if (saved === null) {
      return hasMeaningfulDraftInput(formValueToPayload(fg));
    }
    return current !== saved;
  }
}
