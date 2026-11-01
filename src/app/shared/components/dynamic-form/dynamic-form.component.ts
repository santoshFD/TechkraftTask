import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { ControlContainer, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { DynamicFormConfig, FormField } from '../../models/dynamic-form.model';
import { DynamicFormService } from '../../services/dynamic-form.service';
import { resolveValidationMessage } from '../../constants/validation-messages';
import { PhoneMaskDirective } from '../../directives/phone-mask.directive';
import { SsnMaskDirective } from '../../directives/ssn-mask.directive';
import { TaxIdMaskDirective } from '../../directives/tax-id-mask.directive';
import { isObservable } from 'rxjs';

type FieldUiState = { visible: boolean };

@Component({
  selector: 'dynamic-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    TaxIdMaskDirective,
    PhoneMaskDirective,
    SsnMaskDirective,
  ],
  viewProviders: [
    {
      provide: ControlContainer,
      useFactory: () => inject(ControlContainer, { skipSelf: true }),
    },
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DynamicFormComponent {
  private readonly svc = inject(DynamicFormService);
  private readonly controlContainer = inject(ControlContainer);

  readonly config = input.required<DynamicFormConfig>();
  readonly showValidation = input(false);

  readonly fields = signal<FormField[]>([]);
  readonly fieldStates = signal<Record<string, FieldUiState>>({});
  /** Resolved select options when `field.options` is an Observable. */
  readonly asyncSelectOptions = signal<Record<string, unknown[]>>({});
  constructor() {
    effect(() => {
      const cfg = this.config();
      const errors = this.svc.validateFormConfig(cfg);
      if (errors.length) {
        console.error('[DynamicForm]', errors);
        return;
      }
      const list = this.svc.getFields(cfg);
      this.fields.set(list);
      const states: Record<string, FieldUiState> = {};
      for (const f of list) {
        states[f.id] = { visible: !f.isHidden };
      }
      this.fieldStates.set(states);
    });

    effect((onCleanup) => {
      const subs: { unsubscribe: () => void }[] = [];
      const sync: Record<string, unknown[]> = {};
      for (const field of this.fields()) {
        if (field.type !== 'select' || field.options == null) {
          continue;
        }
        if (isObservable(field.options)) {
          subs.push(
            field.options.subscribe((items) => {
              this.asyncSelectOptions.update((m) => ({ ...m, [field.id]: items }));
            }),
          );
        } else {
          sync[field.id] = field.options;
        }
      }
      if (Object.keys(sync).length) {
        this.asyncSelectOptions.update((m) => ({ ...m, ...sync }));
      }
      onCleanup(() => subs.forEach((s) => s.unsubscribe()));
    });

    effect((onCleanup) => {
      const cfg = this.config();
      const fg = this.formGroup;
      if (!fg) {
        return;
      }
      this.syncState(fg, cfg.formId);
      const valueSub = fg.valueChanges.subscribe((values) => {
        this.applyConditions(cfg, values as Record<string, unknown>);
        this.syncState(fg, cfg.formId);
      });
      const statusSub = fg.statusChanges.subscribe(() => this.syncState(fg, cfg.formId));
      onCleanup(() => {
        valueSub.unsubscribe();
        statusSub.unsubscribe();
      });
    });
  }

  get formGroup(): FormGroup | null {
    const c = this.controlContainer.control;
    return c instanceof FormGroup ? c : null;
  }

  colClass(field: FormField): string {
    if (field.fullWidth) {
      return 'col-12';
    }
    if (field.halfWidth === false) {
      return 'col-12';
    }
    return 'col-12 col-md-6';
  }

  isVisible(field: FormField): boolean {
    return this.fieldStates()[field.id]?.visible !== false;
  }

  /** Options safe for `@for` (arrays only; Observables resolved via `asyncSelectOptions`). */
  selectOptions(field: FormField): unknown[] {
    const opts = field.options;
    if (opts == null) {
      return [];
    }
    if (isObservable(opts)) {
      return this.asyncSelectOptions()[field.id] ?? [];
    }
    return opts;
  }

  /** Blue outline after the user has changed the value (not whole-step markAllAsTouched). */
  fieldEngaged(field: FormField): boolean {
    const control = this.formGroup?.get(field.name);
    return !!control?.dirty;
  }

  showFieldError(field: FormField): boolean {
    const control = this.formGroup?.get(field.name);
    if (!control?.errors) {
      return false;
    }
    return control.touched || control.dirty || this.showValidation();
  }

  fieldErrors(field: FormField): string[] {
    const control = this.formGroup?.get(field.name);
    if (!control?.errors) {
      return [];
    }
    return Object.keys(control.errors).map((key) => this.messageFor(field, key, control.errors![key]));
  }

  private messageFor(field: FormField, key: string, err: unknown): string {
    return resolveValidationMessage(field, key, err);
  }

  private applyConditions(cfg: DynamicFormConfig, values: Record<string, unknown>): void {
    const next = { ...this.fieldStates() };
    for (const section of cfg.sections) {
      const allConditions = [
        ...(section.conditions ?? []),
        ...section.fields.flatMap((f) => f.conditions ?? []),
      ];
      if (!allConditions.length) {
        continue;
      }
      const results = this.svc.evaluateConditions(allConditions, values);
      for (const [fieldId, visible] of Object.entries(results)) {
        if (next[fieldId]) {
          next[fieldId] = { visible };
        }
      }
    }
    this.fieldStates.set(next);
  }

  private syncState(fg: FormGroup, formId: string): void {
    const errors: Record<string, string[]> = {};
    const touched: Record<string, boolean> = {};
    const dirty: Record<string, boolean> = {};
    Object.keys(fg.controls).forEach((name) => {
      const c = fg.get(name)!;
      touched[name] = c.touched;
      dirty[name] = c.dirty;
      if (c.errors) {
        errors[name] = Object.keys(c.errors).map((k) => {
          const field = this.svc.findField(this.config(), name);
          return field ? this.messageFor(field, k, c.errors![k]) : k;
        });
      }
    });

    this.svc.updateFormState(formId, {
      values: fg.getRawValue(),
      errors,
      touched,
      dirty,
      valid: fg.valid,
    });
  }
}
