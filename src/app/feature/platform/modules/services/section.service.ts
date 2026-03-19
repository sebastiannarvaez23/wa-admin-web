import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
    CreateSectionPayload,
    PlatformSection,
    UpdateSectionPayload,
} from '../interfaces/module.interfaces';

@Injectable({ providedIn: 'root' })
export class SectionService {

    private readonly base = `${environment.apiUrl}/platform-sections/`;

    constructor(private http: HttpClient) {}

    getSections(): Observable<PlatformSection[]> {
        return this.http.get<PlatformSection[]>(this.base);
    }

    createSection(payload: CreateSectionPayload): Observable<PlatformSection> {
        return this.http.post<PlatformSection>(`${this.base}create/`, payload);
    }

    updateSection(id: string, payload: UpdateSectionPayload): Observable<PlatformSection> {
        return this.http.patch<PlatformSection>(`${this.base}${id}/`, payload);
    }

    toggleSection(id: string): Observable<PlatformSection> {
        return this.http.post<PlatformSection>(`${this.base}${id}/toggle/`, {});
    }

    deleteSection(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${id}/`);
    }
}
