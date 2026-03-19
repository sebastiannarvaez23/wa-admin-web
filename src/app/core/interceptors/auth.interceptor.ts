import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
} from '@angular/common/http';
import { Observable } from 'rxjs';

import { SessionService } from 'wa-components-web';

// Endpoints that use the 'Token' prefix (platform admin user/role management)
const TOKEN_PREFIX_PATTERNS = [
    '/platform-admin/users',
    '/platform-admin/roles',
];

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(private session: SessionService) {}

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = this.session.token;

        if (!token || req.url.includes('/platform-auth/login/')) {
            return next.handle(req);
        }

        const useTokenPrefix = TOKEN_PREFIX_PATTERNS.some(p => req.url.includes(p));
        const prefix = useTokenPrefix ? 'Token' : 'AdminToken';

        return next.handle(
            req.clone({ setHeaders: { Authorization: `${prefix} ${token}` } }),
        );
    }
}
