import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';

export interface AppSettings {
  whatsappNumber: string;
}

export interface UpdateAppSettingsDto {
  whatsappNumber: string;
}

@Injectable({
  providedIn: 'root',
})
export class AppSettingsService {
  private readonly API_URL = `${environment.apiUrl}/settings`;

  constructor(private http: HttpClient) {}

  get(): Observable<ApiResponse<AppSettings>> {
    return this.http.get<ApiResponse<AppSettings>>(this.API_URL);
  }

  update(dto: UpdateAppSettingsDto): Observable<ApiResponse<AppSettings>> {
    return this.http.patch<ApiResponse<AppSettings>>(this.API_URL, dto);
  }
}
