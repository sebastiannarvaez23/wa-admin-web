export interface SubscriptionLimitApiItem {
    id:                       string;
    subscription_id:          string;
    functionality_id:         string;
    subscription_name:        string;
    functionality_key:        string;
    functionality_label:      string;
    functionality_module_code: string;
    name:                     string;
    max_value:                number;
    created_at:               string;
    updated_at:               string;
}

export interface CreateSubscriptionLimitPayload {
    subscription:  string;
    functionality: string;
    name:          string;
    max_value:     number;
}

export interface UpdateSubscriptionLimitPayload {
    name?:      string;
    max_value?: number;
}
