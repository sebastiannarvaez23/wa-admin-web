import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutPageComponent } from 'src/app/core/components/layout-page/layout-page.component';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { ModuleInConstructionPageComponent } from './pages/module-in-construction/module-in-construction-page.component';
import { SettingsPageComponent } from './pages/settings/settings-page.component';
import { SubscriptionsPageComponent } from './pages/subscriptions/subscriptions-page.component';
import { authGuard } from 'src/app/core/guards/auth.guard';

const routes: Routes = [
    {
        path: '',
        component: LayoutPageComponent,
        canActivate: [authGuard],
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

            // Dashboard
            { path: 'dashboard', component: DashboardPageComponent },

            // Plataforma
            { path: 'tenants',   component: ModuleInConstructionPageComponent },
            { path: 'users',     component: ModuleInConstructionPageComponent },
            { path: 'security',  component: ModuleInConstructionPageComponent },
            { path: 'settings',  component: SettingsPageComponent },

            // Comercial
            { path: 'subscriptions', component: SubscriptionsPageComponent },
            { path: 'billing',       component: ModuleInConstructionPageComponent },
            { path: 'features',      component: ModuleInConstructionPageComponent },
            { path: 'ai-features',   component: ModuleInConstructionPageComponent },

            // Soporte
            { path: 'support', component: ModuleInConstructionPageComponent },
            { path: 'docs',    component: ModuleInConstructionPageComponent },

            // Analítica
            { path: 'analytics', component: ModuleInConstructionPageComponent },
            { path: 'audit',     component: ModuleInConstructionPageComponent },
        ],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class AdminRoutingModule { }
