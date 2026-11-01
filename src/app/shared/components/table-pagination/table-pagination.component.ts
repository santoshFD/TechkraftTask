import { Component, input, output } from '@angular/core';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';

/**
 * Reusable server-side table pagination wrapper around Material paginator.
 * Parent owns page state and reloads data on `pageChange`.
 */
@Component({
  selector: 'table-pagination',
  standalone: true,
  imports: [MatPaginatorModule],
  templateUrl: './table-pagination.component.html',
  styleUrl: './table-pagination.component.scss',
})
export class TablePaginationComponent {
  readonly length = input.required<number>();
  readonly pageIndex = input(0);
  readonly pageSize = input(10);
  readonly pageSizeOptions = input<number[]>([5, 10, 25]);
  readonly ariaLabel = input('Table pagination');

  readonly pageChange = output<PageEvent>();

  onPage(event: PageEvent): void {
    this.pageChange.emit(event);
  }
}
