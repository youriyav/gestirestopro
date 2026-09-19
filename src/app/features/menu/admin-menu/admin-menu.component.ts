import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  MenuCategoriesService,
  MenuCategory,
} from '@app/core/services/menu-categories.service';
import { MenuItemsService, MenuItem } from '@app/core/services/menu-items.service';
import { ToastService } from '@app/shared/services/toast.service';
import { DeleteConfirmationModal } from '@component/ui/delete-confirmation-modal/delete-confirmation-modal';
import { CategoryIcon } from '@app/components/ui/icons/category/category.icon';
import { DishIcon } from '@app/components/ui/icons/dish/dish.icon';
import { CloseIcon } from '@app/components/ui/icons/close/close';
import { RevenueIcon } from '@app/components/ui/icons/revenue/revenue.icon';
import { PencilIcon } from '@app/components/ui/icons/pencil/pencil.icon';
import { CopyIcon } from '@app/components/ui/icons/copy/copy.icon';
import { TrashIcon } from '@app/components/ui/icons/trash/trash.icon';

interface PendingDelete {
  type: 'category' | 'item';
  id: string;
  label: string;
}

type AvailabilityFilter = 'all' | 'on' | 'off';
type ViewMode = 'list' | 'grid';

interface DishDialogState {
  mode: 'create' | 'edit';
  id: string | null;
}

interface CategoryDialogState {
  mode: 'create' | 'edit';
  id: string | null;
}

const VIEW_STORAGE_KEY = 'admin-menu-view';
const COMBINING_DIACRITICS_REGEX = new RegExp('[̀-ͯ]', 'g');

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS_REGEX, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function formatFcfa(value: number): string {
  return `${Math.round(value).toLocaleString('fr-FR').replace(/ | /g, ' ')} FCFA`;
}

@Component({
  selector: 'app-admin-menu',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DeleteConfirmationModal,
    CategoryIcon,
    DishIcon,
    CloseIcon,
    RevenueIcon,
    PencilIcon,
    CopyIcon,
    TrashIcon,
  ],
  templateUrl: './admin-menu.component.html',
  styleUrl: './admin-menu.component.css',
})
export class AdminMenuComponent implements OnInit {
  categories = signal<MenuCategory[]>([]);
  items = signal<MenuItem[]>([]);
  loading = signal(true);

  selectedCategoryId = signal<string | null>(null);
  query = signal('');
  availabilityFilter = signal<AvailabilityFilter>('all');
  view = signal<ViewMode>('list');

  dishDialog = signal<DishDialogState | null>(null);
  categoryDialog = signal<CategoryDialogState | null>(null);

  categoryForm: FormGroup;
  savingCategory = signal(false);
  categorySlugTouched = false;

  itemForm: FormGroup;
  savingItem = signal(false);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  editingItemImageUrl = signal<string | null>(null);

  pendingDelete = signal<PendingDelete | null>(null);
  isDeleting = signal(false);

  readonly selectedCategory = computed(
    () => this.categories().find((c) => c.id === this.selectedCategoryId()) ?? null,
  );

