import { Component, inject, signal } from '@angular/core';
import { HeaderComponent } from '../header/header-component';
import { SidebarComponent } from '../sidebar/sidebar-component';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@app/core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NotificationComponent } from '@app/components/ui/notification/notification';

@Component({
  selector: 'app-admin',
  imports: [HeaderComponent,SidebarComponent,RouterOutlet,CommonModule,NotificationComponent],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class AdminComponentLayout {
  sidebarOpen = signal<boolean>(true);

  constructor(public authService: AuthService) {}

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
