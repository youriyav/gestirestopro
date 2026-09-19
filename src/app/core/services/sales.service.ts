import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';

export interface SaleItem {
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
}

export interface Sale {
  id: string;
  tableLabel: string;
  serverName?: string | null;
  cashierId?: string | null;
  cashier?: { id: string; first_name: string; last_name: string } | null;
  total: number;
  printedAt: string;
  items: SaleItem[];
}

export interface SalesQuery {
  date?: string;
  cashierId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedSales {
  data: Sale[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({
  providedIn: 'root',
})
export class SalesService {
  private readonly API_URL = `${environment.apiUrl}/sales`;

  constructor(private http: HttpClient) {}

  findAll(query: SalesQuery = {}): Observable<ApiResponse<PaginatedSales>> {
    const params: Record<string, string> = {};
    if (query.date) params['date'] = query.date;
    if (query.cashierId) params['cashierId'] = query.cashierId;
    if (query.page) params['page'] = String(query.page);
    if (query.limit) params['limit'] = String(query.limit);

    return this.http.get<ApiResponse<PaginatedSales>>(this.API_URL, { params });
  }
}
