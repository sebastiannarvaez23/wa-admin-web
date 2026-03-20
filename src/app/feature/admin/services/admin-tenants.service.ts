import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SessionService } from 'wa-components-web';
import { environment } from 'src/environments/environment';
import {
    CreateTenantPayload,
    PaginatedTenantsResponse,
    PaginatedTenantUsersResponse,
    Tenant,
    TenantRole,
    TenantsFilterParams,
    TenantUsersFilterParams,
    UpdateTenantPayload,
} from '../interfaces/admin-tenants.interfaces';
import {
    AdminModule,
    AdminUserRol,
    CreateRolePayload,
    FeatureCatalogItem,
    UpdateRolePayload,
} from '../interfaces/admin-users.interfaces';

@Injectable({ providedIn: 'root' })
export class AdminTenantsService {

    private readonly base = `${environment.apiUrl}/companies/`;

    constructor(private http: HttpClient, private session: SessionService) {}

    private get headers() {
        return { Authorization: `AdminToken ${this.session.token}` };
    }

    // ── Companies ─────────────────────────────────────────────────────────────

    getTenants(page = 0, pageSize = 10, filters: TenantsFilterParams = {}): Observable<PaginatedTenantsResponse> {
        const params: Record<string, string> = {
            page:      String(page),
            page_size: String(pageSize),
        };
        if (filters.name)   params['name']   = filters.name;
        if (filters.nit)    params['nit']    = filters.nit;
        if (filters.city)   params['city']   = filters.city;
        if (filters.status) params['status'] = filters.status;

        return this.http.get<PaginatedTenantsResponse>(this.base, { headers: this.headers, params });
    }

    createTenant(payload: CreateTenantPayload): Observable<Tenant> {
        return this.http.post<Tenant>(this.base, payload, { headers: this.headers });
    }

    updateTenant(id: string, payload: UpdateTenantPayload): Observable<Tenant> {
        return this.http.patch<Tenant>(`${this.base}${id}/`, payload, { headers: this.headers });
    }

    toggleTenant(id: string): Observable<Tenant> {
        return this.http.post<Tenant>(`${this.base}${id}/toggle-active/`, {}, { headers: this.headers });
    }

    // ── Company Users ─────────────────────────────────────────────────────────

    getTenantUsers(page = 0, pageSize = 10, filters: TenantUsersFilterParams = {}): Observable<PaginatedTenantUsersResponse> {
        const params: Record<string, string> = {
            page:      String(page),
            page_size: String(pageSize),
        };
        if (filters.name)    params['name']    = filters.name;
        if (filters.email)   params['email']   = filters.email;
        if (filters.company) params['company'] = filters.company;
        if (filters.status)  params['status']  = filters.status;

        return this.http.get<PaginatedTenantUsersResponse>(
            `${this.base}users/`,
            { headers: this.headers, params },
        );
    }

    toggleTenantUserActive(id: string): Observable<any> {
        return this.http.post(`${this.base}users/${id}/toggle-active/`, {}, { headers: this.headers });
    }

    // ── Generic company roles ─────────────────────────────────────────────────

    getModules(): Observable<AdminModule[]> {
        return this.http.get<AdminModule[]>(
            `${environment.apiUrl}/platform/modules/`,
            { headers: this.headers },
        );
    }

    getRoles(): Observable<AdminUserRol[]> {
        return this.http.get<AdminUserRol[]>(
            `${environment.apiUrl}/company-roles/generic/`,
            { headers: this.headers },
        );
    }

    getFeaturesCatalog(): Observable<FeatureCatalogItem[]> {
        return this.http.get<FeatureCatalogItem[]>(
            `${environment.apiUrl}/company-roles/features/`,
            { headers: this.headers },
        );
    }

    createRole(payload: CreateRolePayload): Observable<AdminUserRol> {
        return this.http.post<AdminUserRol>(
            `${environment.apiUrl}/company-roles/generic/`,
            payload,
            { headers: this.headers },
        );
    }

    updateRole(id: string, payload: UpdateRolePayload): Observable<AdminUserRol> {
        return this.http.patch<AdminUserRol>(
            `${environment.apiUrl}/company-roles/generic/${id}/`,
            payload,
            { headers: this.headers },
        );
    }

    updateRoleFeatures(id: string, featureKeys: string[], moduleCodes: string[]): Observable<AdminUserRol> {
        return this.http.put<AdminUserRol>(
            `${environment.apiUrl}/company-roles/generic/${id}/features/`,
            { feature_keys: featureKeys, module_codes: moduleCodes },
            { headers: this.headers },
        );
    }

    toggleCompanyAccess(id: string, is_active: boolean): Observable<AdminUserRol> {
        return this.http.patch<AdminUserRol>(
            `${environment.apiUrl}/company-roles/generic/${id}/`,
            { is_active },
            { headers: this.headers },
        );
    }
}
