import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'page-back-nav',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  templateUrl: './page-back-nav.component.html',
  styleUrl: './page-back-nav.component.scss',
})
export class PageBackNavComponent {
  readonly link = input.required<string | string[]>();
  readonly label = input('Back');
}