  readonly categoryCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const item of this.items()) {
      counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
    }
    return counts;
  });

  readonly filteredDishes = computed(() => {
    const q = this.query().trim().toLowerCase();
    const filter = this.availabilityFilter();
    let list = q
      ? this.items().filter((item) => item.name.toLowerCase().includes(q))
      : this.items().filter((item) => item.categoryId === this.selectedCategoryId());

    if (filter === 'on') list = list.filter((item) => item.isAvailable);
    if (filter === 'off') list = list.filter((item) => !item.isAvailable);
    return list;
  });

  readonly panelTitle = computed(() =>
    this.query().trim() ? 'Résultats' : this.selectedCategory()?.name ?? '',
  );

  readonly stats = computed(() => {
    const items = this.items();
    const outOfStock = items.filter((item) => !item.isAvailable).length;
    const avgPrice = items.length ? items.reduce((sum, item) => sum + item.price, 0) / items.length : 0;
    return {
      categories: this.categories().length,
      dishes: items.length,
      outOfStock,
      avgPrice: formatFcfa(avgPrice),
    };
  });

  constructor(
    private fb: FormBuilder,
    private menuCategoriesService: MenuCategoriesService,
    private menuItemsService: MenuItemsService,
    private toastService: ToastService,
  ) {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required]],
      slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9]+(-[a-z0-9]+)*$/)]],
      icon: [''],
    });

    this.itemForm = this.fb.group({
      name: ['', [Validators.required]],
      categoryId: ['', [Validators.required]],
      price: [null, [Validators.required, Validators.min(0)]],
      unit: [''],
      description: [''],
      isAvailable: [true],
    });

    const storedView = localStorage.getItem(VIEW_STORAGE_KEY);
    if (storedView === 'list' || storedView === 'grid') {
      this.view.set(storedView);
    }
  }

  ngOnInit(): void {
    this.loadAll();
  }

  private loadAll(): void {
    this.loading.set(true);
    forkJoin({
      categories: this.menuCategoriesService.findAll(),
      items: this.menuItemsService.findAllAdmin(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ categories, items }) => {
          const cats = categories.data ?? [];
          this.categories.set(cats);
          this.items.set(items.data ?? []);
          if (!this.selectedCategoryId() && cats.length) {
            this.selectedCategoryId.set(cats[0].id);
          }
        },
        error: () => {
          this.toastService.error('Impossible de charger le menu.');
        },
      });
  }

  // ----- Selection / filters -----

  selectCategory(category: MenuCategory): void {
    this.selectedCategoryId.set(category.id);
    this.query.set('');
  }

  onSearchInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setAvailabilityFilter(filter: AvailabilityFilter): void {
    this.availabilityFilter.set(filter);
  }

  setView(view: ViewMode): void {
    this.view.set(view);
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }

  itemCount(categoryId: string): number {
    return this.categoryCounts().get(categoryId) ?? 0;
  }

  // ----- Category dialog -----

  openCreateCategory(): void {
    this.categorySlugTouched = false;
    this.categoryForm.reset({ name: '', slug: '', icon: '' });
    this.categoryDialog.set({ mode: 'create', id: null });
  }

  openEditCategory(category: MenuCategory): void {
    this.categorySlugTouched = true;
    this.categoryForm.setValue({
      name: category.name,
      slug: category.slug,
      icon: category.icon ?? '',
    });
    this.categoryDialog.set({ mode: 'edit', id: category.id });
  }

  closeCategoryDialog(): void {
    this.categoryDialog.set(null);
  }

  onCategoryNameInput(): void {
    if (this.categorySlugTouched || this.categoryDialog()?.mode === 'edit') return;
    const name = this.categoryForm.get('name')?.value ?? '';
    this.categoryForm.get('slug')?.setValue(slugify(name));
  }

  onCategorySlugInput(): void {
    this.categorySlugTouched = true;
  }

  submitCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    const value = this.categoryForm.value;
    const dialog = this.categoryDialog();
    this.savingCategory.set(true);

    const request =
      dialog?.mode === 'edit' && dialog.id
        ? this.menuCategoriesService.update(dialog.id, value)
        : this.menuCategoriesService.create({ ...value, order: this.categories().length });

    request.pipe(finalize(() => this.savingCategory.set(false))).subscribe({
      next: () => {
        this.toastService.success(dialog?.mode === 'edit' ? 'Catégorie mise à jour.' : 'Catégorie créée.');
        this.closeCategoryDialog();
        this.loadAll();
      },
      error: (error) => {
        this.toastService.error(this.extractErrorMessage(error, "Impossible d'enregistrer la catégorie."));
      },
    });
  }

  moveCategory(category: MenuCategory, direction: -1 | 1): void {
    const ordered = [...this.categories()].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((c) => c.id === category.id);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= ordered.length) return;

    const target = ordered[targetIndex];
    forkJoin([
      this.menuCategoriesService.update(category.id, { order: target.order }),
      this.menuCategoriesService.update(target.id, { order: category.order }),
    ]).subscribe({
      next: () => this.loadAll(),
      error: () => this.toastService.error('Impossible de réordonner les catégories.'),
    });
  }

  isFirstCategory(category: MenuCategory): boolean {
    const ordered = [...this.categories()].sort((a, b) => a.order - b.order);
    return ordered[0]?.id === category.id;
  }

  isLastCategory(category: MenuCategory): boolean {
    const ordered = [...this.categories()].sort((a, b) => a.order - b.order);
    return ordered[ordered.length - 1]?.id === category.id;
  }

  deleteCategoryFromDialog(): void {
    const dialog = this.categoryDialog();
    if (!dialog?.id) return;
    const category = this.categories().find((c) => c.id === dialog.id);
    if (category) this.requestDeleteCategory(category);
  }

  // ----- Dish dialog -----

  openCreateDish(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.editingItemImageUrl.set(null);
    this.itemForm.reset({
      name: '',
      categoryId: this.selectedCategoryId() ?? this.categories()[0]?.id ?? '',
      price: null,
      unit: '',
      description: '',
      isAvailable: true,
    });
    this.dishDialog.set({ mode: 'create', id: null });
  }

  openEditDish(item: MenuItem): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.editingItemImageUrl.set(item.imageUrl ?? null);
    this.itemForm.setValue({
      name: item.name,
      categoryId: item.categoryId,
      price: item.price,
      unit: item.unit ?? '',
      description: item.description ?? '',
      isAvailable: item.isAvailable,
    });
    this.dishDialog.set({ mode: 'edit', id: item.id });
  }

  duplicateDish(item: MenuItem): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.editingItemImageUrl.set(null);
    this.itemForm.setValue({
      name: `${item.name} (copie)`,
      categoryId: item.categoryId,
      price: item.price,
      unit: item.unit ?? '',
      description: item.description ?? '',
      isAvailable: item.isAvailable,
    });
    this.dishDialog.set({ mode: 'create', id: null });
  }

  closeDishDialog(): void {
    this.dishDialog.set(null);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
    this.previewUrl.set(file ? URL.createObjectURL(file) : null);
  }

  submitDish(): void {
    if (this.itemForm.invalid) {
      this.itemForm.markAllAsTouched();
      return;
    }

    const value = this.itemForm.value;
    const dialog = this.dishDialog();
    const editingId = dialog?.mode === 'edit' ? dialog.id : null;
    this.savingItem.set(true);

    const request = editingId
      ? this.menuItemsService.update(editingId, value)
      : this.menuItemsService.create({ ...value, order: this.itemsInCategoryCount(value.categoryId) });

    request.subscribe({
      next: (response) => {
        const item = response.data;
        const file = this.selectedFile();

        if (item && file) {
          this.menuItemsService
            .uploadImage(item.id, file)
            .pipe(finalize(() => this.savingItem.set(false)))
            .subscribe({
              next: () => {
                this.toastService.success('Plat enregistré.');
                this.closeDishDialog();
                this.loadAll();
              },
              error: () => {
                this.toastService.error("Le plat a été enregistré mais l'upload de la photo a échoué.");
                this.closeDishDialog();
                this.loadAll();
              },
            });
        } else {
          this.savingItem.set(false);
          this.toastService.success(editingId ? 'Plat mis à jour.' : 'Plat créé.');
          this.closeDishDialog();
          this.loadAll();
        }
      },
      error: (error) => {
        this.savingItem.set(false);
        this.toastService.error(this.extractErrorMessage(error, "Impossible d'enregistrer le plat."));
      },
    });
  }

  private itemsInCategoryCount(categoryId: string): number {
    return this.items().filter((item) => item.categoryId === categoryId).length;
  }

  // ----- Availability toggle (optimistic) -----

  toggleAvailability(item: MenuItem): void {
    const next = !item.isAvailable;
    this.items.set(this.items().map((i) => (i.id === item.id ? { ...i, isAvailable: next } : i)));

    this.menuItemsService.update(item.id, { isAvailable: next }).subscribe({
      error: () => {
        this.items.set(this.items().map((i) => (i.id === item.id ? { ...i, isAvailable: !next } : i)));
        this.toastService.error('Impossible de mettre à jour la disponibilité.');
      },
    });
  }

  // ----- Delete -----

  requestDeleteCategory(category: MenuCategory): void {
    this.pendingDelete.set({ type: 'category', id: category.id, label: category.name });
  }

  requestDeleteItem(item: MenuItem): void {
    this.pendingDelete.set({ type: 'item', id: item.id, label: item.name });
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const pending = this.pendingDelete();
    if (!pending) return;

    this.isDeleting.set(true);
    const request =
      pending.type === 'category'
        ? this.menuCategoriesService.delete(pending.id)
        : this.menuItemsService.delete(pending.id);

    request.pipe(finalize(() => this.isDeleting.set(false))).subscribe({
      next: () => {
        this.toastService.success(pending.type === 'category' ? 'Catégorie supprimée.' : 'Plat supprimé.');
        this.pendingDelete.set(null);
        if (pending.type === 'category') {
          this.closeCategoryDialog();
          if (this.selectedCategoryId() === pending.id) {
            this.selectedCategoryId.set(null);
          }
        }
        this.loadAll();
      },
      error: (error) => {
        this.toastService.error(this.extractErrorMessage(error, 'Suppression impossible.'));
        this.pendingDelete.set(null);
      },
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.pendingDelete()) {
      this.cancelDelete();
    } else if (this.dishDialog()) {
      this.closeDishDialog();
    } else if (this.categoryDialog()) {
      this.closeCategoryDialog();
    }
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    const message = (error as { error?: { message?: string } })?.error?.message;
    return message || fallback;
  }
}
