import { ChangeDetectionStrategy, Component } from '@angular/core';

type CommunicationsTab = 'emails' | 'sent';

@Component({
    selector: 'wa-admin-communications-page',
    templateUrl: './communications-page.component.html',
    styleUrls: ['./communications-page.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommunicationsPageComponent {

    activeTab: CommunicationsTab = 'emails';

    readonly tabs: { key: CommunicationsTab; icon: string; label: string }[] = [
        { key: 'emails', icon: 'bx-file', label: 'admin.communications.tabs.templates' },
        { key: 'sent', icon: 'bx-mail-send', label: 'admin.communications.tabs.sent' },
    ];

    setTab(tab: CommunicationsTab): void {
        this.activeTab = tab;
    }
}
