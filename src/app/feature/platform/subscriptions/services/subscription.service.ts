import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import { ModuleLimit, Subscription, SubscriptionLimitValue, SubscriptionModule } from '../interfaces/subscription.interfaces';
import { SubscriptionLimitApiItem } from '../interfaces/subscription-limit.interfaces';

interface SubscriptionApiResponse {
    id:               string;
    code:             string;
    name:             string;
    description:      string;
    price:            string;
    logo:             string;
    is_active:        boolean;
    enabled_modules:  string[];
    enabled_features: string[];
    created_at:       string;
    updated_at:       string;
}

// ── Modules catalog (shared with wa-client-web) ───────────────────────────────

interface CatalogEntry {
    code: string;
    name: string;
    description: string;
    icon: string;
    features: { key: string; label: string; category: string }[];
}

const MODULES_CATALOG: CatalogEntry[] = [
    {
        code: 'dashboard', name: 'Inicio', description: 'Visualización general del estado del almacén', icon: 'bx-home',
        features: [
            { key: 'view-summary', label: 'Ver resumen general de operaciones', category: 'features' },
            { key: 'configurable-widgets', label: 'Widgets configurables', category: 'features' },
            { key: 'real-time-metrics', label: 'Métricas en tiempo real', category: 'features' },
            { key: 'alerts-notifications', label: 'Alertas y notificaciones', category: 'features' },
            { key: 'quick-access', label: 'Acceso rápido a módulos', category: 'features' },
            { key: 'kpis', label: 'Indicadores de rendimiento (KPIs)', category: 'features' },
            { key: 'daily-demand-prediction', label: 'Predicción de demanda diaria', category: 'ai' },
            { key: 'predictive-alerts', label: 'Alertas predictivas de operación', category: 'ai' },
            { key: 'smart-day-summary', label: 'Resumen inteligente del día', category: 'ai' },
        ],
    },
    {
        code: 'orders', name: 'Pedidos', description: 'Gestión de pedidos de clientes', icon: 'bx-cart',
        features: [
            { key: 'create', label: 'Crear pedidos', category: 'features' },
            { key: 'edit', label: 'Editar pedidos', category: 'features' },
            { key: 'cancel', label: 'Cancelar pedidos', category: 'features' },
            { key: 'view-status', label: 'Ver estados de la orden', category: 'features' },
            { key: 'inventory-validation', label: 'Validación de disponibilidad', category: 'features' },
            { key: 'priorities', label: 'Manejo de prioridades', category: 'features' },
            { key: 'multi-warehouse', label: 'Soporte multi-bodega', category: 'features' },
            { key: 'traceability', label: 'Trazabilidad completa', category: 'features' },
            { key: 'priority-prediction', label: 'Predicción de prioridad', category: 'ai' },
            { key: 'delay-prediction', label: 'Predicción de retrasos', category: 'ai' },
            { key: 'optimal-warehouse', label: 'Recomendación de bodega óptima', category: 'ai' },
        ],
    },
    {
        code: 'reception', name: 'Recepción', description: 'Recepción y verificación de mercancía entrante', icon: 'bx-import',
        features: [
            { key: 'create', label: 'Crear recepciones', category: 'features' },
            { key: 'edit', label: 'Editar recepciones', category: 'features' },
            { key: 'quality-control', label: 'Control de calidad en recepción', category: 'features' },
            { key: 'blind-count', label: 'Conteo ciego', category: 'features' },
            { key: 'location-assignment', label: 'Asignación de ubicaciones', category: 'features' },
            { key: 'lot-series-traceability', label: 'Trazabilidad de lotes y series', category: 'features' },
            { key: 'auto-location-suggestion', label: 'Sugerencia automática de ubicación', category: 'ai' },
            { key: 'anomaly-detection', label: 'Detección de anomalías', category: 'ai' },
        ],
    },
    {
        code: 'location', name: 'Almacenes', description: 'Gestión de almacenes y ubicaciones', icon: 'bx-map',
        features: [
            { key: 'create', label: 'Crear ubicaciones', category: 'features' },
            { key: 'edit', label: 'Editar ubicaciones', category: 'features' },
            { key: 'zone-management', label: 'Gestión de zonas y pasillos', category: 'features' },
            { key: 'warehouse-map', label: 'Mapa visual de bodega', category: 'features' },
            { key: 'inventory-relocation', label: 'Reubicación de inventario', category: 'features' },
            { key: 'multi-warehouse', label: 'Multi-bodega', category: 'features' },
            { key: 'optimal-slotting', label: 'Recomendación de slotting óptimo', category: 'ai' },
            { key: 'occupancy-prediction', label: 'Predicción de ocupación', category: 'ai' },
        ],
    },
    {
        code: 'inventories', name: 'Inventarios', description: 'Control y seguimiento del inventario', icon: 'bx-box',
        features: [
            { key: 'real-time-view', label: 'Ver inventario en tiempo real', category: 'features' },
            { key: 'adjustments', label: 'Ajustes de inventario', category: 'features' },
            { key: 'physical-counts', label: 'Conteos físicos', category: 'features' },
            { key: 'lot-expiry-control', label: 'Control por lotes y vencimiento', category: 'features' },
            { key: 'warehouse-transfers', label: 'Transferencias entre bodegas', category: 'features' },
            { key: 'movement-history', label: 'Historial de movimientos', category: 'features' },
            { key: 'kardex', label: 'Kardex por producto', category: 'features' },
            { key: 'stockout-prediction', label: 'Predicción de ruptura de stock', category: 'ai' },
            { key: 'abc-classification', label: 'Clasificación ABC automática', category: 'ai' },
            { key: 'demand-prediction', label: 'Predicción de demanda por SKU', category: 'ai' },
        ],
    },
    {
        code: 'picking', name: 'Picking', description: 'Proceso de recolección de productos', icon: 'bx-select-multiple',
        features: [
            { key: 'create-tasks', label: 'Crear tareas de picking', category: 'features' },
            { key: 'assign-tasks', label: 'Asignar tareas a operarios', category: 'features' },
            { key: 'batch-picking', label: 'Picking por lote', category: 'features' },
            { key: 'wave-picking', label: 'Picking por ola', category: 'features' },
            { key: 'picking-rules', label: 'Reglas de picking (FIFO, FEFO, LIFO)', category: 'features' },
            { key: 'traceability', label: 'Trazabilidad de picking', category: 'features' },
            { key: 'route-optimization', label: 'Optimización de rutas de picking', category: 'ai' },
            { key: 'order-grouping', label: 'Agrupación inteligente de órdenes', category: 'ai' },
            { key: 'auto-assignment', label: 'Asignación automática de operarios', category: 'ai' },
        ],
    },
    {
        code: 'packing', name: 'Empaque', description: 'Preparación y empaque de pedidos', icon: 'bx-package',
        features: [
            { key: 'create-tasks', label: 'Crear tareas de empaque', category: 'features' },
            { key: 'product-verification', label: 'Verificación de productos', category: 'features' },
            { key: 'dimensions-weight', label: 'Cálculo de dimensiones y peso', category: 'features' },
            { key: 'label-generation', label: 'Generación de etiquetas', category: 'features' },
            { key: 'quality-control', label: 'Control de calidad en empaque', category: 'features' },
            { key: 'optimal-package-recommendation', label: 'Recomendación de empaque óptimo', category: 'ai' },
            { key: 'time-prediction', label: 'Predicción de tiempo de empaque', category: 'ai' },
        ],
    },
    {
        code: 'dispatches', name: 'Despachos', description: 'Coordinación de despachos y salidas', icon: 'bx-export',
        features: [
            { key: 'create', label: 'Crear despachos', category: 'features' },
            { key: 'edit', label: 'Editar despachos', category: 'features' },
            { key: 'carrier-assignment', label: 'Asignación de transportadora', category: 'features' },
            { key: 'dispatch-guide', label: 'Generación de guía de despacho', category: 'features' },
            { key: 'traceability', label: 'Trazabilidad de despacho', category: 'features' },
            { key: 'route-optimization', label: 'Optimización de rutas', category: 'ai' },
            { key: 'delivery-time-prediction', label: 'Predicción de tiempos de entrega', category: 'ai' },
        ],
    },
    {
        code: 'shipping', name: 'Envíos', description: 'Gestión de envíos y seguimiento', icon: 'bx-send',
        features: [
            { key: 'carrier-management', label: 'Gestión de transportadoras', category: 'features' },
            { key: 'tracking', label: 'Seguimiento de envíos', category: 'features' },
            { key: 'customer-notifications', label: 'Notificaciones al cliente', category: 'features' },
            { key: 'label-generation', label: 'Generación de etiquetas de envío', category: 'features' },
            { key: 'multi-carrier', label: 'Multi-transportadora', category: 'features' },
            { key: 'optimal-carrier-selection', label: 'Selección automática de transportadora', category: 'ai' },
            { key: 'cost-optimization', label: 'Optimización de costos de envío', category: 'ai' },
        ],
    },
    {
        code: 'third_parties', name: 'Terceros', description: 'Administración de clientes, proveedores y transportistas', icon: 'bx-group',
        features: [
            { key: 'client-management', label: 'Gestión de clientes', category: 'features' },
            { key: 'supplier-management', label: 'Gestión de proveedores', category: 'features' },
            { key: 'contact-info', label: 'Información de contacto', category: 'features' },
            { key: 'credit-control', label: 'Control de crédito', category: 'features' },
            { key: 'classification', label: 'Clasificación de terceros', category: 'features' },
            { key: 'credit-risk-classification', label: 'Clasificación automática de riesgo', category: 'ai' },
        ],
    },
    {
        code: 'users_roles', name: 'Usuarios y Roles', description: 'Gestión de usuarios y asignación de roles', icon: 'bx-user-check',
        features: [
            { key: 'create-users', label: 'Crear usuarios', category: 'features' },
            { key: 'edit-users', label: 'Editar usuarios', category: 'features' },
            { key: 'create-roles', label: 'Crear roles', category: 'features' },
            { key: 'module-permissions', label: 'Gestión de permisos por módulo', category: 'features' },
            { key: 'feature-permissions', label: 'Gestión de permisos por funcionalidad', category: 'features' },
            { key: 'access-history', label: 'Historial de accesos', category: 'features' },
        ],
    },
    {
        code: 'tasks', name: 'Tareas', description: 'Administración de tareas operativas', icon: 'bx-task',
        features: [
            { key: 'create', label: 'Crear tareas', category: 'features' },
            { key: 'assign', label: 'Asignar tareas a usuarios', category: 'features' },
            { key: 'status-tracking', label: 'Seguimiento de estado', category: 'features' },
            { key: 'deadlines', label: 'Fechas límite', category: 'features' },
            { key: 'recurring-tasks', label: 'Tareas recurrentes', category: 'features' },
            { key: 'auto-prioritization', label: 'Priorización automática', category: 'ai' },
            { key: 'smart-assignment', label: 'Asignación inteligente', category: 'ai' },
        ],
    },
    {
        code: 'integrations', name: 'Integraciones', description: 'Conexión con sistemas externos', icon: 'bx-plug',
        features: [
            { key: 'erp-integration', label: 'Integración con ERP', category: 'features' },
            { key: 'ecommerce-integration', label: 'Integración con e-commerce', category: 'features' },
            { key: 'webhooks', label: 'Webhooks de entrada y salida', category: 'features' },
            { key: 'rest-api', label: 'API REST', category: 'features' },
            { key: 'import-export', label: 'Importación/Exportación', category: 'features' },
            { key: 'integration-logs', label: 'Logs de integración', category: 'features' },
        ],
    },
    {
        code: 'automation', name: 'Automatización', description: 'Reglas y flujos de trabajo automáticos', icon: 'bx-bot',
        features: [
            { key: 'create-rules', label: 'Crear reglas de automatización', category: 'features' },
            { key: 'event-triggers', label: 'Triggers por evento', category: 'features' },
            { key: 'cron-triggers', label: 'Triggers por tiempo (cron)', category: 'features' },
            { key: 'chained-actions', label: 'Acciones encadenadas', category: 'features' },
            { key: 'execution-history', label: 'Historial de ejecuciones', category: 'features' },
            { key: 'rule-suggestion', label: 'Sugerencia de reglas', category: 'ai' },
            { key: 'workflow-optimization', label: 'Optimización de flujos', category: 'ai' },
        ],
    },
    {
        code: 'analytics', name: 'Analítica', description: 'Reportes e indicadores de desempeño', icon: 'bx-bar-chart-alt-2',
        features: [
            { key: 'custom-dashboards', label: 'Dashboards personalizados', category: 'features' },
            { key: 'predefined-reports', label: 'Reportes predefinidos', category: 'features' },
            { key: 'export-reports', label: 'Exportación de reportes', category: 'features' },
            { key: 'operational-kpis', label: 'KPIs operativos', category: 'features' },
            { key: 'operator-productivity', label: 'Productividad por operario', category: 'features' },
            { key: 'demand-predictive-analysis', label: 'Análisis predictivo de demanda', category: 'ai' },
            { key: 'trend-detection', label: 'Detección de tendencias', category: 'ai' },
            { key: 'improvement-recommendations', label: 'Recomendaciones de mejora', category: 'ai' },
        ],
    },
    {
        code: 'audit', name: 'Auditoría', description: 'Registro y trazabilidad de operaciones', icon: 'bx-search-alt',
        features: [
            { key: 'event-logging', label: 'Registro de eventos del sistema', category: 'features' },
            { key: 'advanced-filters', label: 'Filtros avanzados', category: 'features' },
            { key: 'log-export', label: 'Exportación de logs', category: 'features' },
            { key: 'critical-alerts', label: 'Alertas por eventos críticos', category: 'features' },
            { key: 'user-traceability', label: 'Trazabilidad de usuarios', category: 'features' },
            { key: 'audit-reports', label: 'Reportes de auditoría', category: 'features' },
        ],
    },
    {
        code: 'settings', name: 'Configuración', description: 'Configuración general del sistema', icon: 'bx-cog',
        features: [
            { key: 'company-config', label: 'Configuración de la empresa', category: 'features' },
            { key: 'warehouse-management', label: 'Gestión de bodegas', category: 'features' },
            { key: 'notifications-config', label: 'Configuración de notificaciones', category: 'features' },
            { key: 'document-templates', label: 'Gestión de plantillas', category: 'features' },
            { key: 'security-params', label: 'Parámetros de seguridad', category: 'features' },
            { key: 'subscription-billing', label: 'Gestión de suscripción y facturación', category: 'features' },
        ],
    },
];

