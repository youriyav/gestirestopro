import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@app/core/services/auth.service';

/**
 * Placeholder: the prompt named this page in the Super Admin sidebar without
 * specifying any content for it. Kept as a minimal profile summary rather
 * than inventing an unrequested settings feature set.
 */
@Component({
  selector: 'app-super-admin-settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './super-admin-settings.component.html',
})
export class SuperAdminSettingsComponent {
  readonly authService = inject(AuthService);
}
