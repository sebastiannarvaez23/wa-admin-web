import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
    CreateModulePayload,
    ModulesFilterParams,
    PaginatedModulesResponse,
    PlatformModule,
    UpdateModulePayload,
} from '../interfaces/module.interfaces';

@Injectable({ providedIn: 'root' })
export class ModuleService {

    private readonly base = `${environment.apiUrl}/modules/`;

    constructor(private http: HttpClient) {}

    getModules(page = 0, pageSize = 10, filters: ModulesFilterParams = {}): Observable<PaginatedModulesResponse> {
        const params: Record<string, string> = {
            page:      String(page),
            page_size: String(pageSize),
        };
        if (filters.name)       params['name']       = filters.name;
        if (filters.code)       params['code']       = filters.code;
        if (filters.section_id) params['section_id'] = filters.section_id;
        if (filters.is_active)  params['is_active']  = filters.is_active;

        return this.http.get<PaginatedModulesResponse>(`${this.base}admin/`, { params });
    }

    getModule(id: string): Observable<PlatformModule> {
        return this.http.get<PlatformModule>(`${this.base}${id}/`);
    }

    createModule(payload: CreateModulePayload): Observable<PlatformModule> {
        return this.http.post<PlatformModule>(`${this.base}create/`, payload);
    }

    updateModule(id: string, payload: UpdateModulePayload): Observable<PlatformModule> {
        return this.http.patch<PlatformModule>(`${this.base}${id}/`, payload);
    }

    deleteModule(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${id}/`);
    }

    toggleModule(id: string): Observable<PlatformModule> {
        return this.http.post<PlatformModule>(`${this.base}${id}/toggle/`, {});
    }
}
