import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, startWith } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { NotificationService } from 'wa-components-web';
import { isFieldInvalid } from '../../../../core/utils/form.utils';
import { extractError } from '../../../../core/utils/error.utils';
import { TableConfig } from '../../../../core/interfaces/table.interfaces';
import { TenantService } from '../../../platform/tenants/services/tenant.service';
import { Tenant, TenantsFilterParams } from '../../../platform/tenants/interfaces/tenant.interfaces';

@Component({
    selector: 'wa-tenant-companies',
    templateUrl: './tenant-companies.component.html',
    styleUrls: ['../admin-shared.css', '../admin-users/admin-users.component.css', './tenant-companies.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TenantCompaniesComponent implements OnInit {

    readonly tableConfig: TableConfig = {
        columns: [
            { key: 'name',         label: 'admin.tenants.companies.table.name',         filterable: true,  type: 'text',               width: '2fr'   },
            { key: 'nit',          label: 'admin.tenants.companies.table.nit',          filterable: true,  type: 'muted',              width: '1.2fr' },
            { key: 'city',         label: 'admin.tenants.companies.table.city',         filterable: true,  type: 'text',               width: '1fr'   },
            { key: 'subscription', label: 'admin.tenants.companies.table.subscription', filterable: true,  type: 'subscription-badge', width: '1fr'   },
            {
                key: 'status', label: 'admin.tenants.companies.table.status', filterable: true,
                type: 'status-badge', width: '0.8fr',
                filterType: 'select',
                filterOptions: [
                    { value: '',         label: 'admin.tenants.companies.filter.status.all'      },
                    { value: 'active',   label: 'admin.tenants.companies.filter.status.active'   },
                    { value: 'inactive', label: 'admin.tenants.companies.filter.status.inactive' },
                ],
            },
        ],
        editable: true,
        deletable: true,
    };

    readonly gridTemplate: string;

    pagedTenants: Tenant[] = [];
    total      = 0;
    totalPages = 0;

    loading = false;
    saving  = false;

    readonly pageSize = 10;
    currentPage       = 1;

    showModal      = false;
    editingTenant: Tenant | null = null;
    form:          FormGroup;
    filterForm:    FormGroup;

    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr        = inject(ChangeDetectorRef);

    constructor(
        private fb:            FormBuilder,
        private tenantService: TenantService,
        private notification:  NotificationService,
        private translate:     TranslateService,
    ) {
        this.form = this.fb.group({
            schema_name: ['', [Validators.required, Validators.minLength(2)]],
            nit:         ['', [Validators.required, Validators.minLength(5)]],
            name:        ['', [Validators.required, Validators.minLength(2)]],
            address:     ['', [Validators.required]],
            country:     ['', [Validators.required]],
            state:       ['', [Validators.required]],
            city:        ['', [Validators.required]],
        });

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
            this.loadTenants();
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
        this.loadTenants();
    }

    loadTenants(): void {
        this.loading = true;
        const v      = this.filterForm.value as Record<string, string>;

        const filters: TenantsFilterParams = {};
        if (v['name'])         filters.name         = v['name'];
        if (v['nit'])          filters.nit          = v['nit'];
        if (v['city'])         filters.city         = v['city'];
        if (v['subscription']) filters.subscription = v['subscription'];
        if (v['status'])       filters.status       = v['status'] as 'active' | 'inactive';

        this.tenantService.getTenants(this.currentPage - 1, this.pageSize, filters)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: result => {
                    this.pagedTenants = result.items;
                    this.total        = result.total;
                    this.totalPages   = result.total_pages;
                    this.loading      = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.notification.push(this.translate.instant('admin.tenants.companies.notifications.load-error'), 'error');
                    this.loading = false;
                    this.cdr.markForCheck();
                },
            });
    }

    getCellValue(tenant: Tenant, key: string): unknown {
        return (tenant as unknown as Record<string, unknown>)[key] ?? '';
    }

    getSubscriptionLabel(tenant: Tenant): string {
        return tenant.subscription?.subscription_name ?? '—';
    }

    getSubscriptionClass(tenant: Tenant): string {
        const status = tenant.subscription?.status;
        if (status === 'ACTIVE')    return 'sub-active';
        if (status === 'SUSPENDED') return 'sub-suspended';
        if (status === 'EXPIRED')   return 'sub-expired';
        if (status === 'CANCELLED') return 'sub-cancelled';
        return 'sub-none';
    }

    trackById(_: number, item: { id: string }): string  { return item.id; }
    trackByKey(_: number, item: { key: string }): string { return item.key; }

    openCreate(): void {
        this.editingTenant = null;
        this.form.reset();
        this.form.get('schema_name')?.enable();
        this.form.get('nit')?.enable();
        this.showModal = true;
    }

    openEdit(tenant: Tenant): void {
        this.editingTenant = tenant;
        this.form.patchValue({
            schema_name: tenant.schema_name,
            nit:         tenant.nit,
            name:        tenant.name,
            address:     tenant.address,
            country:     tenant.country,
            state:       tenant.state,
            city:        tenant.city,
        });
        this.form.get('schema_name')?.disable();
        this.form.get('nit')?.disable();
        this.showModal = true;
    }

    closeModal(): void { this.showModal = false; this.editingTenant = null; }

    save(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        this.saving = true;
        const value = this.form.getRawValue();

        if (this.editingTenant) {
            const payload: Record<string, unknown> = {};
            (['name', 'address', 'country', 'state', 'city'] as const).forEach(f => {
                if (value[f] !== (this.editingTenant as unknown as Record<string, unknown>)[f]) payload[f] = value[f];
            });

            this.tenantService.updateTenant(this.editingTenant.id, payload)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadTenants();
                        this.notification.push(this.translate.instant('admin.tenants.companies.notifications.update-success'), 'success');
                        this.saving = false;
                        this.closeModal();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.tenants.companies.notifications.update-error')), 'error');
                        this.saving = false;
                        this.cdr.markForCheck();
                    },
                });
        } else {
            this.tenantService.createTenant(value)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.currentPage = 1;
                        this.loadTenants();
                        this.notification.push(this.translate.instant('admin.tenants.companies.notifications.create-success'), 'success');
                        this.saving = false;
                        this.closeModal();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.tenants.companies.notifications.create-error')), 'error');
                        this.saving = false;
                        this.cdr.markForCheck();
                    },
                });
        }
    }

    toggleActive(tenant: Tenant): void {
        this.tenantService.toggleTenant(tenant.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.loadTenants();
                    this.notification.push(
                        this.translate.instant(
                            !tenant.is_active
                                ? 'admin.tenants.companies.notifications.toggle-activated'
                                : 'admin.tenants.companies.notifications.toggle-deactivated',
                        ),
                        'success',
                    );
                },
                error: err => {
                    this.notification.push(extractError(err, this.translate.instant('admin.tenants.companies.notifications.toggle-error')), 'error');
                },
            });
    }

    isInvalid(field: string): boolean { return isFieldInvalid(this.form, field); }

    private buildGridTemplate(): string {
        const widths = this.tableConfig.columns.map(c => c.width ?? '1fr');
        if (this.tableConfig.editable || this.tableConfig.deletable) widths.push('90px');
        return widths.join(' ');
    }
}
