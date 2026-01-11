import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-delete-confirmation-modal',
  imports: [CommonModule],
  templateUrl: './delete-confirmation-modal.html',
  styleUrl: './delete-confirmation-modal.css',
})
export class DeleteConfirmationModal {
  isOpen = input<boolean>(false);
  title = input<string>('Confirmation de suppression');
  message = input<string>('Voulez-vous continuer cette opération?');
  isDeleting = input<boolean>(false);

  confirm = output<void>();
  cancel = output<void>();

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.cancel.emit();
    }
  }

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
