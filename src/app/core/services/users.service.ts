import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string;
  isActivate?: boolean;
  isAdmin?: boolean;
  role?: string;
  accessCode?: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address?: string;
  password?: string;
  role?: string;
  isActivate?: boolean;
}

export interface CreateUserDto {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  password?: string;
  address?: string;
  isAdmin?: boolean;
  role?: string;
  isActivate?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly API_URL = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  findAll(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(this.API_URL);
  }

  /** Super Admin only — every user across every restaurant, via GET /users/all. */
  findAllAcrossAllRestaurants(): Observable<ApiResponse<User[]>> {
    return this.http.get<ApiResponse<User[]>>(`${this.API_URL}/all`);
  }

  findOne(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/${id}`);
  }

  /** On-demand reveal of a SERVER/CASHIER user's 4-digit mobile access code. */
  getAccessCode(id: string): Observable<ApiResponse<{ accessCode: string | null }>> {
    return this.http.get<ApiResponse<{ accessCode: string | null }>>(`${this.API_URL}/${id}/access-code`);
  }

  create(createUserDto: CreateUserDto): Observable<ApiResponse<User>> {
    return this.http.post<ApiResponse<User>>(this.API_URL, createUserDto);
  }

  update(id: string, updateUserDto: UpdateUserDto): Observable<ApiResponse<User>> {
    return this.http.patch<ApiResponse<User>>(`${this.API_URL}/${id}`, updateUserDto);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`);
  }
}
