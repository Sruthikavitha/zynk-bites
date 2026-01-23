/**
 * ZYNK API Service
 * Simulates Express.js REST API endpoints
 * All responses follow the ApiResponse<T> structure
 */

import type { 
  ApiResponse, 
  User, 
  Customer, 
  Chef, 
  Subscription, 
  Address, 
  DailyMeal, 
  Order,
  PlanType,
  MealTime
} from '@/types';
import * as db from './db';

// ========================================
// AUTH ENDPOINTS (POST /api/auth/*)
// ========================================

/**
 * POST /api/auth/register
 * Register a new customer
 */
export const registerCustomer = (
  email: string, 
  password: string, 
  name: string,
  phone?: string
): ApiResponse<Customer> => {
  // Check if user already exists
  const existingUser = db.findUserByEmail(email);
  if (existingUser) {
    return { success: false, error: 'Email already registered' };
  }

  const customer: Customer = {
    id: db.generateId('cust'),
    email,
    password,
    name,
    phone,
    role: 'customer',
    createdAt: new Date().toISOString(),
  };

  db.createUser(customer);
  return { 
    success: true, 
    data: customer, 
    message: 'Customer registered successfully' 
  };
};

/**
 * POST /api/auth/login
 * Login user (any role)
 */
export const login = (email: string, password: string): ApiResponse<User> => {
  const user = db.findUserByEmail(email);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Invalid password' };
  }

  // For chef, check if approved
  if (user.role === 'chef' && (user as Chef).status !== 'approved') {
    return { 
      success: false, 
      error: 'Chef account pending approval. Please wait for admin approval.' 
    };
  }

  return { 
    success: true, 
    data: user, 
    message: 'Login successful' 
  };
};

// ========================================
// CUSTOMER ENDPOINTS (POST /api/customer/*)
// ========================================

/**
 * POST /api/customer/subscribe
 * Create a new subscription for customer
 */
export const subscribe = (
  customerId: string,
  plan: PlanType,
  mealTime: MealTime,
  address: Address
): ApiResponse<Subscription> => {
  const user = db.findUserById(customerId);
  if (!user || user.role !== 'customer') {
    return { success: false, error: 'Customer not found' };
  }

  // Check for existing active subscription
  const existingSub = db.findSubscriptionByCustomerId(customerId);
  if (existingSub) {
    return { success: false, error: 'Already have an active subscription' };
  }

  const subscription: Subscription = {
    id: db.generateId('sub'),
    customerId,
    plan,
    mealTime,
    address,
    startDate: db.getTomorrowDate(),
    status: 'active',
  };

  db.createSubscription(subscription);

  // Create daily meals for next 7 days
  const meals = db.getAllMeals();
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const randomMeal = meals[Math.floor(Math.random() * meals.length)];
    
    const dailyMeal: DailyMeal = {
      id: db.generateId('dm'),
      date: dateStr,
      mealTime,
      subscriptionId: subscription.id,
      customerId,
      originalMealId: randomMeal.id,
      currentMealId: randomMeal.id,
      isSkipped: false,
      isSwapped: false,
      status: 'scheduled',
    };
    db.createDailyMeal(dailyMeal);

    // Create order
    const order: Order = {
      id: db.generateId('ord'),
      dailyMealId: dailyMeal.id,
      customerId,
      mealId: randomMeal.id,
      mealName: randomMeal.name,
      customerName: user.name,
      deliveryAddress: address,
      status: 'pending',
      date: dateStr,
      mealTime,
    };
    db.createOrder(order);
  }

  return { 
    success: true, 
    data: subscription, 
    message: 'Subscription created successfully' 
  };
};

/**
 * POST /api/customer/skip-meal
 * Skip tomorrow's meal (only before 8 PM)
 */
