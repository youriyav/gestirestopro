import { Component, HostListener, OnInit, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { EmplacementsService, Emplacement } from '@app/core/services/emplacements.service';
import { TablesService, RestaurantTable } from '@app/core/services/tables.service';
import { UsersService, User } from '@app/core/services/users.service';
import { ToastService } from '@app/shared/services/toast.service';
import { TABLE_ETAT } from '@app/shared/enums';
import { DeleteConfirmationModal } from '@component/ui/delete-confirmation-modal/delete-confirmation-modal';
import { LocationIcon } from '@app/components/ui/icons/location/location';
import { RestaurantIcon } from '@app/components/ui/icons/restaurant/restaurant.icon';
import { ChartBarIcon } from '@app/components/ui/icons/chart-bar/chart-bar.icon';
import { PencilIcon } from '@app/components/ui/icons/pencil/pencil.icon';
import { TrashIcon } from '@app/components/ui/icons/trash/trash.icon';

interface PendingDelete {
  type: 'emplacement' | 'table';
  id: string;
  label: string;
}

type EtatFilter = 'all' | TABLE_ETAT;
type ViewMode = 'list' | 'grid';

interface EmplacementDialogState {
  mode: 'create' | 'edit';
  id: string | null;
}

interface TableDialogState {
  mode: 'create' | 'edit';
  id: string | null;
}

const VIEW_STORAGE_KEY = 'table-management-view';

@Component({
  selector: 'app-table-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DeleteConfirmationModal,
    LocationIcon,
    RestaurantIcon,
    ChartBarIcon,
    PencilIcon,
    TrashIcon,
  ],
  templateUrl: './table-management.component.html',
  styleUrl: './table-management.component.css',
})
export class TableManagementComponent implements OnInit {
  readonly TABLE_ETAT = TABLE_ETAT;

  emplacements = signal<Emplacement[]>([]);
  tables = signal<RestaurantTable[]>([]);
  staff = signal<User[]>([]);
  loading = signal(true);

  selectedEmplacementId = signal<string | null>(null);
  query = signal('');
  etatFilter = signal<EtatFilter>('all');
  view = signal<ViewMode>('list');

  emplacementDialog = signal<EmplacementDialogState | null>(null);
  tableDialog = signal<TableDialogState | null>(null);

  emplacementForm: FormGroup;
  savingEmplacement = signal(false);

  tableForm: FormGroup;
  savingTable = signal(false);

  pendingDelete = signal<PendingDelete | null>(null);
  isDeleting = signal(false);

  readonly selectedEmplacement = computed(
    () => this.emplacements().find((e) => e.id === this.selectedEmplacementId()) ?? null,
  );

  readonly emplacementCounts = computed(() => {
    const counts = new Map<string, number>();
    for (const table of this.tables()) {
      if (!table.emplacementId) continue;
      counts.set(table.emplacementId, (counts.get(table.emplacementId) ?? 0) + 1);
    }
    return counts;
  });

  readonly filteredTables = computed(() => {
    const q = this.query().trim().toLowerCase();
    const filter = this.etatFilter();
    let list = q
      ? this.tables().filter((table) => table.nom.toLowerCase().includes(q))
      : this.selectedEmplacementId()
        ? this.tables().filter((table) => table.emplacementId === this.selectedEmplacementId())
        : this.tables();

    if (filter !== 'all') list = list.filter((table) => table.etat === filter);
    return list;
  });

  readonly panelTitle = computed(() =>
    this.query().trim() ? 'Résultats' : (this.selectedEmplacement()?.name ?? 'Toutes les tables'),
  );

  readonly stats = computed(() => ({
    emplacements: this.emplacements().length,
    tables: this.tables().length,
    occupied: this.tables().filter((table) => table.etat === TABLE_ETAT.OCCUPEE).length,
  }));

  readonly deleteDialogTitle = computed(() =>
    this.pendingDelete()?.type === 'emplacement' ? "Supprimer l'emplacement" : 'Supprimer la table',
  );