// ── Module builder utility ────────────────────────────────────────────────────

export function buildModules(enabledModules: string[], enabledFeatures: string[]): SubscriptionModule[] {
    const modSet = new Set(enabledModules);
    const featSet = new Set(enabledFeatures);
    return MODULES_CATALOG.map(m => ({
        code:        m.code,
        name:        m.name,
        description: m.description,
        icon:        m.icon,
        hasAccess:   modSet.has(m.code),
        features:    m.features.map(f => ({
            key:      `${m.code}.${f.key}`,
            label:    f.label,
            enabled:  featSet.has(`${m.code}.${f.key}`),
            category: f.category,
        })),
    }));
}

export function getTotalModulesCount(): number {
    return MODULES_CATALOG.length;
}

// ── Seed data (temporary until API endpoint is ready) ────────────────────────

const SEED_SUBSCRIPTIONS: Subscription[] = [
    {
        id: '1', code: 'FREE', name: 'Free',
        description: 'Plan gratuito con funcionalidades básicas',
        price: 0, logo: 'assets/subs/Shield Standard.png', is_active: true,
        modules: buildModules(
            ['dashboard', 'inventories', 'settings'],
            ['dashboard.view-summary', 'dashboard.alerts-notifications', 'inventories.real-time-view', 'inventories.adjustments', 'settings.company-config'],
        ),
        created_at: '2024-01-01', updated_at: '2024-01-01',
    },
    {
        id: '2', code: 'BASIC', name: 'Básico',
        description: 'Plan básico para pequeñas empresas',
        price: 29.99, logo: 'assets/subs/Shield Basic.png', is_active: true,
        modules: buildModules(
            ['dashboard', 'orders', 'reception', 'inventories', 'picking', 'dispatches', 'third_parties', 'settings'],
            ['dashboard.view-summary', 'dashboard.real-time-metrics', 'dashboard.alerts-notifications', 'dashboard.kpis',
             'orders.create', 'orders.edit', 'orders.view-status', 'orders.inventory-validation',
             'reception.create', 'reception.edit', 'reception.quality-control',
             'inventories.real-time-view', 'inventories.adjustments', 'inventories.physical-counts', 'inventories.movement-history',
             'picking.create-tasks', 'picking.assign-tasks', 'picking.traceability',
             'dispatches.create', 'dispatches.edit', 'dispatches.carrier-assignment',
             'third_parties.client-management', 'third_parties.supplier-management', 'third_parties.contact-info',
             'settings.company-config', 'settings.warehouse-management', 'settings.notifications-config'],
        ),
        created_at: '2024-01-01', updated_at: '2024-01-01',
    },
    {
        id: '3', code: 'PRO', name: 'Profesional',
        description: 'Plan profesional con todas las funcionalidades',
        price: 79.99, logo: 'assets/subs/Shield Professional.png', is_active: true,
        modules: buildModules(
            MODULES_CATALOG.map(m => m.code),
            MODULES_CATALOG.flatMap(m => m.features.filter(f => f.category === 'features').map(f => `${m.code}.${f.key}`)),
        ),
        created_at: '2024-01-01', updated_at: '2024-01-01',
    },
    {
        id: '4', code: 'ENTERPRISE', name: 'Empresarial',
        description: 'Plan empresarial con soporte dedicado y personalización completa',
        price: 199.99, logo: 'assets/subs/Shield Enterprise.png', is_active: false,
        modules: buildModules(
            MODULES_CATALOG.map(m => m.code),
            MODULES_CATALOG.flatMap(m => m.features.map(f => `${m.code}.${f.key}`)),
        ),
        created_at: '2024-01-01', updated_at: '2024-01-01',
    },
];

