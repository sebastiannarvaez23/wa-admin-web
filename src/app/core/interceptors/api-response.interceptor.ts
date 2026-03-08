import { Injectable } from '@angular/core';
import {
    HttpInterceptor,
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ApiResponseInterceptor implements HttpInterceptor {
    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            map(event => {
                if (
                    event instanceof HttpResponse &&
                    event.body !== null &&
                    typeof event.body === 'object' &&
                    'status_code' in event.body &&
                    'data' in event.body
                ) {
                    return event.clone({ body: event.body['data'] });
                }
                return event;
            }),
        );
    }
}
