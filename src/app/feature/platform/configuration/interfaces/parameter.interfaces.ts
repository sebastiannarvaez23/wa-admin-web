export type DataType = 'STRING' | 'INT' | 'DECIMAL' | 'BOOL' | 'JSON';

export interface ParameterType {
    id: string;
    code: string;
    name: string;
    description: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface Parameter {
    id: string;
    parameter_type: string;
    parameter_type_detail?: ParameterType | null;
    code: string;
    name: string;
    description: string;
    data_type: DataType;
    value: string;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateParameterTypePayload {
    code: string;
    name: string;
    description?: string;
    is_active?: boolean;
}

export interface UpdateParameterTypePayload {
    code?: string;
    name?: string;
    description?: string;
    is_active?: boolean;
}

export interface CreateParameterPayload {
    parameter_type: string;
    code: string;
    name: string;
    description?: string;
    data_type: DataType;
    value: string;
    is_active?: boolean;
}

export interface UpdateParameterPayload {
    parameter_type?: string;
    code?: string;
    name?: string;
    description?: string;
    data_type?: DataType;
    value?: string;
    is_active?: boolean;
}