  constructor(
    private fb: FormBuilder,
    private emplacementsService: EmplacementsService,
    private tablesService: TablesService,
    private usersService: UsersService,
    private toastService: ToastService,
  ) {
    this.emplacementForm = this.fb.group({
      name: ['', [Validators.required]],
    });

    this.tableForm = this.fb.group({
      nom: ['', [Validators.required]],
      emplacementId: [''],
      capacite: [2, [Validators.required, Validators.min(1)]],
      etat: [TABLE_ETAT.LIBRE, [Validators.required]],
      assignedStaffId: [''],
    });

    const storedView = localStorage.getItem(VIEW_STORAGE_KEY);
    if (storedView === 'list' || storedView === 'grid') {
      this.view.set(storedView);
    }
  }

  ngOnInit(): void {
    this.loadAll();
    this.usersService.findAll().subscribe({
      next: (response) => this.staff.set(response.data ?? []),
    });
  }

  private loadAll(): void {
    this.loading.set(true);
    forkJoin({
      emplacements: this.emplacementsService.findAll(),
      tables: this.tablesService.findAll(),
    })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: ({ emplacements, tables }) => {
          this.emplacements.set(emplacements.data ?? []);
          this.tables.set(tables.data ?? []);
        },
        error: () => {
          this.toastService.error('Impossible de charger les tables.');
        },
      });
  }

  // ----- Selection / filters -----

  selectEmplacement(emplacement: Emplacement | null): void {
    this.selectedEmplacementId.set(emplacement?.id ?? null);
    this.query.set('');
  }

  onSearchInput(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  setEtatFilter(filter: EtatFilter): void {
    this.etatFilter.set(filter);
  }

  setView(view: ViewMode): void {
    this.view.set(view);
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  }

  tableCount(emplacementId: string): number {
    return this.emplacementCounts().get(emplacementId) ?? 0;
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

  staffName(staff?: { first_name: string; last_name: string } | null): string {
    if (!staff) return '';
    return `${staff.first_name} ${staff.last_name}`;
  }

  staffInitials(staff?: { first_name: string; last_name: string } | null): string {
    if (!staff) return '';
    return `${staff.first_name.charAt(0)}${staff.last_name.charAt(0)}`.toUpperCase();
  }

  // ----- Emplacement dialog -----

  openCreateEmplacement(): void {
    this.emplacementForm.reset({ name: '' });
    this.emplacementDialog.set({ mode: 'create', id: null });
  }

  openEditEmplacement(emplacement: Emplacement): void {
    this.emplacementForm.setValue({ name: emplacement.name });
    this.emplacementDialog.set({ mode: 'edit', id: emplacement.id });
  }

  closeEmplacementDialog(): void {
    this.emplacementDialog.set(null);
  }

  submitEmplacement(): void {
    if (this.emplacementForm.invalid) {
      this.emplacementForm.markAllAsTouched();
      return;
    }

    const value = this.emplacementForm.value;
    const dialog = this.emplacementDialog();
    this.savingEmplacement.set(true);

    const request =
      dialog?.mode === 'edit' && dialog.id
        ? this.emplacementsService.update(dialog.id, value)
        : this.emplacementsService.create({ ...value, order: this.emplacements().length });

    request.pipe(finalize(() => this.savingEmplacement.set(false))).subscribe({
      next: () => {
        this.toastService.success(
          dialog?.mode === 'edit' ? 'Emplacement mis à jour.' : 'Emplacement créé.',
        );
        this.closeEmplacementDialog();
        this.loadAll();
      },
      error: (error) => {
        this.toastService.error(
          this.extractErrorMessage(error, "Impossible d'enregistrer l'emplacement."),
        );
      },
    });
  }

  moveEmplacement(emplacement: Emplacement, direction: -1 | 1): void {
    const ordered = [...this.emplacements()].sort((a, b) => a.order - b.order);
    const index = ordered.findIndex((e) => e.id === emplacement.id);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= ordered.length) return;

    const target = ordered[targetIndex];
    forkJoin([
      this.emplacementsService.update(emplacement.id, { order: target.order }),
      this.emplacementsService.update(target.id, { order: emplacement.order }),
    ]).subscribe({
      next: () => this.loadAll(),
      error: () => this.toastService.error('Impossible de réordonner les emplacements.'),
    });
  }

  isFirstEmplacement(emplacement: Emplacement): boolean {
    const ordered = [...this.emplacements()].sort((a, b) => a.order - b.order);
    return ordered[0]?.id === emplacement.id;
  }

  isLastEmplacement(emplacement: Emplacement): boolean {
    const ordered = [...this.emplacements()].sort((a, b) => a.order - b.order);
    return ordered[ordered.length - 1]?.id === emplacement.id;
  }

  deleteEmplacementFromDialog(): void {
    const dialog = this.emplacementDialog();
    if (!dialog?.id) return;
    const emplacement = this.emplacements().find((e) => e.id === dialog.id);
    if (emplacement) this.requestDeleteEmplacement(emplacement);
  }

  // ----- Table dialog -----

  openCreateTable(): void {
    this.tableForm.reset({
      nom: '',
      emplacementId: this.selectedEmplacementId() ?? '',
      capacite: 2,
      etat: TABLE_ETAT.LIBRE,
      assignedStaffId: '',
    });
    this.tableDialog.set({ mode: 'create', id: null });
  }

  openEditTable(table: RestaurantTable): void {
    this.tableForm.setValue({
      nom: table.nom,
      emplacementId: table.emplacementId ?? '',
      capacite: table.capacite,
      etat: table.etat,
      assignedStaffId: table.assignedStaffId ?? '',
    });
    this.tableDialog.set({ mode: 'edit', id: table.id });
  }

  closeTableDialog(): void {
    this.tableDialog.set(null);
  }

  submitTable(): void {
    if (this.tableForm.invalid) {
      this.tableForm.markAllAsTouched();
      return;
    }

    const value = {
      ...this.tableForm.value,
      emplacementId: this.tableForm.value.emplacementId || null,
      assignedStaffId: this.tableForm.value.assignedStaffId || null,
    };
    const dialog = this.tableDialog();
    const editingId = dialog?.mode === 'edit' ? dialog.id : null;
    this.savingTable.set(true);

    const request = editingId
      ? this.tablesService.update(editingId, value)
      : this.tablesService.create(value);

    request.pipe(finalize(() => this.savingTable.set(false))).subscribe({
      next: () => {
        this.toastService.success(editingId ? 'Table mise à jour.' : 'Table créée.');
        this.closeTableDialog();
        this.loadAll();
      },
      error: (error) => {
        this.toastService.error(this.extractErrorMessage(error, "Impossible d'enregistrer la table."));
      },
    });
  }

  // ----- Delete -----

  requestDeleteEmplacement(emplacement: Emplacement): void {
    this.pendingDelete.set({ type: 'emplacement', id: emplacement.id, label: emplacement.name });
  }

  requestDeleteTable(table: RestaurantTable): void {
    this.pendingDelete.set({ type: 'table', id: table.id, label: table.nom });
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const pending = this.pendingDelete();
    if (!pending) return;

    this.isDeleting.set(true);
    const request =
      pending.type === 'emplacement'
        ? this.emplacementsService.delete(pending.id)
        : this.tablesService.delete(pending.id);

    request.pipe(finalize(() => this.isDeleting.set(false))).subscribe({
      next: () => {
        this.toastService.success(
          pending.type === 'emplacement' ? 'Emplacement supprimé.' : 'Table supprimée.',
        );
        this.pendingDelete.set(null);
        if (pending.type === 'emplacement') {
          this.closeEmplacementDialog();
          if (this.selectedEmplacementId() === pending.id) {
            this.selectedEmplacementId.set(null);
          }
        }
        this.loadAll();
      },
      error: (error) => {
        this.toastService.error(this.extractErrorMessage(error, 'Suppression impossible.'));
        this.pendingDelete.set(null);
      },
    });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.pendingDelete()) {
      this.cancelDelete();
    } else if (this.tableDialog()) {
      this.closeTableDialog();
    } else if (this.emplacementDialog()) {
      this.closeEmplacementDialog();
    }
  }

  private extractErrorMessage(error: unknown, fallback: string): string {
    const message = (error as { error?: { message?: string } })?.error?.message;
    return message || fallback;
  }
}