export interface CreateSubscriptionPayload {
    code:        string;
    name:        string;
    description: string;
    price:       number;
}

export interface UpdateSubscriptionPayload {
    code?:          string;
    name?:          string;
    description?:   string;
    price?:         number;
    is_active?:     boolean;
    module_limits?: { module: string; limits: { key: string; value: number | null }[] }[];
}

// ── Limits catalog ────────────────────────────────────────────────────────────

export interface LimitDefinition {
    key: string;
}

const LIMITS_CATALOG: Record<string, LimitDefinition[]> = {
    dashboard:     [{ key: 'max_widgets' },          { key: 'max_kpi_cards' }],
    orders:        [{ key: 'max_orders_per_day' },   { key: 'max_items_per_order' },    { key: 'max_open_orders' }],
    reception:     [{ key: 'max_receptions_per_day' }, { key: 'max_items_per_reception' }],
    location:      [{ key: 'max_warehouses' },       { key: 'max_zones_per_warehouse' }, { key: 'max_locations' }],
    inventories:   [{ key: 'max_skus' },             { key: 'max_adjustments_per_day' }, { key: 'max_transfers_per_month' }],
    picking:       [{ key: 'max_tasks_per_user' },   { key: 'max_items_per_task' },     { key: 'max_concurrent_waves' }],
    packing:       [{ key: 'max_tasks_per_user' },   { key: 'max_items_per_task' }],
    dispatches:    [{ key: 'max_dispatches_per_day' }, { key: 'max_orders_per_dispatch' }],
    shipping:      [{ key: 'max_carriers' },         { key: 'max_active_shipments' }],
    third_parties: [{ key: 'max_clients' },          { key: 'max_suppliers' },          { key: 'max_carriers' }],
    users_roles:   [{ key: 'max_users' },            { key: 'max_roles' }],
    tasks:         [{ key: 'max_active_tasks' },     { key: 'max_tasks_per_user' },     { key: 'max_recurring_tasks' }],
    integrations:  [{ key: 'max_webhooks' },         { key: 'max_api_requests_per_day' }, { key: 'max_integrations' }],
    automation:    [{ key: 'max_rules' },            { key: 'max_executions_per_day' }, { key: 'max_chained_actions' }],
    analytics:     [{ key: 'max_dashboards' },       { key: 'max_exports_per_month' },  { key: 'max_data_retention_days' }],
    audit:         [{ key: 'max_log_retention_days' }, { key: 'max_exported_logs' }],
    settings:      [{ key: 'max_warehouses' },       { key: 'max_templates' }],
};

