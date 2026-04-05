export interface EmailSender {
    id: string;
    code: string;
    name: string;
    email: string;
    reply_to: string;
    is_default: boolean;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface EmailTemplate {
    id: string;
    code: string;
    name: string;
    subject: string;
    body: string;
    html_template: string;
    sender: string | null;
    sender_detail: EmailSender | null;
    mock_data: Record<string, string>;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateEmailTemplatePayload {
    code: string;
    name: string;
    subject: string;
    body?: string;
    html_template: string;
    sender?: string | null;
    mock_data?: Record<string, string>;
    description?: string;
    is_active?: boolean;
}

export interface UpdateEmailTemplatePayload {
    name?: string;
    subject?: string;
    body?: string;
    html_template?: string;
    sender?: string | null;
    mock_data?: Record<string, string>;
    description?: string;
    is_active?: boolean;
}

export interface SendTestEmailPayload {
    template_code: string;
    to: string[];
    context?: Record<string, string>;
}
