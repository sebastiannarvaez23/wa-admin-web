// ── Tenant / Company ──────────────────────────────────────────────────────────

export interface TenantSubscription {
    id:                string;
    subscription_name: string;
    subscription_code: string;
    status:            'ACTIVE' | 'CANCELLED' | 'EXPIRED' | 'SUSPENDED';
    start_date:        string;
    end_date:          string;
}

export interface Tenant {
    id:           string;
    schema_name:  string;
    nit:          string;
    name:         string;
    address:      string;
    country:      string;
    state:        string;
    city:         string;
    subscription?: TenantSubscription | null;
    is_active:    boolean;
    created:      string;
}

export interface PaginatedTenantsResponse {
    items:       Tenant[];
    total:       number;
    page:        number;
    page_size:   number;
    total_pages: number;
}

export interface TenantsFilterParams {
    name?:         string;
    nit?:          string;
    city?:         string;
    subscription?: string;
    status?:       'active' | 'inactive';
}

export interface CreateTenantPayload {
    schema_name:      string;
    nit:              string;
    name:             string;
    address:          string;
    country:          string;
    state:            string;
    city:             string;
    subscription_id?: string;
}

export interface UpdateTenantPayload {
    name?:    string;
    address?: string;
    country?: string;
    state?:   string;
    city?:    string;
}

// ── Tenant Users ──────────────────────────────────────────────────────────────

export interface TenantUser {
    id:           string;
    first_name:   string;
    last_name:    string;
    email:        string;
    username:     string;
    telephone:    string;
    company_name: string;
    company_nit:  string;
    rol?:         { id: string; name: string } | null;
    is_active:    boolean;
}

export interface PaginatedTenantUsersResponse {
    items:       TenantUser[];
    total:       number;
    page:        number;
    page_size:   number;
    total_pages: number;
}

export interface TenantUsersFilterParams {
    name?:    string;
    email?:   string;
    company?: string;
    status?:  'active' | 'inactive';
}
