import { Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '@app/core/services/auth.service';
import { TablesService, RestaurantTable, AssignedStaff } from '@app/core/services/tables.service';
import { SalesService, Sale } from '@app/core/services/sales.service';
import { TABLE_ETAT } from '@app/shared/enums';
import { RevenueIcon } from '@app/components/ui/icons/revenue/revenue.icon';
import { DocumentsIcon } from '@app/components/ui/icons/documents/documents.icon';
import { ShoppingCartIcon } from '@app/components/ui/icons/shopping-cart/shopping-cart.icon';
import { RestaurantIcon } from '@app/components/ui/icons/restaurant/restaurant.icon';

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/**
 * CA/Commandes/Panier moyen sont calculés à partir des vraies ventes du jour
 * (GET /sales, limité aux 100 premières — largement suffisant pour un
 * restaurant, comme le fait déjà le dashboard admin pour le MRR). La grille
 * de tables et le compteur "Tables servies" reflètent les vraies tables
 * gérées depuis la page "Table".
 */
@Component({
  selector: 'app-dashboard-tab',
  standalone: true,
  imports: [CommonModule, RevenueIcon, DocumentsIcon, ShoppingCartIcon, RestaurantIcon],
  templateUrl: './dashboard-tab.component.html',
})
export class DashboardTabComponent implements OnInit, OnDestroy {
  readonly authService = inject(AuthService);
  private readonly tablesService = inject(TablesService);
  private readonly salesService = inject(SalesService);

  private pollingId?: ReturnType<typeof setInterval>;

  readonly TABLE_ETAT = TABLE_ETAT;

  tables = signal<RestaurantTable[]>([]);
  sales = signal<Sale[]>([]);
  statusFilter = signal<TABLE_ETAT | null>(null);

  readonly tablesServies = computed(
    () => this.tables().filter((table) => table.etat !== TABLE_ETAT.LIBRE).length,
  );

  readonly chiffreAffaires = computed(() => this.sales().reduce((sum, sale) => sum + sale.total, 0));
  readonly commandes = computed(() => this.sales().length);
  readonly panierMoyen = computed(() =>
    this.commandes() === 0 ? 0 : Math.round(this.chiffreAffaires() / this.commandes()),
  );

  readonly filteredTables = computed(() => {
    const filter = this.statusFilter();
    return filter ? this.tables().filter((table) => table.etat === filter) : this.tables();
  });

  ngOnInit(): void {
    this.refresh();
    // Synchronisation automatique : tables/ventes changent en continu pendant
    // le service (autre caissier, autre serveur sur le mobile).
    this.pollingId = setInterval(() => this.refresh(), 5000);
  }

  ngOnDestroy(): void {
    if (this.pollingId) clearInterval(this.pollingId);
  }

  private refresh(): void {
    this.tablesService.findAll().subscribe({
      next: (response) => this.tables.set(response.data ?? []),
    });

    this.salesService.findAll({ date: todayIso(), limit: 100 }).subscribe({
      next: (response) => this.sales.set(response.data?.data ?? []),
    });
  }

  toggleStatusFilter(etat: TABLE_ETAT): void {
    this.statusFilter.set(this.statusFilter() === etat ? null : etat);
  }

  clearStatusFilter(): void {
    this.statusFilter.set(null);
  }

  etatLabel(etat: TABLE_ETAT): string {
    switch (etat) {
      case TABLE_ETAT.LIBRE:
        return 'Libre';
      case TABLE_ETAT.OCCUPEE:
        return 'Occupée';
      case TABLE_ETAT.ADDITION:
        return 'Addition';
      case TABLE_ETAT.RESERVEE:
        return 'Réservée';
      default:
        return etat;
    }
  }

  staffInitials(staff?: AssignedStaff | null): string {
    if (!staff) return '';
    return `${staff.first_name.charAt(0)}${staff.last_name.charAt(0)}`.toUpperCase();
  }

  /** Montant de la consommation en cours — même calcul que RestaurantTableModel.total côté mobile caissier. */
  tableTotal(table: RestaurantTable): number {
    return (table.orderItems ?? []).reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  }
}
