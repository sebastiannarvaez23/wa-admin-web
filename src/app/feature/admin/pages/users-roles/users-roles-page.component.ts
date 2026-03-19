import { ChangeDetectionStrategy, Component } from '@angular/core';

import { RoleService } from '../../../platform/roles/services/role.service';
import { PermissionsDataSource } from '../../../platform/roles/interfaces/role.interfaces';

type UsersRolesTab = 'users' | 'permissions';

@Component({
    selector: 'wa-admin-users-roles-page',
    templateUrl: './users-roles-page.component.html',
    styleUrls: ['./users-roles-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersRolesPageComponent {

    activeTab: UsersRolesTab = 'users';

    readonly tabs: { key: UsersRolesTab; icon: string; label: string }[] = [
        { key: 'users',       icon: 'bx-group',          label: 'admin.users-roles.tabs.users' },
        { key: 'permissions', icon: 'bx-shield-quarter', label: 'admin.users-roles.tabs.permissions' },
    ];

    /** Passed to PermissionsManagerComponent as dataSource. */
    readonly permissionsDataSource: PermissionsDataSource;

    constructor(roleService: RoleService) {
        this.permissionsDataSource = roleService;
    }

    setTab(tab: UsersRolesTab): void {
        this.activeTab = tab;
    }
}
