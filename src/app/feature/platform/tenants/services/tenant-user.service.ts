import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
    PaginatedTenantUsersResponse,
    TenantUsersFilterParams,
} from '../interfaces/tenant.interfaces';

@Injectable({ providedIn: 'root' })
export class TenantUserService {

    private readonly base = `${environment.apiUrl}/companies/users/`;

    constructor(private http: HttpClient) {}

    getTenantUsers(page = 0, pageSize = 10, filters: TenantUsersFilterParams = {}): Observable<PaginatedTenantUsersResponse> {
        const params: Record<string, string> = {
            page:      String(page),
            page_size: String(pageSize),
        };
        if (filters.name)    params['name']    = filters.name;
        if (filters.email)   params['email']   = filters.email;
        if (filters.company) params['company'] = filters.company;
        if (filters.status)  params['status']  = filters.status;

        return this.http.get<PaginatedTenantUsersResponse>(this.base, { params });
    }

    toggleActive(id: string): Observable<unknown> {
        return this.http.post(`${this.base}${id}/toggle-active/`, {});
    }
}
