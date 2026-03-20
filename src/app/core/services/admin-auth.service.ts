import { Inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

import { API_URL, NotificationService, SessionService } from 'wa-components-web';

interface PlatformAdminUser {
    id: string;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    role: { id: string; name: string; is_active: boolean } | null;
    is_active: boolean;
    is_superuser: boolean;
}

interface PlatformLoginResponse {
    access_token: string;
    user: PlatformAdminUser;
}

@Injectable({ providedIn: 'root' })
export class AdminAuthService {

    constructor(
        private http: HttpClient,
        private session: SessionService,
        private notification: NotificationService,
        private translate: TranslateService,
        @Inject(API_URL) private apiUrl: string,
    ) {}

    login(username: string, password: string): Observable<void> {
        return this.http
            .post<PlatformLoginResponse>(`${this.apiUrl}/platform/auth/login/`, { username, password })
            .pipe(
                tap(response => {
                    this.session.save({
                        access_token: response.access_token,
                        user: {
                            id: response.user.id as any,
                            username: response.user.username,
                            rol: response.user.role?.name,
                        },
                        company: null as any,
                    });
                    this.notification.push(
                        this.translate.instant('auth.login-success'),
                        'success',
                    );
                }),
            ) as unknown as Observable<void>;
    }

    logout(): void {
        this.session.clear();
    }
}
