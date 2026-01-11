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
import { GymIcon } from '@app/components/ui/icons/gym/gym';
import { ProjectsIcon } from '@app/components/ui/icons/projects/projects.icon';
import { ProvidersIcon } from '@app/components/ui/icons/providers/providers.icon';
import { DocumentsIcon } from '@app/components/ui/icons/documents/documents.icon';
import { LogisticsIcon } from '@app/components/ui/icons/logistics/logistics.icon';
import { SettingsIcon } from '@app/components/ui/icons/settings/settings.icon';
import { LogoutIcon } from '@app/components/ui/icons/logout/logout.icon';
import { AuthService, User } from '@app/core/services/auth.service';
import { USER_ROLES } from '@app/shared/enums';

interface MenuItem {
  label: string;
  route: string;
  icon?: Type<any>;
  hasArrow?: boolean;
  roles?: string[]; // Rôles autorisés pour voir cet élément (vide = accessible à tous)
  submenu?: { label: string; route: string; roles?: string[] }[];
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
      };
    return roleMap[user!.role!] 

  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   */
  hasRole(requiredRoles?: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      // Si aucun rôle requis, accessible à tous
      return true;
    }

    

    return true
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
      label: "VUE D'ENSEMBLE",
      route: '/dashboard',
      icon: HomeIcon,
      roles: [], // Accessible à tous
    },
    {
      label: 'Gymnases',
      route: '/gym',
      icon: GymIcon,
      roles: [], // Accessible à tous
    },
    {
      label: 'Membres',
      route: '/membres',
      icon: UsersIcon,
      roles: [], // Accessible à tous
    },
    {
      label: 'Personnels',
      route: '/personnels',
      icon: UsersIcon,
      roles: [], // Accessible à tous
    },
    /*{
      label: 'PRESTATAIRES',
      route: '/providers',
      icon: ProvidersIcon,
      hasArrow: true,
      roles: ['admin', 'manager'],
    },
    {
      label: 'DOCUMENTS',
      route: '/documents',
      icon: DocumentsIcon,
      roles: [], // Accessible à tous
    },
    {
      label: 'LOGISTIQUE',
      route: '/logistics',
      icon: LogisticsIcon,
      hasArrow: true,
      submenu: [
        {
          label: 'Commandes',
          route: '/logistics/commandes',
          roles: [ 'admin', 'manager'],
        },
        {
          label: 'Fournisseurs',
          route: '/logistics/fournisseurs',
          roles: ['admin', 'manager'],
        },
        {
          label: 'Transporteurs',
          route: '/logistics/transporteurs',
          roles: ['admin', 'manager'],
        },
        {
          label: 'Types Transport',
          route: '/logistics/type-transport',
          roles: ['admin', 'manager'],
        },
      ],
      roles: ['admin', 'manager'],
    },*/
    {
      label: 'PARAMETRES',
      route: '/settings',
      icon: SettingsIcon,
      hasArrow: true,
      submenu: [
        {
          label: 'Globals',
          route: '/parametres',
        },
        // {
        //   label: 'Utilisateurs',
        //   route: '/settings/users',
        // },
        {
          label: 'Domaines',
          route: '/settings/domaines',
        },
        {
          label: 'Type de Transport',
          route: '/settings/type-transport',
        },
        {
          label: 'Régions',
          route: '/settings/regions',
        },
      ],
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
