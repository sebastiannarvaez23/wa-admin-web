import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SessionService } from 'wa-components-web';
import { environment } from 'src/environments/environment';
import {
    AdminModule,
    AdminUser,
    AdminUserRol,
    CreateRolePayload,
    CreateUserPayload,
    FeatureCatalogItem,
    PaginatedUsersResponse,
    UpdateRolePayload,
    UpdateUserPayload,
    UsersFilterParams,
} from '../interfaces/admin-users.interfaces';

@Injectable({ providedIn: 'root' })
export class AdminUserManagementService {

    constructor(private http: HttpClient, private session: SessionService) {}

    private get base(): string {
        return `${environment.apiUrl}/platform/users/`;
    }

    private get headers() {
        return { Authorization: `Token ${this.session.token}` };
    }

    // ── Modules ──────────────────────────────────────────────────────────────

    getModules(): Observable<AdminModule[]> {
        return this.http.get<AdminModule[]>(
            `${environment.apiUrl}/platform/modules/`,
            { headers: this.headers },
        );
    }

    // ── Roles ────────────────────────────────────────────────────────────────

    getRoles(): Observable<AdminUserRol[]> {
        return this.http.get<AdminUserRol[]>(
            `${environment.apiUrl}/platform/roles/`,
            { headers: this.headers },
        );
    }

    getFeaturesCatalog(): Observable<FeatureCatalogItem[]> {
        return this.http.get<FeatureCatalogItem[]>(
            `${environment.apiUrl}/platform-admin/roles/features/`,
            { headers: this.headers },
        );
    }

    createRole(payload: CreateRolePayload): Observable<AdminUserRol> {
        return this.http.post<AdminUserRol>(
            `${environment.apiUrl}/platform/roles/`,
            payload,
            { headers: this.headers },
        );
    }

    updateRole(id: string, payload: UpdateRolePayload): Observable<AdminUserRol> {
        return this.http.patch<AdminUserRol>(
            `${environment.apiUrl}/platform/roles/${id}/`,
            payload,
            { headers: this.headers },
        );
    }

    updateRoleFeatures(id: string, featureKeys: string[], moduleCodes: string[]): Observable<AdminUserRol> {
        return this.http.put<AdminUserRol>(
            `${environment.apiUrl}/platform/roles/${id}/features/`,
            { feature_keys: featureKeys, module_codes: moduleCodes },
            { headers: this.headers },
        );
    }

    toggleCompanyAccess(id: string, is_active: boolean): Observable<AdminUserRol> {
        return this.http.patch<AdminUserRol>(
            `${environment.apiUrl}/platform/roles/${id}/access/`,
            { is_active },
            { headers: this.headers },
        );
    }

    // ── Users ────────────────────────────────────────────────────────────────

    getUsers(page = 0, pageSize = 10, filters: UsersFilterParams = {}): Observable<PaginatedUsersResponse> {
        const params: Record<string, string> = {
            page:      String(page),
            page_size: String(pageSize),
        };
        if (filters.name)     params['name']     = filters.name;
        if (filters.email)    params['email']    = filters.email;
        if (filters.username) params['username'] = filters.username;
        if (filters.role)     params['role']     = filters.role;
        if (filters.status)   params['status']   = filters.status;

        return this.http.get<PaginatedUsersResponse>(this.base, { headers: this.headers, params });
    }

    createUser(payload: CreateUserPayload): Observable<AdminUser> {
        return this.http.post<AdminUser>(this.base, payload, { headers: this.headers });
    }

    updateUser(id: string, payload: UpdateUserPayload): Observable<AdminUser> {
        return this.http.patch<AdminUser>(`${this.base}${id}/`, payload, { headers: this.headers });
    }

    toggleActive(id: string): Observable<AdminUser> {
        return this.http.post<AdminUser>(`${this.base}${id}/toggle-active/`, {}, { headers: this.headers });
    }
}
