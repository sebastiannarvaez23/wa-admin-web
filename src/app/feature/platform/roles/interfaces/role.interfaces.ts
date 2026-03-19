import { Observable } from 'rxjs';
import { PlatformModule } from '../../modules/interfaces/module.interfaces';

// ── Role models ───────────────────────────────────────────────────────────────

/** Role summary without permission details (list views). */
export interface RoleSummary {
    id:          string;
    name:        string;
    description?: string;
    is_active?:  boolean;
    is_generic?: boolean;
    is_editable?: boolean;
}

/** Role with full permission details (permissions panel). */
export interface RoleWithPermissions extends RoleSummary {
    features: string[];
    modules:  string[];
}

export interface CreateRolePayload {
    name:         string;
    description?: string;
}

export interface UpdateRolePayload {
    name?:        string;
    description?: string;
    is_active?:   boolean;
}

// ── Feature catalog ───────────────────────────────────────────────────────────

export interface FeatureCatalogItem {
    key:      string;
    module:   string;
    label:    string;
    category: string;
}

// ── Permissions data source (ISP — injected into PermissionsManagerComponent) ──

export interface PermissionsDataSource {
    getModules(): Observable<PlatformModule[]>;
    getRoles(): Observable<RoleWithPermissions[]>;
    getFeaturesCatalog(): Observable<FeatureCatalogItem[]>;
    createRole(payload: CreateRolePayload): Observable<RoleSummary>;
    updateRole(id: string, payload: UpdateRolePayload): Observable<RoleSummary>;
    updateRoleFeatures(id: string, featureKeys: string[], moduleCodes: string[]): Observable<RoleWithPermissions>;
    toggleRoleActive(id: string, isActive: boolean, isGeneric: boolean): Observable<RoleSummary>;
}
