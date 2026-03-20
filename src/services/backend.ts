const normalizeApiBase = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    return new URL(trimmed).toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

const defaultApiBase =
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:3002`
    : 'http://localhost:3002';

const configuredApiBase = normalizeApiBase(import.meta.env.VITE_API_URL);

const isLegacyLocalPort = (value?: string | null) => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return ['localhost', '127.0.0.1'].includes(url.hostname) && url.port === '5000';
  } catch {
    return false;
  }
};

const preferredApiBase = isLegacyLocalPort(configuredApiBase) ? defaultApiBase : configuredApiBase || defaultApiBase;

const apiBaseCandidates = Array.from(
  new Set([preferredApiBase, configuredApiBase, defaultApiBase].filter(Boolean))
) as string[];

export const API_BASE = preferredApiBase;
export const getBackendApiBaseUrl = () => API_BASE;

const TOKEN_KEY = 'zynk_api_token';

const getNetworkErrorMessage = () =>
  `Unable to reach the backend at ${API_BASE}. Make sure the backend server is running.`;

const readJsonSafely = async <T>(response: Response) => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const requestJson = async <T>(path: string, init?: RequestInit) => {
  let lastError: string | null = null;

  for (const baseUrl of apiBaseCandidates) {
    try {
      const response = await fetch(`${baseUrl}${path}`, init);
      const data = await readJsonSafely<T>(response);
      return { response, data, error: null as string | null };
    } catch (error) {
      lastError =
        error instanceof Error && error.message && error.message !== 'Failed to fetch'
          ? error.message
          : getNetworkErrorMessage();
    }
  }

  return {
    response: null,
    data: null,
    error: lastError || getNetworkErrorMessage(),
  };
};

export const getApiToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setApiToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Ignore storage failures (private mode, etc.)
  }
};

export const clearApiToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Ignore
  }
};

export type BackendSubscription = {
  id: number;
  chefId?: number | null;
  planName: string;
  mealsPerWeek: number;
  priceInCents: number;
  deliveryAddress: string;
  postalCode: string;
  city: string;
  status: string;
};

export type BackendUserRole = 'customer' | 'chef' | 'delivery' | 'admin';

export type BackendAuthUser = {
  id: number;
  email: string;
  fullName: string;
  role: BackendUserRole;
  phone?: string | null;
};

type BackendAuthResponse = {
  success: boolean;
  message?: string;
  token?: string;
  user?: BackendAuthUser;
};

export const loginUser = async (email: string, password: string) => {
  const { response, data, error } = await requestJson<BackendAuthResponse>('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: email.trim(), password }),
  });

  if (!response || !data) {
    return { success: false, message: error || getNetworkErrorMessage() };
  }

  if (!response.ok) {
    return { success: false, message: data.message || 'Login failed' };
  }

  return data;
};

export const registerUser = async (payload: {
  fullName: string;
  email: string;
  password: string;
  role?: BackendUserRole;
  chefBusinessName?: string;
  phone?: string;
  specialty?: string;
  bio?: string;
  serviceArea?: string;
}) => {
  const { response, data, error } = await requestJson<BackendAuthResponse>('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...payload,
      email: payload.email.trim(),
    }),
  });

  if (!response || !data) {
    return { success: false, message: error || getNetworkErrorMessage() };
  }

  if (!response.ok) {
    return { success: false, message: data.message || 'Registration failed' };
  }

  return data;
};

export const getSubscriptions = async (token: string): Promise<BackendSubscription[] | null> => {
  const { response, data } = await requestJson<{ success: boolean; subscriptions?: BackendSubscription[] }>(
    '/api/subscriptions',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response?.ok || !data?.success || !Array.isArray(data.subscriptions)) return null;
  return data.subscriptions;
};

export const updateSubscriptionChef = async (token: string, subscriptionId: string, chefId: string) => {
  const { response, data } = await requestJson<{ success: boolean; message?: string }>(
    `/api/subscriptions/${subscriptionId}/chef`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ chefId }),
    }
  );

  if (!response?.ok || !data?.success) {
    return { success: false, message: data?.message || 'Failed to update chef' };
  }

  return { success: true };
};

export const getChefsWithRatings = async () => {
  const { response, data } = await requestJson<{ success: boolean; data?: any[] }>('/api/chefs');
  if (!response?.ok || !data?.success || !Array.isArray(data.data)) return null;
  return data.data;
};

export const getChefProfile = async (chefId: string) => {
  const { response, data } = await requestJson<{
    success: boolean;
    data?: {
      chef: any;
      dishes: any[];
      reviews: any[];
      avgRating: number;
    };
  }>(`/api/chefs/${chefId}/profile`);

  if (!response?.ok || !data?.success || !data.data) return null;
  return data.data;
};

export const getAllDishes = async () => {
  const { response, data } = await requestJson<{ success: boolean; data?: any[] }>('/api/dishes');
  if (!response?.ok || !data?.success || !Array.isArray(data.data)) return null;
  return data.data;
};

export const getAllMeals = async () => {
  const { response, data } = await requestJson<{ success: boolean; data?: any[] }>('/api/meals');
  if (!response?.ok || !data?.success || !Array.isArray(data.data)) return null;
  return data.data;
};

type BackendActionResponse = {
  success: boolean;
  message?: string;
  nextAvailableAt?: string;
};

export const getCustomerMeals = async (token: string) => {
  const { response, data } = await requestJson<{ success: boolean; meals?: any[] }>('/api/customer/meals', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response?.ok || !data?.success || !Array.isArray(data.meals)) return null;
  return data.meals;
};

export const skipCustomerMeal = async (token: string, dailyMealId: string): Promise<BackendActionResponse> => {
  const { response, data } = await requestJson<BackendActionResponse>(`/api/customer/meals/${dailyMealId}/skip`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response?.ok) {
    return {
      success: false,
      message: data?.message || 'Failed to skip meal',
      nextAvailableAt: data?.nextAvailableAt,
    };
  }

  return { success: true, message: data?.message };
};

export const unskipCustomerMeal = async (token: string, dailyMealId: string): Promise<BackendActionResponse> => {
  const { response, data } = await requestJson<BackendActionResponse>(`/api/customer/meals/${dailyMealId}/unskip`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response?.ok) {
    return {
      success: false,
      message: data?.message || 'Failed to restore meal',
      nextAvailableAt: data?.nextAvailableAt,
    };
  }

  return { success: true, message: data?.message };
};

export const swapCustomerMeal = async (
  token: string,
  dailyMealId: string,
  newMealId: string
): Promise<BackendActionResponse> => {
  const { response, data } = await requestJson<BackendActionResponse>(`/api/customer/meals/${dailyMealId}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ newMealId }),
  });

  if (!response?.ok) {
    return {
      success: false,
      message: data?.message || 'Failed to swap meal',
      nextAvailableAt: data?.nextAvailableAt,
    };
  }

  return { success: true, message: data?.message };
};