export const skipMeal = (customerId: string, dailyMealId: string): ApiResponse<DailyMeal> => {
  // Check time cutoff
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Meal locked. Skip/swap allowed only before 8 PM.' };
  }

  const dailyMeals = db.findDailyMealsByCustomerId(customerId, db.getTomorrowDate());
  const meal = dailyMeals.find(dm => dm.id === dailyMealId);

  if (!meal) {
    return { success: false, error: 'Meal not found for tomorrow' };
  }

  if (meal.isSkipped) {
    return { success: false, error: 'Meal already skipped' };
  }

  const updated = db.updateDailyMeal(dailyMealId, { isSkipped: true });
  
  // Update corresponding order
  const dbData = db.readDatabase();
  const order = dbData.orders.find(o => o.dailyMealId === dailyMealId);
  if (order) {
    db.updateOrder(order.id, { status: 'pending' });
  }

  return { 
    success: true, 
    data: updated!, 
    message: 'Meal skipped successfully' 
  };
};

/**
 * POST /api/customer/swap-meal
 * Swap tomorrow's meal (only before 8 PM)
 */
export const swapMeal = (
  customerId: string, 
  dailyMealId: string, 
  newMealId: string
): ApiResponse<DailyMeal> => {
  // Check time cutoff
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Meal locked. Skip/swap allowed only before 8 PM.' };
  }

  const dailyMeals = db.findDailyMealsByCustomerId(customerId, db.getTomorrowDate());
  const meal = dailyMeals.find(dm => dm.id === dailyMealId);

  if (!meal) {
    return { success: false, error: 'Meal not found for tomorrow' };
  }

  if (meal.isSkipped) {
    return { success: false, error: 'Cannot swap a skipped meal' };
  }

  const newMeal = db.findMealById(newMealId);
  if (!newMeal) {
    return { success: false, error: 'Selected meal not found' };
  }

  const updated = db.updateDailyMeal(dailyMealId, { 
    currentMealId: newMealId, 
    isSwapped: true 
  });

  // Update corresponding order
  const dbData = db.readDatabase();
  const order = dbData.orders.find(o => o.dailyMealId === dailyMealId);
  if (order) {
    db.updateOrder(order.id, { mealId: newMealId, mealName: newMeal.name });
  }

  return { 
    success: true, 
    data: updated!, 
    message: 'Meal swapped successfully' 
  };
};

/**
 * PUT /api/customer/address
 * Update delivery address
 */
export const updateAddress = (
  customerId: string, 
  address: Address
): ApiResponse<Subscription> => {
  const subscription = db.findSubscriptionByCustomerId(customerId);
  if (!subscription) {
    return { success: false, error: 'No active subscription found' };
  }

  const updated = db.updateSubscription(subscription.id, { address });
  return { 
    success: true, 
    data: updated!, 
    message: 'Address updated successfully' 
  };
};

/**
 * GET /api/customer/subscription
 * Get customer's current subscription
 */
export const getSubscription = (customerId: string): ApiResponse<Subscription | null> => {
  const subscription = db.findSubscriptionByCustomerId(customerId);
  return { success: true, data: subscription || null };
};

/**
 * GET /api/customer/meals
 * Get customer's upcoming meals
 */
export const getCustomerMeals = (customerId: string): ApiResponse<DailyMeal[]> => {
  const meals = db.findDailyMealsByCustomerId(customerId);
  return { success: true, data: meals };
};

// ========================================
// CHEF ENDPOINTS (GET/POST /api/chef/*)
// ========================================

/**
 * POST /api/chef/register
 * Register a new chef (status = pending)
 */
export const registerChef = (
  email: string,
  password: string,
  name: string,
  specialty?: string,
  bio?: string
): ApiResponse<Chef> => {
  const existingUser = db.findUserByEmail(email);
  if (existingUser) {
    return { success: false, error: 'Email already registered' };
  }

  const chef: Chef = {
    id: db.generateId('chef'),
    email,
    password,
    name,
    role: 'chef',
    status: 'pending',
    specialty,
    bio,
    createdAt: new Date().toISOString(),
  };

  db.createUser(chef);
  return { 
    success: true, 
    data: chef, 
    message: 'Chef registration submitted. Awaiting admin approval.' 
  };
};

