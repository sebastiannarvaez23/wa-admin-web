import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SessionService } from 'wa-components-web';
import { environment } from 'src/environments/environment';
import {
    AdminModule,
    AdminSection,
    CreateModulePayload,
    CreateSectionPayload,
    ModulesFilterParams,
    PaginatedModulesResponse,
    UpdateModulePayload,
    UpdateSectionPayload,
} from '../interfaces/admin-users.interfaces';

@Injectable({ providedIn: 'root' })
export class AdminModulesService {

    private readonly base = `${environment.apiUrl}/platform/modules/`;

    constructor(private http: HttpClient, private session: SessionService) {}

    private get headers() {
        return { Authorization: `AdminToken ${this.session.token}` };
    }

    // ── List (paginated, admin) ───────────────────────────────────────────────

    getModules(page = 0, pageSize = 10, filters: ModulesFilterParams = {}): Observable<PaginatedModulesResponse> {
        const params: Record<string, string> = {
            page:      String(page),
            page_size: String(pageSize),
        };
        if (filters.name)       params['name']       = filters.name;
        if (filters.code)       params['code']       = filters.code;
        if (filters.section_id) params['section_id'] = filters.section_id;
        if (filters.is_active)  params['is_active']  = filters.is_active;

        return this.http.get<PaginatedModulesResponse>(
            `${this.base}admin/`,
            { headers: this.headers, params },
        );
    }

    // ── Detail ───────────────────────────────────────────────────────────────

    getModule(id: string): Observable<AdminModule> {
        return this.http.get<AdminModule>(
            `${this.base}${id}/`,
            { headers: this.headers },
        );
    }

    // ── Create ───────────────────────────────────────────────────────────────

    createModule(payload: CreateModulePayload): Observable<AdminModule> {
        return this.http.post<AdminModule>(
            `${this.base}create/`,
            payload,
            { headers: this.headers },
        );
    }

    // ── Update ───────────────────────────────────────────────────────────────

    updateModule(id: string, payload: UpdateModulePayload): Observable<AdminModule> {
        return this.http.patch<AdminModule>(
            `${this.base}${id}/`,
            payload,
            { headers: this.headers },
        );
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    deleteModule(id: string): Observable<void> {
        return this.http.delete<void>(
            `${this.base}${id}/`,
            { headers: this.headers },
        );
    }

    // ── Toggle active ─────────────────────────────────────────────────────────

    toggleModule(id: string): Observable<AdminModule> {
        return this.http.post<AdminModule>(
            `${this.base}${id}/toggle/`,
            {},
            { headers: this.headers },
        );
    }

    // ── Sections ──────────────────────────────────────────────────────────────

    getSections(): Observable<AdminSection[]> {
        return this.http.get<AdminSection[]>(
            `${environment.apiUrl}/platform/sections/`,
            { headers: this.headers },
        );
    }

    createSection(payload: CreateSectionPayload): Observable<AdminSection> {
        return this.http.post<AdminSection>(
            `${environment.apiUrl}/platform/sections/`,
            payload,
            { headers: this.headers },
        );
    }

    updateSection(id: string, payload: UpdateSectionPayload): Observable<AdminSection> {
        return this.http.patch<AdminSection>(
            `${environment.apiUrl}/platform/sections/${id}/`,
            payload,
            { headers: this.headers },
        );
    }

    toggleSection(id: string): Observable<AdminSection> {
        return this.http.post<AdminSection>(
            `${environment.apiUrl}/platform/sections/${id}/toggle/`,
            {},
            { headers: this.headers },
        );
    }

    deleteSection(id: string): Observable<void> {
        return this.http.delete<void>(
            `${environment.apiUrl}/platform/sections/${id}/`,
            { headers: this.headers },
        );
    }
}
