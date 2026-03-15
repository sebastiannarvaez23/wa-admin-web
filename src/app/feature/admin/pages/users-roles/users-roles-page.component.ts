import { Component } from '@angular/core';

type UsersRolesTab = 'users' | 'permissions';

@Component({
    selector: 'wa-admin-users-roles-page',
    templateUrl: './users-roles-page.component.html',
    styleUrls: ['./users-roles-page.component.css'],
})
export class UsersRolesPageComponent {

    activeTab: UsersRolesTab = 'users';

    readonly tabs: { key: UsersRolesTab; icon: string; label: string }[] = [
        { key: 'users',       icon: 'bx-group',          label: 'admin.users-roles.tabs.users' },
        { key: 'permissions', icon: 'bx-shield-quarter', label: 'admin.users-roles.tabs.permissions' },
    ];

    setTab(tab: UsersRolesTab): void {
        this.activeTab = tab;
    }
}
