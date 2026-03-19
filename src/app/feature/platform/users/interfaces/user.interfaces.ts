import { RoleSummary } from '../../roles/interfaces/role.interfaces';

export interface AdminUser {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    telephone: string;
    rol?: RoleSummary | null;
    is_active: boolean;
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

export interface CreateUserPayload {
    first_name: string;
    last_name:  string;
    email:      string;
    username:   string;
    telephone:  string;
    password:   string;
    rol_id?:    string;
}

export interface UpdateUserPayload {
    first_name?: string;
    last_name?:  string;
    email?:      string;
    telephone?:  string;
    password?:   string;
    rol_id?:     string;
}
