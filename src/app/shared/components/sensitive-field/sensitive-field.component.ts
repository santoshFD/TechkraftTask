import { Component, computed, inject, input, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'sensitive-field',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './sensitive-field.component.html',
  styleUrl: './sensitive-field.component.scss',
})
export class SensitiveFieldComponent {
  private readonly auth = inject(AuthService);

  readonly value = input.required<string>();
  readonly label = input.required<string>();
  readonly maskChar = input('*');

  readonly revealed = signal(false);

  readonly canReveal = computed(() => this.auth.hasRole('REVIEWER', 'ADMIN'));

  displayValue(): string {
    const raw = this.value() ?? '';
    if (!raw) {
      return '�';
    }
    if (this.revealed() && this.canReveal()) {
      return raw;
    }
    if (raw.length <= 4) {
      return this.maskChar().repeat(raw.length);
    }
    return `${this.maskChar().repeat(Math.max(0, raw.length - 4))}${raw.slice(-4)}`;
  }

  toggle(): void {
    if (!this.canReveal()) {
      return;
    }
    this.revealed.update((v) => !v);
  }
}
