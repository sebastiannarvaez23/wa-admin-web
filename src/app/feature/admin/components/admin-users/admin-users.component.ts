import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, startWith } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { NotificationService } from 'wa-components-web';
import { isFieldInvalid } from '../../../../core/utils/form.utils';
import { extractError } from '../../../../core/utils/error.utils';
import { ColumnConfig, TableConfig } from '../../../../core/interfaces/table.interfaces';
import { DEFAULT_PAGE_SIZE, rowNumber } from '../../../../core/interfaces/pagination.interfaces';
import { UserService } from '../../../platform/users/services/user.service';
import { AdminUser, CreateUserPayload, UpdateUserPayload, UsersFilterParams } from '../../../platform/users/interfaces/user.interfaces';
import { RoleSummary } from '../../../platform/roles/interfaces/role.interfaces';
import { RoleService } from '../../../platform/roles/services/role.service';

@Component({
    selector: 'wa-admin-users',
    templateUrl: './admin-users.component.html',
    styleUrls: ['../admin-shared.css', './admin-users.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminUsersComponent implements OnInit {

    readonly tableConfig: TableConfig = {
        columns: [
            { key: 'name',     label: 'admin.users-roles.users.table.name',     filterable: true, type: 'user-cell',    width: '2fr'   },
            { key: 'email',    label: 'admin.users-roles.users.table.email',    filterable: true, type: 'text',         width: '1.5fr' },
            { key: 'username', label: 'admin.users-roles.users.table.username', filterable: true, type: 'muted',        width: '1fr'   },
            { key: 'role',     label: 'admin.users-roles.users.table.role',     filterable: true, type: 'role-badge',   width: '1fr'   },
            {
                key: 'status', label: 'admin.users-roles.users.table.status', filterable: true,
                type: 'status-badge', width: '0.9fr',
                filterType: 'select',
                filterOptions: [
                    { value: '',         label: 'admin.users-roles.users.filter.status.all'   },
                    { value: 'active',   label: 'admin.users-roles.users.status.active'       },
                    { value: 'inactive', label: 'admin.users-roles.users.status.inactive'     },
                ],
            },
        ],
        editable: true,
        deletable: true,
    };

    readonly gridTemplate: string;

    pagedUsers: AdminUser[]   = [];
    roles:      RoleSummary[] = [];
    total:      number        = 0;
    totalPages: number        = 0;

    loading = false;
    saving  = false;

    readonly pageSize = DEFAULT_PAGE_SIZE;
    currentPage       = 1;

    showModal    = false;
    editingUser: AdminUser | null = null;
    form:        FormGroup;
    filterForm:  FormGroup;

    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr        = inject(ChangeDetectorRef);

    constructor(
        private fb:          FormBuilder,
        private userService: UserService,
        private roleService: RoleService,
        private notification: NotificationService,
        private translate:   TranslateService,
    ) {
        this.form = this.fb.group({
            first_name: ['', [Validators.required, Validators.minLength(2)]],
            last_name:  ['', [Validators.required, Validators.minLength(2)]],
            email:      ['', [Validators.required, Validators.email]],
            username:   ['', [Validators.required, Validators.minLength(3)]],
            telephone:  ['', [Validators.required, Validators.minLength(10), Validators.maxLength(15)]],
            password:   [''],
            rol_id:     ['', [Validators.required]],
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
            this.loadUsers();
        });

        this.loadRoles();
    }

    clearFilters(): void { this.filterForm.reset(); }
    clearFilter(key: string): void { this.filterForm.get(key)?.setValue(''); }

    get hasActiveFilters(): boolean {
        return Object.values(this.filterForm.value as Record<string, string>)
            .some(v => !!v && v.trim() !== '');
    }

    get filterableColumns(): ColumnConfig[] {
        return this.tableConfig.columns.filter(c => c.filterable);
    }

    onPageChange(page: number): void {
        if (page < 1 || page > this.totalPages) return;
        this.currentPage = page;
        this.loadUsers();
    }

    getRowNumber(index: number): number {
        return rowNumber(this.currentPage, this.pageSize, index);
    }

    loadRoles(): void {
        this.roleService.getRoles()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: roles => { this.roles = roles; this.cdr.markForCheck(); },
            });
    }

    loadUsers(): void {
        this.loading = true;
        const v      = this.filterForm.value as Record<string, string>;

        const filters: UsersFilterParams = {};
        if (v['name'])     filters.name     = v['name'];
        if (v['email'])    filters.email    = v['email'];
        if (v['username']) filters.username = v['username'];
        if (v['role'])     filters.role     = v['role'];
        if (v['status'])   filters.status   = v['status'] as 'active' | 'inactive';

        this.userService.getUsers(this.currentPage - 1, this.pageSize, filters)
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
                    this.notification.push(this.translate.instant('admin.users-roles.users.notifications.load-error'), 'error');
                    this.loading = false;
                    this.cdr.markForCheck();
                },
            });
    }

    getInitials(user: AdminUser): string {
        return `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase();
    }

    getRoleClass(rolName: string): string {
        const l = (rolName ?? '').toLowerCase();
        if (l.includes('admin'))                            return 'admin';
        if (l.includes('emplead') || l.includes('operat')) return 'operator';
        return 'viewer';
    }

    getCellValue(user: AdminUser, key: string): unknown {
        return (user as unknown as Record<string, unknown>)[key] ?? '';
    }

    trackById(_: number, item: { id: string }): string { return item.id; }
    trackByKey(_: number, item: ColumnConfig): string  { return item.key; }

    openCreate(): void {
        this.editingUser = null;
        this.form.reset({ first_name: '', last_name: '', email: '', username: '', telephone: '', password: '', rol_id: '' });
        this.form.get('username')?.enable();
        this.form.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
        this.form.get('password')?.updateValueAndValidity();
        this.showModal = true;
    }

    openEdit(user: AdminUser): void {
        this.editingUser = user;
        this.form.patchValue({
            first_name: user.first_name,
            last_name:  user.last_name,
            email:      user.email,
            username:   user.username,
            telephone:  user.telephone,
            password:   '',
            rol_id:     user.rol?.id ?? '',
        });
        this.form.get('username')?.disable();
        this.form.get('password')?.clearValidators();
        this.form.get('password')?.updateValueAndValidity();
        this.showModal = true;
    }

    closeModal(): void { this.showModal = false; this.editingUser = null; }

    save(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        this.saving = true;
        const value = this.form.getRawValue();

        if (this.editingUser) {
            const payload: UpdateUserPayload = {};
            (['first_name', 'last_name', 'email', 'telephone'] as const).forEach(f => {
                if (value[f] !== (this.editingUser as unknown as Record<string, unknown>)[f]) {
                    (payload as Record<string, unknown>)[f] = value[f];
                }
            });
            if (value['password']) payload.password = value['password'];
            if (value['rol_id'] && value['rol_id'] !== this.editingUser.rol?.id) payload.rol_id = value['rol_id'];

            this.userService.updateUser(this.editingUser.id, payload)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadUsers();
                        this.notification.push(this.translate.instant('admin.users-roles.users.notifications.update-success'), 'success');
                        this.saving = false;
                        this.closeModal();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.users-roles.users.notifications.update-error')), 'error');
                        this.saving = false;
                        this.cdr.markForCheck();
                    },
                });
        } else {
            const createPayload: CreateUserPayload = {
                first_name: value['first_name'],
                last_name:  value['last_name'],
                email:      value['email'],
                username:   value['username'],
                telephone:  value['telephone'],
                password:   value['password'],
                rol_id:     value['rol_id'] || undefined,
            };
            this.userService.createUser(createPayload)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.currentPage = 1;
                        this.loadUsers();
                        this.notification.push(this.translate.instant('admin.users-roles.users.notifications.create-success'), 'success');
                        this.saving = false;
                        this.closeModal();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.users-roles.users.notifications.create-error')), 'error');
                        this.saving = false;
                        this.cdr.markForCheck();
                    },
                });
        }
    }

    toggleActive(user: AdminUser): void {
        this.userService.toggleActive(user.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.loadUsers();
                    this.notification.push(
                        this.translate.instant(
                            !user.is_active
                                ? 'admin.users-roles.users.notifications.toggle-activated'
                                : 'admin.users-roles.users.notifications.toggle-deactivated',
                        ),
                        'success',
                    );
                },
                error: err => {
                    this.notification.push(extractError(err, this.translate.instant('admin.users-roles.users.notifications.toggle-error')), 'error');
                },
            });
    }

    isInvalid(field: string): boolean { return isFieldInvalid(this.form, field); }

    private buildGridTemplate(): string {
        const widths = ['45px', ...this.tableConfig.columns.map(c => c.width ?? '1fr')];
        if (this.tableConfig.editable || this.tableConfig.deletable) widths.push('90px');
        return widths.join(' ');
    }
}
