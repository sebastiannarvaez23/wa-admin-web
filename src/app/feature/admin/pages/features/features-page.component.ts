import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { debounceTime, startWith } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { FeatureModule, Feature, FeatureTableConfig } from './feature.interfaces';
import { isFieldInvalid } from 'src/app/core/utils/form.utils';

// ── Mock modules catalog ──────────────────────────────────────────────────────
const MOCK_MODULES: FeatureModule[] = [
    { id: '1',  code: 'dashboard',     name: 'Inicio',               description: 'Visualización general del estado del almacén',           icon: 'bx-home',              is_active: true,  features_count: 9,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '2',  code: 'orders',        name: 'Pedidos',              description: 'Gestión de pedidos de clientes',                          icon: 'bx-cart',              is_active: true,  features_count: 11, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '3',  code: 'reception',     name: 'Recepción',            description: 'Recepción y verificación de mercancía entrante',           icon: 'bx-import',            is_active: true,  features_count: 8,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '4',  code: 'location',      name: 'Almacenes',            description: 'Gestión de almacenes y ubicaciones',                      icon: 'bx-map',               is_active: true,  features_count: 8,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '5',  code: 'inventories',   name: 'Inventarios',          description: 'Control y seguimiento del inventario',                    icon: 'bx-box',               is_active: true,  features_count: 10, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '6',  code: 'picking',       name: 'Picking',              description: 'Proceso de recolección de productos',                     icon: 'bx-select-multiple',   is_active: true,  features_count: 9,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '7',  code: 'packing',       name: 'Empaque',              description: 'Preparación y empaque de pedidos',                        icon: 'bx-package',           is_active: true,  features_count: 7,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '8',  code: 'dispatches',    name: 'Despachos',            description: 'Coordinación de despachos y salidas',                     icon: 'bx-export',            is_active: true,  features_count: 7,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '9',  code: 'shipping',      name: 'Envíos',               description: 'Gestión de envíos y seguimiento',                         icon: 'bx-send',              is_active: true,  features_count: 7,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '10', code: 'third_parties', name: 'Terceros',             description: 'Administración de clientes, proveedores y transportistas', icon: 'bx-group',             is_active: true,  features_count: 6,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '11', code: 'users_roles',   name: 'Usuarios y Roles',     description: 'Gestión de usuarios y asignación de roles',               icon: 'bx-user-check',        is_active: true,  features_count: 6,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '12', code: 'tasks',         name: 'Tareas',               description: 'Administración de tareas operativas',                     icon: 'bx-task',              is_active: true,  features_count: 7,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '13', code: 'integrations',  name: 'Integraciones',        description: 'Conexión con sistemas externos',                          icon: 'bx-plug',              is_active: true,  features_count: 6,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '14', code: 'automation',    name: 'Automatización',       description: 'Reglas y flujos de trabajo automáticos',                   icon: 'bx-bot',               is_active: true,  features_count: 7,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '15', code: 'analytics',     name: 'Analítica',            description: 'Reportes e indicadores de desempeño',                     icon: 'bx-bar-chart-alt-2',   is_active: true,  features_count: 8,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '16', code: 'audit',         name: 'Auditoría',            description: 'Registro y trazabilidad de operaciones',                  icon: 'bx-search-alt',        is_active: true,  features_count: 6,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '17', code: 'settings',      name: 'Configuración',        description: 'Configuración general del sistema',                       icon: 'bx-cog',               is_active: false, features_count: 6,  created_at: '2024-01-01', updated_at: '2024-01-01' },
];

