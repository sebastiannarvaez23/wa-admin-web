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
    section_code: string;
    section_order: number;
    order: number;
    is_active: boolean;
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
