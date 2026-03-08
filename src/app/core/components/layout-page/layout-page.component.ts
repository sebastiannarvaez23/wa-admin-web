import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService, SidebarNavSection } from 'wa-components-web';

@Component({
    selector: 'wa-main-layout',
    template: `
        <wa-sidebar
            logoSidebarOpen="assets/logo/Logo light.png"
            logoSidebarOpenDark="assets/logo/Logo dark.png"
            logoSidebarClose="assets/logo/Shield Admin PLatform Light.png"
            logoSidebarCloseDark="assets/logo/Shield Admin PLatform Dark.png"
            profilePicture="assets/profile-pictures/profile.jpg"
            [navMenu]="navMenu"
            [logout]="logout"
            footerRight="Derechos reservados - Warehouse Anywhere® v 1.0"
        >
            <router-outlet></router-outlet>
        </wa-sidebar>
        <wa-notification></wa-notification>
        <wa-dialog></wa-dialog>
    `,
})
export class LayoutPageComponent {

    readonly navMenu: SidebarNavSection[] = [
        {
            options: [
                { name: 'sidebar.index', link: '/admin/dashboard', icon: 'bx-grid-alt' },
            ],
        },
        {
            name: 'sidebar.group.platform',
            options: [
                { name: 'sidebar.tenants',     link: '/admin/tenants',  icon: 'bx-buildings'  },
                { name: 'sidebar.users-roles', link: '/admin/users',    icon: 'bx-user-check' },
                { name: 'sidebar.security',    link: '/admin/security', icon: 'bx-shield'     },
                { name: 'sidebar.settings',    link: '/admin/settings', icon: 'bx-cog'        },
            ],
        },
        {
            name: 'sidebar.group.commercial',
            options: [
                { name: 'sidebar.subscriptions', link: '/admin/subscriptions', icon: 'bx-credit-card' },
                { name: 'sidebar.billing',        link: '/admin/billing',       icon: 'bx-money'       },
                { name: 'sidebar.features',       link: '/admin/features',      icon: 'bx-extension'   },
                { name: 'sidebar.ai',             link: '/admin/ai-features',   icon: 'bx-chip'        },
            ],
        },
        {
            name: 'sidebar.group.support',
            options: [
                { name: 'sidebar.support', link: '/admin/support', icon: 'bx-support' },
                { name: 'sidebar.docs',    link: '/admin/docs',    icon: 'bx-book'    },
            ],
        },
        {
            name: 'sidebar.group.analytics',
            options: [
                { name: 'sidebar.analytics', link: '/admin/analytics', icon: 'bx-pie-chart-alt-2' },
                { name: 'sidebar.audit',     link: '/admin/audit',     icon: 'bx-history'         },
            ],
        },
    ];

    readonly logout = () => {
        this.authService.logout().subscribe({
            next:  () => this.router.navigate(['/security/login']),
            error: () => this.router.navigate(['/security/login']),
        });
    };

    constructor(
        private authService: AuthService,
        private router: Router,
    ) { }
}