// ── Mock features catalog ─────────────────────────────────────────────────────
const MOCK_FEATURES: Feature[] = [
    // Dashboard
    { id: '1',  key: 'dashboard.view-summary',           label: 'Ver resumen general de operaciones',   description: 'Permite ver el resumen del estado del almacén',          module_code: 'dashboard',   module_name: 'Inicio',         category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '2',  key: 'dashboard.configurable-widgets',   label: 'Widgets configurables',                description: 'Configurar widgets del dashboard',                       module_code: 'dashboard',   module_name: 'Inicio',         category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '3',  key: 'dashboard.real-time-metrics',      label: 'Métricas en tiempo real',              description: 'Visualización de métricas en tiempo real',                module_code: 'dashboard',   module_name: 'Inicio',         category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '4',  key: 'dashboard.alerts-notifications',   label: 'Alertas y notificaciones',             description: 'Sistema de alertas y notificaciones',                     module_code: 'dashboard',   module_name: 'Inicio',         category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '5',  key: 'dashboard.quick-access',           label: 'Acceso rápido a módulos',              description: 'Acceso directo a los módulos principales',                module_code: 'dashboard',   module_name: 'Inicio',         category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '6',  key: 'dashboard.kpis',                   label: 'Indicadores de rendimiento (KPIs)',    description: 'Visualización de indicadores clave de rendimiento',       module_code: 'dashboard',   module_name: 'Inicio',         category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '7',  key: 'dashboard.daily-demand-prediction', label: 'Predicción de demanda diaria',        description: 'IA para predecir la demanda diaria',                     module_code: 'dashboard',   module_name: 'Inicio',         category: 'ai',       is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '8',  key: 'dashboard.predictive-alerts',      label: 'Alertas predictivas de operación',     description: 'IA para alertar sobre potenciales problemas',             module_code: 'dashboard',   module_name: 'Inicio',         category: 'ai',       is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '9',  key: 'dashboard.smart-day-summary',      label: 'Resumen inteligente del día',          description: 'IA para generar resumen del día',                         module_code: 'dashboard',   module_name: 'Inicio',         category: 'ai',       is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    // Orders
    { id: '10', key: 'orders.create',                    label: 'Crear pedidos',                        description: 'Crear nuevos pedidos',                                    module_code: 'orders',      module_name: 'Pedidos',        category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '11', key: 'orders.edit',                      label: 'Editar pedidos',                       description: 'Editar pedidos existentes',                               module_code: 'orders',      module_name: 'Pedidos',        category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '12', key: 'orders.cancel',                    label: 'Cancelar pedidos',                     description: 'Cancelar pedidos en curso',                               module_code: 'orders',      module_name: 'Pedidos',        category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '13', key: 'orders.view-status',               label: 'Ver estados de la orden',              description: 'Consultar el estado actual de los pedidos',               module_code: 'orders',      module_name: 'Pedidos',        category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '14', key: 'orders.inventory-validation',      label: 'Validación de disponibilidad',         description: 'Validar disponibilidad de inventario al crear pedidos',   module_code: 'orders',      module_name: 'Pedidos',        category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '15', key: 'orders.priorities',                label: 'Manejo de prioridades',                description: 'Asignar y gestionar prioridades de pedidos',              module_code: 'orders',      module_name: 'Pedidos',        category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '16', key: 'orders.multi-warehouse',           label: 'Soporte multi-bodega',                 description: 'Gestionar pedidos desde múltiples bodegas',               module_code: 'orders',      module_name: 'Pedidos',        category: 'features', is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '17', key: 'orders.traceability',              label: 'Trazabilidad completa',                description: 'Trazabilidad completa del pedido',                        module_code: 'orders',      module_name: 'Pedidos',        category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '18', key: 'orders.priority-prediction',       label: 'Predicción de prioridad',              description: 'IA para predecir prioridades de pedidos',                 module_code: 'orders',      module_name: 'Pedidos',        category: 'ai',       is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '19', key: 'orders.delay-prediction',          label: 'Predicción de retrasos',               description: 'IA para predecir retrasos en los pedidos',                module_code: 'orders',      module_name: 'Pedidos',        category: 'ai',       is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '20', key: 'orders.optimal-warehouse',         label: 'Recomendación de bodega óptima',       description: 'IA para recomendar la bodega más eficiente',              module_code: 'orders',      module_name: 'Pedidos',        category: 'ai',       is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    // Inventories
    { id: '21', key: 'inventories.real-time-view',       label: 'Ver inventario en tiempo real',         description: 'Consultar inventario actual en tiempo real',              module_code: 'inventories', module_name: 'Inventarios',    category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '22', key: 'inventories.adjustments',          label: 'Ajustes de inventario',                description: 'Realizar ajustes de inventario',                          module_code: 'inventories', module_name: 'Inventarios',    category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '23', key: 'inventories.physical-counts',      label: 'Conteos físicos',                      description: 'Gestión de conteos físicos de inventario',                module_code: 'inventories', module_name: 'Inventarios',    category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '24', key: 'inventories.stockout-prediction',  label: 'Predicción de ruptura de stock',       description: 'IA para predecir ruptura de stock',                       module_code: 'inventories', module_name: 'Inventarios',    category: 'ai',       is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '25', key: 'inventories.abc-classification',   label: 'Clasificación ABC automática',         description: 'IA para clasificación ABC de productos',                  module_code: 'inventories', module_name: 'Inventarios',    category: 'ai',       is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    // Picking
    { id: '26', key: 'picking.create-tasks',             label: 'Crear tareas de picking',              description: 'Crear tareas de recolección',                             module_code: 'picking',     module_name: 'Picking',        category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '27', key: 'picking.assign-tasks',             label: 'Asignar tareas a operarios',           description: 'Asignar tareas de picking a operarios',                   module_code: 'picking',     module_name: 'Picking',        category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '28', key: 'picking.route-optimization',       label: 'Optimización de rutas de picking',     description: 'IA para optimizar las rutas de picking',                  module_code: 'picking',     module_name: 'Picking',        category: 'ai',       is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    // Analytics
    { id: '29', key: 'analytics.custom-dashboards',      label: 'Dashboards personalizados',            description: 'Crear dashboards personalizados',                         module_code: 'analytics',   module_name: 'Analítica',      category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '30', key: 'analytics.predefined-reports',     label: 'Reportes predefinidos',                description: 'Acceder a reportes predefinidos',                         module_code: 'analytics',   module_name: 'Analítica',      category: 'features', is_active: true,  created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '31', key: 'analytics.trend-detection',        label: 'Detección de tendencias',              description: 'IA para detectar tendencias en los datos',                module_code: 'analytics',   module_name: 'Analítica',      category: 'ai',       is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
    { id: '32', key: 'analytics.improvement-recommendations', label: 'Recomendaciones de mejora',       description: 'IA para sugerir mejoras operativas',                      module_code: 'analytics',   module_name: 'Analítica',      category: 'ai',       is_active: false, created_at: '2024-01-01', updated_at: '2024-01-01' },
];

@Component({
    selector: 'wa-admin-features-page',
    templateUrl: './features-page.component.html',
    styleUrls: ['../subscriptions/subscriptions-shared.css', './features-table.css', './features-page.component.css'],
})
export class FeaturesPageComponent {

    // ─── Active tab ────────────────────────────────────────────────────────────
    activeTab: 'modules' | 'features' = 'modules';

    // ═══════════════════════════════════════════════════════════════════════════
    // MODULES SECTION (card-based, like subscriptions)
    // ═══════════════════════════════════════════════════════════════════════════

    modules: FeatureModule[] = [...MOCK_MODULES];
    modulesLoading = false;

    showModuleModal = false;
    editingModule: FeatureModule | null = null;
    moduleSaving = false;
    moduleForm!: FormGroup;

    // ═══════════════════════════════════════════════════════════════════════════
    // FEATURES SECTION (table with pagination, like user management)
    // ═══════════════════════════════════════════════════════════════════════════

    readonly tableConfig: FeatureTableConfig = {
        columns: [
            { key: 'label',       label: 'admin.features.table.label',    filterable: true,  type: 'text',           width: '2fr' },
            { key: 'key',         label: 'admin.features.table.key',      filterable: true,  type: 'muted',          width: '1.5fr' },
            { key: 'module_name', label: 'admin.features.table.module',   filterable: true,  type: 'module-badge',   width: '1fr',
                filterType: 'select',
                filterOptions: [
                    { value: '', label: 'admin.features.filter.module.all' },
                    ...MOCK_MODULES.map(m => ({ value: m.code, label: m.name })),
                ],
            },
            { key: 'category',    label: 'admin.features.table.category', filterable: true,  type: 'category-badge', width: '0.9fr',
                filterType: 'select',
                filterOptions: [
                    { value: '',         label: 'admin.features.filter.category.all' },
                    { value: 'features', label: 'admin.features.filter.category.features' },
                    { value: 'ai',       label: 'admin.features.filter.category.ai' },
                ],
            },
            { key: 'status',      label: 'admin.features.table.status',   filterable: true,  type: 'status-badge',   width: '0.8fr',
                filterType: 'select',
                filterOptions: [
                    { value: '',         label: 'admin.features.filter.status.all' },
                    { value: 'active',   label: 'admin.features.filter.status.active' },
                    { value: 'inactive', label: 'admin.features.filter.status.inactive' },
                ],
            },
        ],
        editable: true,
        deletable: true,
    };

    readonly gridTemplate: string;

    allFeatures: Feature[] = [...MOCK_FEATURES];
    pagedFeatures: Feature[] = [];
    featuresTotal = 0;
    featuresTotalPages = 0;
    featuresLoading = false;

    readonly pageSize = 10;
    currentPage = 1;

    showFeatureModal = false;
    editingFeature: Feature | null = null;
    featureSaving = false;
    featureForm!: FormGroup;

    filterForm!: FormGroup;
    private filterSub?: Subscription;

    constructor(
        private fb: FormBuilder,
        private translate: TranslateService,
    ) {
        // Module form
        this.moduleForm = this.fb.group({
            code:        ['', [Validators.required, Validators.minLength(2)]],
            name:        ['', [Validators.required, Validators.minLength(2)]],
            description: ['', [Validators.required]],
            icon:        ['bx-cube', [Validators.required]],
        });

        // Feature form
        this.featureForm = this.fb.group({
            key:         ['', [Validators.required, Validators.minLength(3)]],
            label:       ['', [Validators.required, Validators.minLength(2)]],
            description: ['', [Validators.required]],
            module_code: ['', [Validators.required]],
            category:    ['features', [Validators.required]],
        });

        // Filter form
        const filterControls: Record<string, string> = {};
        this.tableConfig.columns
            .filter(c => c.filterable)
            .forEach(c => { filterControls[c.key] = ''; });
        this.filterForm = this.fb.group(filterControls);

        this.gridTemplate = this.buildGridTemplate();
    }

    ngOnInit(): void {
        this.filterSub = this.filterForm.valueChanges.pipe(
            debounceTime(400),
            startWith(this.filterForm.value),
        ).subscribe(() => {
            this.currentPage = 1;
            this.loadFeatures();
        });
    }

    ngOnDestroy(): void {
        this.filterSub?.unsubscribe();
    }

    // ─── Tab switching ─────────────────────────────────────────────────────────

    setTab(tab: 'modules' | 'features'): void {
        this.activeTab = tab;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MODULES — Card list (subscriptions style)
    // ═══════════════════════════════════════════════════════════════════════════

    openCreateModule(): void {
        this.editingModule = null;
        this.moduleForm.reset({ icon: 'bx-cube' });
        this.showModuleModal = true;
    }

    openEditModule(mod: FeatureModule): void {
        this.editingModule = mod;
        this.moduleForm.patchValue({ code: mod.code, name: mod.name, description: mod.description, icon: mod.icon });
        this.showModuleModal = true;
    }

    closeModuleModal(): void {
        this.showModuleModal = false;
        this.editingModule = null;
    }

    toggleModuleActive(mod: FeatureModule): void {
        mod.is_active = !mod.is_active;
    }

    confirmDeleteModule(mod: FeatureModule): void {
        this.modules = this.modules.filter(m => m.id !== mod.id);
        this.allFeatures = this.allFeatures.filter(f => f.module_code !== mod.code);
        this.loadFeatures();
    }

    saveModule(): void {
        if (this.moduleForm.invalid) { this.moduleForm.markAllAsTouched(); return; }
        this.moduleSaving = true;
        const value = this.moduleForm.getRawValue();
        setTimeout(() => {
            if (this.editingModule) {
                const idx = this.modules.findIndex(m => m.id === this.editingModule!.id);
                if (idx !== -1) {
                    this.modules[idx] = { ...this.modules[idx], ...value, updated_at: new Date().toISOString() };
                }
            } else {
                this.modules.push({
                    id: Date.now().toString(), ...value,
                    is_active: true, features_count: 0,
                    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                });
            }
            this.moduleSaving = false;
            this.closeModuleModal();
        }, 400);
    }

    isModuleInvalid(field: string): boolean {
        return isFieldInvalid(this.moduleForm, field);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // FEATURES — Table with pagination (user management style)
    // ═══════════════════════════════════════════════════════════════════════════

    loadFeatures(): void {
        this.featuresLoading = true;
        const v = this.filterForm.value as Record<string, string>;

        setTimeout(() => {
            let filtered = [...this.allFeatures];

            if (v['label'])       filtered = filtered.filter(f => f.label.toLowerCase().includes(v['label'].toLowerCase()));
            if (v['key'])         filtered = filtered.filter(f => f.key.toLowerCase().includes(v['key'].toLowerCase()));
            if (v['module_name']) filtered = filtered.filter(f => f.module_code === v['module_name']);
            if (v['category'])    filtered = filtered.filter(f => f.category === v['category']);
            if (v['status'])      filtered = filtered.filter(f => v['status'] === 'active' ? f.is_active : !f.is_active);

            this.featuresTotal = filtered.length;
            this.featuresTotalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
            if (this.currentPage > this.featuresTotalPages) this.currentPage = this.featuresTotalPages;

            const start = (this.currentPage - 1) * this.pageSize;
            this.pagedFeatures = filtered.slice(start, start + this.pageSize);
            this.featuresLoading = false;
        }, 200);
    }

    onPageChange(page: number): void {
        if (page < 1 || page > this.featuresTotalPages) return;
        this.currentPage = page;
        this.loadFeatures();
    }

    // Filters

    clearFilters(): void { this.filterForm.reset(); }

    clearFilter(key: string): void { this.filterForm.get(key)?.setValue(''); }

    get hasActiveFilters(): boolean {
        return Object.values(this.filterForm.value as Record<string, string>)
            .some(v => !!v && v.trim() !== '');
    }

    // Feature CRUD

    openCreateFeature(): void {
        this.editingFeature = null;
        this.featureForm.reset({ category: 'features', module_code: '' });
        this.showFeatureModal = true;
    }

    openEditFeature(feat: Feature): void {
        this.editingFeature = feat;
        this.featureForm.patchValue({
            key: feat.key, label: feat.label, description: feat.description,
            module_code: feat.module_code, category: feat.category,
        });
        this.showFeatureModal = true;
    }

    closeFeatureModal(): void {
        this.showFeatureModal = false;
        this.editingFeature = null;
    }

    toggleFeatureActive(feat: Feature): void {
        const idx = this.allFeatures.findIndex(f => f.id === feat.id);
        if (idx !== -1) this.allFeatures[idx].is_active = !this.allFeatures[idx].is_active;
        this.loadFeatures();
    }

    saveFeature(): void {
        if (this.featureForm.invalid) { this.featureForm.markAllAsTouched(); return; }
        this.featureSaving = true;
        const value = this.featureForm.getRawValue();
        const mod = this.modules.find(m => m.code === value.module_code);

        setTimeout(() => {
            if (this.editingFeature) {
                const idx = this.allFeatures.findIndex(f => f.id === this.editingFeature!.id);
                if (idx !== -1) {
                    this.allFeatures[idx] = {
                        ...this.allFeatures[idx], ...value,
                        module_name: mod?.name ?? value.module_code,
                        updated_at: new Date().toISOString(),
                    };
                }
            } else {
                this.allFeatures.push({
                    id: Date.now().toString(), ...value,
                    module_name: mod?.name ?? value.module_code,
                    is_active: true,
                    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
                });
            }
            this.featureSaving = false;
            this.closeFeatureModal();
            this.loadFeatures();
        }, 400);
    }

    isFeatureInvalid(field: string): boolean {
        return isFieldInvalid(this.featureForm, field);
    }

    // ─── Display helpers ───────────────────────────────────────────────────────

    getCellValue(feat: Feature, key: string): any {
        return (feat as any)[key] ?? '';
    }

    getCategoryClass(category: string): string {
        return category === 'ai' ? 'cat-ai' : 'cat-features';
    }

    private buildGridTemplate(): string {
        const widths = this.tableConfig.columns.map(c => c.width ?? '1fr');
        if (this.tableConfig.editable || this.tableConfig.deletable) widths.push('90px');
        return widths.join(' ');
    }
}
