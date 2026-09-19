import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';

export type DesiredPlan = 'essentiel' | 'pro' | 'business' | 'unsure';
export type ProspectStatus = 'new' | 'contacted' | 'converted' | 'discarded';

export interface Prospect {
  id: string;
  restaurantName: string;
  contactName: string;
  phone: string;
  email?: string;
  city: string;
  desiredPlan: DesiredPlan;
  message?: string;
  status: ProspectStatus;
  createdAt: string;
}

export interface ProspectsQuery {
  status?: ProspectStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedProspects {
  data: Prospect[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

@Injectable({
  providedIn: 'root',
})
export class ProspectsService {
  private readonly API_URL = `${environment.apiUrl}/prospects`;

  constructor(private http: HttpClient) {}

  findAll(query: ProspectsQuery = {}): Observable<ApiResponse<PaginatedProspects>> {
    const params: Record<string, string> = {};
    if (query.status) params['status'] = query.status;
    if (query.page) params['page'] = String(query.page);
    if (query.limit) params['limit'] = String(query.limit);

    return this.http.get<ApiResponse<PaginatedProspects>>(this.API_URL, { params });
  }

  updateStatus(id: string, status: ProspectStatus): Observable<ApiResponse<Prospect>> {
    return this.http.patch<ApiResponse<Prospect>>(`${this.API_URL}/${id}/status`, { status });
  }
}
