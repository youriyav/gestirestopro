import { Component, inject, signal } from '@angular/core';
import { HeaderComponent } from '../header/header-component';
import { SidebarComponent } from '../sidebar/sidebar-component';
import { ImpersonationSidebarComponent } from '../impersonation-sidebar/impersonation-sidebar-component';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { RestaurantsService } from '@app/core/services/restaurants.service';
import { CommonModule } from '@angular/common';
import { ToastContainerComponent } from '@app/components/ui/toast/toast-container.component';

@Component({
  selector: 'app-admin',
  imports: [HeaderComponent, SidebarComponent, ImpersonationSidebarComponent, RouterOutlet, CommonModule, ToastContainerComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponentLayout {
  sidebarOpen = signal<boolean>(true);
  private readonly restaurantsService = inject(RestaurantsService);
  private readonly router = inject(Router);

  constructor(public authService: AuthService) {}

  quitImpersonation(): void {
    const restaurant = this.authService.impersonatedRestaurant();
    this.authService.stopImpersonation();
    this.router.navigate(['/dashboard']);
    if (restaurant) {
      this.restaurantsService.stopImpersonate(restaurant.id).subscribe();
    }
  }

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    // Only fetch profile if user is authenticated but profile not loaded yet
    //if (this.authService.isAuthenticated() && !this.authService.currentUser()) {
      this.authService.getProfile().subscribe({
        next: (user) => {
          console.log('User profile loaded:', user);
        },
        error: (error) => {
          console.error('Error loading current user:', error);
          // Don't block the application if user profile cannot be loaded
        },
      });
    //}
  }

  toggleSidebar() {
    this.sidebarOpen.set(!this.sidebarOpen());
  }

  closeSidebar() {
    this.sidebarOpen.set(false);
  }

}
