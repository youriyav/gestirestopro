import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RestaurantsService, Restaurant } from '@app/core/services/restaurants.service';
import { AuthService } from '@app/core/services/auth.service';
import { ToastService } from '@app/shared/services/toast.service';
import { ImpersonateConfirmModal } from '../impersonate-confirm-modal/impersonate-confirm-modal.component';
import { PencilIcon } from '@app/components/ui/icons/pencil/pencil.icon';
import { PowerIcon } from '@app/components/ui/icons/power/power.icon';
import { TrashIcon } from '@app/components/ui/icons/trash/trash.icon';
import { DeleteConfirmationModal } from '@app/components/ui/delete-confirmation-modal/delete-confirmation-modal';

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Component({
  selector: 'app-restaurants-table',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ImpersonateConfirmModal,
    PencilIcon,
    PowerIcon,
    TrashIcon,
    DeleteConfirmationModal,
  ],
  templateUrl: './restaurants-table.component.html',
  styleUrl: './restaurants-table.component.css',
})
export class RestaurantsTableComponent implements OnInit {
  private readonly restaurantsService = inject(RestaurantsService);
  private readonly authService = inject(AuthService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  restaurants = signal<Restaurant[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);

  pendingRestaurant = signal<Restaurant | null>(null);
  isImpersonating = signal<boolean>(false);

  dialogMode = signal<'create' | 'edit' | null>(null);
  editingId = signal<string | null>(null);
  isSaving = signal<boolean>(false);
  private slugTouched = false;

  pendingDelete = signal<Restaurant | null>(null);
  isDeleting = signal<boolean>(false);

  form: FormGroup = this.fb.group({
    name: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/)]],
    city: ['Bangui'],
    address: [''],
    phone: [''],
    plan: ['essentiel', [Validators.required]],
    status: ['trial', [Validators.required]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.restaurantsService.findAll({ limit: 100 }).subscribe({
      next: (response) => {
        this.restaurants.set(response.data?.data ?? []);
        this.total.set(response.data?.meta.total ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Impossible de charger les restaurants.');
        this.isLoading.set(false);
      },
    });
  }

  planLabel(plan: string): string {
    switch (plan) {
      case 'essentiel':
        return 'Essentiel';
      case 'pro':
        return 'Pro';
      case 'business':
        return 'Business';
      default:
        return plan;
    }
  }

  statusLabel(status: string): string {
    switch (status) {
      case 'active':
        return 'Actif';
      case 'trial':
        return 'Essai';
      case 'suspended':
        return 'Suspendu';
      default:
        return status;
    }
  }

  requestImpersonate(restaurant: Restaurant): void {
    this.pendingRestaurant.set(restaurant);
  }

  cancelImpersonate(): void {
    this.pendingRestaurant.set(null);
  }

  confirmImpersonate(): void {
    const restaurant = this.pendingRestaurant();
    if (!restaurant) return;

    this.isImpersonating.set(true);
    this.restaurantsService.impersonate(restaurant.id).subscribe({
      next: (response) => {
        if (response.data) {
          this.authService.startImpersonation(response.data.access_token, response.data.restaurant);
          this.pendingRestaurant.set(null);
          this.isImpersonating.set(false);
          this.router.navigate(['/restaurant-view/dashboard'], {
            queryParams: { restaurantId: restaurant.id },
          });
        }
      },
      error: () => {
        this.toastService.error("Impossible d'accéder à ce compte.");
        this.isImpersonating.set(false);
      },
    });
  }

  // ----- Création / modification -----

  openCreate(): void {
    this.dialogMode.set('create');
    this.editingId.set(null);
    this.slugTouched = false;
    this.form.reset({ city: 'Bangui', plan: 'essentiel', status: 'trial' });
  }

  openEdit(restaurant: Restaurant): void {
    this.dialogMode.set('edit');
    this.editingId.set(restaurant.id);
    this.slugTouched = true;
    this.form.reset({
      name: restaurant.name,
      slug: restaurant.slug,
      city: restaurant.city,
      address: restaurant.address ?? '',
      phone: restaurant.phone ?? '',
      plan: restaurant.plan,
      status: restaurant.status,
    });
  }

  closeDialog(): void {
    this.dialogMode.set(null);
    this.editingId.set(null);
  }

  onNameInput(): void {
    if (this.slugTouched) return;
    this.form.get('slug')?.setValue(slugify(this.form.get('name')?.value ?? ''));
  }

  onSlugInput(): void {
    this.slugTouched = true;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = { ...this.form.value };
    const editingId = this.editingId();
    if (editingId) {
      delete value.plan; // immuable après création, ignoré côté backend de toute façon
    }

    this.isSaving.set(true);
    const request = editingId
      ? this.restaurantsService.update(editingId, value)
      : this.restaurantsService.create(value);

    request.subscribe({
      next: () => {
        this.toastService.success(editingId ? 'Restaurant modifié.' : 'Restaurant ajouté.');
        this.isSaving.set(false);
        this.closeDialog();
        this.load();
      },
      error: (err) => {
        this.isSaving.set(false);
        const message = err?.error?.error?.message || err?.error?.message;
        this.toastService.error(message || "Impossible d'enregistrer ce restaurant.");
      },
    });
  }

  // ----- Activer / désactiver (optimiste) -----

  toggleStatus(restaurant: Restaurant): void {
    const next = restaurant.status === 'suspended' ? 'active' : 'suspended';
    this.restaurants.set(
      this.restaurants().map((r) => (r.id === restaurant.id ? { ...r, status: next } : r)),
    );

    this.restaurantsService.update(restaurant.id, { status: next }).subscribe({
      error: () => {
        this.restaurants.set(
          this.restaurants().map((r) => (r.id === restaurant.id ? { ...r, status: restaurant.status } : r)),
        );
        this.toastService.error('Impossible de modifier le statut de ce restaurant.');
      },
    });
  }

  // ----- Suppression -----

  requestDelete(restaurant: Restaurant): void {
    this.pendingDelete.set(restaurant);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const restaurant = this.pendingDelete();
    if (!restaurant) return;

    this.isDeleting.set(true);
    this.restaurantsService.delete(restaurant.id).subscribe({
      next: () => {
        this.toastService.success('Restaurant supprimé.');
        this.isDeleting.set(false);
        this.pendingDelete.set(null);
        this.load();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.pendingDelete.set(null);
        const message = err?.error?.error?.message || err?.error?.message;
        this.toastService.error(message || 'Impossible de supprimer ce restaurant.');
      },
    });
  }
}
