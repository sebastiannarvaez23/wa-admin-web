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
