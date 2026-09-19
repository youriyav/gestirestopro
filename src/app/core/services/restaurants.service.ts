import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';
import { ImpersonatedRestaurant } from './auth.service';

export type RestaurantPlan = 'essentiel' | 'pro' | 'business';
export type RestaurantStatus = 'active' | 'trial' | 'suspended';

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  city: string;
  plan: RestaurantPlan;
  status: RestaurantStatus;
  mrr: number;
  createdAt: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
}

export interface UpdateRestaurantDto {
  name?: string;
  slug?: string;
  city?: string;
  plan?: RestaurantPlan;
  status?: RestaurantStatus;
  address?: string;
  phone?: string;
}

export interface CreateRestaurantDto {
  name: string;
  slug: string;
  city?: string;
  address?: string;
  phone?: string;
  plan?: RestaurantPlan;
  status?: RestaurantStatus;
}

export interface RestaurantsQuery {
  status?: RestaurantStatus;
  page?: number;
  limit?: number;
}

export interface PaginatedRestaurants {
  data: Restaurant[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface ImpersonateResponse {
  access_token: string;
  restaurant: ImpersonatedRestaurant;
}

@Injectable({
  providedIn: 'root',
})
export class RestaurantsService {
  private readonly API_URL = `${environment.apiUrl}/restaurants`;

  constructor(private http: HttpClient) {}

  findAll(query: RestaurantsQuery = {}): Observable<ApiResponse<PaginatedRestaurants>> {
    const params: Record<string, string> = {};
    if (query.status) params['status'] = query.status;
    if (query.page) params['page'] = String(query.page);
    if (query.limit) params['limit'] = String(query.limit);

    return this.http.get<ApiResponse<PaginatedRestaurants>>(this.API_URL, { params });
  }

  findOne(id: string): Observable<ApiResponse<Restaurant>> {
    return this.http.get<ApiResponse<Restaurant>>(`${this.API_URL}/${id}`);
  }

  create(dto: CreateRestaurantDto): Observable<ApiResponse<Restaurant>> {
    return this.http.post<ApiResponse<Restaurant>>(this.API_URL, dto);
  }

  update(id: string, dto: UpdateRestaurantDto): Observable<ApiResponse<Restaurant>> {
    return this.http.patch<ApiResponse<Restaurant>>(`${this.API_URL}/${id}`, dto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  impersonate(id: string): Observable<ApiResponse<ImpersonateResponse>> {
    return this.http.post<ApiResponse<ImpersonateResponse>>(`${this.API_URL}/${id}/impersonate`, {});
  }

  stopImpersonate(id: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/${id}/stop-impersonate`, {});
  }

  uploadLogo(id: string, file: File): Observable<ApiResponse<Restaurant>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<Restaurant>>(`${this.API_URL}/${id}/logo`, formData);
  }
}
