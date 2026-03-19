import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import { DialogService } from 'wa-components-web';
import { isFieldInvalid } from 'src/app/core/utils/form.utils';
import { ModuleService } from '../../../platform/modules/services/module.service';
import { SectionService } from '../../../platform/modules/services/section.service';
import { FunctionalityService } from '../../../platform/functionalities/services/functionality.service';
import { PlatformModule, PlatformSection } from '../../../platform/modules/interfaces/module.interfaces';
import { Functionality } from '../../../platform/functionalities/interfaces/functionality.interfaces';

@Component({
    selector: 'wa-admin-features-page',
    templateUrl: './features-page.component.html',
    styleUrls: ['../subscriptions/subscriptions-shared.css', './features-table.css', './features-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeaturesPageComponent implements OnInit {

    // ═══════════════════════════════════════════════════════════════════════════
    // SECTIONS
    // ═══════════════════════════════════════════════════════════════════════════

    sections:         PlatformSection[] = [];
    sectionsLoading   = false;
    selectedSectionId: string | null   = null;

    showSectionModal  = false;
    editingSection:   PlatformSection | null = null;
    sectionSaving     = false;
    sectionForm!:     FormGroup;

    // ═══════════════════════════════════════════════════════════════════════════
    // MODULES
    // ═══════════════════════════════════════════════════════════════════════════

    modules:       PlatformModule[] = [];
    modulesLoading = false;

    showModuleModal = false;
    editingModule:  PlatformModule | null = null;
    moduleSaving    = false;
    moduleForm!:    FormGroup;

    // ═══════════════════════════════════════════════════════════════════════════
    // MODULE FEATURES MODAL
    // ═══════════════════════════════════════════════════════════════════════════

    showFeaturesModal           = false;
    selectedModuleForFeatures:  PlatformModule | null = null;
    moduleFeatures:             Functionality[] = [];
    moduleFeaturesLoading       = false;

    showFeatureModal  = false;
    editingFeature:   Functionality | null = null;
    featureSaving     = false;
    featureForm!:     FormGroup;

    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr        = inject(ChangeDetectorRef);

    constructor(
        private fb:                     FormBuilder,
        private moduleService:          ModuleService,
        private sectionService:         SectionService,
        private functionalityService:   FunctionalityService,
        private dialog:                 DialogService,
        private translate:              TranslateService,
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

    // ── TrackBy ───────────────────────────────────────────────────────────────

    trackById(_: number, item: { id: string }): string { return item.id; }

    // ─── Sections CRUD ────────────────────────────────────────────────────────

    loadSections(): void {
        this.sectionsLoading = true;
        this.sectionService.getSections()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: sections => {
                    this.sections = sections;
                    if (!this.selectedSectionId && sections.length > 0) {
                        this.selectedSectionId = sections[0].id;
                    }
                    this.sectionsLoading = false;
                    this.cdr.markForCheck();
                },
                error: () => { this.sectionsLoading = false; this.cdr.markForCheck(); },
            });
    }

    get selectedSection(): PlatformSection | undefined {
        return this.sections.find(s => s.id === this.selectedSectionId);
    }

    get filteredModules(): PlatformModule[] {
        if (!this.selectedSectionId) return [];
        return this.modules.filter(m => m.section_id === this.selectedSectionId);
    }

    selectSection(sec: PlatformSection): void {
        this.selectedSectionId = sec.id;
    }

    openCreateSection(): void {
        this.editingSection = null;
        this.sectionForm.reset({ icon: 'bx-category' });
        this.showSectionModal = true;
    }

    openEditSection(sec: PlatformSection, event: Event): void {
        event.stopPropagation();
        this.editingSection = sec;
        this.sectionForm.patchValue({ code: sec.code, name: sec.name, icon: sec.icon });
        this.showSectionModal = true;
    }

    closeSectionModal(): void {
        this.showSectionModal = false;
        this.editingSection   = null;
    }

    confirmDeleteSection(sec: PlatformSection, event: Event): void {
        event.stopPropagation();
        this.dialog.confirm({
            type:         'danger',
            title:        this.translate.instant('admin.features.sections.delete-dialog.title'),
            message:      this.translate.instant('admin.features.sections.delete-dialog.message', { name: sec.name }),
            confirmLabel: this.translate.instant('admin.features.sections.delete-dialog.confirm'),
            cancelLabel:  this.translate.instant('dialog.common.cancel'),
        }).pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(confirmed => {
              if (!confirmed) return;
              this.sectionService.deleteSection(sec.id)
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                      next: () => {
                          this.sections = this.sections.filter(s => s.id !== sec.id);
                          if (this.selectedSectionId === sec.id) {
                              this.selectedSectionId = this.sections[0]?.id ?? null;
                          }
                          this.cdr.markForCheck();
                      },
                  });
          });
    }

    toggleSectionActive(sec: PlatformSection, event: Event): void {
        event.stopPropagation();
        this.sectionService.toggleSection(sec.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: updated => {
                    const idx = this.sections.findIndex(s => s.id === sec.id);
                    if (idx !== -1) this.sections[idx].is_active = updated.is_active;
                    this.cdr.markForCheck();
                },
            });
    }

    saveSection(): void {
        if (this.sectionForm.invalid) { this.sectionForm.markAllAsTouched(); return; }
        this.sectionSaving = true;
        const value = this.sectionForm.getRawValue();

        const request$ = this.editingSection
            ? this.sectionService.updateSection(this.editingSection.id, value)
            : this.sectionService.createSection(value);

        request$.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.sectionSaving = false;
                    this.closeSectionModal();
                    this.loadSections();
                },
                error: () => { this.sectionSaving = false; this.cdr.markForCheck(); },
            });
    }

    isSectionInvalid(field: string): boolean { return isFieldInvalid(this.sectionForm, field); }

    // ─── Modules CRUD ─────────────────────────────────────────────────────────

    loadModules(): void {
        this.modulesLoading = true;
        this.moduleService.getModules(0, 200)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: result => {
                    this.modules        = result.items;
                    this.modulesLoading = false;
                    this.cdr.markForCheck();
                },
                error: () => { this.modulesLoading = false; this.cdr.markForCheck(); },
            });
    }

    openCreateModule(): void {
        this.editingModule = null;
        this.moduleForm.reset({ icon: 'bx-cube', section_id: this.selectedSectionId ?? '' });
        this.showModuleModal = true;
    }

    openEditModule(mod: PlatformModule): void {
        this.editingModule = mod;
        this.moduleForm.patchValue({
            code:        mod.code,
            name:        mod.name,
            description: mod.description,
            icon:        mod.icon,
            route:       mod.route ?? '',
            section_id:  mod.section_id ?? '',
        });
        this.showModuleModal = true;
    }

    closeModuleModal(): void {
        this.showModuleModal = false;
        this.editingModule   = null;
    }

    toggleModuleActive(mod: PlatformModule): void {
        this.moduleService.toggleModule(mod.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: updated => {
                    const idx = this.modules.findIndex(m => m.id === mod.id);
                    if (idx !== -1) this.modules[idx].is_active = updated.is_active;
                    this.cdr.markForCheck();
                },
            });
    }

    confirmDeleteModule(mod: PlatformModule): void {
        this.dialog.confirm({
            type:         'danger',
            title:        this.translate.instant('admin.features.modules.delete-dialog.title'),
            message:      this.translate.instant('admin.features.modules.delete-dialog.message', { name: mod.name }),
            confirmLabel: this.translate.instant('admin.features.modules.delete-dialog.confirm'),
            cancelLabel:  this.translate.instant('dialog.common.cancel'),
        }).pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(confirmed => {
              if (!confirmed) return;
              this.moduleService.deleteModule(mod.id)
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                      next: () => {
                          this.modules = this.modules.filter(m => m.id !== mod.id);
                          this.cdr.markForCheck();
                      },
                  });
          });
    }

    saveModule(): void {
        if (this.moduleForm.invalid) { this.moduleForm.markAllAsTouched(); return; }
        this.moduleSaving = true;
        const value = this.moduleForm.getRawValue();

        const request$ = this.editingModule
            ? this.moduleService.updateModule(this.editingModule.id, value)
            : this.moduleService.createModule(value);

        request$.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.moduleSaving = false;
                    this.closeModuleModal();
                    this.loadModules();
                },
                error: () => { this.moduleSaving = false; this.cdr.markForCheck(); },
            });
    }

    isModuleInvalid(field: string): boolean { return isFieldInvalid(this.moduleForm, field); }

    // ─── Module Features Modal ────────────────────────────────────────────────

    openModuleFeatures(mod: PlatformModule): void {
        this.selectedModuleForFeatures = mod;
        this.showFeaturesModal         = true;
        this.loadModuleFeatures();
    }

    closeModuleFeaturesModal(): void {
        this.showFeaturesModal          = false;
        this.selectedModuleForFeatures  = null;
        this.moduleFeatures             = [];
        this.showFeatureModal           = false;
        this.editingFeature             = null;
    }

    loadModuleFeatures(): void {
        if (!this.selectedModuleForFeatures) return;
        this.moduleFeaturesLoading = true;
        this.functionalityService.getFunctionalities(this.selectedModuleForFeatures.code)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: items => {
                    this.moduleFeatures        = items;
                    this.moduleFeaturesLoading = false;
                    this.cdr.markForCheck();
                },
                error: () => { this.moduleFeaturesLoading = false; this.cdr.markForCheck(); },
            });
    }

    openCreateFeature(): void {
        this.editingFeature = null;
        this.featureForm.reset({ category: 'features' });
        this.showFeatureModal = true;
    }

    openEditFeature(feat: Functionality): void {
        this.editingFeature = feat;
        this.featureForm.patchValue({ key: feat.key, label: feat.label, category: feat.category });
        this.showFeatureModal = true;
    }

    closeFeatureModal(): void {
        this.showFeatureModal = false;
        this.editingFeature   = null;
    }

    confirmDeleteFeature(feat: Functionality): void {
        this.dialog.confirm({
            type:         'danger',
            title:        this.translate.instant('admin.features.features-section.delete-dialog.title'),
            message:      this.translate.instant('admin.features.features-section.delete-dialog.message', { label: feat.label }),
            confirmLabel: this.translate.instant('admin.features.features-section.delete-dialog.confirm'),
            cancelLabel:  this.translate.instant('dialog.common.cancel'),
        }).pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(confirmed => {
              if (!confirmed) return;
              this.functionalityService.deleteFunctionality(feat.id)
                  .pipe(takeUntilDestroyed(this.destroyRef))
                  .subscribe({
                      next: () => {
                          this.moduleFeatures = this.moduleFeatures.filter(f => f.id !== feat.id);
                          this.cdr.markForCheck();
                      },
                  });
          });
    }

    toggleFeatureActive(feat: Functionality): void {
        this.functionalityService.updateFunctionality(feat.id, { is_active: !feat.is_active })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({ next: () => this.loadModuleFeatures() });
    }

    saveFeature(): void {
        if (this.featureForm.invalid) { this.featureForm.markAllAsTouched(); return; }
        this.featureSaving    = true;
        const value           = this.featureForm.getRawValue();
        const moduleCode      = this.selectedModuleForFeatures!.code;

        const request$ = this.editingFeature
            ? this.functionalityService.updateFunctionality(this.editingFeature.id, {
                key: value.key, label: value.label, category: value.category,
              })
            : this.functionalityService.createFunctionality({
                key: value.key, label: value.label, module: moduleCode,
                category: value.category || 'features',
              });

        request$.pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.featureSaving = false;
                    this.closeFeatureModal();
                    this.loadModuleFeatures();
                },
                error: () => { this.featureSaving = false; this.cdr.markForCheck(); },
            });
    }

    isFeatureInvalid(field: string): boolean { return isFieldInvalid(this.featureForm, field); }
}
