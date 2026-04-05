import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
    ParameterType,
    CreateParameterTypePayload,
    UpdateParameterTypePayload,
} from '../interfaces/parameter.interfaces';

@Injectable({ providedIn: 'root' })
export class ParameterTypeService {

    private readonly base = `${environment.apiUrl}/platform/parameter-types/`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<ParameterType[]> {
        return this.http.get<ParameterType[]>(this.base);
    }

    create(payload: CreateParameterTypePayload): Observable<ParameterType> {
        return this.http.post<ParameterType>(this.base, payload);
    }

    update(id: string, payload: UpdateParameterTypePayload): Observable<ParameterType> {
        return this.http.patch<ParameterType>(`${this.base}${id}/`, payload);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${id}/`);
    }
}
