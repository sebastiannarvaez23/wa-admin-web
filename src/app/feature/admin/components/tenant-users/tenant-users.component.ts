import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, startWith } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { NotificationService } from 'wa-components-web';
import { TableConfig } from '../../../../core/interfaces/table.interfaces';
import { DEFAULT_PAGE_SIZE, rowNumber } from '../../../../core/interfaces/pagination.interfaces';
import { TenantUserService } from '../../../platform/tenants/services/tenant-user.service';
import { TenantUser, TenantUsersFilterParams } from '../../../platform/tenants/interfaces/tenant.interfaces';

@Component({
    selector: 'wa-tenant-users',
    templateUrl: './tenant-users.component.html',
    styleUrls: ['../admin-shared.css', '../admin-users/admin-users.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantUsersComponent implements OnInit {

    readonly tableConfig: TableConfig = {
        columns: [
            { key: 'name',         label: 'admin.tenants.users.table.name',    filterable: true, type: 'text',         width: '1.8fr' },
            { key: 'email',        label: 'admin.tenants.users.table.email',   filterable: true, type: 'text',         width: '1.5fr' },
            { key: 'company_name', label: 'admin.tenants.users.table.company', filterable: true, type: 'text',         width: '1.2fr' },
            {
                key: 'status', label: 'admin.tenants.users.table.status', filterable: true,
                type: 'status-badge', width: '0.8fr',
                filterType: 'select',
                filterOptions: [
                    { value: '',         label: 'admin.tenants.users.filter.status.all'      },
                    { value: 'active',   label: 'admin.tenants.users.filter.status.active'   },
                    { value: 'inactive', label: 'admin.tenants.users.filter.status.inactive' },
                ],
            },
        ],
        editable: false,
        deletable: true,
    };

    readonly gridTemplate: string;

    pagedUsers: TenantUser[] = [];
    total      = 0;
    totalPages = 0;

    loading = false;

    readonly pageSize = DEFAULT_PAGE_SIZE;
    currentPage       = 1;

    filterForm: FormGroup;

    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr        = inject(ChangeDetectorRef);

    constructor(
        private fb:                FormBuilder,
        private tenantUserService: TenantUserService,
        private notification:      NotificationService,
        private translate:         TranslateService,
    ) {
        const filterControls: Record<string, string> = {};
        this.tableConfig.columns
            .filter(c => c.filterable)
            .forEach(c => { filterControls[c.key] = ''; });
        this.filterForm = this.fb.group(filterControls);

        this.gridTemplate = this.buildGridTemplate();
    }

    ngOnInit(): void {
        this.filterForm.valueChanges.pipe(
            debounceTime(400),
            startWith(this.filterForm.value),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe(() => {
            this.currentPage = 1;
            this.loadUsers();
        });
    }

    clearFilters(): void { this.filterForm.reset(); }
    clearFilter(key: string): void { this.filterForm.get(key)?.setValue(''); }

    get hasActiveFilters(): boolean {
        return Object.values(this.filterForm.value as Record<string, string>)
            .some(v => !!v && v.trim() !== '');
    }

    onPageChange(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadUsers();
    }

    getRowNumber(index: number): number {
        return rowNumber(this.currentPage, this.pageSize, index);
    }

    loadUsers(): void {
        this.loading = true;
        const v      = this.filterForm.value as Record<string, string>;

        const filters: TenantUsersFilterParams = {};
        if (v['name'])         filters.name    = v['name'];
        if (v['email'])        filters.email   = v['email'];
        if (v['company_name']) filters.company = v['company_name'];
        if (v['status'])       filters.status  = v['status'] as 'active' | 'inactive';

        this.tenantUserService.getTenantUsers(this.currentPage - 1, this.pageSize, filters)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: result => {
                    this.pagedUsers = result.items;
                    this.total      = result.total;
                    this.totalPages = result.total_pages;
                    this.loading    = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.notification.push(this.translate.instant('admin.tenants.users.notifications.load-error'), 'error');
                    this.loading = false;
                    this.cdr.markForCheck();
                },
            });
    }

    getUserDisplayName(user: TenantUser): string {
        return `${user.first_name} ${user.last_name}`;
    }

    getInitials(user: TenantUser): string {
        return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
    }

    getCellValue(user: TenantUser, key: string): unknown {
        if (key === 'name') return this.getUserDisplayName(user);
        return (user as unknown as Record<string, unknown>)[key] ?? '';
    }

    trackById(_: number, item: { id: string }): string  { return item.id; }
    trackByKey(_: number, item: { key: string }): string { return item.key; }

    toggleActive(user: TenantUser): void {
        this.tenantUserService.toggleActive(user.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.loadUsers();
                    this.notification.push(
                        this.translate.instant(
                            !user.is_active
                                ? 'admin.tenants.users.notifications.toggle-activated'
                                : 'admin.tenants.users.notifications.toggle-deactivated',
                        ),
                        'success',
                    );
                },
                error: () => {
                    this.notification.push(this.translate.instant('admin.tenants.users.notifications.toggle-error'), 'error');
                },
            });
    }

    private buildGridTemplate(): string {
        const widths = ['45px', ...this.tableConfig.columns.map(c => c.width ?? '1fr')];
        if (this.tableConfig.editable || this.tableConfig.deletable) widths.push('90px');
        return widths.join(' ');
    }
}
