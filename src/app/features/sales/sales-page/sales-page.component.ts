import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SalesService, Sale } from '@app/core/services/sales.service';
import { UsersService, User } from '@app/core/services/users.service';
import { ToastService } from '@app/shared/services/toast.service';
import { USER_ROLES } from '@app/shared/enums';

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

@Component({
  selector: 'app-sales-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sales-page.component.html',
})
export class SalesPageComponent implements OnInit, OnDestroy {
  private readonly salesService = inject(SalesService);
  private readonly usersService = inject(UsersService);
  private readonly toastService = inject(ToastService);

  private pollingId?: ReturnType<typeof setInterval>;

  sales = signal<Sale[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  cashiers = signal<User[]>([]);

  selectedDate = signal<string>(todayIso());
  selectedCashierId = signal<string>('');

  ngOnInit(): void {
    this.loadCashiers();
    this.load();
    // Synchronisation automatique : d'autres caissiers encaissent en continu
    // depuis le mobile pendant que cette page reste ouverte.
    this.pollingId = setInterval(() => this.load(true), 5000);
  }

  ngOnDestroy(): void {
    if (this.pollingId) clearInterval(this.pollingId);
  }

  loadCashiers(): void {
    this.usersService.findAll().subscribe({
      next: (response) => {
        const users = response.data ?? [];
        this.cashiers.set(users.filter((u) => u.role === USER_ROLES.CASHIER));
      },
      error: () => this.toastService.error('Impossible de charger les caissiers.'),
    });
  }

  load(silent = false): void {
    if (!silent) this.isLoading.set(true);
    this.salesService
      .findAll({
        date: this.selectedDate() || undefined,
        cashierId: this.selectedCashierId() || undefined,
        limit: 100,
      })
      .subscribe({
        next: (response) => {
          this.sales.set(response.data?.data ?? []);
          this.total.set(response.data?.meta.total ?? 0);
          if (!silent) this.isLoading.set(false);
        },
        error: () => {
          if (!silent) {
            this.toastService.error('Impossible de charger les ventes.');
            this.isLoading.set(false);
          }
        },
      });
  }

  onDateChange(value: string): void {
    this.selectedDate.set(value);
    this.load();
  }

  onCashierChange(value: string): void {
    this.selectedCashierId.set(value);
    this.load();
  }

  cashierName(sale: Sale): string {
    if (sale.cashier) {
      return `${sale.cashier.first_name} ${sale.cashier.last_name}`;
    }
    return sale.serverName || '—';
  }

  itemsSummary(sale: Sale): string {
    return sale.items.map((item) => `${item.quantity}x ${item.name}`).join(', ');
  }
}
