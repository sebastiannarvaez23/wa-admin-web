import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { FeatureModule } from './feature.interfaces';
import { AdminSection, AdminFunctionality } from '../../interfaces/admin-users.interfaces';
import { AdminModulesService } from '../../services/admin-modules.service';
import { AdminFunctionalitiesService } from '../../services/admin-functionalities.service';
import { isFieldInvalid } from 'src/app/core/utils/form.utils';
import { DialogService } from 'wa-components-web';

@Component({
    selector: 'wa-admin-features-page',
    templateUrl: './features-page.component.html',
    styleUrls: ['../subscriptions/subscriptions-shared.css', './features-table.css', './features-page.component.css'],
})
export class FeaturesPageComponent implements OnInit, OnDestroy {

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    sections: AdminSection[] = [];
    sectionsLoading = false;
    selectedSectionId: string | null = null;

    showSectionModal = false;
    editingSection: AdminSection | null = null;
    sectionSaving = false;
    sectionForm!: FormGroup;

    // ═══════════════════════════════════════════════════════════════════════════
    // MODULES
    // ═══════════════════════════════════════════════════════════════════════════

    modules: FeatureModule[] = [];
    modulesLoading = false;

    showModuleModal = false;
    editingModule: FeatureModule | null = null;
    moduleSaving = false;
    moduleForm!: FormGroup;

    // ═══════════════════════════════════════════════════════════════════════════
    // MODULE FEATURES MODAL
    // ═══════════════════════════════════════════════════════════════════════════

    showFeaturesModal = false;
    selectedModuleForFeatures: FeatureModule | null = null;
    moduleFeatures: AdminFunctionality[] = [];
    moduleFeaturesLoading = false;

    showFeatureModal = false;
    editingFeature: AdminFunctionality | null = null;
    featureSaving = false;
    featureForm!: FormGroup;

