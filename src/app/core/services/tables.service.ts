import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';
import { TABLE_ETAT } from '@app/shared/enums';
import { Emplacement } from './emplacements.service';

export interface AssignedStaff {
  id: string;
  first_name: string;
  last_name: string;
}

export interface TableOrderItem {
  menuItemId: string | null;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface RestaurantTable {
  id: string;
  nom: string;
  emplacementId?: string | null;
  emplacement?: Emplacement | null;
  capacite: number;
  etat: TABLE_ETAT;
  restaurantId: string;
  createdAt: string;
  assignedStaffId?: string | null;
  assignedStaff?: AssignedStaff | null;
  orderItems?: TableOrderItem[];
}

export interface CreateTableDto {
  nom: string;
  emplacementId?: string | null;
  capacite: number;
  etat?: TABLE_ETAT;
  assignedStaffId?: string | null;
}

export interface UpdateTableDto {
  nom?: string;
  emplacementId?: string | null;
  capacite?: number;
  etat?: TABLE_ETAT;
  assignedStaffId?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class TablesService {
  private readonly API_URL = `${environment.apiUrl}/tables`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<ApiResponse<RestaurantTable[]>> {
    return this.http.get<ApiResponse<RestaurantTable[]>>(this.API_URL);
  }

  create(createTableDto: CreateTableDto): Observable<ApiResponse<RestaurantTable>> {
    return this.http.post<ApiResponse<RestaurantTable>>(this.API_URL, createTableDto);
  }

  update(id: string, updateTableDto: UpdateTableDto): Observable<ApiResponse<RestaurantTable>> {
    return this.http.patch<ApiResponse<RestaurantTable>>(`${this.API_URL}/${id}`, updateTableDto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
