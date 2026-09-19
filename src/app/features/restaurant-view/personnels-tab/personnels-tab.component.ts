import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { UsersService, User } from '@app/core/services/users.service';
import { ToastService } from '@app/shared/services/toast.service';
import { USER_ROLES } from '@app/shared/enums';
import { PencilIcon } from '@app/components/ui/icons/pencil/pencil.icon';
import { PowerIcon } from '@app/components/ui/icons/power/power.icon';
import { TrashIcon } from '@app/components/ui/icons/trash/trash.icon';
import { EyeIcon } from '@app/components/ui/icons/eye/eye.icon';
import { DeleteConfirmationModal } from '@app/components/ui/delete-confirmation-modal/delete-confirmation-modal';

/** Roles managed from this screen — mobile-app staff who log in via phone + 4-digit code. */
const MANAGEABLE_ROLES: string[] = [USER_ROLES.SERVER, USER_ROLES.CASHIER];

@Component({
  selector: 'app-personnels-tab',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, PencilIcon, PowerIcon, TrashIcon, EyeIcon, DeleteConfirmationModal],
  templateUrl: './personnels-tab.component.html',
})
export class PersonnelsTabComponent implements OnInit {
  private readonly usersService = inject(UsersService);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  members = signal<User[]>([]);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);
  isDeleting = signal<boolean>(false);

  dialogMode = signal<'create' | 'edit' | null>(null);
  editingId = signal<string | null>(null);
  pendingDelete = signal<User | null>(null);

  readonly USER_ROLES = USER_ROLES;

  form: FormGroup = this.fb.group({
    first_name: ['', [Validators.required]],
    last_name: ['', [Validators.required]],
    phone: ['', [Validators.required]],
    role: [USER_ROLES.SERVER, [Validators.required]],
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.usersService.findAll().subscribe({
      next: (response) => {
        this.members.set(response.data ?? []);
        this.isLoading.set(false);
      },
      error: () => {
        this.toastService.error("Impossible de charger l'équipe.");
        this.isLoading.set(false);
      },
    });
  }

  roleLabel(role: string | undefined): string {
    switch (role) {
      case USER_ROLES.OWNER:
        return 'Propriétaire';
      case USER_ROLES.SERVER:
        return 'Serveur';
      case USER_ROLES.CASHIER:
        return 'Caissier';
      case USER_ROLES.STAFF:
        return 'Staff';
      case USER_ROLES.MEMBER:
        return 'Membre';
      default:
        return role ?? '—';
    }
  }

  /** Only server/cashier rows are managed from this popup — never the restaurant owner or other legacy accounts. */
  isManageable(member: User): boolean {
    return MANAGEABLE_ROLES.includes(member.role ?? '');
  }

  // ----- Create / edit dialog -----

  openCreate(): void {
    this.dialogMode.set('create');
    this.editingId.set(null);
    this.form.reset({ role: USER_ROLES.SERVER });
  }

  openEdit(member: User): void {
    this.dialogMode.set('edit');
    this.editingId.set(member.id);
    this.form.reset({
      first_name: member.first_name,
      last_name: member.last_name,
      phone: member.phone,
      role: member.role ?? USER_ROLES.SERVER,
    });
  }

  closeDialog(): void {
    this.dialogMode.set(null);
    this.editingId.set(null);
    this.form.reset({ role: USER_ROLES.SERVER });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = { ...this.form.value };
    const editingId = this.editingId();

    if (!editingId) {
      value.isActivate = true;
    }

    this.isSaving.set(true);
    const request = editingId
      ? this.usersService.update(editingId, value)
      : this.usersService.create(value);

    request.subscribe({
      next: (response) => {
        this.isSaving.set(false);
        this.closeDialog();
        this.load();
        if (!editingId && response.data?.accessCode) {
          this.toastService.success(`Personnel ajouté. Code d'accès : ${response.data.accessCode}`, 8000);
        } else {
          this.toastService.success(editingId ? 'Personnel modifié.' : 'Personnel ajouté.');
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        const message = err?.error?.error?.message || err?.error?.message;
        this.toastService.error(message || "Impossible d'enregistrer ce personnel.");
      },
    });
  }

  // ----- Afficher le code d'accès -----

  reveal(member: User): void {
    this.usersService.getAccessCode(member.id).subscribe({
      next: (response) => {
        const code = response.data?.accessCode;
        if (code) {
          this.toastService.info(`Code d'accès de ${member.first_name} : ${code}`, 8000);
        } else {
          this.toastService.error('Aucun code d\'accès pour ce personnel.');
        }
      },
      error: () => {
        this.toastService.error("Impossible de récupérer le code d'accès.");
      },
    });
  }

  // ----- Activer / désactiver (optimiste) -----

  toggleActive(member: User): void {
    const next = !member.isActivate;
    this.members.set(this.members().map((m) => (m.id === member.id ? { ...m, isActivate: next } : m)));

    this.usersService.update(member.id, { role: member.role, isActivate: next }).subscribe({
      error: () => {
        this.members.set(this.members().map((m) => (m.id === member.id ? { ...m, isActivate: !next } : m)));
        this.toastService.error('Impossible de modifier le statut de ce personnel.');
      },
    });
  }

  // ----- Suppression -----

  requestDelete(member: User): void {
    this.pendingDelete.set(member);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  confirmDelete(): void {
    const member = this.pendingDelete();
    if (!member) return;

    this.isDeleting.set(true);
    this.usersService.delete(member.id).subscribe({
      next: () => {
        this.toastService.success('Personnel supprimé.');
        this.isDeleting.set(false);
        this.pendingDelete.set(null);
        this.load();
      },
      error: (err) => {
        this.isDeleting.set(false);
        this.pendingDelete.set(null);
        const message = err?.error?.error?.message || err?.error?.message;
        this.toastService.error(message || 'Impossible de supprimer ce personnel.');
      },
    });
  }
}
