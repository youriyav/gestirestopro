import {
  Component,
  ViewEncapsulation,
  inject,
  signal,
  computed,
  HostListener,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { SidebarService } from '@app/core/services/sidebar.service';
import { AuthService } from '@app/core/services/auth.service';



interface BreadcrumbItem {
  label: string;
  route: string;
}

@Component({
  selector: 'app-header-component',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
 
  ],
  templateUrl: './header-component.html',
  styleUrl: './header-component.css', 
  encapsulation: ViewEncapsulation.None,
})
export class HeaderComponent  {
  private readonly router = inject(Router);
  private readonly sidebarService = inject(SidebarService);
  readonly authService = inject(AuthService);
  private routerSubscription?: Subscription;
  private notificationRefreshSubscription?: Subscription;

  readonly userEmail = computed(() => this.authService.currentUser()?.email ?? '');

  // UI state
  showLanguageMenu = signal(false);
  showNotificationsMenu = signal(false);
  showUserMenu = signal(false);

  // Computed values
  userDisplayName = computed(() => {
    const user = this.authService.currentUser();
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.first_name || user?.email || 'Utilisateur';
  });

  userRole = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role === 'super_admin' ? 'Super Admin' : (role ?? '');
  });

  userInitials = computed(() => {
    const name = this.userDisplayName();
    if (!name) return 'U';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  });

  // Notifications
  notifications = signal<Notification[]>([]);
  notificationCount = signal(0);
  loadingNotifications = signal(false);

  // Current language
  currentLanguage = signal<'fr' | 'en'>('fr');

  // Breadcrumb
  breadcrumbs = signal<BreadcrumbItem[]>([]);

  // État collapsed de la sidebar
  isSidebarCollapsed = this.sidebarService.isCollapsed;

  // Route label mapping
  private routeLabels: Record<string, string> = {
    dashboard: "VUE D'ENSEMBLE",
    projects: 'PROJETS',
    taches: 'TÂCHES',
    settings: 'PARAMETRES',
    utilisateurs: 'Utilisateurs',
    prestataires: 'Prestataires',
    domaines: 'Domaines',
    fournisseurs: 'Fournisseurs',
    transporteurs: 'Transporteurs',
    'type-transport': 'Type de Transport',
    regions: 'Régions',
    providers: 'PRESTATAIRES',
    documents: 'DOCUMENTS',
    logistics: 'LOGISTIQUE',
  };

  ngOnInit() {
    // Initialize breadcrumb with current route
   /* this.updateBreadcrumbs(this.router.url);

    // Subscribe to route changes
    this.routerSubscription = this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        map(() => this.router.url)
      )
      .subscribe((url) => {
        this.updateBreadcrumbs(url);
      });

    // Load notifications
    this.loadNotifications();
    this.loadUnreadCount();

    // Refresh notifications every 30 seconds
    this.notificationRefreshSubscription = interval(30000).subscribe(() => {
      this.loadNotifications();
      this.loadUnreadCount();
    });*/
  }

  ngOnDestroy() {
    /*if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
    if (this.notificationRefreshSubscription) {
      this.notificationRefreshSubscription.unsubscribe();
    }*/
  }

  /**
   * Update breadcrumbs based on current URL
   */
  private updateBreadcrumbs(url: string) {
    // Remove query params and hash
    const cleanUrl = url.split('?')[0].split('#')[0];

    // Split URL into segments
    const segments = cleanUrl
      .split('/')
      .filter((segment) => segment.length > 0);

    const breadcrumbItems: BreadcrumbItem[] = [];

    // Build breadcrumb from segments
    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;

      // Skip if it's a UUID or numeric ID (likely a detail page)
      const isId =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          segment
        ) || /^\d+$/.test(segment);

      if (!isId) {
        const label =
          this.routeLabels[segment] ||
          segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        breadcrumbItems.push({
          label,
          route: currentPath,
        });
      } else {
        // For ID segments, try to get the label from the previous segment
        const previousSegment = segments[index - 1];
        if (previousSegment) {
          const label =
            this.routeLabels[previousSegment] ||
            previousSegment.charAt(0).toUpperCase() + previousSegment.slice(1);
          breadcrumbItems.push({
            label: `${label} (Détails)`,
            route: currentPath,
          });
        }
      }
    });

    // If no breadcrumbs (empty route), show dashboard
    if (breadcrumbItems.length === 0) {
      breadcrumbItems.push({
        label: this.routeLabels['dashboard'] || "VUE D'ENSEMBLE",
        route: '/dashboard',
      });
    }

    this.breadcrumbs.set(breadcrumbItems);
  }

  /**
   * Navigate to a breadcrumb route
   */
  navigateToBreadcrumb(route: string) {
    this.router.navigate([route]);
  }

  toggleLanguageMenu() {
    this.showLanguageMenu.set(!this.showLanguageMenu());
    this.showNotificationsMenu.set(false);
    this.showUserMenu.set(false);
  }

  toggleNotificationsMenu() {
    const isOpening = !this.showNotificationsMenu();
    this.showNotificationsMenu.set(isOpening);
    this.showLanguageMenu.set(false);
    this.showUserMenu.set(false);

    // Charger toutes les notifications quand on ouvre le menu
    if (isOpening) {
      this.loadNotifications(true);
    }
  }

  toggleUserMenu() {
    this.showUserMenu.set(!this.showUserMenu());
    this.showLanguageMenu.set(false);
    this.showNotificationsMenu.set(false);
  }

  closeAllMenus() {
    this.showLanguageMenu.set(false);
    this.showNotificationsMenu.set(false);
    this.showUserMenu.set(false);
  }

  changeLanguage(lang: 'fr' | 'en') {
    this.currentLanguage.set(lang);
    this.closeAllMenus();
    // TODO: Implement language change logic
  }

  onLogout() {
    this.authService.logout();
  }

  navigateToOverview() {
    this.router.navigate(['/dashboard']);
  }

  /**
   * Load notifications from API
   */
  loadNotifications(showAll = false) {
    /*const user = this.user();
    if (!user?.id) {
      return;
    }

    this.loadingNotifications.set(true);
    this.notificationService
      .getNotifications({
        userId: user.id,
        isRead: showAll ? undefined : false, // Charger toutes si showAll, sinon seulement les non lues
        limit: 20,
        page: 1,
      })
      .subscribe({
        next: (response) => {
          this.notifications.set(response.data || []);
          this.loadingNotifications.set(false);
        },
        error: (err) => {
          console.error('Erreur lors du chargement des notifications:', err);
          this.notifications.set([]);
          this.loadingNotifications.set(false);
        },
      });*/
  }

  /**
   * Load unread notification count
   */
  loadUnreadCount() {
    /*this.notificationService.getUnreadCount().subscribe({
      next: (count) => {
        this.notificationCount.set(count);
      },
      error: (err) => {
        console.error(
          'Erreur lors du chargement du nombre de notifications:',
          err
        );
        this.notificationCount.set(0);
      },
    });*/
  }

  /**
   * Mark notification as read
   */
  markAsRead(notification: Notification, event?: Event) {
    if (event) {
      event.stopPropagation();
    }

   /* this.notificationService.markAsRead(notification.id).subscribe({
      next: () => {
        // Update local state
        const updatedNotifications = this.notifications().map((n) =>
          n.id === notification.id ? { ...n, isRead: true } : n
        );
        this.notifications.set(updatedNotifications);
        // Reload count
        this.loadUnreadCount();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour de la notification:', err);
      },
    });*/
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(event?: Event) {
    /*if (event) {
      event.stopPropagation();
    }

    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        // Update local state
        const updatedNotifications = this.notifications().map((n) => ({
          ...n,
          isRead: true,
        }));
        this.notifications.set(updatedNotifications);
        // Reload count
        this.loadUnreadCount();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour des notifications:', err);
      },
    });*/
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return "À l'instant";
    } else if (diffMins < 60) {
      return `Il y a ${diffMins} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours} h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} j`;
    } else {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
      });
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event) {
    // Close all menus when clicking outside
    const target = event.target as HTMLElement;
    if (!target.closest('.header-menu')) {
      this.closeAllMenus();
    }
  }
}