export function buildModuleLimits(
    modules: SubscriptionModule[],
    backendLimits: SubscriptionLimitApiItem[] = [],
): ModuleLimit[] {
    // Agrupa los topes del backend por módulo usando el campo functionality_module_code
    const limitsByModule = new Map<string, SubscriptionLimitValue[]>();
    for (const bl of backendLimits) {
        const code = bl.functionality_module_code;
        if (!limitsByModule.has(code)) { limitsByModule.set(code, []); }
        limitsByModule.get(code)!.push({
            key:             bl.functionality_key,
            value:           bl.max_value,
            id:              bl.id,
            functionalityId: bl.functionality_id,
            label:           bl.functionality_label,
            name:            bl.name,
        });
    }

    return modules
        .filter(m => m.hasAccess)
        .map(m => ({
            moduleCode: m.code,
            moduleName: m.name,
            moduleIcon: m.icon,
            limits: limitsByModule.get(m.code) ?? [],
        }));
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SubscriptionService {

    private readonly base = `${environment.apiUrl}/billing/subscriptions/`;

    constructor(private http: HttpClient) {}

    private mapResponse(item: SubscriptionApiResponse): Subscription {
        return {
            id:          item.id,
            code:        item.code,
            name:        item.name,
            description: item.description,
            price:       Number(item.price),
            logo:        item.logo,
            is_active:   item.is_active,
            modules:     buildModules(item.enabled_modules, item.enabled_features),
            created_at:  item.created_at,
            updated_at:  item.updated_at,
        };
    }

    getSubscriptions(): Observable<Subscription[]> {
        return this.http.get<SubscriptionApiResponse[]>(this.base).pipe(
            map(items => items.map(item => this.mapResponse(item))),
        );
    }

    createSubscription(payload: CreateSubscriptionPayload): Observable<Subscription> {
        return this.http.post<SubscriptionApiResponse>(this.base, payload).pipe(
            map(item => this.mapResponse(item)),
        );
    }

    updateSubscription(id: string, payload: UpdateSubscriptionPayload): Observable<Subscription> {
        return this.http.patch<SubscriptionApiResponse>(`${this.base}${id}/`, payload).pipe(
            map(item => this.mapResponse(item)),
        );
    }

    /** @deprecated Use getSubscriptions() instead. */
    getSeedSubscriptions(): Subscription[] {
        return [...SEED_SUBSCRIPTIONS];
    }
}
