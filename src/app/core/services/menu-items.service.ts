import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';
import { MenuCategory } from './menu-categories.service';

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  category?: MenuCategory;
  price: number;
  unit?: string;
  description?: string;
  imageUrl?: string;
  imageObjectKey?: string;
  isAvailable: boolean;
  order: number;
}

export interface CreateMenuItemDto {
  name: string;
  categoryId: string;
  price: number;
  unit?: string;
  description?: string;
  isAvailable?: boolean;
  order?: number;
}

export interface UpdateMenuItemDto {
  name?: string;
  categoryId?: string;
  price?: number;
  unit?: string;
  description?: string;
  isAvailable?: boolean;
  order?: number;
}

export interface FindPublicMenuItemsParams {
  category?: string;
  search?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MenuItemsService {
  private readonly API_URL = `${environment.apiUrl}/menu/items`;

  constructor(private http: HttpClient) {}

  findPublic(params: FindPublicMenuItemsParams = {}): Observable<ApiResponse<MenuItem[]>> {
    const query: Record<string, string> = {};
    if (params.category) query['category'] = params.category;
    if (params.search) query['search'] = params.search;

    return this.http.get<ApiResponse<MenuItem[]>>(this.API_URL, { params: query });
  }

  findAllAdmin(): Observable<ApiResponse<MenuItem[]>> {
    return this.http.get<ApiResponse<MenuItem[]>>(`${this.API_URL}/all`);
  }

  create(createMenuItemDto: CreateMenuItemDto): Observable<ApiResponse<MenuItem>> {
    return this.http.post<ApiResponse<MenuItem>>(this.API_URL, createMenuItemDto);
  }

  update(id: string, updateMenuItemDto: UpdateMenuItemDto): Observable<ApiResponse<MenuItem>> {
    return this.http.patch<ApiResponse<MenuItem>>(`${this.API_URL}/${id}`, updateMenuItemDto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }

  uploadImage(id: string, file: File): Observable<ApiResponse<MenuItem>> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ApiResponse<MenuItem>>(`${this.API_URL}/${id}/image`, formData);
  }
}
