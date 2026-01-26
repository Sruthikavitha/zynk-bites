/**
 * Real Backend API Client
 * Connects frontend to Express.js backend at http://localhost:5000/api
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ApiClientOptions {
  token?: string;
}

/**
 * Make HTTP request to backend
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit & ApiClientOptions = {}
): Promise<T> {
  const { token, ...fetchOptions } = options;
  const url = `${API_URL}${endpoint}`;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `API Error: ${response.status}`);
  }

  return response.json();
}

/**
 * Auth Endpoints
 */
export const apiAuth = {
  register: (email: string, password: string, name: string) =>
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    }),

  login: (email: string, password: string) =>
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  getProfile: (token: string) =>
    fetchApi('/auth/profile', {
      token,
    }),
};

/**
 * Subscription Endpoints
 */
export const apiSubscription = {
  create: (data: any, token: string) =>
    fetchApi('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
      token,
    }),

  get: (token: string) =>
    fetchApi('/subscriptions', {
      token,
    }),

  update: (id: string, data: any, token: string) =>
    fetchApi(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      token,
    }),

  skipMeal: (subscriptionId: string, mealId: string, token: string) =>
    fetchApi(`/subscriptions/${subscriptionId}/skip/${mealId}`, {
      method: 'POST',
      token,
    }),

  swapMeal: (subscriptionId: string, mealId: string, newMealId: string, token: string) =>
    fetchApi(`/subscriptions/${subscriptionId}/swap/${mealId}`, {
      method: 'POST',
      body: JSON.stringify({ newMealId }),
      token,
    }),
};

/**
 * Health Check
 */
export const apiHealth = {
  check: () =>
    fetchApi('/auth/health', {
      method: 'GET',
    }),
};

export default {
  auth: apiAuth,
  subscription: apiSubscription,
  health: apiHealth,
};
