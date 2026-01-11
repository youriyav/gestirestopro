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

  findOne(id: string): Observable<ApiResponse<User>> {
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/${id}`);
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
