// Type definitions for subscription requests and responses

// Request body for creating a new subscription
export interface CreateSubscriptionRequest {
  planName: string;
  mealsPerWeek: number;
  priceInCents: number;
  deliveryAddress: string;
  postalCode: string;
  city: string;
}

// Request body for updating address
export interface UpdateAddressRequest {
  deliveryAddress: string;
  postalCode: string;
  city: string;
}

// Request body for swapping a meal
export interface SwapMealRequest {
  newMealId: number;
}

// Response format for subscription operations
export interface SubscriptionResponse {
  success: boolean;
  message: string;
  subscription?: any;
  count?: number;
  subscriptions?: any[];
  nextAvailableAt?: Date;
}
