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
  MealTime,
  AddressType,
  Dish,
  NutritionalInfo,
  CustomizationOption,
  SelectedCustomization
} from '@/types';
import * as db from './db';

// ========================================
// AUTH ENDPOINTS (POST /api/auth/*)
// ========================================

/**
 * POST /api/auth/register
 * Register a new customer with home and work addresses
 */
export const registerCustomer = (
  email: string, 
  password: string, 
  name: string,
  phone?: string,
  homeAddress?: Address,
  workAddress?: Address
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
    homeAddress,
    workAddress,
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
 * Login user (any role) - allows pending chefs to login
 */
export const login = (email: string, password: string): ApiResponse<User> => {
  const user = db.findUserByEmail(email);
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  if (user.password !== password) {
    return { success: false, error: 'Invalid password' };
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
 * Create a new subscription for customer with chef selection
 */
export const subscribe = (
  customerId: string,
  plan: PlanType,
  mealTime: MealTime,
  address: Address,
  addressType: AddressType = 'home',
  selectedChefId?: string
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
    activeAddressType: addressType,
    selectedChefId,
    startDate: db.getTomorrowDate(),
    status: 'active',
  };

  db.createSubscription(subscription);

  // Update customer with selected chef
  if (selectedChefId) {
    db.updateUser(customerId, { selectedChefId } as Partial<Customer>);
  }

  // Get chef's dishes or fall back to sample meals
  const chefDishes = selectedChefId ? db.getDishesByChefId(selectedChefId) : [];
  const meals = db.getAllMeals();

  // Create daily meals for next 7 days
  for (let i = 1; i <= 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    let mealId: string;
    let mealName: string;
    let dishId: string | undefined;

    if (chefDishes.length > 0) {
      const randomDish = chefDishes[Math.floor(Math.random() * chefDishes.length)];
      dishId = randomDish.id;
      mealId = randomDish.id;
      mealName = randomDish.name;
    } else {
      const randomMeal = meals[Math.floor(Math.random() * meals.length)];
      mealId = randomMeal.id;
      mealName = randomMeal.name;
    }
    
    const dailyMeal: DailyMeal = {
      id: db.generateId('dm'),
      date: dateStr,
      mealTime,
      subscriptionId: subscription.id,
      customerId,
      originalMealId: mealId,
      currentMealId: mealId,
      originalDishId: dishId,
      currentDishId: dishId,
      isSkipped: false,
      isSwapped: false,
      status: 'scheduled',
      deliveryAddressType: addressType,
      isFinalized: false,
    };
    db.createDailyMeal(dailyMeal);

    // Create order
    const order: Order = {
      id: db.generateId('ord'),
      dailyMealId: dailyMeal.id,
      customerId,
      chefId: selectedChefId,
      mealId,
      mealName,
      dishId,
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

  if (meal.isFinalized) {
    return { success: false, error: 'Meal is already finalized' };
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
 * POST /api/customer/unskip-meal
 * Reverse a skipped meal (only before 8 PM)
 */
export const unskipMeal = (customerId: string, dailyMealId: string): ApiResponse<DailyMeal> => {
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Meal locked. Changes allowed only before 8 PM.' };
  }

  const dailyMeals = db.findDailyMealsByCustomerId(customerId, db.getTomorrowDate());
  const meal = dailyMeals.find(dm => dm.id === dailyMealId);

  if (!meal) {
    return { success: false, error: 'Meal not found for tomorrow' };
  }

  if (meal.isFinalized) {
    return { success: false, error: 'Meal is already finalized' };
  }

  if (!meal.isSkipped) {
    return { success: false, error: 'Meal is not skipped' };
  }

  const updated = db.updateDailyMeal(dailyMealId, { isSkipped: false });

  return { 
    success: true, 
    data: updated!, 
    message: 'Meal restored successfully' 
  };
};

/**
 * POST /api/customer/swap-meal
 * Swap tomorrow's meal (only before 8 PM)
 */
export const swapMeal = (
  customerId: string, 
  dailyMealId: string, 
  newMealId: string,
  selectedCustomizations?: SelectedCustomization[]
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

  if (meal.isFinalized) {
    return { success: false, error: 'Meal is already finalized' };
  }

  if (meal.isSkipped) {
    return { success: false, error: 'Cannot swap a skipped meal' };
  }

  // Check if it's a dish or meal
  const newDish = db.findDishById(newMealId);
  const newMeal = db.findMealById(newMealId);

  if (!newDish && !newMeal) {
    return { success: false, error: 'Selected meal/dish not found' };
  }

  const updates: Partial<DailyMeal> = {
    currentMealId: newMealId,
    isSwapped: true,
    selectedCustomizations,
  };

  if (newDish) {
    updates.currentDishId = newMealId;
  }

  const updated = db.updateDailyMeal(dailyMealId, updates);

  // Update corresponding order
  const dbData = db.readDatabase();
  const order = dbData.orders.find(o => o.dailyMealId === dailyMealId);
  if (order) {
    db.updateOrder(order.id, { 
      mealId: newMealId, 
      mealName: newDish?.name || newMeal?.name || 'Unknown',
      dishId: newDish?.id,
      selectedCustomizations,
    });
  }

  return { 
    success: true, 
    data: updated!, 
    message: 'Meal swapped successfully' 
  };
};

/**
 * PUT /api/customer/address
 * Update delivery address (only before 8 PM for tomorrow)
 */
export const updateAddress = (
  customerId: string, 
  address: Address,
  addressType: AddressType
): ApiResponse<Subscription> => {
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Address change locked after 8 PM.' };
  }

  const subscription = db.findSubscriptionByCustomerId(customerId);
  if (!subscription) {
    return { success: false, error: 'No active subscription found' };
  }

  const updated = db.updateSubscription(subscription.id, { 
    address, 
    activeAddressType: addressType 
  });

  // Update tomorrow's orders
  const dbData = db.readDatabase();
  const tomorrow = db.getTomorrowDate();
  dbData.orders.forEach(order => {
    if (order.customerId === customerId && order.date === tomorrow) {
      db.updateOrder(order.id, { deliveryAddress: address });
    }
  });

  return { 
    success: true, 
    data: updated!, 
    message: 'Address updated successfully' 
  };
};

/**
 * PUT /api/customer/switch-address
 * Switch between home and work address (only before 8 PM)
 */
export const switchDeliveryAddress = (
  customerId: string,
  addressType: AddressType
): ApiResponse<Subscription> => {
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Address change locked after 8 PM.' };
  }

  const user = db.findUserById(customerId) as Customer;
  if (!user || user.role !== 'customer') {
    return { success: false, error: 'Customer not found' };
  }

  const address = addressType === 'home' ? user.homeAddress : user.workAddress;
  if (!address) {
    return { success: false, error: `No ${addressType} address configured` };
  }

  const subscription = db.findSubscriptionByCustomerId(customerId);
  if (!subscription) {
    return { success: false, error: 'No active subscription found' };
  }

  const updated = db.updateSubscription(subscription.id, { 
    address, 
    activeAddressType: addressType 
  });

  // Update tomorrow's daily meal and order
  const dbData = db.readDatabase();
  const tomorrow = db.getTomorrowDate();
  
  dbData.dailyMeals.forEach(dm => {
    if (dm.customerId === customerId && dm.date === tomorrow && !dm.isFinalized) {
      db.updateDailyMeal(dm.id, { deliveryAddressType: addressType });
    }
  });

  dbData.orders.forEach(order => {
    if (order.customerId === customerId && order.date === tomorrow) {
      db.updateOrder(order.id, { deliveryAddress: address });
    }
  });

  return { 
    success: true, 
    data: updated!, 
    message: `Delivery address switched to ${addressType}` 
  };
};

/**
 * PUT /api/customer/select-chef
 * Change selected chef (only before 8 PM for tomorrow's meal)
 */
export const selectChef = (
  customerId: string,
  chefId: string
): ApiResponse<{ chef: Chef; subscription: Subscription }> => {
  if (!db.isBeforeCutoff()) {
    return { success: false, error: 'Chef change locked after 8 PM.' };
  }

  const chef = db.findUserById(chefId) as Chef;
  if (!chef || chef.role !== 'chef' || chef.status !== 'approved') {
    return { success: false, error: 'Chef not found or not approved' };
  }

  const subscription = db.findSubscriptionByCustomerId(customerId);
  if (!subscription) {
    return { success: false, error: 'No active subscription found' };
  }

  // Update subscription with new chef
  const updatedSub = db.updateSubscription(subscription.id, { selectedChefId: chefId });
  db.updateUser(customerId, { selectedChefId: chefId } as Partial<Customer>);

  // Update tomorrow's orders with new chef
  const dbData = db.readDatabase();
  const tomorrow = db.getTomorrowDate();
  const chefDishes = db.getDishesByChefId(chefId);
  
  dbData.orders.forEach(order => {
    if (order.customerId === customerId && order.date === tomorrow) {
      // Assign a random dish from the new chef
      if (chefDishes.length > 0) {
        const randomDish = chefDishes[Math.floor(Math.random() * chefDishes.length)];
        db.updateOrder(order.id, { 
          chefId, 
          mealId: randomDish.id,
          mealName: randomDish.name,
          dishId: randomDish.id,
        });
        
        // Update daily meal too
        const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
        if (dailyMeal && !dailyMeal.isFinalized) {
          db.updateDailyMeal(dailyMeal.id, {
            currentMealId: randomDish.id,
            currentDishId: randomDish.id,
            isSwapped: true,
          });
        }
      } else {
        db.updateOrder(order.id, { chefId });
      }
    }
  });

  return { 
    success: true, 
    data: { chef, subscription: updatedSub! }, 
    message: 'Chef updated successfully' 
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

/**
 * GET /api/customer/selected-chef
 * Get customer's selected chef details
 */
export const getSelectedChef = (customerId: string): ApiResponse<Chef | null> => {
  const subscription = db.findSubscriptionByCustomerId(customerId);
  if (!subscription?.selectedChefId) {
    return { success: true, data: null };
  }

  const chef = db.findUserById(subscription.selectedChefId) as Chef;
  return { success: true, data: chef || null };
};

// ========================================
// CHEF ENDPOINTS (GET/POST /api/chef/*)
// ========================================

/**
 * POST /api/chef/register
 * Register a new chef with kitchen location and service area
 */
export const registerChef = (
  email: string,
  password: string,
  name: string,
  specialty?: string,
  bio?: string,
  kitchenLocation?: Address,
  serviceArea?: string,
  deliverySlots?: string[]
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
    kitchenLocation,
    serviceArea,
    deliverySlots,
    rating: 0,
    totalOrders: 0,
    createdAt: new Date().toISOString(),
  };

  db.createUser(chef);
  return { 
    success: true, 
    data: chef, 
    message: 'Chef registration submitted. You can now add your dishes while awaiting approval.' 
  };
};

/**
 * POST /api/chef/dish
 * Add a new dish (chef must be logged in)
 */
export const addDish = (
  chefId: string,
  name: string,
  description: string,
  category: 'veg' | 'non-veg',
  nutritionalInfo: NutritionalInfo,
  allowsCustomization: boolean,
  customizationOptions: CustomizationOption[]
): ApiResponse<Dish> => {
  const chef = db.findUserById(chefId) as Chef;
  if (!chef || chef.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  const dish: Dish = {
    id: db.generateId('dish'),
    chefId,
    name,
    description,
    category,
    nutritionalInfo,
    allowsCustomization,
    customizationOptions,
    isActive: true,
  };

  db.createDish(dish);
  return { 
    success: true, 
    data: dish, 
    message: 'Dish added successfully' 
  };
};

/**
 * PUT /api/chef/dish/:id
 * Update a dish
 */
export const updateDish = (
  chefId: string,
  dishId: string,
  updates: Partial<Dish>
): ApiResponse<Dish> => {
  const dish = db.findDishById(dishId);
  if (!dish || dish.chefId !== chefId) {
    return { success: false, error: 'Dish not found or not owned by this chef' };
  }

  const updated = db.updateDish(dishId, updates);
  return { 
    success: true, 
    data: updated!, 
    message: 'Dish updated successfully' 
  };
};

/**
 * DELETE /api/chef/dish/:id
 * Delete (deactivate) a dish
 */
export const deleteDish = (chefId: string, dishId: string): ApiResponse<boolean> => {
  const dish = db.findDishById(dishId);
  if (!dish || dish.chefId !== chefId) {
    return { success: false, error: 'Dish not found or not owned by this chef' };
  }

  db.deleteDish(dishId);
  return { 
    success: true, 
    data: true, 
    message: 'Dish deleted successfully' 
  };
};

/**
 * GET /api/chef/dishes
 * Get chef's dishes
 */
export const getChefDishes = (chefId: string): ApiResponse<Dish[]> => {
  const dishes = db.getDishesByChefId(chefId);
  return { success: true, data: dishes };
};

/**
 * GET /api/chef/orders
 * Get finalized next-day orders (only after 8 PM or for approved chefs)
 */
export const getChefOrders = (chefId: string): ApiResponse<Order[]> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  if ((user as Chef).status !== 'approved') {
    return { success: false, error: 'Chef not approved. Cannot view orders.' };
  }

  // If before cutoff, orders are not finalized yet
  const isBefore = db.isBeforeCutoff();
  const tomorrow = db.getTomorrowDate();
  const allOrders = db.getOrdersByDate(tomorrow);
  
  // Filter orders for this chef only (or all orders if no chef assigned)
  const chefOrders = allOrders.filter(order => 
    order.chefId === chefId || !order.chefId
  );
  
  // Filter out skipped meals
  const dbData = db.readDatabase();
  const activeOrders = chefOrders.filter(order => {
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return dailyMeal && !dailyMeal.isSkipped;
  });

  // Add finalized flag info
  const ordersWithInfo = activeOrders.map(order => ({
    ...order,
    isFinalized: !isBefore,
  }));

  return { success: true, data: ordersWithInfo as Order[] };
};

/**
 * PUT /api/chef/order/:id/status
 * Update order status (preparing, ready)
 */
export const updateOrderStatus = (
  chefId: string,
  orderId: string,
  status: 'preparing' | 'ready'
): ApiResponse<Order> => {
  const order = db.readDatabase().orders.find(o => o.id === orderId);
  if (!order) {
    return { success: false, error: 'Order not found' };
  }

  if (order.chefId && order.chefId !== chefId) {
    return { success: false, error: 'Not authorized to update this order' };
  }

  const updated = db.updateOrder(orderId, { status });
  return { 
    success: true, 
    data: updated!, 
    message: `Order marked as ${status}` 
  };
};

// ========================================
// DELIVERY ENDPOINTS (GET/POST /api/delivery/*)
// ========================================

export interface DeliveryOrder extends Order {
  chefName?: string;
  zone?: string;
}

export interface GroupedDeliveries {
  byZone: Record<string, DeliveryOrder[]>;
  byChef: Record<string, DeliveryOrder[]>;
}

const getZoneFromAddress = (address: Address): string => {
  const city = address.city?.toLowerCase() || '';
  const zipCode = address.zipCode || '';
  
  if (city.includes('koramangala') || zipCode.startsWith('5600')) return 'South Bangalore';
  if (city.includes('whitefield') || zipCode.startsWith('5600')) return 'East Bangalore';
  if (city.includes('jp nagar') || city.includes('jayanagar')) return 'South Bangalore';
  if (city.includes('indiranagar') || city.includes('domlur')) return 'Central Bangalore';
  return address.city || 'Unknown Zone';
};

export const getTomorrowDeliveries = (): ApiResponse<Order[]> => {
  const tomorrow = db.getTomorrowDate();
  const allOrders = db.getOrdersByDate(tomorrow);
  
  const dbData = db.readDatabase();
  const activeOrders = allOrders.filter(order => {
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return dailyMeal && !dailyMeal.isSkipped;
  });

  const ordersWithDetails = activeOrders.map(order => {
    const chef = order.chefId ? dbData.users.find(u => u.id === order.chefId) as Chef : null;
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return {
      ...order,
      chefName: chef?.name || 'Unassigned',
      zone: getZoneFromAddress(order.deliveryAddress),
      deliveryAddressType: dailyMeal?.deliveryAddressType || 'home',
    };
  });

  return { success: true, data: ordersWithDetails };
};

export const getGroupedDeliveries = (): ApiResponse<GroupedDeliveries> => {
  const response = getTomorrowDeliveries();
  if (!response.success || !response.data) {
    return { success: false, error: 'Failed to fetch deliveries' };
  }

  const orders = response.data as DeliveryOrder[];
  
  const byZone: Record<string, DeliveryOrder[]> = {};
  const byChef: Record<string, DeliveryOrder[]> = {};

  orders.forEach(order => {
    const zone = order.zone || 'Unknown';
    const chefName = order.chefName || 'Unassigned';

    if (!byZone[zone]) byZone[zone] = [];
    byZone[zone].push(order);

    if (!byChef[chefName]) byChef[chefName] = [];
    byChef[chefName].push(order);
  });

  return { success: true, data: { byZone, byChef } };
};

export const markPickedUp = (
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

  if (order.status === 'delivered') {
    return { success: false, error: 'Order already delivered' };
  }

  const updated = db.updateOrder(orderId, { status: 'picked_up' });

  const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
  if (dailyMeal) {
    db.updateDailyMeal(dailyMeal.id, { 
      status: 'out_for_delivery',
      deliveryPartnerId 
    });
  }

  return { 
    success: true, 
    data: updated!, 
    message: 'Order picked up' 
  };
};

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

  if (order.status === 'delivered') {
    return { success: false, error: 'Order already delivered' };
  }

  const updated = db.updateOrder(orderId, { status: 'delivered' });

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

export interface TomorrowOperationsSummary {
  chefBreakdown: Array<{
    chefId: string;
    chefName: string;
    totalMeals: number;
    customizationCount: number;
  }>;
  zoneBreakdown: Array<{
    zone: string;
    totalDeliveries: number;
  }>;
  totalMeals: number;
}

export const getTomorrowOperationsSummary = (): ApiResponse<TomorrowOperationsSummary> => {
  const tomorrow = db.getTomorrowDate();
  const dbData = db.readDatabase();
  const allOrders = db.getOrdersByDate(tomorrow);
  
  const activeOrders = allOrders.filter(order => {
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return dailyMeal && !dailyMeal.isSkipped;
  });

  const chefStats: Record<string, { chefName: string; totalMeals: number; customizationCount: number }> = {};
  const zoneStats: Record<string, number> = {};

  activeOrders.forEach(order => {
    const chefId = order.chefId || 'unassigned';
    const chef = order.chefId ? dbData.users.find(u => u.id === order.chefId) : null;
    const chefName = chef?.name || 'Unassigned';

    if (!chefStats[chefId]) {
      chefStats[chefId] = { chefName, totalMeals: 0, customizationCount: 0 };
    }
    chefStats[chefId].totalMeals++;
    if (order.selectedCustomizations && order.selectedCustomizations.length > 0) {
      chefStats[chefId].customizationCount++;
    }

    const zone = order.deliveryAddress?.city || 'Unknown';
    zoneStats[zone] = (zoneStats[zone] || 0) + 1;
  });

  return {
    success: true,
    data: {
      chefBreakdown: Object.entries(chefStats).map(([chefId, stats]) => ({
        chefId,
        ...stats,
      })),
      zoneBreakdown: Object.entries(zoneStats).map(([zone, totalDeliveries]) => ({
        zone,
        totalDeliveries,
      })),
      totalMeals: activeOrders.length,
    },
  };
};

export interface EnhancedAdminStats {
  totalCustomers: number;
  totalChefs: number;
  approvedChefs: number;
  activeSubscriptions: number;
  pendingChefs: number;
  totalOrders: number;
  tomorrowMeals: number;
  pausedSubscriptions: number;
  disabledChefs: number;
}

export const getEnhancedAdminOverview = (): ApiResponse<EnhancedAdminStats> => {
  const dbData = db.readDatabase();
  const tomorrow = db.getTomorrowDate();
  const tomorrowOrders = db.getOrdersByDate(tomorrow);
  const activeTomorrowOrders = tomorrowOrders.filter(order => {
    const dailyMeal = dbData.dailyMeals.find(dm => dm.id === order.dailyMealId);
    return dailyMeal && !dailyMeal.isSkipped;
  });

  return {
    success: true,
    data: {
      totalCustomers: dbData.users.filter(u => u.role === 'customer').length,
      totalChefs: dbData.users.filter(u => u.role === 'chef').length,
      approvedChefs: dbData.users.filter(u => u.role === 'chef' && (u as Chef).status === 'approved').length,
      activeSubscriptions: dbData.subscriptions.filter(s => s.status === 'active').length,
      pendingChefs: dbData.users.filter(u => u.role === 'chef' && (u as Chef).status === 'pending').length,
      totalOrders: dbData.orders.length,
      tomorrowMeals: activeTomorrowOrders.length,
      pausedSubscriptions: dbData.subscriptions.filter(s => s.status === 'paused').length,
      disabledChefs: dbData.users.filter(u => u.role === 'chef' && (u as Chef).isDisabled).length,
    },
  };
};

export const pauseSubscription = (subscriptionId: string): ApiResponse<Subscription> => {
  const dbData = db.readDatabase();
  const subscription = dbData.subscriptions.find(s => s.id === subscriptionId);
  
  if (!subscription) {
    return { success: false, error: 'Subscription not found' };
  }

  const updated = db.updateSubscription(subscriptionId, { status: 'paused' });
  return {
    success: true,
    data: updated!,
    message: 'Subscription paused',
  };
};

export const resumeSubscription = (subscriptionId: string): ApiResponse<Subscription> => {
  const dbData = db.readDatabase();
  const subscription = dbData.subscriptions.find(s => s.id === subscriptionId);
  
  if (!subscription) {
    return { success: false, error: 'Subscription not found' };
  }

  const updated = db.updateSubscription(subscriptionId, { status: 'active' });
  return {
    success: true,
    data: updated!,
    message: 'Subscription resumed',
  };
};

export const disableChef = (chefId: string): ApiResponse<Chef> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  const updated = db.updateUser(chefId, { isDisabled: true } as Partial<Chef>);
  return {
    success: true,
    data: updated as Chef,
    message: 'Chef disabled',
  };
};

export const enableChef = (chefId: string): ApiResponse<Chef> => {
  const user = db.findUserById(chefId);
  if (!user || user.role !== 'chef') {
    return { success: false, error: 'Chef not found' };
  }

  const updated = db.updateUser(chefId, { isDisabled: false } as Partial<Chef>);
  return {
    success: true,
    data: updated as Chef,
    message: 'Chef enabled',
  };
};

export const getAllSubscriptions = (): ApiResponse<Subscription[]> => {
  const dbData = db.readDatabase();
  const subscriptionsWithNames = dbData.subscriptions.map(sub => {
    const customer = dbData.users.find(u => u.id === sub.customerId);
    return {
      ...sub,
      customerName: customer?.name || 'Unknown',
    };
  });
  return { success: true, data: subscriptionsWithNames };
};

export const getAllChefs = (): ApiResponse<Chef[]> => {
  const dbData = db.readDatabase();
  const chefs = dbData.users.filter(u => u.role === 'chef') as Chef[];
  return { success: true, data: chefs };
};

// ========================================
// PUBLIC ENDPOINTS
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
 * GET /api/dishes
 * Get all available dishes
 */
export const getAllDishes = (): ApiResponse<Dish[]> => {
  const dishes = db.getAllDishes();
  return { success: true, data: dishes };
};

/**
 * GET /api/chefs
 * Get all approved chefs
 */
export const getApprovedChefs = (): ApiResponse<Chef[]> => {
  const chefs = db.getApprovedChefs();
  return { success: true, data: chefs };
};

/**
 * GET /api/chef/:id/dishes
 * Get dishes for a specific chef
 */
export const getDishesForChef = (chefId: string): ApiResponse<Dish[]> => {
  const dishes = db.getDishesByChefId(chefId);
  return { success: true, data: dishes };
};

/**
 * Utility: Check if meal modifications are allowed
 */
export const canModifyMeal = (): boolean => {
  return db.isBeforeCutoff();
};

/**
 * Utility: Generate nutritional info from dish name (simulated)
 */
export const generateNutritionalInfo = (dishName: string): NutritionalInfo => {
  // Simulated nutritional info generation based on dish name keywords
  const name = dishName.toLowerCase();
  
  let base = { calories: 450, protein: 20, carbs: 50, fat: 15 };
  
  if (name.includes('chicken') || name.includes('mutton') || name.includes('fish')) {
    base = { calories: 550, protein: 35, carbs: 35, fat: 22 };
  } else if (name.includes('paneer') || name.includes('cheese')) {
    base = { calories: 520, protein: 22, carbs: 40, fat: 28 };
  } else if (name.includes('keto') || name.includes('low carb')) {
    base = { calories: 380, protein: 30, carbs: 12, fat: 25 };
  } else if (name.includes('biryani') || name.includes('rice')) {
    base = { calories: 620, protein: 18, carbs: 75, fat: 20 };
  } else if (name.includes('salad') || name.includes('healthy')) {
    base = { calories: 320, protein: 12, carbs: 30, fat: 15 };
  }
  
  // Add some randomness
  return {
    calories: base.calories + Math.floor(Math.random() * 50) - 25,
    protein: base.protein + Math.floor(Math.random() * 5) - 2,
    carbs: base.carbs + Math.floor(Math.random() * 10) - 5,
    fat: base.fat + Math.floor(Math.random() * 5) - 2,
  };
};
