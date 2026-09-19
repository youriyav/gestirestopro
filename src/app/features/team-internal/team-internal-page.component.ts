import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UsersService, User } from '@app/core/services/users.service';

/**
 * Minimal first pass: lists GestiRestoPro's own internal accounts (isAdmin=true),
 * distinct from a restaurant's own staff (see the impersonated "Personnels" tab).
 * The original request only named this page in the sidebar without detailing its
 * content — kept intentionally simple rather than inventing an unrequested feature set.
 */
@Component({
  selector: 'app-team-internal-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-internal-page.component.html',
})
export class TeamInternalPageComponent implements OnInit {
  private readonly usersService = inject(UsersService);

  internalUsers = signal<User[]>([]);
  isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.usersService.findAllAcrossAllRestaurants().subscribe({
      next: (response) => {
        this.internalUsers.set((response.data ?? []).filter((u) => u.isAdmin));
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }
}
