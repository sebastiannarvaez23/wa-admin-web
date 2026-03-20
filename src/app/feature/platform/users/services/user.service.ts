import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'src/environments/environment';
import {
    AdminUser,
    CreateUserPayload,
    PaginatedUsersResponse,
    UpdateUserPayload,
    UsersFilterParams,
} from '../interfaces/user.interfaces';

@Injectable({ providedIn: 'root' })
export class UserService {

    private readonly base = `${environment.apiUrl}/platform/users/`;

    constructor(private http: HttpClient) {}

    getUsers(page = 0, pageSize = 10, filters: UsersFilterParams = {}): Observable<PaginatedUsersResponse> {
        const params: Record<string, string> = {
            page:      String(page),
            page_size: String(pageSize),
        };
        if (filters.name)     params['name']     = filters.name;
        if (filters.email)    params['email']    = filters.email;
        if (filters.username) params['username'] = filters.username;
        if (filters.role)     params['role']     = filters.role;
        if (filters.status)   params['status']   = filters.status;

        return this.http.get<PaginatedUsersResponse>(this.base, { params });
    }

    createUser(payload: CreateUserPayload): Observable<AdminUser> {
        return this.http.post<AdminUser>(this.base, payload);
    }

    updateUser(id: string, payload: UpdateUserPayload): Observable<AdminUser> {
        return this.http.patch<AdminUser>(`${this.base}${id}/`, payload);
    }

    toggleActive(id: string): Observable<AdminUser> {
        return this.http.post<AdminUser>(`${this.base}${id}/deactivate/`, {});
    }
}
