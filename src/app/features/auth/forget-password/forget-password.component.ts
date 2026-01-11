import { Component, output } from '@angular/core';
import { PrimaryButton } from '@app/components/ui/buttons/primary-button/primary-button.component';

@Component({
  selector: 'app-forget-password',
  imports: [PrimaryButton],
  templateUrl: './forget-password.html',
  styleUrl: './forget-password.css',
})
export class ForgetPasswordComponent {
  onClose = output<void>();

  handleReset(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    // Password reset logic will go here
    console.log('Password reset requested');
  }

  closeModal() {
    this.onClose.emit();
  }
}
