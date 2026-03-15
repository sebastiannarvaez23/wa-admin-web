import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

import { WaComponentsWebModule } from 'wa-components-web';

import { CoreModule } from 'src/app/core/core.module';

import { AdminRoutingModule } from './admin-routing.module';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { ModuleInConstructionPageComponent } from './pages/module-in-construction/module-in-construction-page.component';
import { SettingsPageComponent } from './pages/settings/settings-page.component';
import { SubscriptionsPageComponent } from './pages/subscriptions/subscriptions-page.component';

@NgModule({
    declarations: [
        DashboardPageComponent,
        ModuleInConstructionPageComponent,
        SettingsPageComponent,
        SubscriptionsPageComponent,
    ],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TranslateModule,
        CoreModule,
        WaComponentsWebModule,
        AdminRoutingModule,
    ],
})
export class AdminModule { }
