import {
  Component,
  ViewEncapsulation,
  input,
  output,
  inject,
  OnInit,
  signal,
  computed,
  Type,
} from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { SidebarService } from '@app/core/services/sidebar.service';
import { HomeIcon } from '@app/components/ui/icons/home/home.icon';
import { UsersIcon } from '@app/components/ui/icons/users/users.icon';
import { RestaurantIcon } from '@app/components/ui/icons/restaurant/restaurant.icon';
import { EmailIcon } from '@app/components/ui/icons/email/email';
import { SettingsIcon } from '@app/components/ui/icons/settings/settings.icon';
import { LogoutIcon } from '@app/components/ui/icons/logout/logout.icon';
import { RevenueIcon } from '@app/components/ui/icons/revenue/revenue.icon';
import { OrdersIcon } from '@app/components/ui/icons/orders/orders.icon';
import { AuthService, User } from '@app/core/services/auth.service';
import { USER_ROLES } from '@app/shared/enums';

interface MenuItem {
  label: string;
  route: string;
  icon?: Type<any>;
  hasArrow?: boolean;
  roles?: USER_ROLES[]; // Rôles autorisés pour voir cet élément (vide = accessible à tous)
  submenu?: { label: string; route: string; roles?: USER_ROLES[] }[];
}

@Component({
  selector: 'app-sidebar-component',
  standalone: true,
  imports: [CommonModule, RouterModule,NgComponentOutlet],
  templateUrl: './sidebar-component.html',
  styleUrl: './sidebar-component.css',
  encapsulation: ViewEncapsulation.None,
})
export class SidebarComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly sidebarService = inject(SidebarService);
  currentUser = signal<User | null>(null);


  isOpen = input<boolean>(false);
  closeSidebar = output<void>();

  // État de la sidebar (collapsed/expanded) - synchronisé avec le service
  isCollapsed = this.sidebarService.isCollapsed;
  toggleSidebar = output<boolean>(); // Émet l'état collapsed

  // Expose user info from auth
  readonly userName = signal("")//this.authService.userName;

  // User profile data from API
  //currentUser = signal<User | null>(null);
  isLoadingUser = signal<boolean>(false);

  // Icon components
  LogoutIcon = LogoutIcon;

  ngOnInit(): void {
    this.loadCurrentUser();
    //this.currentUser=this.authService.currentUser
  }

  loadCurrentUser(): void {
    
  }

  getUserDisplayName(): string {
   
    const user = this.authService.currentUser();
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    if (user?.email) {
      return user.email;
    }
    return this.userName() || 'Utilisateur';
  }

  getUserInitials(): string {
    
     const user = this.authService.currentUser();
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(
        0
      )}`.toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return this.userName() ? this.userName().charAt(0).toUpperCase() : 'U';
  
  }

  getUserRole(): string {
    const user = this.authService.currentUser();
    const roleMap: Record<USER_ROLES, string> = {
        [USER_ROLES.SUPER_ADMIN]: 'SUPER ADMIN',
        [USER_ROLES.ADMIN]: 'ADMIN',
        [USER_ROLES.OWNER]: 'Propriétaire',
        [USER_ROLES.STAFF]: 'STAFF',
        [USER_ROLES.TRAINER]: 'TRAINER',
        [USER_ROLES.MEMBER]: 'MEMBER',
        [USER_ROLES.SERVER]: 'SERVEUR',
        [USER_ROLES.CASHIER]: 'CAISSIER',
      };
    return roleMap[user!.role!] 

  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(requiredRoles?: USER_ROLES[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      // Si aucun rôle requis, accessible à tous
      return true;
    }

    const userRole = this.authService.currentUser()?.role;
    return !!userRole && requiredRoles.includes(userRole);
  }

  /**
   * Filtre les éléments de menu selon les rôles de l'utilisateur
   */
  filteredMenuItems = computed<MenuItem[]>(() => {
    return this.menuItems.filter((item) => {
      // Vérifier si l'utilisateur a accès à cet élément de menu
      if (!this.hasRole(item.roles)) {
        return false;
      }

      // Si l'élément a un sous-menu, filtrer aussi les sous-éléments
      if (item.submenu) {
        item.submenu = item.submenu.filter((subitem) =>
          this.hasRole(subitem.roles)
        );
        // Si tous les sous-éléments sont filtrés, masquer l'élément parent aussi
        if (item.submenu.length === 0) {
          return false;
        }
      }
      return true;
    });
  });

  menuItems: MenuItem[] = [
    {
      label: "Vue d'ensemble",
      route: '/dashboard',
      icon: HomeIcon,
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      label: 'Restaurants',
      route: '/restaurants',
      icon: RestaurantIcon,
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      label: 'Prospects',
      route: '/prospects',
      icon: EmailIcon,
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      label: 'Équipe interne',
      route: '/equipe-interne',
      icon: UsersIcon,
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      label: 'Paramètres',
      route: '/parametres',
      icon: SettingsIcon,
      roles: [USER_ROLES.SUPER_ADMIN],
    },
    {
      label: 'Ventes',
      route: '/ventes',
      icon: RevenueIcon,
      roles: [USER_ROLES.OWNER],
    },
    {
      label: 'Additions',
      route: '/additions',
      icon: OrdersIcon,
      roles: [USER_ROLES.OWNER],
    },
  ];

  expandedMenus: { [key: string]: boolean } = {};

  private router = inject(Router);

  isActiveRoute(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }

  onLinkClick() {
    // Fermer le sidebar sur mobile/tablette après avoir cliqué sur un lien
    if (this.isOpen()) {
      this.closeSidebar.emit();
    }
  }

  toggleSubmenu(label: string, event?: Event) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.expandedMenus[label] = !this.expandedMenus[label];
  }

  isSubmenuExpanded(label: string): boolean {
    return this.expandedMenus[label] || false;
  }

  /**
   * Logout user via Keycloak
   */
  onLogout(): void {
    this.authService.logout();
  }

  /**
   * Toggle la visibilité de la sidebar (masquer/afficher)
   */
  onToggleSidebar(): void {
    this.sidebarService.toggle();
    // Émettre l'événement pour les composants qui en ont besoin
    this.toggleSidebar.emit(this.sidebarService.isCollapsed());
  }
}
