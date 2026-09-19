import { Component, Type, computed, inject, input, output } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { RestaurantIcon } from '@app/components/ui/icons/restaurant/restaurant.icon';
import { PlatIcon } from '@app/components/ui/icons/plat/plat.icon';
import { UsersIcon } from '@app/components/ui/icons/users/users.icon';
import { SettingsIcon } from '@app/components/ui/icons/settings/settings.icon';
import { HomeIcon } from '@app/components/ui/icons/home/home.icon';
import { RevenueIcon } from '@app/components/ui/icons/revenue/revenue.icon';
import { OrdersIcon } from '@app/components/ui/icons/orders/orders.icon';

interface RestaurantNavItem {
  label: string;
  route: string;
  icon: Type<unknown>;
}

@Component({
  selector: 'app-impersonation-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, NgComponentOutlet],
  templateUrl: './impersonation-sidebar-component.html',
  styleUrl: './impersonation-sidebar-component.css',
})
export class ImpersonationSidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  isOpen = input<boolean>(false);
  closeSidebar = output<void>();

  restaurant = computed(() => this.authService.impersonatedRestaurant());

  readonly navItems: RestaurantNavItem[] = [
    { label: 'Dashboard', route: '/restaurant-view/dashboard', icon: HomeIcon },
    { label: 'Table', route: '/restaurant-view/table', icon: RestaurantIcon },
    { label: 'Menu', route: '/restaurant-view/menu', icon: PlatIcon },
    { label: 'Personnels', route: '/restaurant-view/personnels', icon: UsersIcon },
    { label: 'Ventes', route: '/restaurant-view/ventes', icon: RevenueIcon },
    { label: 'Additions', route: '/restaurant-view/additions', icon: OrdersIcon },
    { label: 'Paramètres', route: '/restaurant-view/parametres', icon: SettingsIcon },
  ];

  planLabel(plan: string | undefined): string {
    switch (plan) {
      case 'essentiel':
        return 'Essentiel';
      case 'pro':
        return 'Pro';
      case 'business':
        return 'Business';
      default:
        return '';
    }
  }

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  onLinkClick(): void {
    if (this.isOpen()) {
      this.closeSidebar.emit();
    }
  }

  restaurantInitials(): string {
    const name = this.restaurant()?.name ?? '';
    return name.slice(0, 2).toUpperCase() || '?';
  }

  getUserDisplayName(): string {
    const user = this.authService.currentUser();
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.first_name || user?.email || 'Utilisateur';
  }

  getUserInitials(): string {
    const user = this.authService.currentUser();
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() ?? 'U';
  }
}
