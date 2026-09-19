import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { RestaurantsService, Restaurant } from '@app/core/services/restaurants.service';
import { ProspectsService, Prospect } from '@app/core/services/prospects.service';
import { RestaurantsTableComponent } from '@features/restaurants/restaurants-table/restaurants-table.component';

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, RestaurantsTableComponent],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.css',
})
export class SuperAdminDashboardComponent implements OnInit, OnDestroy {
  private readonly restaurantsService = inject(RestaurantsService);
  private readonly prospectsService = inject(ProspectsService);

  private pollingId?: ReturnType<typeof setInterval>;

  restaurants = signal<Restaurant[]>([]);
  recentProspects = signal<Prospect[]>([]);
  isLoadingMetrics = signal<boolean>(true);

  activeCount = computed(() => this.restaurants().filter((r) => r.status === 'active').length);
  trialCount = computed(() => this.restaurants().filter((r) => r.status === 'trial').length);
  totalMrr = computed(() => this.restaurants().reduce((sum, r) => sum + r.mrr, 0));

  // Approximation faute d'historique de transition de statut en base : ratio
  // instantané actifs / (actifs + essai), pas un vrai taux de conversion mesuré dans le temps.
  conversionRate = computed(() => {
    const denom = this.activeCount() + this.trialCount();
    return denom === 0 ? 0 : Math.round((this.activeCount() / denom) * 100);
  });

  newProspectsLast7Days = computed(() => {
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return this.recentProspects().filter((p) => new Date(p.createdAt).getTime() >= sevenDaysAgo)
      .length;
  });

  newRestaurantsThisMonth = computed(
    () => this.restaurants().filter((r) => this.isThisMonth(r.createdAt)).length,
  );

  // "En hausse"/"En baisse"/"Stable" en comparant les 7 derniers jours à la
  // fenêtre des 7 jours précédents (J-14 à J-7), sur la même liste de
  // prospects déjà chargée (limit: 50) — pas d'appel réseau supplémentaire.
  prospectsTrend = computed<'up' | 'down' | 'stable'>(() => {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;
    const previousWindowCount = this.recentProspects().filter((p) => {
      const createdAt = new Date(p.createdAt).getTime();
      return createdAt >= now - 14 * day && createdAt < now - 7 * day;
    }).length;

    if (this.newProspectsLast7Days() > previousWindowCount) return 'up';
    if (this.newProspectsLast7Days() < previousWindowCount) return 'down';
    return 'stable';
  });

  ngOnInit(): void {
    this.refresh();
    // Synchronisation automatique : les restaurants/prospects peuvent changer
    // pendant que cette page reste ouverte (nouvelle inscription, etc.).
    this.pollingId = setInterval(() => this.refresh(), 5000);
  }

  ngOnDestroy(): void {
    if (this.pollingId) clearInterval(this.pollingId);
  }

  private refresh(): void {
    this.restaurantsService.findAll({ limit: 100 }).subscribe({
      next: (response) => {
        this.restaurants.set(response.data?.data ?? []);
        this.isLoadingMetrics.set(false);
      },
      error: () => this.isLoadingMetrics.set(false),
    });

    this.prospectsService.findAll({ limit: 50 }).subscribe({
      next: (response) => this.recentProspects.set(response.data?.data ?? []),
      error: () => this.recentProspects.set([]),
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
        return 'Indécis';
    }
  }

  relativeTime(dateString: string): string {
    const diffMs = Date.now() - new Date(dateString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `il y a ${Math.max(diffMins, 1)} min`;
    if (diffHours < 24) return `il y a ${diffHours} h`;
    if (diffDays === 1) return 'hier';
    return `il y a ${diffDays} jours`;
  }

  private isThisMonth(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth();
  }
}
