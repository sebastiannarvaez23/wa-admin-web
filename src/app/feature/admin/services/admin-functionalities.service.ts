import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { SessionService } from 'wa-components-web';
import { environment } from 'src/environments/environment';
import {
    AdminFunctionality,
    CreateFunctionalityPayload,
    UpdateFunctionalityPayload,
} from '../interfaces/admin-users.interfaces';

@Injectable({ providedIn: 'root' })
export class AdminFunctionalitiesService {

    // security_features table — company-features endpoint
    private readonly base = `${environment.apiUrl}/platform/functionalities/`;

    constructor(private http: HttpClient, private session: SessionService) {}

    private get headers() {
        return { Authorization: `AdminToken ${this.session.token}` };
    }

    // ── List (all features, optional module filter) ───────────────────────────

    getFunctionalities(module?: string): Observable<AdminFunctionality[]> {
        const params: Record<string, string> = {};
        if (module) params['module'] = module;

        return this.http.get<AdminFunctionality[]>(
            this.base,
            { headers: this.headers, params },
        );
    }

    // ── Create ───────────────────────────────────────────────────────────────

    createFunctionality(payload: CreateFunctionalityPayload): Observable<AdminFunctionality> {
        return this.http.post<AdminFunctionality>(
            this.base,
            payload,
            { headers: this.headers },
        );
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    deleteFunctionality(id: string): Observable<void> {
        return this.http.delete<void>(
            `${environment.apiUrl}/platform/functionalities/${id}/`,
            { headers: this.headers },
        );
    }

    // ── Update (also used for toggling is_active) ─────────────────────────────

    updateFunctionality(id: string, payload: UpdateFunctionalityPayload): Observable<AdminFunctionality> {
        return this.http.patch<AdminFunctionality>(
            `${environment.apiUrl}/platform/functionalities/${id}/`,
            payload,
            { headers: this.headers },
        );
    }
}
