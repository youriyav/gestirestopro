import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-impersonate-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './impersonate-confirm-modal.component.html',
  styleUrl: './impersonate-confirm-modal.component.css',
})
export class ImpersonateConfirmModal {
  isOpen = input<boolean>(false);
  restaurantName = input<string>('');
  isLoading = input<boolean>(false);

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
