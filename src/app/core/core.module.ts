import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

import { WaComponentsWebModule } from 'wa-components-web';

import { LayoutPageComponent } from './components/layout-page/layout-page.component';
import { PaginatorComponent } from './components/paginator/paginator.component';

@NgModule({
    declarations: [
        LayoutPageComponent,
        PaginatorComponent,
    ],
    exports: [
        LayoutPageComponent,
        PaginatorComponent,
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
