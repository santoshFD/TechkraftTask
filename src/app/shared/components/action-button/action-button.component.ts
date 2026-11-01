import { Component, computed, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

export type ActionButtonVariant = 'flat' | 'stroked' | 'text';

@Component({
  selector: 'action-button',
  standalone: true,
  imports: [MatButtonModule, MatProgressSpinnerModule],
  templateUrl: './action-button.component.html',
  styleUrl: './action-button.component.scss',
})
export class ActionButtonComponent {
  readonly variant = input<ActionButtonVariant>('flat');
  readonly color = input<'primary' | 'accent' | 'warn' | undefined>('primary');
  readonly type = input<'button' | 'submit'>('button');
  readonly loading = input(false);
  readonly disabled = input(false);

  readonly pressed = output<MouseEvent>();

  /** Material M3 appearance � one `<button>` so projected label content works. */
  readonly matAppearance = computed(() => {
    switch (this.variant()) {
      case 'flat':
        return 'filled';
      case 'stroked':
        return 'outlined';
      default:
        return 'text';
    }
  });

  readonly hostClass = computed(() => {
    switch (this.variant()) {
      case 'flat':
        return 'action-btn action-btn--flat';
      case 'stroked':
        return 'action-btn action-btn--stroked';
      default:
        return 'action-btn action-btn--text';
    }
  });

  onClick(event: MouseEvent): void {
    if (!this.loading() && !this.disabled()) {
      this.pressed.emit(event);
    }
  }
}
