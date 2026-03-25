import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { environment } from 'src/environments/environment';
import {
    CreateFunctionalityPayload,
    Functionality,
    UpdateFunctionalityPayload,
} from '../interfaces/functionality.interfaces';

@Injectable({ providedIn: 'root' })
export class FunctionalityService {

    private readonly base = `${environment.apiUrl}/platform/functionalities/`;

    constructor(private http: HttpClient) {}

    getFunctionalities(module?: string): Observable<Functionality[]> {
        const params: Record<string, string> = { page_size: '200' };
        if (module) params['module'] = module;
        return this.http.get<{ items: Functionality[] }>(this.base, { params }).pipe(
            map(res => res.items),
        );
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
