import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { debounceTime, startWith } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

import { DialogService, NotificationService } from 'wa-components-web';
import { isFieldInvalid } from '../../../../core/utils/form.utils';
import { extractError } from '../../../../core/utils/error.utils';
import { TableConfig } from '../../../../core/interfaces/table.interfaces';
import { EmailTemplateService } from '../../../platform/communication/services/email-template.service';
import { EmailSenderService } from '../../../platform/communication/services/email-sender.service';
import { EmailTemplate, EmailSender } from '../../../platform/communication/interfaces/email-template.interfaces';

@Component({
    selector: 'wa-email-templates',
    templateUrl: './email-templates.component.html',
    styleUrls: ['../admin-shared.css', '../admin-users/admin-users.component.css', './email-templates.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplatesComponent implements OnInit {

    readonly tableConfig: TableConfig = {
        columns: [
            { key: 'code', label: 'admin.communications.emails.table.code', filterable: true, type: 'muted', width: '1.2fr' },
            { key: 'name', label: 'admin.communications.emails.table.name', filterable: true, type: 'text', width: '2fr' },
            { key: 'subject', label: 'admin.communications.emails.table.subject', filterable: true, type: 'text', width: '2fr' },
            { key: 'sender_name', label: 'admin.communications.emails.table.sender', filterable: true, type: 'muted', width: '1.5fr' },
            {
                key: 'status', label: 'admin.communications.emails.table.status', filterable: true,
                type: 'status-badge', width: '0.8fr',
                filterType: 'select',
                filterOptions: [
                    { value: '', label: 'admin.communications.emails.filter.status.all' },
                    { value: 'active', label: 'admin.communications.emails.filter.status.active' },
                    { value: 'inactive', label: 'admin.communications.emails.filter.status.inactive' },
                ],
            },
        ],
        editable: true,
        deletable: true,
    };

    readonly gridTemplate: string;

    templates: EmailTemplate[] = [];
    filteredTemplates: EmailTemplate[] = [];

    loading = false;
    saving = false;

    showModal = false;
    editingItem: EmailTemplate | null = null;
    form: FormGroup;
    filterForm: FormGroup;

    // Senders
    senders: EmailSender[] = [];
    showSendersModal = false;
    senderForm: FormGroup;
    editingSender: EmailSender | null = null;
    showSenderForm = false;
    savingSender = false;

    // Code editor
    previewTab: 'code' | 'preview' | 'mock' = 'code';
    previewHtml: SafeHtml = '';
    highlightedHtml = '';
    htmlLineNumbers: number[] = [1];
    emulateVars = false;

    @ViewChild('highlightEl') highlightEl!: ElementRef<HTMLPreElement>;
    @ViewChild('lineNumbersEl') lineNumbersEl!: ElementRef<HTMLDivElement>;

    private readonly destroyRef = inject(DestroyRef);
    private readonly cdr = inject(ChangeDetectorRef);

    constructor(
        private fb: FormBuilder,
        private emailTemplateService: EmailTemplateService,
        private emailSenderService: EmailSenderService,
        private notification: NotificationService,
        private dialog: DialogService,
        private translate: TranslateService,
        private sanitizer: DomSanitizer,
    ) {
        this.form = this.fb.group({
            code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80), Validators.pattern(/^[A-Za-z0-9_]+$/)]],
            name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(200)]],
            subject: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(300)]],
            body: [''],
            html_template: ['', [Validators.required]],
            sender: [null],
            mock_data: ['{}'],
            description: [''],
            is_active: [true],
        });

        this.senderForm = this.fb.group({
            code: ['', [Validators.required, Validators.maxLength(80), Validators.pattern(/^[A-Za-z0-9_]+$/)]],
            name: ['', [Validators.required, Validators.maxLength(200)]],
            email: ['', [Validators.required, Validators.email, Validators.maxLength(254)]],
            reply_to: [''],
        });

        const filterControls: Record<string, string> = {};
        this.tableConfig.columns
            .filter(c => c.filterable)
            .forEach(c => { filterControls[c.key] = ''; });
        this.filterForm = this.fb.group(filterControls);

        this.gridTemplate = this.buildGridTemplate();
    }

    ngOnInit(): void {
        this.filterForm.valueChanges.pipe(
            debounceTime(400),
            startWith(this.filterForm.value),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe(() => this.applyFilters());

        this.form.get('html_template')!.valueChanges.pipe(
            debounceTime(150),
            startWith(this.form.get('html_template')!.value ?? ''),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe((html: string) => {
            const src = html || '';
            this.highlightedHtml = this.highlightSyntax(src);
            this.updateLineNumbers(src);
            this.updatePreview();
            this.cdr.markForCheck();
        });

        this.loadTemplates();
        this.loadSenders();
    }

    // ── Filters ──────────────────────────────────────────────────────────────

    clearFilters(): void { this.filterForm.reset(); }
    clearFilter(key: string): void { this.filterForm.get(key)?.setValue(''); }

    get hasActiveFilters(): boolean {
        return Object.values(this.filterForm.value as Record<string, string>)
            .some(v => !!v && v.trim() !== '');
    }

    private applyFilters(): void {
        const v = this.filterForm.value as Record<string, string>;
        this.filteredTemplates = this.templates.filter(t => {
            if (v['code'] && !t.code.toLowerCase().includes(v['code'].toLowerCase())) return false;
            if (v['name'] && !t.name.toLowerCase().includes(v['name'].toLowerCase())) return false;
            if (v['subject'] && !t.subject.toLowerCase().includes(v['subject'].toLowerCase())) return false;
            if (v['sender_name']) {
                const senderText = t.sender_detail ? `${t.sender_detail.name} ${t.sender_detail.email}` : '';
                if (!senderText.toLowerCase().includes(v['sender_name'].toLowerCase())) return false;
            }
            if (v['status']) {
                const isActive = v['status'] === 'active';
                if (t.is_active !== isActive) return false;
            }
            return true;
        });
        this.cdr.markForCheck();
    }

    // ── Data loading ─────────────────────────────────────────────────────────

    loadTemplates(): void {
        this.loading = true;
        this.emailTemplateService.getAll()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: result => {
                    this.templates = result;
                    this.applyFilters();
                    this.loading = false;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.notification.push(this.translate.instant('admin.communications.emails.notifications.load-error'), 'error');
                    this.loading = false;
                    this.cdr.markForCheck();
                },
            });
    }

    loadSenders(): void {
        this.emailSenderService.getAll()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: result => {
                    this.senders = result;
                    this.cdr.markForCheck();
                },
                error: () => {
                    this.notification.push(this.translate.instant('admin.communications.senders.notifications.load-error'), 'error');
                },
            });
    }

    // ── Cell helpers ─────────────────────────────────────────────────────────

    getCellValue(item: EmailTemplate, key: string): unknown {
        if (key === 'sender_name') {
            return item.sender_detail ? `${item.sender_detail.name} <${item.sender_detail.email}>` : '—';
        }
        return (item as unknown as Record<string, unknown>)[key] ?? '';
    }

    trackById(_: number, item: { id: string }): string { return item.id; }
    trackByKey(_: number, item: { key: string }): string { return item.key; }

    // ── Template Modal CRUD ─────────────────────────────────────────────────

    openCreate(): void {
        this.editingItem = null;
        this.form.reset({ is_active: true, sender: null });
        this.form.get('code')?.enable();
        this.previewTab = 'code';
        this.showModal = true;
    }

    openEdit(item: EmailTemplate): void {
        this.editingItem = item;
        this.form.patchValue({
            code: item.code,
            name: item.name,
            subject: item.subject,
            body: item.body,
            html_template: item.html_template,
            sender: item.sender,
            mock_data: JSON.stringify(item.mock_data || {}, null, 2),
            description: item.description,
            is_active: item.is_active,
        });
        this.form.get('code')?.disable();
        this.showModal = true;
    }

    closeModal(): void { this.showModal = false; this.editingItem = null; }

    toggleActive(item: EmailTemplate): void {
        const newState = !item.is_active;
        this.emailTemplateService.update(item.id, { is_active: newState })
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    item.is_active = newState;
                    this.cdr.markForCheck();
                },
                error: err => {
                    this.notification.push(extractError(err, this.translate.instant('admin.communications.emails.notifications.update-error')), 'error');
                    this.cdr.markForCheck();
                },
            });
    }

    save(): void {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }

        this.saving = true;
        const raw = this.form.getRawValue();
        raw.code = (raw.code || '').toUpperCase();
        try { raw.mock_data = JSON.parse(raw.mock_data || '{}'); } catch { raw.mock_data = {}; }
        const value = Object.fromEntries(
            Object.entries(raw).map(([k, v]) => [k, k === 'sender' || k === 'mock_data' ? v : (v === null || v === undefined ? '' : v)]),
        ) as typeof raw;

        if (this.editingItem) {
            const payload: Record<string, unknown> = {};
            const original = this.editingItem as unknown as Record<string, unknown>;
            Object.keys(value).forEach(k => {
                if (value[k] !== original[k]) {
                    payload[k] = value[k];
                }
            });

            this.emailTemplateService.update(this.editingItem.id, payload)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadTemplates();
                        this.notification.push(this.translate.instant('admin.communications.emails.notifications.update-success'), 'success');
                        this.saving = false;
                        this.closeModal();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.communications.emails.notifications.update-error')), 'error');
                        this.saving = false;
                        this.cdr.markForCheck();
                    },
                });
        } else {
            this.emailTemplateService.create(value)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadTemplates();
                        this.notification.push(this.translate.instant('admin.communications.emails.notifications.create-success'), 'success');
                        this.saving = false;
                        this.closeModal();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.communications.emails.notifications.create-error')), 'error');
                        this.saving = false;
                        this.cdr.markForCheck();
                    },
                });
        }
    }

    confirmDelete(item: EmailTemplate): void {
        this.dialog.confirm({
            type: 'warning',
            title: this.translate.instant('admin.communications.emails.delete-dialog.title'),
            message: this.translate.instant('admin.communications.emails.delete-dialog.message', { name: item.name }),
            confirmLabel: this.translate.instant('admin.communications.emails.delete-dialog.confirm'),
            cancelLabel: this.translate.instant('dialog.common.cancel'),
        }).pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed: boolean) => { if (confirmed) this.deleteTemplate(item); });
    }

    private deleteTemplate(item: EmailTemplate): void {
        this.emailTemplateService.delete(item.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.loadTemplates();
                    this.notification.push(this.translate.instant('admin.communications.emails.notifications.delete-success'), 'success');
                },
                error: err => {
                    this.notification.push(extractError(err, this.translate.instant('admin.communications.emails.notifications.delete-error')), 'error');
                },
            });
    }

    // ── Sender CRUD ─────────────────────────────────────────────────────────

    saveSender(): void {
        if (this.senderForm.invalid) { this.senderForm.markAllAsTouched(); return; }
        this.savingSender = true;
        const val = this.senderForm.getRawValue();
        val.code = (val.code || '').toUpperCase();

        if (this.editingSender) {
            this.emailSenderService.update(this.editingSender.id, val)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadSenders();
                        this.loadTemplates();
                        this.notification.push(this.translate.instant('admin.communications.senders.notifications.update-success'), 'success');
                        this.savingSender = false;
                        this.cancelEditSender();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.communications.senders.notifications.update-error')), 'error');
                        this.savingSender = false;
                        this.cdr.markForCheck();
                    },
                });
        } else {
            this.emailSenderService.create(val)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        this.loadSenders();
                        this.notification.push(this.translate.instant('admin.communications.senders.notifications.create-success'), 'success');
                        this.savingSender = false;
                        this.showSenderForm = false;
                        this.senderForm.reset();
                    },
                    error: err => {
                        this.notification.push(extractError(err, this.translate.instant('admin.communications.senders.notifications.create-error')), 'error');
                        this.savingSender = false;
                        this.cdr.markForCheck();
                    },
                });
        }
    }

    editSender(s: EmailSender): void {
        this.editingSender = s;
        this.showSenderForm = true;
        this.senderForm.patchValue({ code: s.code, name: s.name, email: s.email, reply_to: s.reply_to });
    }

    cancelEditSender(): void {
        this.editingSender = null;
        this.showSenderForm = false;
        this.senderForm.reset();
    }

    setDefaultSender(s: EmailSender): void {
        this.emailSenderService.update(s.id, { is_default: true } as Partial<EmailSender>)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.loadSenders();
                    this.notification.push(this.translate.instant('admin.communications.senders.notifications.default-set'), 'success');
                },
                error: err => {
                    this.notification.push(extractError(err, this.translate.instant('admin.communications.senders.notifications.update-error')), 'error');
                },
            });
    }

    deleteSender(s: EmailSender): void {
        this.dialog.confirm({
            type: 'warning',
            title: this.translate.instant('admin.communications.senders.delete-dialog.title'),
            message: this.translate.instant('admin.communications.senders.delete-dialog.message', { name: s.name }),
            confirmLabel: this.translate.instant('admin.communications.senders.delete-dialog.confirm'),
            cancelLabel: this.translate.instant('dialog.common.cancel'),
        }).pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((confirmed: boolean) => {
                if (!confirmed) return;
                this.emailSenderService.delete(s.id)
                    .pipe(takeUntilDestroyed(this.destroyRef))
                    .subscribe({
                        next: () => {
                            this.loadSenders();
                            this.loadTemplates();
                            this.notification.push(this.translate.instant('admin.communications.senders.notifications.delete-success'), 'success');
                        },
                        error: err => {
                            this.notification.push(extractError(err, this.translate.instant('admin.communications.senders.notifications.delete-error')), 'error');
                        },
                    });
            });
    }

    // ── Form helpers ────────────────────────────────────────────────────────

    isInvalid(field: string): boolean { return isFieldInvalid(this.form, field); }

    getFieldError(field: string): string {
        const control = this.form.get(field);
        if (!control || !control.errors || !control.touched) return '';

        const errors = control.errors;
        const prefix = 'admin.communications.emails.modal.errors';

        if (errors['required']) return this.translate.instant(`${prefix}.required`);
        if (errors['minlength']) return this.translate.instant(`${prefix}.minlength`, { min: errors['minlength'].requiredLength });
        if (errors['maxlength']) return this.translate.instant(`${prefix}.maxlength`, { max: errors['maxlength'].requiredLength });
        if (errors['email']) return this.translate.instant(`${prefix}.email`);
        if (errors['pattern']) return this.translate.instant(`${prefix}.pattern-code`);

        return '';
    }

    // ── Code editor helpers ──────────────────────────────────────────────────

    syncScroll(event: Event): void {
        const ta = event.target as HTMLTextAreaElement;
        if (this.highlightEl) {
            this.highlightEl.nativeElement.scrollTop = ta.scrollTop;
            this.highlightEl.nativeElement.scrollLeft = ta.scrollLeft;
        }
        if (this.lineNumbersEl) {
            this.lineNumbersEl.nativeElement.scrollTop = ta.scrollTop;
        }
    }

    onCodeKeydown(event: KeyboardEvent): void {
        if (event.key === 'Tab') {
            event.preventDefault();
            const ta = event.target as HTMLTextAreaElement;
            const start = ta.selectionStart;
            const end = ta.selectionEnd;
            const val = ta.value;
            const indent = '    ';
            ta.value = val.substring(0, start) + indent + val.substring(end);
            ta.selectionStart = ta.selectionEnd = start + indent.length;
            ta.dispatchEvent(new Event('input'));
        }
    }

    updatePreview(): void {
        const raw = this.form.get('html_template')?.value || '';
        const html = this.emulateVars ? this.replaceVars(raw) : raw;
        this.previewHtml = this.sanitizer.bypassSecurityTrustHtml(html);
    }

    private replaceVars(html: string): string {
        let mockData: Record<string, string> = {};
        try { mockData = JSON.parse(this.form.get('mock_data')?.value || '{}'); } catch { /* ignore */ }
        return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key) => {
            if (mockData[key]) return mockData[key];
            return `{{ ${key} }}`;
        });
    }

    private updateLineNumbers(html: string): void {
        const count = Math.max(1, (html.match(/\n/g) || []).length + 1);
        this.htmlLineNumbers = Array.from({ length: count }, (_, i) => i + 1);
    }

    // ── Syntax highlighting ─────────────────────────────────────────────────

    private highlightSyntax(html: string): string {
        const esc = (s: string) => s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        let result = '';
        let i = 0;

        while (i < html.length) {
            if (html.startsWith('<!--', i)) {
                const end = html.indexOf('-->', i);
                const close = end === -1 ? html.length : end + 3;
                result += `<span class="hl-comment">${esc(html.substring(i, close))}</span>`;
                i = close;
                continue;
            }

            if (html.startsWith('{{', i)) {
                const end = html.indexOf('}}', i);
                const close = end === -1 ? html.length : end + 2;
                result += `<span class="hl-variable">${esc(html.substring(i, close))}</span>`;
                i = close;
                continue;
            }

            if (html[i] === '<' && i + 1 < html.length && html[i + 1] !== ' ') {
                const tagEnd = html.indexOf('>', i);
                if (tagEnd !== -1) {
                    result += this.highlightTag(html.substring(i, tagEnd + 1));
                    i = tagEnd + 1;
                    continue;
                }
            }

            const nextSpecial = this.findNext(html, i);
            result += esc(html.substring(i, nextSpecial));
            i = nextSpecial;
        }

        return result;
    }

    private highlightTag(tag: string): string {
        const esc = (s: string) => s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        if (tag.startsWith('<!')) {
            return `<span class="hl-doctype">${esc(tag)}</span>`;
        }

        let result = '';
        const tagNameMatch = tag.match(/^(<\/?)([\w-]+)/);
        if (!tagNameMatch) return esc(tag);

        result += `<span class="hl-bracket">${esc(tagNameMatch[1])}</span>`;
        result += `<span class="hl-tag">${esc(tagNameMatch[2])}</span>`;

        const rest = tag.substring(tagNameMatch[0].length);
        const attrRegex = /([\w\-:.]+)\s*=\s*("[^"]*"|'[^']*')|(\s*\/?>)|([\s]+)|([\w\-:.]+)/g;
        let m: RegExpExecArray | null;
        while ((m = attrRegex.exec(rest)) !== null) {
            if (m[1]) {
                result += `<span class="hl-attr"> ${esc(m[1])}</span>`;
                result += `<span class="hl-punct">=</span>`;
                result += `<span class="hl-string">${esc(m[2])}</span>`;
            } else if (m[3]) {
                result += `<span class="hl-bracket">${esc(m[3])}</span>`;
            } else if (m[4]) {
                result += m[4];
            } else if (m[5]) {
                result += `<span class="hl-attr">${esc(m[5])}</span>`;
            }
        }

        return result;
    }

    private findNext(html: string, from: number): number {
        let nearest = html.length;
        for (const token of ['<!--', '{{', '<']) {
            const idx = html.indexOf(token, from + 1);
            if (idx !== -1 && idx < nearest) nearest = idx;
        }
        return nearest;
    }

    private buildGridTemplate(): string {
        const widths = this.tableConfig.columns.map(c => c.width ?? '1fr');
        if (this.tableConfig.editable || this.tableConfig.deletable) widths.push('90px');
        return widths.join(' ');
    }
}
