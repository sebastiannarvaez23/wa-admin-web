import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { WaComponentsWebModule } from 'wa-components-web';

import { LayoutPageComponent } from './components/layout-page/layout-page.component';

@NgModule({
    declarations: [
        LayoutPageComponent,
    ],
    exports: [
        LayoutPageComponent,
        RouterModule,
        WaComponentsWebModule,
    ],
    imports: [
        CommonModule,
        RouterModule,
        TranslateModule,
        WaComponentsWebModule,
    ],
})
export class CoreModule { }
