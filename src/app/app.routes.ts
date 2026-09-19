import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import {AdminComponentLayout} from '@app/layout/admin/admin.component'
import { authGuard } from '@app/core/guards/auth.guard';
import { roleGuard } from '@app/core/guards/role.guard';
import { restaurantContextGuard } from '@app/core/guards/restaurant-context.guard';
import { USER_ROLES } from '@app/shared/enums';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>import('@features/auth/login/login').then(m => m.Login),
    },
    {
        path: 'menu',
        loadComponent: () =>import('@features/menu/public-menu/public-menu.component').then(m => m.PublicMenuComponent),
    },
    {
        path: '',
        component:AdminComponentLayout,
       // canActivate: [authGuard],
        children:[
            {
                path: '',
                redirectTo:'dashboard',
                pathMatch: 'full',
            },
            {
                path: 'dashboard',
                loadComponent: () =>import('@features/dashboard/super-admin/super-admin-dashboard.component').then(m => m.SuperAdminDashboardComponent),
                canActivate: [authGuard, roleGuard],
                data: { roles: [USER_ROLES.SUPER_ADMIN] },
            },
            {
                path: 'restaurants',
                loadComponent: () =>import('@features/restaurants/restaurants-page/restaurants-page.component').then(m => m.RestaurantsPageComponent),
                canActivate: [authGuard, roleGuard],
                data: { roles: [USER_ROLES.SUPER_ADMIN] },
            },
            {
                path: 'prospects',
                loadComponent: () =>import('@features/prospects/prospects-page/prospects-page.component').then(m => m.ProspectsPageComponent),
                canActivate: [authGuard, roleGuard],
                data: { roles: [USER_ROLES.SUPER_ADMIN] },
            },
            {
                path: 'equipe-interne',
                loadComponent: () =>import('@features/team-internal/team-internal-page.component').then(m => m.TeamInternalPageComponent),
                canActivate: [authGuard, roleGuard],
                data: { roles: [USER_ROLES.SUPER_ADMIN] },
            },
            {
                path: 'parametres',
                loadComponent: () =>import('@features/super-admin-settings/super-admin-settings.component').then(m => m.SuperAdminSettingsComponent),
                canActivate: [authGuard, roleGuard],
                data: { roles: [USER_ROLES.SUPER_ADMIN] },
            },
            {
                path: 'admin/menu',
                loadComponent: () =>import('@features/menu/admin-menu/admin-menu.component').then(m => m.AdminMenuComponent),
                canActivate: [authGuard, roleGuard],
                data: { roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER] },
            },
            {
                path: 'ventes',
                loadComponent: () =>import('@features/sales/sales-page/sales-page.component').then(m => m.SalesPageComponent),
                canActivate: [authGuard, roleGuard],
                data: { roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER] },
            },
            {
                path: 'additions',
                loadComponent: () =>import('@features/additions/additions-page/additions-page.component').then(m => m.AdditionsPageComponent),
                canActivate: [authGuard, roleGuard],
                data: { roles: [USER_ROLES.SUPER_ADMIN, USER_ROLES.OWNER] },
            },
            {
                path: 'restaurant-view',
                canActivate: [authGuard, roleGuard, restaurantContextGuard],
                data: { roles: [USER_ROLES.SUPER_ADMIN] },
                children: [
                    { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
                    {
                        path: 'dashboard',
                        loadComponent: () =>import('@features/restaurant-view/dashboard-tab/dashboard-tab.component').then(m => m.DashboardTabComponent),
                    },
                    {
                        path: 'table',
                        loadComponent: () =>import('@features/restaurant-view/table-management/table-management.component').then(m => m.TableManagementComponent),
                    },
                    {
                        path: 'menu',
                        loadComponent: () =>import('@features/menu/admin-menu/admin-menu.component').then(m => m.AdminMenuComponent),
                    },
                    {
                        path: 'personnels',
                        loadComponent: () =>import('@features/restaurant-view/personnels-tab/personnels-tab.component').then(m => m.PersonnelsTabComponent),
                    },
                    {
                        path: 'parametres',
                        loadComponent: () =>import('@features/restaurant-view/parametres-tab/parametres-tab.component').then(m => m.ParametresTabComponent),
                    },
                    {
                        path: 'ventes',
                        loadComponent: () =>import('@features/sales/sales-page/sales-page.component').then(m => m.SalesPageComponent),
                    },
                    {
                        path: 'additions',
                        loadComponent: () =>import('@features/additions/additions-page/additions-page.component').then(m => m.AdditionsPageComponent),
                    },
                ],
            },
        ],

    },
    /*{
        path: 'admin',
        loadComponent: () =>import('@app/features/admin/admin.component').then(m => m.AdminComponent),
    }*/
];
