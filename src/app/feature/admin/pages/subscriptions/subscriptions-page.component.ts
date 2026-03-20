import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { isFieldInvalid } from 'src/app/core/utils/form.utils';
import { Subscription, SubscriptionFeature, SubscriptionModule } from '../../../platform/subscriptions/interfaces/subscription.interfaces';
import { buildModules, getTotalModulesCount, SubscriptionService } from '../../../platform/subscriptions/services/subscription.service';

@Component({
    selector: 'wa-admin-subscriptions-page',
    templateUrl: './subscriptions-page.component.html',
    styleUrls: ['./subscriptions-shared.css', './subscriptions-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SubscriptionsPageComponent implements OnInit {

    subscriptions: Subscription[] = [];
    loading = false;

    showModal            = false;
    editingSubscription: Subscription | null = null;
    saving               = false;
    form!:               FormGroup;

    showModulesModal      = false;
    modulesSubscription:  Subscription | null = null;

    showFeatureDetailModal = false;
    currentDetailModule:   SubscriptionModule | null = null;
    currentDetailGroups:   { category: string; features: SubscriptionFeature[] }[] = [];

    constructor(
        private fb:                  FormBuilder,
        private translate:           TranslateService,
        private subscriptionService: SubscriptionService,
    ) {
        this.form = this.fb.group({
            code:        ['', [Validators.required, Validators.minLength(2)]],
            name:        ['', [Validators.required, Validators.minLength(2)]],
            description: ['', [Validators.required]],
            price:       [0,  [Validators.required, Validators.min(0)]],
        });
    }

    ngOnInit(): void {
        this.subscriptions = this.subscriptionService.getSeedSubscriptions();
    }

    trackById(_: number, item: { id: string }): string { return item.id; }
    trackByCode(_: number, item: { code: string }): string { return item.code; }
    trackByKey(_: number, item: { key: string }): string { return item.key; }
    trackByCategory(_: number, g: { category: string }): string { return g.category; }

    // ── List actions ──────────────────────────────────────────────────────────

    openCreate(): void {
        this.editingSubscription = null;
        this.form.reset({ price: 0 });
        this.showModal = true;
    }

    openEdit(sub: Subscription): void {
        this.editingSubscription = sub;
        this.form.patchValue({ code: sub.code, name: sub.name, description: sub.description, price: sub.price });
        this.showModal = true;
    }

    closeModal(): void {
        this.showModal           = false;
        this.editingSubscription = null;
    }

    toggleActive(sub: Subscription): void {
        sub.is_active = !sub.is_active;
    }

    confirmDelete(sub: Subscription): void {
        this.subscriptions = this.subscriptions.filter(s => s.id !== sub.id);
    }

    save(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.saving = true;
        const value = this.form.getRawValue();
        setTimeout(() => {
            if (this.editingSubscription) {
                const idx = this.subscriptions.findIndex(s => s.id === this.editingSubscription!.id);
                if (idx !== -1) {
                    this.subscriptions[idx] = { ...this.subscriptions[idx], ...value, updated_at: new Date().toISOString() };
                }
            } else {
                this.subscriptions.push({
                    id: Date.now().toString(), ...value, logo: '', is_active: true,
                    modules:     buildModules([], []),
                    created_at:  new Date().toISOString(),
                    updated_at:  new Date().toISOString(),
                });
            }
            this.saving = false;
            this.closeModal();
        }, 400);
    }

    // ── Modules modal ─────────────────────────────────────────────────────────

    openModulesModal(sub: Subscription): void {
        this.modulesSubscription = sub;
        this.showModulesModal    = true;
    }

    closeModulesModal(): void {
        this.showModulesModal    = false;
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

    // ── Limits modal (placeholder) ──────────────────────────────────────────────

    openLimitsModal(sub: Subscription): void {
        // TODO: implement limits modal
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
        this.currentDetailModule   = null;
        this.currentDetailGroups   = [];
    }

    isInvalid(field: string): boolean {
        return isFieldInvalid(this.form, field);
    }

    getPriceClass(price: number): string {
        if (price === 0)   return 'tier-free';
        if (price < 50)    return 'tier-basic';
        if (price < 150)   return 'tier-pro';
        return 'tier-enterprise';
    }
}
