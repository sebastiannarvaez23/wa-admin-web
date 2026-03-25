import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { DialogService, DropdownOption } from 'wa-components-web';
import { forkJoin, Observable } from 'rxjs';

import { isFieldInvalid } from 'src/app/core/utils/form.utils';
import { AvailableFunctionality, ModuleLimit, SubscriptionLimitValue, Subscription, SubscriptionFeature, SubscriptionModule } from '../../../platform/subscriptions/interfaces/subscription.interfaces';
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

    showLimitsModal = false;
    limitsSubscription: Subscription | null = null;
    moduleLimits: ModuleLimit[] = [];
    loadingLimits = false;
    savingLimits = false;
    activeModuleCode: string | null = null;             // accordion: módulo expandido
    limitEditMap = new Map<SubscriptionLimitValue, string>(); // label pendiente mientras edita
    pendingLimits = new Set<SubscriptionLimitValue>();          // topes nuevos sin confirmar
    private limitCounter = 0;

    showFeatureDetailModal = false;
    currentDetailModule: SubscriptionModule | null = null;
    currentDetailGroups: { category: string; features: SubscriptionFeature[] }[] = [];

    private readonly destroyRef = inject(DestroyRef);

    constructor(
        private fb: FormBuilder,
        private translate: TranslateService,
        private subscriptionService: SubscriptionService,
        private subscriptionLimitSvc: SubscriptionLimitService,
        private functionalityService: FunctionalityService,
        private cdr: ChangeDetectorRef,
        private dialog: DialogService,
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
                        this.cdr.markForCheck();
                    },
                    error: () => {
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
                this.cdr.markForCheck();
            },
            error: () => {
                this.saving = false;
                this.cdr.markForCheck();
            },
        });
    }

    // ── Modules modal ─────────────────────────────────────────────────────────

    openModulesModal(sub: Subscription): void {
        this.modulesSubscription = sub;
        this.showModulesModal = true;
    }

    closeModulesModal(): void {
        this.showModulesModal = false;
        this.modulesSubscription = null;
    }

    toggleModuleAccess(mod: SubscriptionModule): void {
        if (mod.hasAccess) {
            mod.hasAccess = false;
            mod.features.forEach(f => f.enabled = false);
        } else {
            mod.hasAccess = true;
        }
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

    private scrollToLastLimitField(): void {
        // Esperar a que Angular renderice la nueva fila antes de scrollear
        setTimeout(() => {
            const fields = this.elRef.nativeElement.querySelectorAll('.limit-field') as NodeListOf<HTMLElement>;
            if (fields.length > 0) {
                fields[fields.length - 1].scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

        this.functionalityService.getFunctionalities(ml.moduleCode)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: (functionalities) => {
                    const usedKeys = new Set(ml.limits.map(l => l.key));
                    ml.availableFunctionalities = functionalities
                        .filter(f => f.is_active && !usedKeys.has(f.key))
                        .map(f => ({ id: f.id, key: f.key, label: f.label }));
                    ml.loadingFunctionalities = false;

                    const lv: SubscriptionLimitValue = {
                        key: '',
                        value: 1,
                        name: '',
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
            if (!lv.functionalityId) { return; }
            if (lv.value === null) {
                // Sin límite seleccionado: quitar el estado pendiente sin POST
                this.pendingLimits.delete(lv);
                this.limitEditMap.delete(lv);
                this.cdr.markForCheck();
                return;
            }
            this.subscriptionLimitSvc.create({
                subscription: this.limitsSubscription!.id,
                functionality: lv.functionalityId,
                name: lv.name ?? '',
                max_value: lv.value,
            }).pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: (created) => {
                        // Reemplazar el objeto pendiente por uno limpio (sin _trackId)
                        // para que Angular destruya el formulario y cree la vista desde cero
                        const savedLv: SubscriptionLimitValue = {
                            key: created.functionality_key,
                            value: created.max_value,
                            id: created.id,
                            functionalityId: created.functionality_id,
                            label: created.functionality_label,
                            name: created.name,
                        };
                        ml.limits = ml.limits.map(l => l === lv ? savedLv : l);
                        this.pendingLimits.delete(lv);
                        this.limitEditMap.delete(lv);
                        this.cdr.markForCheck();
                    },
                    error: () => { this.cdr.markForCheck(); },
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
                        this.cdr.markForCheck();
                    },
                    error: () => { this.cdr.markForCheck(); },
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
                            this.cdr.markForCheck();
                        },
                        error: () => { this.cdr.markForCheck(); },
                    });
            });
    }

    // ── Save: PATCH (valor cambiado) / DELETE (sin límite) ────────────────────

    saveLimits(): void {
        if (!this.limitsSubscription) { return; }

        const ops: Observable<unknown>[] = [];

        for (const ml of this.moduleLimits) {
            for (const lv of ml.limits) {
                if (!lv.id || this.pendingLimits.has(lv)) { continue; }

                if (lv.value === null) {
                    ops.push(this.subscriptionLimitSvc.delete(lv.id));
                } else {
                    ops.push(this.subscriptionLimitSvc.update(lv.id, { max_value: lv.value, name: lv.name }));
                }
            }
        }

        if (!ops.length) {
            this.closeLimitsModal();
            return;
        }

        this.savingLimits = true;
        forkJoin(ops).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: () => {
                this.savingLimits = false;
                this.closeLimitsModal();
                this.cdr.markForCheck();
            },
            error: () => {
                this.savingLimits = false;
                this.cdr.markForCheck();
            },
        });
    }

    // ── Feature detail modal ──────────────────────────────────────────────────

    openFeatureDetail(mod: SubscriptionModule): void {
        this.currentDetailModule = mod;
        const map = new Map<string, SubscriptionFeature[]>();
        for (const f of mod.features) {
            if (!map.has(f.category)) map.set(f.category, []);
            map.get(f.category)!.push(f);
        }
        this.currentDetailGroups = Array.from(map.entries())
            .map(([category, features]) => ({ category, features }));
        this.showFeatureDetailModal = true;
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
