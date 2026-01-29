export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  OWNER = 'owner',
  STAFF = 'staff',
  CLIENT = 'customer',
  SELLER = 'seller',
  RIDER = 'rider',
  DEFAULT = 'user',
}


export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string | null;
  isActivate?: boolean;
  isAdmin?: boolean;
  role?: UserRole;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  password?: string;
  address?: string;
  isActivate?: boolean;
  isAdmin?: boolean;
  role?: UserRole;
}


export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Admin',
  [UserRole.ADMIN]: 'Administrateur',
  [UserRole.OWNER]: 'Propriétaire',
  [UserRole.STAFF]: 'Staff',
  [UserRole.CLIENT]: 'Client',
  [UserRole.SELLER]: 'Vendeur',
  [UserRole.RIDER]: 'Livreur',
  [UserRole.DEFAULT]: 'Utilisateur',
};

