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
 * Manages platform-admin roles and their permissions.
 * Implements PermissionsDataSource for use in PermissionsManagerComponent.
 */
@Injectable({ providedIn: 'root' })
export class RoleService implements PermissionsDataSource {

    private readonly base = `${environment.apiUrl}/platform-admin/roles/`;

    constructor(private http: HttpClient) {}

    getModules(): Observable<PlatformModule[]> {
        return this.http.get<PlatformModule[]>(`${environment.apiUrl}/platform-admin/modules/`);
    }

    getRoles(): Observable<RoleWithPermissions[]> {
        return this.http.get<RoleWithPermissions[]>(this.base);
    }

    getFeaturesCatalog(): Observable<FeatureCatalogItem[]> {
        return this.http.get<FeatureCatalogItem[]>(`${this.base}features/`);
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

    /**
     * For generic roles uses the /access/ endpoint;
     * for editable roles patches is_active directly.
     */
    toggleRoleActive(id: string, isActive: boolean, isGeneric: boolean): Observable<RoleSummary> {
        if (isGeneric) {
            return this.http.patch<RoleSummary>(`${this.base}${id}/access/`, { is_active: isActive });
        }
        return this.http.patch<RoleSummary>(`${this.base}${id}/`, { is_active: isActive });
    }
}
