// Maps to the security_features table via /company-features/ endpoint.

export interface Functionality {
    id:        string;
    module:    string;   // module code (not FK)
    key:       string;
    label:     string;
    category:  string;
    is_active: boolean;
}

export interface FunctionalitiesFilterParams {
    module?: string;  // server-side filter by module code
}

export interface CreateFunctionalityPayload {
    module:    string;
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
