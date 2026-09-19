import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MenuCategoriesService, MenuCategory } from '@app/core/services/menu-categories.service';
import { MenuItemsService, MenuItem } from '@app/core/services/menu-items.service';
import { ToastContainerComponent } from '@component/ui/toast/toast-container.component';
import { ToastService } from '@app/shared/services/toast.service';

interface CategoryGroup {
  category: MenuCategory;
  items: MenuItem[];
}

const WHATSAPP_NUMBERS = ['23676116666', '23672950000'];

@Component({
  selector: 'app-public-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, ToastContainerComponent],
  templateUrl: './public-menu.component.html',
  styleUrl: './public-menu.component.css',
})
export class PublicMenuComponent implements OnInit {
  private readonly menuCategoriesService = inject(MenuCategoriesService);
  private readonly menuItemsService = inject(MenuItemsService);
  private readonly toastService = inject(ToastService);

  readonly whatsappLinks = WHATSAPP_NUMBERS.map((number) => `https://wa.me/${number}`);

  categories = signal<MenuCategory[]>([]);
  items = signal<MenuItem[]>([]);
  searchTerm = signal('');
  loading = signal(true);

  isSearching = computed(() => this.searchTerm().trim().length > 0);

  filteredItems = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) return [];
    return this.items().filter((item) => item.name.toLowerCase().includes(term));
  });

  categoryGroups = computed<CategoryGroup[]>(() => {
    const allItems = this.items();
    return this.categories()
      .map((category) => ({
        category,
        items: allItems.filter((item) => item.categoryId === category.id),
      }))
      .filter((group) => group.items.length > 0);
  });

  ngOnInit(): void {
    forkJoin({
      categories: this.menuCategoriesService.findAll(),
      items: this.menuItemsService.findPublic({}),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ categories, items }) => {
          this.categories.set(categories.data ?? []);
          this.items.set(items.data ?? []);
        },
        error: () => {
          this.toastService.error('Impossible de charger le menu. Veuillez réessayer.');
        },
      });
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchTerm.set(value);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fr-FR').format(price);
  }
}
