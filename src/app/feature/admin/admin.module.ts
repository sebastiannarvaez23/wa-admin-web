import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

import { WaComponentsWebModule } from 'wa-components-web';

import { CoreModule } from 'src/app/core/core.module';

import { AdminRoutingModule } from './admin-routing.module';
import { DashboardPageComponent } from './pages/dashboard/dashboard-page.component';
import { ModuleInConstructionPageComponent } from './pages/module-in-construction/module-in-construction-page.component';
import { SettingsPageComponent } from './pages/settings/settings-page.component';

@NgModule({
    declarations: [
        DashboardPageComponent,
        ModuleInConstructionPageComponent,
        SettingsPageComponent,
    ],
    imports: [
        CommonModule,
        TranslateModule,
        CoreModule,
        WaComponentsWebModule,
        AdminRoutingModule,
    ],
})
export class AdminModule { }
