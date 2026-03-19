import { ChangeDetectionStrategy, Component } from '@angular/core';

import { TenantRoleService } from '../../../platform/roles/services/tenant-role.service';
import { PermissionsDataSource } from '../../../platform/roles/interfaces/role.interfaces';

type TenantsTab = 'companies' | 'users' | 'permissions' | 'params';

@Component({
    selector: 'wa-admin-tenants-page',
    templateUrl: './tenants-page.component.html',
    styleUrls: ['./tenants-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantsPageComponent {

    activeTab: TenantsTab = 'companies';

    readonly tabs: { key: TenantsTab; icon: string; label: string }[] = [
        { key: 'companies',   icon: 'bx-buildings',      label: 'admin.tenants.tabs.companies'   },
        { key: 'users',       icon: 'bx-group',          label: 'admin.tenants.tabs.users'       },
        { key: 'permissions', icon: 'bx-shield-quarter', label: 'admin.tenants.tabs.permissions' },
        { key: 'params',      icon: 'bx-slider-alt',     label: 'admin.tenants.tabs.params'      },
    ];

    /** Passed to PermissionsManagerComponent as dataSource. */
    readonly permissionsDataSource: PermissionsDataSource;

    constructor(tenantRoleService: TenantRoleService) {
        this.permissionsDataSource = tenantRoleService;
    }

    setTab(tab: TenantsTab): void {
        this.activeTab = tab;
    }
}
