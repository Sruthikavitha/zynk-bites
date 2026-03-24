import type { AppNotification, Chef, DailyMeal, Dish, Meal, Order, Review } from '@/types';

const normalizeApiBase = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return null;

  try {
    const normalized = new URL(trimmed).toString().replace(/\/$/, '');
    return normalized.replace(/\/api$/i, '');
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
  'Unable to reach the backend right now. Please try again in a moment.';

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
  chefBusinessName?: string | null;
  specialty?: string | null;
  bio?: string | null;
  serviceArea?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

export type BackendProfileUser = BackendAuthUser & {
  chefBusinessName?: string | null;
  isActive?: boolean;
  createdAt?: string;
};

export type BackendAdminChef = {
  id: string;
  name: string;
  email: string;
  role: 'chef';
  status: 'pending' | 'approved';
  specialty?: string;
  bio?: string;
  serviceArea?: string;
  phone?: string | null;
  isDisabled?: boolean;
  createdAt?: string;
};

export type BackendChefProfile = {
  chef: Chef;
  dishes: Dish[];
  reviews: Review[];
  avgRating: number;
};

export type BackendNotification = AppNotification;

type BackendAuthResponse = {
  success: boolean;
  message?: string;
  token?: string;
  user?: BackendAuthUser;
};

type BackendProfileResponse = {
  success: boolean;
  message?: string;
  user?: BackendProfileUser;
};

type BackendNotificationsResponse = {
  success: boolean;
  notifications?: BackendNotification[];
  unreadCount?: number;
  message?: string;
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

export const getCurrentUserProfile = async (token: string) => {
  const { response, data, error } = await requestJson<BackendProfileResponse>('/api/auth/profile', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response || !data) {
    return { success: false, user: null as BackendProfileUser | null, message: error || getNetworkErrorMessage() };
  }

  if (!response.ok || !data.success || !data.user) {
    return { success: false, user: null as BackendProfileUser | null, message: data.message || 'Failed to load profile' };
  }

  return { success: true, user: data.user };
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
  const { response, data } = await requestJson<{ success: boolean; data?: Chef[] }>('/api/chefs');
  if (!response?.ok || !data?.success || !Array.isArray(data.data)) return null;
  return data.data;
};

export const getChefProfile = async (chefId: string) => {
  const { response, data } = await requestJson<{ success: boolean; data?: BackendChefProfile }>(
    `/api/chefs/${chefId}/profile`
  );

  if (!response?.ok || !data?.success || !data.data) return null;
  return data.data;
};

export const getAllDishes = async () => {
  const { response, data } = await requestJson<{ success: boolean; data?: Dish[] }>('/api/dishes');
  if (!response?.ok || !data?.success || !Array.isArray(data.data)) return null;
  return data.data;
};

export const getChefWorkspaceDishes = async (token: string) => {
  const { response, data, error } = await requestJson<{ success: boolean; data?: Dish[]; message?: string }>(
    '/api/chef/dishes',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response || !data) {
    return { success: false, dishes: null as Dish[] | null, message: error || getNetworkErrorMessage() };
  }

  if (!response.ok || !data.success || !Array.isArray(data.data)) {
    return { success: false, dishes: null as Dish[] | null, message: data.message || 'Failed to load chef dishes' };
  }

  return { success: true, dishes: data.data };
};

export const createChefWorkspaceDish = async (
  token: string,
  payload: {
    name: string;
    description: string;
    category: 'veg' | 'non-veg';
    nutritionalInfo: { calories: number; protein: number; carbs: number; fat: number };
    allowsCustomization: boolean;
    customizationOptions?: { id: string; name: string; type: 'add' | 'remove' | 'adjust' }[];
  }
) => {
  const { response, data, error } = await requestJson<{ success: boolean; data?: Dish; message?: string }>(
    '/api/chef/dishes',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response || !data) {
    return { success: false, dish: null as Dish | null, message: error || getNetworkErrorMessage() };
  }

  if (!response.ok || !data.success || !data.data) {
    return { success: false, dish: null as Dish | null, message: data.message || 'Failed to add dish' };
  }

  return { success: true, dish: data.data };
};

export const getChefOrders = async (token: string) => {
  const { response, data, error } = await requestJson<{ success: boolean; data?: Order[]; message?: string }>(
    '/api/chef/orders',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response || !data) {
    return { success: false, orders: null as Order[] | null, message: error || getNetworkErrorMessage() };
  }

  if (!response.ok || !data.success || !Array.isArray(data.data)) {
    return { success: false, orders: null as Order[] | null, message: data.message || 'Failed to load chef orders' };
  }

  return { success: true, orders: data.data };
};

export const updateChefOrderStatus = async (
  token: string,
  orderId: string,
  status: 'preparing' | 'ready'
) => {
  const { response, data, error } = await requestJson<{ success: boolean; data?: Order; message?: string }>(
    `/api/chef/orders/${orderId}/status`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    }
  );

  if (!response || !data) {
    return { success: false, order: null as Order | null, message: error || getNetworkErrorMessage() };
  }

  if (!response.ok || !data.success || !data.data) {
    return { success: false, order: null as Order | null, message: data.message || 'Failed to update order status' };
  }

  return { success: true, order: data.data };
};

export const getAllMeals = async () => {
  const { response, data } = await requestJson<{ success: boolean; data?: Meal[] }>('/api/meals');
  if (!response?.ok || !data?.success || !Array.isArray(data.data)) return null;
  return data.data;
};

export const getMyNotifications = async (token: string, limit = 25) => {
  const { response, data, error } = await requestJson<BackendNotificationsResponse>(
    `/api/notifications?limit=${limit}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response || !data) {
    return {
      success: false,
      notifications: [] as BackendNotification[],
      unreadCount: 0,
      message: error || getNetworkErrorMessage(),
    };
  }

  if (!response.ok || !data.success) {
    return {
      success: false,
      notifications: [] as BackendNotification[],
      unreadCount: 0,
      message: data.message || 'Failed to load notifications',
    };
  }

  return {
    success: true,
    notifications: Array.isArray(data.notifications) ? data.notifications : [],
    unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : 0,
  };
};

export const markMyNotificationAsRead = async (token: string, notificationId: string) => {
  const { response, data, error } = await requestJson<{
    success: boolean;
    notification?: BackendNotification;
    message?: string;
  }>(`/api/notifications/${notificationId}/read`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response || !data) {
    return {
      success: false,
      message: error || getNetworkErrorMessage(),
    };
  }

  if (!response.ok || !data.success) {
    return {
      success: false,
      message: data.message || 'Failed to update notification',
    };
  }

  return {
    success: true,
    notification: data.notification,
  };
};

export const markAllMyNotificationsAsRead = async (token: string) => {
  const { response, data, error } = await requestJson<{
    success: boolean;
    updatedCount?: number;
    message?: string;
  }>('/api/notifications/read-all', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response || !data) {
    return {
      success: false,
      updatedCount: 0,
      message: error || getNetworkErrorMessage(),
    };
  }

  if (!response.ok || !data.success) {
    return {
      success: false,
      updatedCount: 0,
      message: data.message || 'Failed to mark notifications as read',
    };
  }

  return {
    success: true,
    updatedCount: typeof data.updatedCount === 'number' ? data.updatedCount : 0,
  };
};

type BackendActionResponse = {
  success: boolean;
  message?: string;
  nextAvailableAt?: string;
};

export const getCustomerMeals = async (token: string) => {
  const { response, data } = await requestJson<{ success: boolean; meals?: DailyMeal[] }>('/api/customer/meals', {
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
  const { response, data } = await requestJson<{ success: boolean; orders?: Order[] }>(
    '/api/customer/orders/for-review',
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response?.ok || !data?.success || !Array.isArray(data.orders)) return null;
  return data.orders;
};

export const getCustomerOrdersWithTracking = async (token: string) => {
  const { response, data } = await requestJson<{ success: boolean; orders?: Order[] }>(
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

export const getPendingChefApprovals = async (token: string): Promise<BackendAdminChef[] | null> => {
  const { response, data } = await requestJson<{ success: boolean; data?: BackendAdminChef[] }>('/api/admin/chefs/pending', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response?.ok || !data?.success || !Array.isArray(data.data)) return null;
  return data.data;
};

export const getAllChefApprovals = async (token: string): Promise<BackendAdminChef[] | null> => {
  const { response, data } = await requestJson<{ success: boolean; data?: BackendAdminChef[] }>('/api/admin/chefs', {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response?.ok || !data?.success || !Array.isArray(data.data)) return null;
  return data.data;
};

export const approveChefApproval = async (token: string, chefId: string) => {
  const { response, data } = await requestJson<{
    success: boolean;
    message?: string;
    chef?: BackendAdminChef;
  }>(`/api/admin/chefs/${chefId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response?.ok || !data?.success) {
    return { success: false, message: data?.message || 'Failed to approve chef' };
  }

  return { success: true, message: data.message, chef: data.chef };
};