    constructor(
        private fb: FormBuilder,
        private modulesService: AdminModulesService,
        private functionalitiesService: AdminFunctionalitiesService,
        private dialog: DialogService,
        private translate: TranslateService,
    ) {
        this.sectionForm = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(2)]],
            name: ['', [Validators.required, Validators.minLength(2)]],
            icon: ['bx-category', [Validators.required]],
        });

        this.moduleForm = this.fb.group({
            code:        ['', [Validators.required, Validators.minLength(2)]],
            name:        ['', [Validators.required, Validators.minLength(2)]],
            description: [''],
            icon:        ['bx-cube', [Validators.required]],
            route:       ['', [Validators.required]],
            section_id:  ['', [Validators.required]],
        });

        this.featureForm = this.fb.group({
            key:      ['', [Validators.required, Validators.minLength(2)]],
            label:    ['', [Validators.required, Validators.minLength(2)]],
            category: ['features'],
        });
    }

    ngOnInit(): void {
        this.loadSections();
        this.loadModules();
    }

    ngOnDestroy(): void {}

    // ─── Sections CRUD ──────────────────────────────────────────────────────────

    loadSections(): void {
        this.sectionsLoading = true;
        this.modulesService.getSections().subscribe({
            next: (sections) => {
                this.sections = sections;
                if (!this.selectedSectionId && sections.length > 0) {
                    this.selectedSectionId = sections[0].id;
                }
                this.sectionsLoading = false;
            },
            error: () => { this.sectionsLoading = false; },
        });
    }

    get selectedSection(): AdminSection | undefined {
        return this.sections.find(s => s.id === this.selectedSectionId);
    }

    get filteredModules(): FeatureModule[] {
        if (!this.selectedSectionId) return [];
        return this.modules.filter(m => m.section_id === this.selectedSectionId);
    }

    selectSection(sec: AdminSection): void {
        this.selectedSectionId = sec.id;
    }

    openCreateSection(): void {
        this.editingSection = null;
        this.sectionForm.reset({ icon: 'bx-category' });
        this.showSectionModal = true;
    }

    openEditSection(sec: AdminSection, event: Event): void {
        event.stopPropagation();
        this.editingSection = sec;
        this.sectionForm.patchValue({ code: sec.code, name: sec.name, icon: sec.icon });
        this.showSectionModal = true;
    }

    closeSectionModal(): void {
        this.showSectionModal = false;
        this.editingSection = null;
    }

    confirmDeleteSection(sec: AdminSection, event: Event): void {
        event.stopPropagation();
        this.dialog.confirm({
            type: 'danger',
            title: this.translate.instant('admin.features.sections.delete-dialog.title'),
            message: this.translate.instant('admin.features.sections.delete-dialog.message', { name: sec.name }),
            confirmLabel: this.translate.instant('admin.features.sections.delete-dialog.confirm'),
            cancelLabel: this.translate.instant('dialog.common.cancel'),
        }).subscribe(confirmed => {
            if (!confirmed) return;
            this.modulesService.deleteSection(sec.id).subscribe({
                next: () => {
                    this.sections = this.sections.filter(s => s.id !== sec.id);
                    if (this.selectedSectionId === sec.id) {
                        this.selectedSectionId = this.sections[0]?.id ?? null;
                    }
                },
            });
        });
    }

    toggleSectionActive(sec: AdminSection, event: Event): void {
        event.stopPropagation();
        this.modulesService.toggleSection(sec.id).subscribe({
            next: (updated) => {
                const idx = this.sections.findIndex(s => s.id === sec.id);
                if (idx !== -1) this.sections[idx].is_active = updated.is_active;
            },
        });
    }

    saveSection(): void {
        if (this.sectionForm.invalid) { this.sectionForm.markAllAsTouched(); return; }
        this.sectionSaving = true;
        const value = this.sectionForm.getRawValue();

        const request$ = this.editingSection
            ? this.modulesService.updateSection(this.editingSection.id, value)
            : this.modulesService.createSection(value);

        request$.subscribe({
            next: () => {
                this.sectionSaving = false;
                this.closeSectionModal();
                this.loadSections();
            },
            error: () => { this.sectionSaving = false; },
        });
    }

    isSectionInvalid(field: string): boolean {
        return isFieldInvalid(this.sectionForm, field);
    }

    // ─── Modules CRUD ───────────────────────────────────────────────────────────

    loadModules(): void {
        this.modulesLoading = true;
        this.modulesService.getModules(0, 200).subscribe({
            next: (result) => {
                this.modules = result.items.map(m => ({
                    id:             m.id,
                    code:           m.code,
                    name:           m.name,
                    description:    m.description,
                    icon:           m.icon,
                    section_id:     m.section_id,
                    is_active:      m.is_active,
                    features_count: 0,
                    created_at:     m.created_at,
                    updated_at:     m.updated_at,
                }));
                this.modulesLoading = false;
            },
            error: () => { this.modulesLoading = false; },
        });
    }

    openCreateModule(): void {
        this.editingModule = null;
        this.moduleForm.reset({ icon: 'bx-cube', section_id: this.selectedSectionId ?? '' });
        this.showModuleModal = true;
    }

    openEditModule(mod: FeatureModule): void {
        this.editingModule = mod;
        this.moduleForm.patchValue({
            code:        mod.code,
            name:        mod.name,
            description: mod.description,
            icon:        mod.icon,
            route:       (mod as any)['route'] ?? '',
            section_id:  mod.section_id ?? '',
        });
        this.showModuleModal = true;
    }

    closeModuleModal(): void {
        this.showModuleModal = false;
        this.editingModule = null;
    }

    toggleModuleActive(mod: FeatureModule): void {
        this.modulesService.toggleModule(mod.id).subscribe({
            next: (updated) => {
                const idx = this.modules.findIndex(m => m.id === mod.id);
                if (idx !== -1) this.modules[idx].is_active = updated.is_active;
            },
        });
    }

    confirmDeleteModule(mod: FeatureModule): void {
        this.dialog.confirm({
            type: 'danger',
            title: this.translate.instant('admin.features.modules.delete-dialog.title'),
            message: this.translate.instant('admin.features.modules.delete-dialog.message', { name: mod.name }),
            confirmLabel: this.translate.instant('admin.features.modules.delete-dialog.confirm'),
            cancelLabel: this.translate.instant('dialog.common.cancel'),
        }).subscribe(confirmed => {
            if (!confirmed) return;
            this.modulesService.deleteModule(mod.id).subscribe({
                next: () => { this.modules = this.modules.filter(m => m.id !== mod.id); },
            });
        });
    }

    saveModule(): void {
        if (this.moduleForm.invalid) { this.moduleForm.markAllAsTouched(); return; }
        this.moduleSaving = true;
        const value = this.moduleForm.getRawValue();

        const request$ = this.editingModule
            ? this.modulesService.updateModule(this.editingModule.id, value)
            : this.modulesService.createModule(value);

        request$.subscribe({
            next: () => {
                this.moduleSaving = false;
                this.closeModuleModal();
                this.loadModules();
            },
            error: () => { this.moduleSaving = false; },
        });
    }

    isModuleInvalid(field: string): boolean {
        return isFieldInvalid(this.moduleForm, field);
    }

    // ─── Module Features Modal ───────────────────────────────────────────────────

    openModuleFeatures(mod: FeatureModule): void {
        this.selectedModuleForFeatures = mod;
        this.showFeaturesModal = true;
        this.loadModuleFeatures();
    }

    closeModuleFeaturesModal(): void {
        this.showFeaturesModal = false;
        this.selectedModuleForFeatures = null;
        this.moduleFeatures = [];
        this.showFeatureModal = false;
        this.editingFeature = null;
    }

    loadModuleFeatures(): void {
        if (!this.selectedModuleForFeatures) return;
        this.moduleFeaturesLoading = true;
        this.functionalitiesService.getFunctionalities(this.selectedModuleForFeatures.code).subscribe({
            next: (items) => {
                this.moduleFeatures = items;
                this.moduleFeaturesLoading = false;
            },
            error: () => { this.moduleFeaturesLoading = false; },
        });
    }

    openCreateFeature(): void {
        this.editingFeature = null;
        this.featureForm.reset({ category: 'features' });
        this.showFeatureModal = true;
    }

    openEditFeature(feat: AdminFunctionality): void {
        this.editingFeature = feat;
        this.featureForm.patchValue({ key: feat.key, label: feat.label, category: feat.category });
        this.showFeatureModal = true;
    }

    closeFeatureModal(): void {
        this.showFeatureModal = false;
        this.editingFeature = null;
    }

    toggleFeatureActive(feat: AdminFunctionality): void {
        this.functionalitiesService.updateFunctionality(feat.id, { is_active: !feat.is_active }).subscribe({
            next: () => { this.loadModuleFeatures(); },
        });
    }

    saveFeature(): void {
        if (this.featureForm.invalid) { this.featureForm.markAllAsTouched(); return; }
        this.featureSaving = true;
        const value = this.featureForm.getRawValue();
        const moduleCode = this.selectedModuleForFeatures!.code;

        const request$ = this.editingFeature
            ? this.functionalitiesService.updateFunctionality(this.editingFeature.id, {
                key: value.key, label: value.label, category: value.category,
              })
            : this.functionalitiesService.createFunctionality({
                key: value.key, label: value.label, module: moduleCode,
                category: value.category || 'features',
              });

        request$.subscribe({
            next: () => {
                this.featureSaving = false;
                this.closeFeatureModal();
                this.loadModuleFeatures();
            },
            error: () => { this.featureSaving = false; },
        });
    }

    isFeatureInvalid(field: string): boolean {
        return isFieldInvalid(this.featureForm, field);
    }
}
