import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
    Parameter,
    CreateParameterPayload,
    UpdateParameterPayload,
} from '../interfaces/parameter.interfaces';

@Injectable({ providedIn: 'root' })
export class ParameterService {

    private readonly base = `${environment.apiUrl}/platform/parameters/`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<Parameter[]> {
        return this.http.get<Parameter[]>(this.base);
    }

    create(payload: CreateParameterPayload): Observable<Parameter> {
        return this.http.post<Parameter>(this.base, payload);
    }

    update(id: string, payload: UpdateParameterPayload): Observable<Parameter> {
        return this.http.patch<Parameter>(`${this.base}${id}/`, payload);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${id}/`);
    }
}