export const updateCustomerMealAddress = async (
  token: string,
  dailyMealId: string,
  addressType: 'home' | 'work' | 'custom',
  customAddress?: { street: string; city: string; state: string; zipCode: string }
): Promise<BackendActionResponse> => {
  const { response, data } = await requestJson<BackendActionResponse>(`/api/customer/meals/${dailyMealId}/address`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ addressType, customAddress }),
  });

  if (!response?.ok) {
    return {
      success: false,
      message: data?.message || 'Failed to update address',
      nextAvailableAt: data?.nextAvailableAt,
    };
  }

  return { success: true, message: data?.message };
};

export const getOrdersForReview = async (token: string) => {
  const { response, data } = await requestJson<{ success: boolean; orders?: any[] }>('/api/customer/orders/for-review', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response?.ok || !data?.success || !Array.isArray(data.orders)) return null;
  return data.orders;
};

export const getCustomerOrdersWithTracking = async (token: string) => {
  const { response, data } = await requestJson<{ success: boolean; orders?: any[] }>(
    '/api/customer/orders/tracking',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response?.ok || !data?.success || !Array.isArray(data.orders)) return null;
  return data.orders;
};

export const submitCustomerReview = async (
  token: string,
  orderId: string,
  rating: number,
  comment?: string
): Promise<BackendActionResponse> => {
  const { response, data } = await requestJson<BackendActionResponse>('/api/customer/reviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ orderId, rating, comment }),
  });

  if (!response?.ok) {
    return { success: false, message: data?.message || 'Failed to submit review' };
  }

  return { success: true, message: data?.message || 'Review submitted' };
};
