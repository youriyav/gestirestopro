import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';

export interface AdditionItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Addition {
  id: string;
  tableLabel: string;
  serverName?: string | null;
  cashierId?: string | null;
  cashier?: { id: string; first_name: string; last_name: string } | null;
  total: number;
  printedAt: string;
  items: AdditionItem[];
}

export interface AdditionsQuery {
  date?: string;
  cashierId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedAdditions {
  data: Addition[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({
  providedIn: 'root',
})
export class AdditionsService {
  private readonly API_URL = `${environment.apiUrl}/additions`;

  constructor(private http: HttpClient) {}

  findAll(query: AdditionsQuery = {}): Observable<ApiResponse<PaginatedAdditions>> {
    const params: Record<string, string> = {};
    if (query.date) params['date'] = query.date;
    if (query.cashierId) params['cashierId'] = query.cashierId;
    if (query.page) params['page'] = String(query.page);
    if (query.limit) params['limit'] = String(query.limit);

    return this.http.get<ApiResponse<PaginatedAdditions>>(this.API_URL, { params });
  }
}
