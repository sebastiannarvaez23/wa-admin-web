import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { SessionService, ThemeService } from 'wa-components-web';

@Component({
    selector: 'app-root',
    template: `
    <div class="contain-app">
        <router-outlet></router-outlet>
    </div>`,
    styleUrls: ['./app.component.css'],
})
export class AppComponent {

    constructor(
        public translate: TranslateService,
        private sessionService: SessionService,
        private themeService: ThemeService,
    ) {
        this.translate.addLangs(['es', 'en']);
        this.translate.setDefaultLang('es');

        const storedLang = this.sessionService.user?.preferences?.language;
        if (storedLang === 'es' || storedLang === 'en') {
            this.translate.use(storedLang);
        } else {
            const browserLang = this.translate.getBrowserLang();
            this.translate.use(browserLang === 'en' ? 'en' : 'es');
        }

        const userId = this.sessionService.user?.id;
        if (userId != null) {
            this.themeService.setUser(String(userId));
        }
        this.themeService.restore();
    }
}
