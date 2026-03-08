import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';

import { ThemeService } from 'wa-components-web';
import { AdminAuthService } from '../../../../../core/services/admin-auth.service';
import { isFieldInvalid } from '../../../../../core/utils/form.utils';

@Component({
    selector: 'wa-admin-login',
    templateUrl: './login-page.component.html',
    styleUrls: ['./login-page.component.css'],
})
export class LoginPageComponent {

    form: FormGroup;
    loading = false;
    errorMessage: string | null = null;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private adminAuthService: AdminAuthService,
        private translate: TranslateService,
        public themeService: ThemeService,
    ) {
        this.form = this.fb.group({
            username: ['', [Validators.required]],
            password: ['', [Validators.required]],
        });
    }

    isInvalid(field: string): boolean {
        return isFieldInvalid(this.form, field);
    }

    login(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }
        this.loading = true;
        this.errorMessage = null;
        const { username, password } = this.form.value;
        this.adminAuthService.login(username, password).subscribe({
            next: () => this.router.navigate(['/admin/dashboard']),
            error: (err: { error?: { detail?: string } }) => {
                this.loading = false;
                this.errorMessage = err?.error?.detail
                    ?? this.translate.instant('security.auth.error.invalid-credentials');
            },
        });
    }
}
