import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../../../environments/environment';
import { EmailSender } from '../interfaces/email-template.interfaces';

@Injectable({ providedIn: 'root' })
export class EmailSenderService {

    private readonly base = `${environment.apiUrl}/platform/email-senders/`;

    constructor(private http: HttpClient) {}

    getAll(): Observable<EmailSender[]> {
        return this.http.get<EmailSender[]>(this.base);
    }

    create(payload: Partial<EmailSender>): Observable<EmailSender> {
        return this.http.post<EmailSender>(this.base, payload);
    }

    update(id: string, payload: Partial<EmailSender>): Observable<EmailSender> {
        return this.http.patch<EmailSender>(`${this.base}${id}/`, payload);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${id}/`);
    }
}
