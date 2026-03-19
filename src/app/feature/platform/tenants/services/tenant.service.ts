import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
    CreateTenantPayload,
    PaginatedTenantsResponse,
    Tenant,
    TenantsFilterParams,
    UpdateTenantPayload,
} from '../interfaces/tenant.interfaces';

@Injectable({ providedIn: 'root' })
export class TenantService {

    private readonly base = `${environment.apiUrl}/platform-admin/tenants/`;

    constructor(private http: HttpClient) {}

    getTenants(page = 0, pageSize = 10, filters: TenantsFilterParams = {}): Observable<PaginatedTenantsResponse> {
        const params: Record<string, string> = {
            page:      String(page),
            page_size: String(pageSize),
        };
        if (filters.name)   params['name']   = filters.name;
        if (filters.nit)    params['nit']    = filters.nit;
        if (filters.city)   params['city']   = filters.city;
        if (filters.status) params['status'] = filters.status;

        return this.http.get<PaginatedTenantsResponse>(this.base, { params });
    }

    createTenant(payload: CreateTenantPayload): Observable<Tenant> {
        return this.http.post<Tenant>(this.base, payload);
    }

    updateTenant(id: string, payload: UpdateTenantPayload): Observable<Tenant> {
        return this.http.patch<Tenant>(`${this.base}${id}/`, payload);
    }

    toggleTenant(id: string): Observable<Tenant> {
        return this.http.post<Tenant>(`${this.base}${id}/toggle-active/`, {});
    }
}
