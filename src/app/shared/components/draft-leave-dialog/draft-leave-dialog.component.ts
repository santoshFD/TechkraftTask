import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

export type DraftLeaveDialogResult = 'save' | 'discard' | 'cancel';

export interface DraftLeaveDialogData {
  /** User entered at least one field. */
  hasInput: boolean;
}

@Component({
  selector: 'draft-leave-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule],
  templateUrl: './draft-leave-dialog.component.html',
})
export class DraftLeaveDialogComponent {
  readonly data = inject<DraftLeaveDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DraftLeaveDialogComponent, DraftLeaveDialogResult>);

  save(): void {
    this.dialogRef.close('save');
  }

  discard(): void {
    this.dialogRef.close('discard');
  }

  cancel(): void {
    this.dialogRef.close('cancel');
  }
}
