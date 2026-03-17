export interface AdminUserRol {
    id: string;
    name: string;
    description?: string;
    is_active?: boolean;
    is_generic?: boolean;
    is_editable?: boolean;
    features?: string[];
    modules?: string[];
}

export interface FeatureCatalogItem {
    key: string;
    module: string;
    label: string;
    category: string;
}

export interface CreateRolePayload {
    name: string;
    description?: string;
}

export interface UpdateRolePayload {
    name?: string;
    description?: string;
    is_active?: boolean;
}

export interface PaginatedUsersResponse {
    items:       AdminUser[];
    total:       number;
    page:        number;
    page_size:   number;
    total_pages: number;
}

export interface UsersFilterParams {
    name?:     string;
    email?:    string;
    username?: string;
    role?:     string;
    status?:   'active' | 'inactive';
}

export interface AdminUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    telephone: string;
    rol?: AdminUserRol | null;
    is_active: boolean;
}

export interface CreateUserPayload {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    telephone: string;
    password: string;
    rol_id?: string;
}

export interface UpdateUserPayload {
    first_name?: string;
    last_name?: string;
    email?: string;
    telephone?: string;
    password?: string;
    rol_id?: string;
}

export interface AdminModule {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    route: string;
    section_id: string;
    section_code: string;
    section_name: string;
    section_order: number;
    order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PaginatedModulesResponse {
    items:       AdminModule[];
    total:       number;
    page:        number;
    page_size:   number;
    total_pages: number;
}

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

// AdminFunctionality maps to the security_features table (endpoint: /company-features/)
export interface AdminFunctionality {
    id:        string;
    module:    string;   // module code string (not FK)
    key:       string;
    label:     string;
    category:  string;
    is_active: boolean;
}

export interface FunctionalitiesFilterParams {
    module?: string;    // module code — server-side filter
    // label, key, category, is_active are filtered client-side
}

export interface CreateFunctionalityPayload {
    module:    string;   // module code
    key:       string;
    label:     string;
    category?: string;
}

export interface UpdateFunctionalityPayload {
    module?:    string;
    key?:       string;
    label?:     string;
    category?:  string;
    is_active?: boolean;
}

export interface AdminSection {
    id:       string;
    code:     string;
    name:     string;
    icon:     string;
    order:    number;
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

export type UserColumnType = 'user-cell' | 'text' | 'muted' | 'role-badge' | 'status-badge';

export interface UserFilterOption {
    value: string;
    label: string;
}

export interface UserColumnConfig {
    key: string;
    label: string;
    filterable: boolean;
    filterType?: 'text' | 'select';
    filterOptions?: UserFilterOption[];
    type: UserColumnType;
    width?: string;
}

export interface UserTableConfig {
    columns: UserColumnConfig[];
    editable: boolean;
    deletable: boolean;
}
