import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, finalize, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '@app/shared/types/api.types';
import { USER_ROLES } from '@app/shared/enums';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  isAdmin: boolean;
  role?: USER_ROLES;
  isActivate: boolean;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiUrl}/auth`;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user';

  private _currentUser = signal<User | null>(null);
  private _isAuthenticated = signal<boolean>(false);
  private _isLoading = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  get currentUser() {
    return this._currentUser.asReadonly();
  }

  get isAuthenticated() {
    return this._isAuthenticated.asReadonly();
  }

  get isLoading() {
    return this._isLoading.asReadonly();
  }

  login(credentials: LoginRequest): Observable<ApiResponse<LoginResponse>> {
    this._isLoading.set(true);
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        this.setSession(response.data!);
      }),
      finalize(() => this._isLoading.set(false)) 
    );
  }

  refreshToken(): Observable<ApiResponse<LoginResponse>> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    this._isLoading.set(true);
    return this.http.post<ApiResponse<LoginResponse>>(`${this.API_URL}/refresh`, {
      refresh_token: refreshToken
    }).pipe(
      tap(response => {
        this.setSession(response.data!);
      }),
      finalize(() => this._isLoading.set(false))
    );
  }

  getProfile(): Observable<ApiResponse<User>> {
    this._isLoading.set(true);
    console.log(environment.apiUrl)
    console.log(this.API_URL)
    return this.http.get<ApiResponse<User>>(`${this.API_URL}/profile`).pipe(
      tap(response => {
        this._currentUser.set(response.data!);
        this.saveUserToStorage(response.data!);
      }),

      catchError(error => {
      console.error('Get profile failed', error);

      // Optional: clear user on auth error
      if (error.status !== 401) {
        this.logout();
      }
      // rethrow error so components can react
      return throwError(() => error);
    }),

      finalize(() => this._isLoading.set(false))
    );
  }

  logout(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  }

  private setSession(authResult: LoginResponse): void {
    console.log(authResult)
        console.log("log save user")
    localStorage.setItem(this.ACCESS_TOKEN_KEY, authResult.access_token);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, authResult.refresh_token);
    this.saveUserToStorage(authResult.user);
    this._currentUser.set(authResult.user);
    this._isAuthenticated.set(true);
  }

  private saveUserToStorage(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private loadUserFromStorage(): void {
    const userJson = localStorage.getItem(this.USER_KEY);
    const token = this.getAccessToken();

    if (userJson && token) {
      try {
        const user = JSON.parse(userJson) as User;
        this._currentUser.set(user);
        this._isAuthenticated.set(true);
      } catch (error) {
        console.error('Error parsing user from storage:', error);
        this.logout();
      }
    }
  }
}
