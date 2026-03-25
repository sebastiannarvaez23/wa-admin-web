import { Injectable } from '@angular/core';
import {
    HttpErrorResponse,
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { SessionService } from 'wa-components-web';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

    constructor(
        private session: SessionService,
        private router:  Router,
    ) {}

    intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
        const token = this.session.token;

        if (!token || req.url.includes('/platform/auth/login/')) {
            return next.handle(req);
        }

        return next.handle(
            req.clone({ setHeaders: { Authorization: `AdminToken ${token}` } }),
        ).pipe(
            catchError((err: HttpErrorResponse) => {
                if (err.status === 401) {
                    this.session.clear();
                    this.router.navigate(['/security/login']);
                }
                return throwError(() => err);
            }),
        );
    }
}
