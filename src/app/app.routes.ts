import { Component } from '@angular/core';
import { Routes } from '@angular/router';
import {AdminComponentLayout} from '@app/layout/admin/admin.component'
import { authGuard } from '@app/core/guards/auth.guard';

export const routes: Routes = [
    {
        path: 'login',
        loadComponent: () =>import('@features/auth/login/login').then(m => m.Login),
    },
    {
        path: '',
        component:AdminComponentLayout,
        canActivate: [authGuard],
        children:[
            {
                path: '',
                redirectTo:'dashboard',
                pathMatch: 'full',
                //loadComponent: () =>import('@app/features/dashboard/home/home.component').then(m => m.HomeComponent),
            },
            {
                path: 'dashboard',
                loadComponent: () =>import('@app/features/dashboard/home/home.component').then(m => m.HomeComponent),
            },
        ],

    },
    /*{
        path: 'admin',
        loadComponent: () =>import('@app/features/admin/admin.component').then(m => m.AdminComponent),
    }*/
];
