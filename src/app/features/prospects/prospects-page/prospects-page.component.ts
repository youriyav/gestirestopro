import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProspectsService, Prospect, ProspectStatus } from '@app/core/services/prospects.service';
import { ToastService } from '@app/shared/services/toast.service';

@Component({
  selector: 'app-prospects-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './prospects-page.component.html',
})
export class ProspectsPageComponent implements OnInit {
  private readonly prospectsService = inject(ProspectsService);
  private readonly toastService = inject(ToastService);

  prospects = signal<Prospect[]>([]);
  total = signal<number>(0);
  isLoading = signal<boolean>(false);
  statusFilter = signal<ProspectStatus | ''>('');

  readonly statuses: { value: ProspectStatus; label: string }[] = [
    { value: 'new', label: 'Nouveau' },
    { value: 'contacted', label: 'Contacté' },
    { value: 'converted', label: 'Converti' },
    { value: 'discarded', label: 'Écarté' },
  ];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    const status = this.statusFilter() || undefined;
    this.prospectsService.findAll({ limit: 50, status }).subscribe({
      next: (response) => {
        this.prospects.set(response.data?.data ?? []);
        this.total.set(response.data?.meta.total ?? 0);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error('Impossible de charger les prospects.');
        this.isLoading.set(false);
      },
    });
  }

  onFilterChange(status: string): void {
    this.statusFilter.set(status as ProspectStatus | '');
    this.load();
  }

  updateStatus(prospect: Prospect, status: ProspectStatus): void {
    this.prospectsService.updateStatus(prospect.id, status).subscribe({
      next: () => {
        this.toastService.success('Statut mis à jour.');
        this.load();
      },
      error: () => this.toastService.error('Impossible de mettre à jour le statut.'),
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

  statusLabel(status: string): string {
    return this.statuses.find((s) => s.value === status)?.label ?? status;
  }
}
