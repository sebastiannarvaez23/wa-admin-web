import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { WaComponentsWebModule } from 'wa-components-web';

import { LoginPageComponent } from './login/pages/login/login-page.component';
import { SecurityRoutingModule } from './security-routing.module';

@NgModule({
    declarations: [
        LoginPageComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        TranslateModule,
        WaComponentsWebModule,
        SecurityRoutingModule,
    ],
})
export class SecurityModule { }
