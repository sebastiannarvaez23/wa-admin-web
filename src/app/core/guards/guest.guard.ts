import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from 'wa-components-web';

export const guestGuard: CanActivateFn = () => {
    const session = inject(SessionService);
    const router = inject(Router);

    if (!session.isLoggedIn) return true;
    return router.createUrlTree(['/admin/dashboard']);
};
