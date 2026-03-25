export type LimitValidationType = 'daily' | 'lifetime';

export interface SubscriptionLimitValue {
    key:              string;
    value:            number | null; // null = sin límite
    name?:            string;        // nombre personalizado del tope
    label?:           string;        // functionality_label (read-only, viene del backend)
    id?:              string;        // UUID del backend (undefined si aún no está guardado)
    functionalityId?: string;        // UUID de la Functionality en el backend
    validationType?:  LimitValidationType; // tipo de validación del tope
    _trackId?:        string;        // ID interno para trackBy (topes nuevos sin key definitivo)
}

export interface ModuleLimit {
    moduleCode:               string;
    moduleName:               string;
    moduleIcon:               string;
    limits:                   SubscriptionLimitValue[];
    availableFunctionalities?: AvailableFunctionality[]; // opciones para "Añadir tope"
    loadingFunctionalities?:  boolean;
}

export interface AvailableFunctionality {
    id:    string;
    key:   string;
    label: string;
}

export interface SubscriptionFeature {
    key:      string;
    label:    string;
    enabled:  boolean;
    category: string;
}

export interface SubscriptionModule {
    code:        string;
    name:        string;
    description: string;
    icon:        string;
    hasAccess:   boolean;
    features:    SubscriptionFeature[];
}

export interface Subscription {
    id:          string;
    code:        string;
    name:        string;
    description: string;
    price:       number;
    logo:        string;
    is_active:   boolean;
    modules:     SubscriptionModule[];
    created_at:  string;
    updated_at:  string;
}
