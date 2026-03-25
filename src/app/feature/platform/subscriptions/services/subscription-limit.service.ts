import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
    CreateSubscriptionLimitPayload,
    SubscriptionLimitApiItem,
    UpdateSubscriptionLimitPayload,
} from '../interfaces/subscription-limit.interfaces';

@Injectable({ providedIn: 'root' })
export class SubscriptionLimitService {

    private readonly base = `${environment.apiUrl}/billing/subscription-limits/`;

    constructor(private http: HttpClient) {}

    getBySubscription(subscriptionId: string): Observable<SubscriptionLimitApiItem[]> {
        return this.http
            .get<SubscriptionLimitApiItem[]>(`${this.base}by-subscription/${subscriptionId}/`);
    }

    create(payload: CreateSubscriptionLimitPayload): Observable<SubscriptionLimitApiItem> {
        return this.http.post<SubscriptionLimitApiItem>(this.base, payload);
    }

    update(id: string, payload: UpdateSubscriptionLimitPayload): Observable<SubscriptionLimitApiItem> {
        return this.http.patch<SubscriptionLimitApiItem>(`${this.base}${id}/`, payload);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.base}${id}/`);
    }
}
