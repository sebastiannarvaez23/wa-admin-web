import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoginPageComponent } from './login/pages/login/login-page.component';
import { guestGuard } from 'src/app/core/guards/guest.guard';

const routes: Routes = [
    {
        path: 'login',
        component: LoginPageComponent,
        canActivate: [guestGuard],
    },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule],
})
export class SecurityRoutingModule { }
