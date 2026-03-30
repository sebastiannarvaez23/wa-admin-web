import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import {
    CreateEmailTemplatePayload,
    EmailTemplate,
    UpdateEmailTemplatePayload,
} from '../interfaces/email-template.interfaces';

@Injectable({ providedIn: 'root' })
export class EmailTemplateService {

    private readonly base = `${environment.apiUrl}/platform/email-templates/`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<EmailTemplate[]> {
        return this.http.get<EmailTemplate[]>(this.base);
    }

    getById(id: string): Observable<EmailTemplate> {
        return this.http.get<EmailTemplate>(`${this.base}${id}/`);
    }

    create(payload: CreateEmailTemplatePayload): Observable<EmailTemplate> {
        return this.http.post<EmailTemplate>(this.base, payload);
    }

    update(id: string, payload: UpdateEmailTemplatePayload): Observable<EmailTemplate> {
        return this.http.patch<EmailTemplate>(`${this.base}${id}/`, payload);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${id}/`);
    }
}
