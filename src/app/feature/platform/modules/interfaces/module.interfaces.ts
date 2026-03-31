import { PaginatedResponse } from '../../../../core/interfaces/pagination.interfaces';

// ── Platform Module ───────────────────────────────────────────────────────────

export interface PlatformModule {
    id:           string;
    code:         string;
    name:         string;
    description:  string;
    icon:         string;
    route:        string;
    section_id:   string;
    section_code: string;
    section_name: string;
    section_order: number;
    order:        number;
    is_active:    boolean;
    created_at:   string;
    updated_at:   string;
}

export type PaginatedModulesResponse = PaginatedResponse<PlatformModule>;

export interface ModulesFilterParams {
    name?:       string;
    code?:       string;
    section_id?: string;
    is_active?:  'true' | 'false';
}

export interface CreateModulePayload {
    code:         string;
    name:         string;
    description?: string;
    icon:         string;
    route:        string;
    section_id:   string;
    order?:       number;
}

export interface UpdateModulePayload {
    code?:        string;
    name?:        string;
    description?: string;
    icon?:        string;
    route?:       string;
    section_id?:  string;
    order?:       number;
    is_active?:   boolean;
}

// ── Platform Section ──────────────────────────────────────────────────────────

export interface PlatformSection {
    id:        string;
    code:      string;
    name:      string;
    icon:      string;
    order:     number;
    is_active: boolean;
}

export interface CreateSectionPayload {
    code:   string;
    name:   string;
    icon:   string;
    order?: number;
}

export interface UpdateSectionPayload {
    code?:      string;
    name?:      string;
    icon?:      string;
    order?:     number;
    is_active?: boolean;
}
