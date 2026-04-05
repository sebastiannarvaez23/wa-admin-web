import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';

import { DialogService, NotificationService } from 'wa-components-web';
import { isFieldInvalid } from '../../../../core/utils/form.utils';
import { dataTypeValueValidator } from '../../../../core/validators/data-type-value.validator';
import { extractError } from '../../../../core/utils/error.utils';
import { ParameterTypeService } from '../../../platform/configuration/services/parameter-type.service';
import { ParameterService } from '../../../platform/configuration/services/parameter.service';
import {
    DataType,
    Parameter,
    ParameterType,
} from '../../../platform/configuration/interfaces/parameter.interfaces';

interface GroupedParams {
    type: ParameterType;
    params: Parameter[];
}

const DATA_TYPES: DataType[] = ['STRING', 'INT', 'DECIMAL', 'BOOL', 'JSON'];

@Component({
    selector: 'wa-parameters',
    templateUrl: './parameters.component.html',
    styleUrls: ['../admin-shared.css', '../admin-users/admin-users.component.css', './parameters.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParametersComponent implements OnInit {

    readonly dataTypes = DATA_TYPES;

    parameterTypes: ParameterType[] = [];
    parameters: Parameter[] = [];
    grouped: GroupedParams[] = [];

    loading = false;
    saving = false;

    // Parameter modal
    showParamModal = false;
    editingParam: Parameter | null = null;
    paramForm: FormGroup;

    // Groups modal
    showGroupsModal = false;
    showGroupForm = false;
    editingGroup: ParameterType | null = null;
    groupForm: FormGroup;
    savingGroup = false;

    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    constructor(
        private fb: FormBuilder,
        private parameterTypeService: ParameterTypeService,
        private parameterService: ParameterService,
        private notification: NotificationService,
        private dialog: DialogService,
        private translate: TranslateService,
    ) {
        this.paramForm = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[A-Za-z_]+$/)]],
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[A-Za-záéíóúÁÉÍÓÚñÑüÜ ]+$/)]],
            description: ['', [Validators.minLength(3), Validators.maxLength(120), Validators.pattern(/^[A-Za-záéíóúÁÉÍÓÚñÑüÜ ]*$/)]],
            parameter_type: ['', [Validators.required]],
            data_type: ['STRING', [Validators.required]],
            value: ['', [Validators.required, dataTypeValueValidator(() => this.paramForm?.get('data_type')?.value)]],
        });

        this.paramForm.get('data_type')!.valueChanges
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => this.paramForm.get('value')!.updateValueAndValidity());

        this.groupForm = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(20), Validators.pattern(/^[A-Za-z_]+$/)]],
            name: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[A-Za-záéíóúÁÉÍÓÚñÑüÜ ]+$/)]],
            description: ['', [Validators.minLength(3), Validators.maxLength(120), Validators.pattern(/^[A-Za-záéíóúÁÉÍÓÚñÑüÜ ]*$/)]],
        });
    }

    ngOnInit(): void {
        this.loadAll();
    }

    // ── Data loading ─────────────────────────────────────────────────────────

    loadAll(): void {
        this.loading = true;
        forkJoin({
            types: this.parameterTypeService.getAll(),
            params: this.parameterService.getAll(),
        }).pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({ types, params }) => {
                    this.parameterTypes = types;
                    this.parameters = params;
                    this.buildGroups();
                    this.loading = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.notification.push(this.translate.instant('admin.tenants.params.notifications.load-error'), 'error');
                    this.loading = false;
                    this.cdr.markForCheck();
                },
            });
    }

    private buildGroups(): void {
        const map = new Map<string, GroupedParams>();
        for (const t of this.parameterTypes) {
            map.set(t.id, { type: t, params: [] });
        }
        for (const p of this.parameters) {
            const group = map.get(p.parameter_type);
            if (group) group.params.push(p);
        }
        this.grouped = Array.from(map.values());
    }

    // ── Display helpers ──────────────────────────────────────────────────────

    displayValue(p: Parameter): string {
        if (p.data_type === 'BOOL') {
            return this.isBoolTrue(p) ? 'S' : 'N';
        }
        if (p.data_type === 'JSON') {
            try {
                return JSON.stringify(JSON.parse(p.value), null, 0);
            } catch { return p.value; }
        }
        return p.value;
    }

    isBoolTrue(p: Parameter): boolean {
        return p.value.toLowerCase() === 'true' || p.value === '1' || p.value.toLowerCase() === 'yes';
    }

    trackById(_: number, item: { id: string }): string { return item.id; }
    trackByGroupId(_: number, item: GroupedParams): string { return item.type.id; }

    // ── Parameter modal ──────────────────────────────────────────────────────

    openCreateParam(): void {
        this.editingParam = null;
        this.paramForm.reset({ data_type: 'STRING', parameter_type: '' });
        this.paramForm.get('code')?.enable();
        this.showParamModal = true;
    }

    openEditParam(p: Parameter): void {
        this.editingParam = p;
        this.paramForm.patchValue({
            code: p.code,
            name: p.name,
            description: p.description,
            parameter_type: p.parameter_type,
            data_type: p.data_type,
            value: p.value,
        });
        this.paramForm.get('code')?.disable();
        this.showParamModal = true;
    }

    closeParamModal(): void {
        this.showParamModal = false;
        this.editingParam = null;
    }

    saveParam(): void {
        if (this.paramForm.invalid) { this.paramForm.markAllAsTouched(); return; }
        this.saving = true;
        const raw = this.paramForm.getRawValue();
        raw.code = (raw.code || '').toUpperCase();

        if (this.editingParam) {
            const payload: Record<string, unknown> = {};
            const original = this.editingParam as unknown as Record<string, unknown>;
            Object.keys(raw).forEach(k => {
                if (raw[k] !== original[k]) payload[k] = raw[k];
            });
            this.parameterService.update(this.editingParam.id, payload)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadAll();
                        this.notification.push(this.translate.instant('admin.tenants.params.notifications.update-success'), 'success');
                        this.saving = false;
                        this.closeParamModal();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.tenants.params.notifications.update-error')), 'error');
                        this.saving = false;
                        this.cdr.markForCheck();
                    },
                });
        } else {
            this.parameterService.create(raw)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadAll();
                        this.notification.push(this.translate.instant('admin.tenants.params.notifications.create-success'), 'success');
                        this.saving = false;
                        this.closeParamModal();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.tenants.params.notifications.create-error')), 'error');
                        this.saving = false;
                        this.cdr.markForCheck();
                    },
                });
        }
    }

    confirmDeleteParam(p: Parameter): void {
        this.dialog.confirm({
            type: 'warning',
            title: this.translate.instant('admin.tenants.params.delete-dialog.title'),
            message: this.translate.instant('admin.tenants.params.delete-dialog.message', { name: p.name }),
            confirmLabel: this.translate.instant('admin.tenants.params.delete-dialog.confirm'),
            cancelLabel: this.translate.instant('admin.tenants.params.modal.cancel'),
        }).pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed: boolean) => {
                if (!confirmed) return;
                this.parameterService.delete(p.id)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.loadAll();
                            this.notification.push(this.translate.instant('admin.tenants.params.notifications.delete-success'), 'success');
                        },
                        error: err => {
                            this.notification.push(extractError(err, this.translate.instant('admin.tenants.params.notifications.delete-error')), 'error');
                        },
                    });
            });
    }

    // ── Inline active toggle ────────────────────────────────────────────────────

    toggleActive(p: Parameter): void {
        const newActive = !p.is_active;
        this.parameterService.update(p.id, { is_active: newActive })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    p.is_active = newActive;
                    this.cdr.markForCheck();
                },
                error: err => {
                    this.notification.push(extractError(err, this.translate.instant('admin.tenants.params.notifications.update-error')), 'error');
                },
            });
    }

    // ── Groups modal ─────────────────────────────────────────────────────────

    openGroupForm(group?: ParameterType): void {
        this.editingGroup = group || null;
        if (group) {
            this.groupForm.patchValue({ code: group.code, name: group.name, description: group.description });
            this.groupForm.get('code')?.disable();
        } else {
            this.groupForm.reset();
            this.groupForm.get('code')?.enable();
        }
        this.showGroupForm = true;
    }

    cancelGroupForm(): void {
        this.editingGroup = null;
        this.showGroupForm = false;
        this.groupForm.reset();
    }

    saveGroup(): void {
        if (this.groupForm.invalid) { this.groupForm.markAllAsTouched(); return; }
        this.savingGroup = true;
        const raw = this.groupForm.getRawValue();
        raw.code = (raw.code || '').toUpperCase();

        if (this.editingGroup) {
            this.parameterTypeService.update(this.editingGroup.id, raw)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadAll();
                        this.notification.push(this.translate.instant('admin.tenants.params.notifications.group-update-success'), 'success');
                        this.savingGroup = false;
                        this.cancelGroupForm();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.tenants.params.notifications.group-update-error')), 'error');
                        this.savingGroup = false;
                        this.cdr.markForCheck();
                    },
                });
        } else {
            this.parameterTypeService.create(raw)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadAll();
                        this.notification.push(this.translate.instant('admin.tenants.params.notifications.group-create-success'), 'success');
                        this.savingGroup = false;
                        this.cancelGroupForm();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.tenants.params.notifications.group-create-error')), 'error');
                        this.savingGroup = false;
                        this.cdr.markForCheck();
                    },
                });
        }
    }

    confirmDeleteGroup(group: ParameterType): void {
        this.dialog.confirm({
            type: 'warning',
            title: this.translate.instant('admin.tenants.params.delete-group-dialog.title'),
            message: this.translate.instant('admin.tenants.params.delete-group-dialog.message', { name: group.name }),
            confirmLabel: this.translate.instant('admin.tenants.params.delete-group-dialog.confirm'),
            cancelLabel: this.translate.instant('admin.tenants.params.modal.cancel'),
        }).pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed: boolean) => {
                if (!confirmed) return;
                this.parameterTypeService.delete(group.id)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.loadAll();
                            this.notification.push(this.translate.instant('admin.tenants.params.notifications.group-delete-success'), 'success');
                        },
                        error: err => {
                            this.notification.push(extractError(err, this.translate.instant('admin.tenants.params.notifications.group-delete-error')), 'error');
                        },
                    });
            });
    }

    // ── Form helpers ─────────────────────────────────────────────────────────

    isParamInvalid(field: string): boolean { return isFieldInvalid(this.paramForm, field); }
    isGroupInvalid(field: string): boolean { return isFieldInvalid(this.groupForm, field); }

    getParamError(field: string): string { return this.getFieldError(this.paramForm, field); }
    getGroupError(field: string): string { return this.getFieldError(this.groupForm, field); }

    private getFieldError(form: FormGroup, field: string): string {
        const control = form.get(field);
        if (!control || !control.errors || !control.touched) return '';
        const errors = control.errors;
        if (errors['required']) return this.translate.instant('admin.tenants.params.validation.required');
        if (errors['minlength']) return this.translate.instant('admin.tenants.params.validation.minlength', { min: errors['minlength'].requiredLength });
        if (errors['maxlength']) return this.translate.instant('admin.tenants.params.validation.maxlength', { max: errors['maxlength'].requiredLength });
        if (errors['pattern']) return this.translate.instant('admin.tenants.params.validation.pattern-' + field);
        if (errors['dataTypeValue']) return this.translate.instant('admin.tenants.params.validation.data-type-value', { type: this.translate.instant('admin.tenants.params.data-types.' + errors['dataTypeValue'].dataType) });
        return '';
    }
}
