import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@app/core/services/auth.service';
import { AppSettingsService } from '@app/core/services/app-settings.service';
import { ToastService } from '@app/shared/services/toast.service';

@Component({
  selector: 'app-super-admin-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './super-admin-settings.component.html',
})
export class SuperAdminSettingsComponent implements OnInit {
  readonly authService = inject(AuthService);
  private readonly appSettingsService = inject(AppSettingsService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  isSaving = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    whatsappNumber: ['', [Validators.required]],
  });

  ngOnInit(): void {
    this.appSettingsService.get().subscribe({
      next: (res) => {
        if (res.data) {
          this.form.patchValue({ whatsappNumber: res.data.whatsappNumber });
        }
      },
      error: () => {
        this.toastService.error('Impossible de charger les réglages.');
      },
    });
  }

  submit(): void {
    if (this.form.invalid) return;

    const { whatsappNumber } = this.form.value;

    this.isSaving.set(true);
    this.appSettingsService.update({ whatsappNumber }).subscribe({
      next: () => {
        this.toastService.success('Réglages mis à jour.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toastService.error('Impossible de mettre à jour les réglages.');
        this.isSaving.set(false);
      },
    });
  }
}
