import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '@app/core/services/auth.service';
import { RestaurantsService } from '@app/core/services/restaurants.service';
import { ToastService } from '@app/shared/services/toast.service';

@Component({
  selector: 'app-parametres-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './parametres-tab.component.html',
})
export class ParametresTabComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly restaurantsService = inject(RestaurantsService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  isSaving = signal<boolean>(false);
  logoPreviewUrl = signal<string | null>(null);
  private selectedLogoFile: File | null = null;

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    city: ['', [Validators.required]],
    address: [''],
    phone: [''],
  });

  ngOnInit(): void {
    const restaurant = this.authService.impersonatedRestaurant();
    if (restaurant) {
      this.form.patchValue({
        name: restaurant.name,
        city: restaurant.city,
        address: restaurant.address ?? '',
        phone: restaurant.phone ?? '',
      });
      this.logoPreviewUrl.set(restaurant.logoUrl ?? null);
    }
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedLogoFile = file;
    this.logoPreviewUrl.set(file ? URL.createObjectURL(file) : null);
  }

  submit(): void {
    const restaurant = this.authService.impersonatedRestaurant();
    if (!restaurant || this.form.invalid) return;

    const { name, city, address, phone } = this.form.value;

    this.isSaving.set(true);
    this.restaurantsService.update(restaurant.id, { name, city, address, phone }).subscribe({
      next: () => {
        this.authService.updateImpersonatedRestaurant({ name, city, address, phone });
        this.uploadLogoIfSelected(restaurant.id);
      },
      error: () => {
        this.toastService.error('Impossible de mettre à jour ce restaurant.');
        this.isSaving.set(false);
      },
    });
  }

  private uploadLogoIfSelected(restaurantId: string): void {
    const file = this.selectedLogoFile;
    if (!file) {
      this.toastService.success('Restaurant mis à jour.');
      this.isSaving.set(false);
      return;
    }

    this.restaurantsService.uploadLogo(restaurantId, file).subscribe({
      next: (response) => {
        this.selectedLogoFile = null;
        if (response.data?.logoUrl) {
          this.logoPreviewUrl.set(response.data.logoUrl);
          this.authService.updateImpersonatedRestaurant({ logoUrl: response.data.logoUrl });
        }
        this.toastService.success('Restaurant mis à jour.');
        this.isSaving.set(false);
      },
      error: () => {
        this.toastService.error('Informations enregistrées, mais le logo n\'a pas pu être téléversé.');
        this.isSaving.set(false);
      },
    });
  }
}
