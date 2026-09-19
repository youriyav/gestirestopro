import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  order: number;
}

export interface CreateMenuCategoryDto {
  name: string;
  slug: string;
  icon?: string;
  order?: number;
}

export interface UpdateMenuCategoryDto {
  name?: string;
  slug?: string;
  icon?: string;
  order?: number;
}

@Injectable({
  providedIn: 'root',
})
export class MenuCategoriesService {
  private readonly API_URL = `${environment.apiUrl}/menu/categories`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<ApiResponse<MenuCategory[]>> {
    return this.http.get<ApiResponse<MenuCategory[]>>(this.API_URL);
  }

  create(createMenuCategoryDto: CreateMenuCategoryDto): Observable<ApiResponse<MenuCategory>> {
    return this.http.post<ApiResponse<MenuCategory>>(this.API_URL, createMenuCategoryDto);
  }

  update(
    id: string,
    updateMenuCategoryDto: UpdateMenuCategoryDto,
  ): Observable<ApiResponse<MenuCategory>> {
    return this.http.patch<ApiResponse<MenuCategory>>(
      `${this.API_URL}/${id}`,
      updateMenuCategoryDto,
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
