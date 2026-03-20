import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import { PlatformModule } from '../../modules/interfaces/module.interfaces';
import {
    CreateRolePayload,
    FeatureCatalogItem,
    PermissionsDataSource,
    RoleSummary,
    RoleWithPermissions,
    UpdateRolePayload,
} from '../interfaces/role.interfaces';

/**
 * Manages generic company roles and their permissions.
 * Implements PermissionsDataSource for use in PermissionsManagerComponent.
 */
@Injectable({ providedIn: 'root' })
export class TenantRoleService implements PermissionsDataSource {

    private readonly base = `${environment.apiUrl}/company-roles/generic/`;

    constructor(private http: HttpClient) {}

    getModules(): Observable<PlatformModule[]> {
        return this.http.get<PlatformModule[]>(`${environment.apiUrl}/platform/modules/`);
    }

    getRoles(): Observable<RoleWithPermissions[]> {
        return this.http.get<RoleWithPermissions[]>(this.base);
    }

    getFeaturesCatalog(): Observable<FeatureCatalogItem[]> {
        return this.http.get<FeatureCatalogItem[]>(`${environment.apiUrl}/company-roles/features/`);
    }

    createRole(payload: CreateRolePayload): Observable<RoleSummary> {
        return this.http.post<RoleSummary>(this.base, payload);
    }

    updateRole(id: string, payload: UpdateRolePayload): Observable<RoleSummary> {
        return this.http.patch<RoleSummary>(`${this.base}${id}/`, payload);
    }

    updateRoleFeatures(id: string, featureKeys: string[], moduleCodes: string[]): Observable<RoleWithPermissions> {
        return this.http.put<RoleWithPermissions>(
            `${this.base}${id}/features/`,
            { feature_keys: featureKeys, module_codes: moduleCodes },
        );
    }

    /** Tenant roles always update is_active via the main endpoint. */
    toggleRoleActive(id: string, isActive: boolean, _isGeneric: boolean): Observable<RoleSummary> {
        return this.http.patch<RoleSummary>(`${this.base}${id}/`, { is_active: isActive });
    }
}
