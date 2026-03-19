export type ColumnType =
    | 'text'
    | 'muted'
    | 'user-cell'
    | 'role-badge'
    | 'status-badge'
    | 'subscription-badge'
    | 'module-badge'
    | 'category-badge';

export interface FilterOption {
    value: string;
    label: string;
}

export interface ColumnConfig {
    key: string;
    label: string;
    filterable: boolean;
    filterType?: 'text' | 'select';
    filterOptions?: FilterOption[];
    type: ColumnType;
    width?: string;
}

export interface TableConfig {
    columns: ColumnConfig[];
    editable: boolean;
    deletable: boolean;
}
