import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';

export interface Emplacement {
  id: string;
  name: string;
  order: number;
  restaurantId: string;
}

export interface CreateEmplacementDto {
  name: string;
  order?: number;
}

export interface UpdateEmplacementDto {
  name?: string;
  order?: number;
}

@Injectable({
  providedIn: 'root',
})
export class EmplacementsService {
  private readonly API_URL = `${environment.apiUrl}/emplacements`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<ApiResponse<Emplacement[]>> {
    return this.http.get<ApiResponse<Emplacement[]>>(this.API_URL);
  }

  create(createEmplacementDto: CreateEmplacementDto): Observable<ApiResponse<Emplacement>> {
    return this.http.post<ApiResponse<Emplacement>>(this.API_URL, createEmplacementDto);
  }

  update(
    id: string,
    updateEmplacementDto: UpdateEmplacementDto,
  ): Observable<ApiResponse<Emplacement>> {
    return this.http.patch<ApiResponse<Emplacement>>(`${this.API_URL}/${id}`, updateEmplacementDto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
