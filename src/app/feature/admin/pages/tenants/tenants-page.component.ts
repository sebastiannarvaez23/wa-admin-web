import { Component } from '@angular/core';

type TenantsTab = 'companies' | 'users' | 'permissions' | 'params';

@Component({
    selector: 'wa-admin-tenants-page',
    templateUrl: './tenants-page.component.html',
    styleUrls: ['./tenants-page.component.css'],
})
export class TenantsPageComponent {

    activeTab: TenantsTab = 'companies';

    readonly tabs: { key: TenantsTab; icon: string; label: string }[] = [
        { key: 'companies',   icon: 'bx-buildings',       label: 'admin.tenants.tabs.companies' },
        { key: 'users',       icon: 'bx-group',           label: 'admin.tenants.tabs.users' },
        { key: 'permissions', icon: 'bx-shield-quarter',  label: 'admin.tenants.tabs.permissions' },
        { key: 'params',      icon: 'bx-slider-alt',      label: 'admin.tenants.tabs.params' },
    ];

    setTab(tab: TenantsTab): void {
        this.activeTab = tab;
    }
}
