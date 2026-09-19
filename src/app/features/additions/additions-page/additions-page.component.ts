import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdditionsService, Addition } from '@app/core/services/additions.service';
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
  selector: 'app-additions-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './additions-page.component.html',
})
export class AdditionsPageComponent implements OnInit, OnDestroy {
  private readonly additionsService = inject(AdditionsService);
  private readonly usersService = inject(UsersService);
  private readonly toastService = inject(ToastService);

  private pollingId?: ReturnType<typeof setInterval>;

  additions = signal<Addition[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  cashiers = signal<User[]>([]);

  selectedDate = signal<string>(todayIso());
  selectedCashierId = signal<string>('');

  ngOnInit(): void {
    this.loadCashiers();
    this.load();
    // Synchronisation automatique : d'autres caissiers impriment des
    // additions en continu depuis le mobile pendant que cette page reste ouverte.
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
    this.additionsService
      .findAll({
        date: this.selectedDate() || undefined,
        cashierId: this.selectedCashierId() || undefined,
        limit: 100,
      })
      .subscribe({
        next: (response) => {
          this.additions.set(response.data?.data ?? []);
          this.total.set(response.data?.meta.total ?? 0);
          if (!silent) this.isLoading.set(false);
        },
        error: () => {
          if (!silent) {
            this.toastService.error('Impossible de charger les additions.');
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

  cashierName(addition: Addition): string {
    if (addition.cashier) {
      return `${addition.cashier.first_name} ${addition.cashier.last_name}`;
    }
    return addition.serverName || '—';
  }

  itemsSummary(addition: Addition): string {
    return addition.items.map((item) => `${item.quantity}x ${item.name}`).join(', ');
  }
}
