import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { DialogService, DropdownOption, NotificationService } from 'wa-components-web';

import { isFieldInvalid } from 'src/app/core/utils/form.utils';
import { AvailableFunctionality, LimitValidationType, ModuleLimit, SubscriptionLimitValue, Subscription, SubscriptionFunctionality, SubscriptionModule } from '../../../platform/subscriptions/interfaces/subscription.interfaces';
import { getTotalModulesCount, SubscriptionService, CreateSubscriptionPayload, UpdateSubscriptionPayload, buildModuleLimits } from '../../../platform/subscriptions/services/subscription.service';
import { SubscriptionLimitService } from '../../../platform/subscriptions/services/subscription-limit.service';
import { FunctionalityService } from '../../../platform/functionalities/services/functionality.service';

@Component({
    selector: 'wa-admin-subscriptions-page',
    templateUrl: './subscriptions-page.component.html',
    styleUrls: ['./subscriptions-shared.css', './subscriptions-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsPageComponent implements OnInit {

    subscriptions: Subscription[] = [];
    loading = false;

    showModal = false;
    editingSubscription: Subscription | null = null;
    saving = false;
    form!: FormGroup;

    showModulesModal = false;
    modulesSubscription: Subscription | null = null;
    savingModules = false;
    private modulesSnapshot: Set<string> | null = null;

    savingFeatures = false;
    private featuresSnapshot: Set<string> | null = null;

    showLimitsModal = false;
    limitsSubscription: Subscription | null = null;
    moduleLimits: ModuleLimit[] = [];
    loadingLimits = false;
    activeModuleCode: string | null = null;             // accordion: módulo expandido
    limitEditMap = new Map<SubscriptionLimitValue, string>(); // label pendiente mientras edita
    pendingLimits = new Set<SubscriptionLimitValue>();          // topes nuevos sin confirmar
    savingLimits = new Set<SubscriptionLimitValue>();            // topes en proceso de guardado
    private limitCounter = 0;

    showFeatureDetailModal = false;
    loadingFeatures = false;
    currentDetailModule: SubscriptionModule | null = null;
    currentDetailGroups: { category: string; features: SubscriptionFunctionality[] }[] = [];

    validationTypeOptions: DropdownOption[] = [];
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        private fb: FormBuilder,
        private translate: TranslateService,
        private subscriptionService: SubscriptionService,
        private subscriptionLimitSvc: SubscriptionLimitService,
        private functionalityService: FunctionalityService,
        private cdr: ChangeDetectorRef,
        private dialog: DialogService,
        private notification: NotificationService,
        private elRef: ElementRef,
    ) {
        this.form = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(2)]],
            name: ['', [Validators.required, Validators.minLength(2)]],
            description: ['', [Validators.required]],
            price: [0, [Validators.required, Validators.min(0)]],
        });
    }

    ngOnInit(): void {
        this.validationTypeOptions = [
            { value: 'daily',    label: this.translate.instant('admin.subscriptions.limits-modal.validation-type.daily') },
            { value: 'lifetime', label: this.translate.instant('admin.subscriptions.limits-modal.validation-type.lifetime') },
        ];

        this.loading = true;
        this.subscriptionService.getSubscriptions().subscribe({
            next: (data) => {
                this.subscriptions = data;
                this.loading = false;
                this.cdr.markForCheck();
            },
            error: () => {
                this.loading = false;
                this.cdr.markForCheck();
            },
        });
    }

    trackById(_: number, item: { id: string }): string { return item.id; }
    trackByCode(_: number, item: { code: string }): string { return item.code; }
    trackByKey(_: number, item: { key: string }): string { return item.key; }
    trackByCategory(_: number, g: { category: string }): string { return g.category; }
    trackByModuleCode(_: number, ml: ModuleLimit): string { return ml.moduleCode; }
    trackByLimitValue(_: number, lv: SubscriptionLimitValue): string {
        return lv._trackId ?? lv.id ?? lv.key;
    }

    // ── List actions ──────────────────────────────────────────────────────────

    openCreate(): void {
        this.editingSubscription = null;
        this.form.reset({ price: 0 });
        this.form.get('code')!.enable();
        this.showModal = true;
    }

    openEdit(sub: Subscription): void {
        this.editingSubscription = sub;
        this.form.patchValue({ code: sub.code, name: sub.name, description: sub.description, price: sub.price });
        this.form.get('code')!.disable();
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal = false;
        this.editingSubscription = null;
    }

    toggleActive(sub: Subscription): void {
        const doToggle = () => {
            this.subscriptionService.updateSubscription(sub.id, { is_active: !sub.is_active })
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (saved) => {
                        const idx = this.subscriptions.findIndex(s => s.id === saved.id);
                        if (idx !== -1) { this.subscriptions[idx] = saved; }
                        this.notification.push(
                            this.translate.instant('admin.subscriptions.notifications.toggle-success'),
                            'success',
                        );
                        this.cdr.markForCheck();
                    },
                    error: () => {
                        this.notification.push(
                            this.translate.instant('admin.subscriptions.notifications.toggle-error'),
                            'error',
                        );
                        this.cdr.markForCheck();
                    },
                });
        };

        if (sub.is_active) {
            this.dialog.confirm({
                type: 'warning',
                title: this.translate.instant('admin.subscriptions.deactivate-dialog.title'),
                message: this.translate.instant('admin.subscriptions.deactivate-dialog.message', { name: sub.name }),
                confirmLabel: this.translate.instant('admin.subscriptions.deactivate-dialog.confirm'),
                cancelLabel: this.translate.instant('dialog.common.cancel'),
            }).pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe((confirmed: boolean) => { if (confirmed) { doToggle(); } });
        } else {
            doToggle();
        }
    }

    save(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.saving = true;
        const value = this.form.getRawValue();

        const { code, ...updateValue } = value;
        const request$ = this.editingSubscription
            ? this.subscriptionService.updateSubscription(this.editingSubscription.id, updateValue as UpdateSubscriptionPayload)
            : this.subscriptionService.createSubscription(value as CreateSubscriptionPayload);

        request$.subscribe({
            next: (saved) => {
                if (this.editingSubscription) {
                    const idx = this.subscriptions.findIndex(s => s.id === saved.id);
                    if (idx !== -1) { this.subscriptions[idx] = saved; }
                } else {
                    this.subscriptions.push(saved);
                }
                this.saving = false;
                this.closeModal();
                this.notification.push(
                    this.translate.instant(this.editingSubscription
                        ? 'admin.subscriptions.notifications.update-success'
                        : 'admin.subscriptions.notifications.create-success'),
                    'success',
                );
                this.cdr.markForCheck();
            },
            error: () => {
                this.saving = false;
                this.notification.push(
                    this.translate.instant('admin.subscriptions.notifications.save-error'),
                    'error',
                );
                this.cdr.markForCheck();
            },
        });
    }

    // ── Modules modal ─────────────────────────────────────────────────────────

    openModulesModal(sub: Subscription): void {
        this.modulesSubscription = sub;
        this.modulesSnapshot = new Set(sub.modules.filter(m => m.hasAccess).map(m => m.code));
        this.showModulesModal = true;
    }

    closeModulesModal(): void {
        if (this.modulesSubscription && this.hasModulesChanged(this.modulesSubscription)) {
            this.saveModules(this.modulesSubscription);
            return;
        }
        this.showModulesModal = false;
        this.modulesSubscription = null;
        this.modulesSnapshot = null;
    }

    toggleModuleAccess(mod: SubscriptionModule): void {
        if (mod.hasAccess) {
            mod.hasAccess = false;
            mod.features.forEach(f => f.enabled = false);
        } else {
            mod.hasAccess = true;
        }
    }

    private hasModulesChanged(sub: Subscription): boolean {
        if (!this.modulesSnapshot) { return false; }
        const current = new Set(sub.modules.filter(m => m.hasAccess).map(m => m.code));
        if (current.size !== this.modulesSnapshot.size) { return true; }
        for (const code of current) { if (!this.modulesSnapshot.has(code)) { return true; } }
        return false;
    }

    private saveModules(sub: Subscription): void {
        const moduleCodes = sub.modules.filter(m => m.hasAccess).map(m => m.code);

        this.savingModules = true;
        this.cdr.markForCheck();

        this.subscriptionService.updateModules(sub.id, moduleCodes)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.savingModules = false;
                    this.notification.push(
                        this.translate.instant('admin.subscriptions.notifications.modules-success'),
                        'success',
                    );
                    this.showModulesModal = false;
                    this.modulesSubscription = null;
                    this.modulesSnapshot = null;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.savingModules = false;
                    this.notification.push(
                        this.translate.instant('admin.subscriptions.notifications.modules-error'),
                        'error',
                    );
                    this.cdr.markForCheck();
                },
            });
    }

    getActiveModulesCount(sub: Subscription): number {
        return sub.modules.filter(m => m.hasAccess).length;
    }

    getTotalModulesCount(): number {
        return getTotalModulesCount();
    }

    // ── Limits modal ──────────────────────────────────────────────────────────

    openLimitsModal(sub: Subscription): void {
        this.limitsSubscription = sub;
        this.loadingLimits = true;
        this.showLimitsModal = true;
        this.cdr.markForCheck();

        this.subscriptionLimitSvc.getBySubscription(sub.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (backendLimits) => {
                    this.moduleLimits = buildModuleLimits(sub.modules, backendLimits);
                    this.loadingLimits = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.moduleLimits = buildModuleLimits(sub.modules, []);
                    this.loadingLimits = false;
                    this.cdr.markForCheck();
                },
            });
    }

    onModuleToggle(ml: ModuleLimit): void {
        const closing = this.activeModuleCode === ml.moduleCode;
        // Limpiar estado de edición del módulo que se cierra
        if (closing || this.activeModuleCode !== null) {
            const prev = this.moduleLimits.find(m => m.moduleCode === this.activeModuleCode);
            if (prev) {
                // Eliminar pendientes sin confirmar
                prev.limits = prev.limits.filter(lv => !this.pendingLimits.has(lv));
                for (const lv of prev.limits) { this.limitEditMap.delete(lv); }
                this.pendingLimits.clear();
            }
        }
        this.activeModuleCode = closing ? null : ml.moduleCode;
        this.cdr.markForCheck();
    }

    closeLimitsModal(): void {
        this.showLimitsModal = false;
        this.limitsSubscription = null;
        this.moduleLimits = [];
        this.loadingLimits = false;
        this.activeModuleCode = null;
        this.limitEditMap.clear();
        this.pendingLimits.clear();
        this.savingLimits.clear();
    }

    setUnlimited(lv: SubscriptionLimitValue, unlimited: boolean): void {
        lv.value = unlimited ? null : 100;
    }

    onLimitChange(lv: SubscriptionLimitValue, event: Event): void {
        const val = parseInt((event.target as HTMLInputElement).value, 10);
        lv.value = isNaN(val) || val < 0 ? 0 : val;
    }

    getLimitBadge(ml: ModuleLimit): string {
        const defined = ml.limits.filter(l => l.value !== null).length;
        const total = ml.limits.length;
        if (defined === 0) {
            return this.translate.instant('admin.subscriptions.limits-modal.badge-none');
        }
        return this.translate.instant('admin.subscriptions.limits-modal.badge-count', { defined, total });
    }

    getLimitDisplayLabel(ml: ModuleLimit, lv: SubscriptionLimitValue): string {
        if (lv.label) { return lv.label; }
        return this.translate.instant(`admin.subscriptions.limits.${ml.moduleCode}.${lv.key}`);
    }

    isLimitEditing(lv: SubscriptionLimitValue): boolean {
        return this.limitEditMap.has(lv);
    }

    isPendingLimit(lv: SubscriptionLimitValue): boolean {
        return this.pendingLimits.has(lv);
    }

    isSavingLimit(lv: SubscriptionLimitValue): boolean {
        return this.savingLimits.has(lv);
    }

    private scrollToLastLimitField(): void {
        // Esperar a que Angular renderice la nueva fila antes de scrollear
        setTimeout(() => {
            const addRow = this.elRef.nativeElement.querySelector('.limit-add-row') as HTMLElement;
            if (addRow) {
                addRow.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }
        }, 50);
    }

    startEditLimit(lv: SubscriptionLimitValue): void {
        this.limitEditMap.set(lv, lv.name ?? '');
        this.cdr.markForCheck();
    }

    // ── Add: carga funcionalidades del módulo y agrega fila pendiente ─────────

    addLimit(ml: ModuleLimit): void {
        ml.loadingFunctionalities = true;
        this.cdr.markForCheck();

        // Solo las features habilitadas en esta suscripción son elegibles para topes
        const enabledKeys = new Set(this.limitsSubscription?.enabledFeatureKeys ?? []);

        this.functionalityService.getFunctionalities(ml.moduleCode)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (functionalities) => {
                    const usedKeys = new Set(ml.limits.map(l => l.key));
                    ml.availableFunctionalities = functionalities
                        .filter(f => f.is_active && enabledKeys.has(f.key) && !usedKeys.has(f.key))
                        .map(f => ({ id: f.id, key: f.key, label: f.label }));
                    ml.loadingFunctionalities = false;

                    const lv: SubscriptionLimitValue = {
                        key: '',
                        value: 1,
                        name: '',
                        validationType: undefined,
                        _trackId: `tmp_${++this.limitCounter}`,
                    };
                    ml.limits = [...ml.limits, lv];
                    this.limitEditMap.set(lv, '');
                    this.pendingLimits.add(lv);
                    this.cdr.markForCheck();
                    this.scrollToLastLimitField();
                },
                error: () => {
                    ml.loadingFunctionalities = false;
                    this.cdr.markForCheck();
                },
            });
    }

    functionalityOptions(ml: ModuleLimit): DropdownOption[] {
        return (ml.availableFunctionalities ?? [])
            .map((f: AvailableFunctionality) => ({ value: f.id, label: f.label }));
    }

    onValidationTypeSelect(lv: SubscriptionLimitValue, value: LimitValidationType): void {
        lv.validationType = value;
        this.cdr.markForCheck();
    }

    onFunctionalitySelect(lv: SubscriptionLimitValue, functionalityId: string, ml: ModuleLimit): void {
        const func = ml.availableFunctionalities?.find(f => f.id === functionalityId);
        if (!func) { return; }
        lv.functionalityId = func.id;
        lv.key = func.key;
        lv.label = func.label;
        this.cdr.markForCheck();
    }

    // ── Confirm edit / confirm new limit ─────────────────────────────────────

    confirmEditLimit(ml: ModuleLimit, lv: SubscriptionLimitValue): void {
        if (this.pendingLimits.has(lv)) {
            // Nuevo tope: POST inmediato al backend
            if (!lv.functionalityId || !lv.validationType) { return; }
            if (lv.value === null) {
                // Sin límite seleccionado: quitar el estado pendiente sin POST
                this.pendingLimits.delete(lv);
                this.limitEditMap.delete(lv);
                this.cdr.markForCheck();
                return;
            }
            this.savingLimits.add(lv);
            this.cdr.markForCheck();
            this.subscriptionLimitSvc.create({
                subscription: this.limitsSubscription!.id,
                functionality: lv.functionalityId,
                name: lv.name ?? '',
                max_value: lv.value,
                validation_type: lv.validationType,
            }).pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (created) => {
                        const savedLv: SubscriptionLimitValue = {
                            key: created.functionality_key,
                            value: created.max_value,
                            id: created.id,
                            functionalityId: created.functionality_id,
                            label: created.functionality_label,
                            name: created.name,
                            validationType: created.validation_type,
                        };
                        ml.limits = ml.limits.map(l => l === lv ? savedLv : l);
                        this.pendingLimits.delete(lv);
                        this.savingLimits.delete(lv);
                        this.limitEditMap.delete(lv);
                        this.notification.push(
                            this.translate.instant('admin.subscriptions.notifications.limit-create-success'),
                            'success',
                        );
                        this.cdr.markForCheck();
                    },
                    error: () => {
                        this.savingLimits.delete(lv);
                        this.notification.push(
                            this.translate.instant('admin.subscriptions.notifications.limit-save-error'),
                            'error',
                        );
                        this.cdr.markForCheck();
                    },
                });
        } else {
            // Tope existente: PATCH nombre via API
            if (!lv.id) { return; }
            const name = (this.limitEditMap.get(lv) ?? '').trim();
            this.subscriptionLimitSvc.update(lv.id, { name })
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (updated) => {
                        lv.name = updated.name;
                        this.limitEditMap.delete(lv);
                        this.notification.push(
                            this.translate.instant('admin.subscriptions.notifications.limit-update-success'),
                            'success',
                        );
                        this.cdr.markForCheck();
                    },
                    error: () => {
                        this.notification.push(
                            this.translate.instant('admin.subscriptions.notifications.limit-save-error'),
                            'error',
                        );
                        this.cdr.markForCheck();
                    },
                });
        }
    }

    cancelEditLimit(ml: ModuleLimit, lv: SubscriptionLimitValue): void {
        if (this.pendingLimits.has(lv)) {
            ml.limits = ml.limits.filter(l => l !== lv);
            this.pendingLimits.delete(lv);
        }
        this.limitEditMap.delete(lv);
        this.cdr.markForCheck();
    }

    // ── Delete: confirm dialog + DELETE inmediato ─────────────────────────────

    removeLimit(ml: ModuleLimit, lv: SubscriptionLimitValue): void {
        if (!lv.id) {
            // No existe en backend: solo quita de la lista local
            ml.limits = ml.limits.filter(l => l !== lv);
            this.limitEditMap.delete(lv);
            this.pendingLimits.delete(lv);
            this.cdr.markForCheck();
            return;
        }

        this.dialog.confirm({
            type: 'warning',
            title: this.translate.instant('admin.subscriptions.limits-modal.delete-dialog.title'),
            message: this.translate.instant('admin.subscriptions.limits-modal.delete-dialog.message',
                { label: this.getLimitDisplayLabel(ml, lv) }),
            confirmLabel: this.translate.instant('admin.subscriptions.limits-modal.delete-dialog.confirm'),
            cancelLabel: this.translate.instant('dialog.common.cancel'),
        }).pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed: boolean) => {
                if (!confirmed) { return; }
                this.subscriptionLimitSvc.delete(lv.id!)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            ml.limits = ml.limits.filter(l => l !== lv);
                            this.notification.push(
                                this.translate.instant('admin.subscriptions.notifications.limit-delete-success'),
                                'success',
                            );
                            this.cdr.markForCheck();
                        },
                        error: () => {
                            this.notification.push(
                                this.translate.instant('admin.subscriptions.notifications.limit-delete-error'),
                                'error',
                            );
                            this.cdr.markForCheck();
                        },
                    });
            });
    }

    // ── Feature detail modal ──────────────────────────────────────────────────

    openFeatureDetail(mod: SubscriptionModule): void {
        this.currentDetailModule = mod;
        this.currentDetailGroups = [];
        this.loadingFeatures = true;
        this.showFeatureDetailModal = true;
        this.cdr.markForCheck();

        const enabledKeys = new Set(this.modulesSubscription?.enabledFeatureKeys ?? []);
        this.featuresSnapshot = new Set(enabledKeys);

        this.functionalityService.getFunctionalities(mod.code)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (functionalities) => {
                    const realFeatures: SubscriptionFunctionality[] = functionalities
                        .filter(f => f.is_active)
                        .map(f => ({
                            key:      f.key,
                            label:    f.label,
                            enabled:  enabledKeys.has(f.key),
                            category: f.category,
                        }));

                    // Reemplazar las features del módulo con las reales del backend
                    mod.features = realFeatures;

                    const map = new Map<string, SubscriptionFunctionality[]>();
                    for (const f of realFeatures) {
                        if (!map.has(f.category)) map.set(f.category, []);
                        map.get(f.category)!.push(f);
                    }
                    this.currentDetailGroups = Array.from(map.entries())
                        .map(([category, features]) => ({ category, features }));
                    this.loadingFeatures = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.loadingFeatures = false;
                    this.cdr.markForCheck();
                },
            });
    }

    applyFeatureDetail(): void {
        if (!this.modulesSubscription) { this.closeFeatureDetail(); return; }

        const sub = this.modulesSubscription;
        const featureKeys = sub.modules
            .filter(m => m.hasAccess)
            .flatMap(m => m.features.filter(f => f.enabled).map(f => f.key));

        // Check if features actually changed
        const changed = (() => {
            if (!this.featuresSnapshot) { return true; }
            const current = new Set(featureKeys);
            if (current.size !== this.featuresSnapshot.size) { return true; }
            for (const key of current) { if (!this.featuresSnapshot.has(key)) { return true; } }
            return false;
        })();

        if (!changed) { this.closeFeatureDetail(); return; }

        sub.enabledFeatureKeys = featureKeys;
        this.savingFeatures = true;
        this.cdr.markForCheck();

        this.subscriptionService.updateFeatures(sub.id, featureKeys)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.savingFeatures = false;
                    this.featuresSnapshot = null;
                    this.notification.push(
                        this.translate.instant('admin.subscriptions.notifications.features-success'),
                        'success',
                    );
                    this.closeFeatureDetail();
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.savingFeatures = false;
                    this.notification.push(
                        this.translate.instant('admin.subscriptions.notifications.features-error'),
                        'error',
                    );
                    this.cdr.markForCheck();
                },
            });
    }

    closeFeatureDetail(): void {
        this.showFeatureDetailModal = false;
        this.currentDetailModule = null;
        this.currentDetailGroups = [];
    }

    isInvalid(field: string): boolean {
        return isFieldInvalid(this.form, field);
    }

    getPriceClass(price: number): string {
        if (price === 0) return 'tier-free';
        if (price < 50) return 'tier-basic';
        if (price < 150) return 'tier-pro';
        return 'tier-enterprise';
    }
}
