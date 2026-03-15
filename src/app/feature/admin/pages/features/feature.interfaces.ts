export interface FeatureModule {
    id: string;
    code: string;
    name: string;
    description: string;
    icon: string;
    is_active: boolean;
    features_count: number;
    created_at: string;
    updated_at: string;
}

export interface Feature {
    id: string;
    key: string;
    label: string;
    description: string;
    module_code: string;
    module_name: string;
    category: 'features' | 'ai';
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface FeatureColumnConfig {
    key: string;
    label: string;
    filterable: boolean;
    type: 'text' | 'muted' | 'module-badge' | 'category-badge' | 'status-badge';
    width: string;
    filterType?: 'text' | 'select';
    filterOptions?: { value: string; label: string }[];
}

export interface FeatureTableConfig {
    columns: FeatureColumnConfig[];
    editable: boolean;
    deletable: boolean;
}