/**
 * GET /api/chef/orders
 * Get next-day orders (only for approved chefs)
 */
export const getChefOrders = (chefId: string): ApiResponse<Order[]> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  if ((user as Chef).status !== 'approved') {
    return { success: false, error: 'Chef not approved. Cannot view orders.' };
  }

  const tomorrow = db.getTomorrowDate();
  const allOrders = db.getOrdersByDate(tomorrow);
  
  // Filter out skipped meals
  const dbData = db.readDatabase();
  const activeOrders = allOrders.filter(order => {
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return dailyMeal && !dailyMeal.isSkipped;
  });

  return { success: true, data: activeOrders };
};

// ========================================
// DELIVERY ENDPOINTS (GET/POST /api/delivery/*)
// ========================================

/**
 * GET /api/delivery/tomorrow
 * Get list of tomorrow's deliveries
 */
export const getTomorrowDeliveries = (): ApiResponse<Order[]> => {
  const tomorrow = db.getTomorrowDate();
  const allOrders = db.getOrdersByDate(tomorrow);
  
  // Filter out skipped meals
  const dbData = db.readDatabase();
  const activeOrders = allOrders.filter(order => {
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return dailyMeal && !dailyMeal.isSkipped;
  });

  return { success: true, data: activeOrders };
};

/**
 * POST /api/delivery/mark-delivered
 * Mark an order as delivered
 */
export const markDelivered = (
  deliveryPartnerId: string, 
  orderId: string
): ApiResponse<Order> => {
  const user = db.findUserById(deliveryPartnerId);
  if (!user || user.role !== 'delivery') {
    return { success: false, error: 'Delivery partner not found' };
  }

  const dbData = db.readDatabase();
  const order = dbData.orders.find(o => o.id === orderId);
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  const updated = db.updateOrder(orderId, { status: 'delivered' });

  // Update daily meal status
  const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
  if (dailyMeal) {
    db.updateDailyMeal(dailyMeal.id, { 
      status: 'delivered',
      deliveryPartnerId 
    });
  }

  return { 
    success: true, 
    data: updated!, 
    message: 'Order marked as delivered' 
  };
};

// ========================================
// ADMIN ENDPOINTS (GET/POST /api/admin/*)
// ========================================

/**
 * GET /api/admin/overview
 * Get admin dashboard stats
 */
export const getAdminOverview = (): ApiResponse<{
  totalCustomers: number;
  totalChefs: number;
  activeSubscriptions: number;
  pendingChefs: number;
  totalOrders: number;
}> => {
  const stats = db.getAdminStats();
  return { success: true, data: stats };
};

/**
 * GET /api/admin/pending-chefs
 * Get list of pending chef applications
 */
export const getPendingChefs = (): ApiResponse<Chef[]> => {
  const chefs = db.getPendingChefs();
  return { success: true, data: chefs };
};

/**
 * POST /api/admin/approve-chef
 * Approve a pending chef
 */
export const approveChef = (chefId: string): ApiResponse<Chef> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  if ((user as Chef).status === 'approved') {
    return { success: false, error: 'Chef already approved' };
  }

  const updated = db.updateUser(chefId, { status: 'approved' } as Partial<Chef>);
  return { 
    success: true, 
    data: updated as Chef, 
    message: 'Chef approved successfully' 
  };
};

/**
 * POST /api/admin/reject-chef
 * Reject a pending chef
 */
export const rejectChef = (chefId: string): ApiResponse<Chef> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  const updated = db.updateUser(chefId, { status: 'rejected' } as Partial<Chef>);
  return { 
    success: true, 
    data: updated as Chef, 
    message: 'Chef rejected' 
  };
};

// ========================================
// UTILITY ENDPOINTS
// ========================================

/**
 * GET /api/meals
 * Get all available meals
 */
export const getAllMeals = (): ApiResponse => {
  const meals = db.getAllMeals();
  return { success: true, data: meals };
};

/**
 * Utility: Check if meal modifications are allowed
 */
export const canModifyMeal = (): boolean => {
  return db.isBeforeCutoff();
};
