import { RoleSummary } from '../../roles/interfaces/role.interfaces';
import { PaginatedResponse } from '../../../../core/interfaces/pagination.interfaces';

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

export type PaginatedUsersResponse = PaginatedResponse<AdminUser>;

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
