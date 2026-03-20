import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
    CreateFunctionalityPayload,
    Functionality,
    UpdateFunctionalityPayload,
} from '../interfaces/functionality.interfaces';

@Injectable({ providedIn: 'root' })
export class FunctionalityService {

    // Maps to security_features table — /company-features/ endpoint
    private readonly base = `${environment.apiUrl}/platform/functionalities/`;

    constructor(private http: HttpClient) {}

    getFunctionalities(module?: string): Observable<Functionality[]> {
        const params: Record<string, string> = {};
        if (module) params['module'] = module;
        return this.http.get<Functionality[]>(this.base, { params });
    }

    createFunctionality(payload: CreateFunctionalityPayload): Observable<Functionality> {
        return this.http.post<Functionality>(this.base, payload);
    }

    updateFunctionality(id: string, payload: UpdateFunctionalityPayload): Observable<Functionality> {
        return this.http.patch<Functionality>(`${this.base}${id}/`, payload);
    }

    deleteFunctionality(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${id}/`);
    }
}
