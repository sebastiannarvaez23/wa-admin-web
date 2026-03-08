import { Component } from '@angular/core';

@Component({
    selector: 'wa-admin-settings-page',
    templateUrl: './settings-page.component.html',
    styleUrls: ['./settings-page.component.css'],
})
export class SettingsPageComponent {

    activeTab: 'preferences' = 'preferences';
}
