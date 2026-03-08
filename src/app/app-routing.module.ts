import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
    {
        path: 'security',
        loadChildren: () =>
            import('./feature/security/security.module')
                .then(m => m.SecurityModule),
    },
    {
        path: 'admin',
        loadChildren: () =>
            import('./feature/admin/admin.module')
                .then(m => m.AdminModule),
    },
    { path: '', redirectTo: 'admin/dashboard', pathMatch: 'full' },
    { path: '**', redirectTo: 'admin/dashboard' },
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule],
})
export class AppRoutingModule { }
