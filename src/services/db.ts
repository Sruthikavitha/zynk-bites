/**
 * ZYNK Mock Database Service
 * Simulates a JSON file-based database using localStorage
 * This mimics the Node.js + Express backend with JSON file storage
 */

import type { 
  Database, 
  User, 
  Customer, 
  Chef,
  Subscription, 
  Meal, 
  DailyMeal, 
  Order,
  Address
} from '@/types';

const DB_KEY = 'zynk_database';

// Sample meals for the prototype
const sampleMeals: Meal[] = [
  { id: 'meal-1', name: 'Butter Chicken with Naan', description: 'Creamy tomato-based curry with tender chicken', category: 'North Indian', isVegetarian: false, calories: 650 },
  { id: 'meal-2', name: 'Paneer Tikka Masala', description: 'Grilled cottage cheese in spiced gravy', category: 'North Indian', isVegetarian: true, calories: 520 },
  { id: 'meal-3', name: 'Dal Makhani with Rice', description: 'Creamy black lentils with steamed basmati', category: 'North Indian', isVegetarian: true, calories: 480 },
  { id: 'meal-4', name: 'Grilled Chicken Bowl', description: 'Protein-packed bowl with quinoa and veggies', category: 'Healthy', isVegetarian: false, calories: 420 },
  { id: 'meal-5', name: 'Mediterranean Falafel Wrap', description: 'Crispy falafel with hummus and fresh veggies', category: 'Mediterranean', isVegetarian: true, calories: 380 },
  { id: 'meal-6', name: 'Thai Green Curry', description: 'Coconut-based curry with vegetables and jasmine rice', category: 'Asian', isVegetarian: true, calories: 520 },
  { id: 'meal-7', name: 'Chicken Biryani', description: 'Aromatic basmati rice layered with spiced chicken', category: 'Biryani', isVegetarian: false, calories: 680 },
  { id: 'meal-8', name: 'Veg Biryani', description: 'Fragrant rice with mixed vegetables and herbs', category: 'Biryani', isVegetarian: true, calories: 520 },
];

// Initial database structure
const initialDatabase: Database = {
  users: [
    {
      id: 'admin-1',
      email: 'admin@zynk.com',
      password: 'admin123',
      name: 'ZYNK Admin',
      role: 'admin',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'delivery-1',
      email: 'delivery@zynk.com',
      password: 'delivery123',
      name: 'Raj Kumar',
      role: 'delivery',
      phone: '+91-9876543210',
      createdAt: new Date().toISOString(),
    } as User,
  ],
  subscriptions: [],
  meals: sampleMeals,
  dailyMeals: [],
  orders: [],
};

// Read database from localStorage
export const readDatabase = (): Database => {
  try {
    const data = localStorage.getItem(DB_KEY);
    if (data) {
      return JSON.parse(data);
    }
    // Initialize with default data
    writeDatabase(initialDatabase);
    return initialDatabase;
  } catch (error) {
    console.error('Error reading database:', error);
    return initialDatabase;
  }
};

// Write database to localStorage
export const writeDatabase = (data: Database): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing database:', error);
  }
};

// Generate unique ID
export const generateId = (prefix: string): string => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// Check if current time is before 8 PM
export const isBeforeCutoff = (): boolean => {
  const now = new Date();
  const cutoffHour = 20; // 8 PM
  return now.getHours() < cutoffHour;
};

// Get tomorrow's date in YYYY-MM-DD format
export const getTomorrowDate = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
};

// User helpers
export const findUserByEmail = (email: string): User | undefined => {
  const db = readDatabase();
  return db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const findUserById = (id: string): User | undefined => {
  const db = readDatabase();
  return db.users.find(u => u.id === id);
};

export const createUser = (user: User): User => {
  const db = readDatabase();
  db.users.push(user);
  writeDatabase(db);
  return user;
};

export const updateUser = (id: string, updates: Partial<User>): User | undefined => {
  const db = readDatabase();
  const index = db.users.findIndex(u => u.id === id);
  if (index === -1) return undefined;
  db.users[index] = { ...db.users[index], ...updates };
  writeDatabase(db);
  return db.users[index];
};

// Subscription helpers
export const createSubscription = (subscription: Subscription): Subscription => {
  const db = readDatabase();
  db.subscriptions.push(subscription);
  writeDatabase(db);
  return subscription;
};

export const findSubscriptionByCustomerId = (customerId: string): Subscription | undefined => {
  const db = readDatabase();
  return db.subscriptions.find(s => s.customerId === customerId && s.status === 'active');
};

export const updateSubscription = (id: string, updates: Partial<Subscription>): Subscription | undefined => {
  const db = readDatabase();
  const index = db.subscriptions.findIndex(s => s.id === id);
  if (index === -1) return undefined;
  db.subscriptions[index] = { ...db.subscriptions[index], ...updates };
  writeDatabase(db);
  return db.subscriptions[index];
};

// Daily meal helpers
export const createDailyMeal = (dailyMeal: DailyMeal): DailyMeal => {
  const db = readDatabase();
  db.dailyMeals.push(dailyMeal);
  writeDatabase(db);
  return dailyMeal;
};

export const findDailyMealsByCustomerId = (customerId: string, date?: string): DailyMeal[] => {
  const db = readDatabase();
  return db.dailyMeals.filter(dm => 
    dm.customerId === customerId && 
    (!date || dm.date === date)
  );
};

export const updateDailyMeal = (id: string, updates: Partial<DailyMeal>): DailyMeal | undefined => {
  const db = readDatabase();
  const index = db.dailyMeals.findIndex(dm => dm.id === id);
  if (index === -1) return undefined;
  db.dailyMeals[index] = { ...db.dailyMeals[index], ...updates };
  writeDatabase(db);
  return db.dailyMeals[index];
};

// Order helpers
export const createOrder = (order: Order): Order => {
  const db = readDatabase();
  db.orders.push(order);
  writeDatabase(db);
  return order;
};

export const getOrdersByDate = (date: string): Order[] => {
  const db = readDatabase();
  return db.orders.filter(o => o.date === date);
};

export const updateOrder = (id: string, updates: Partial<Order>): Order | undefined => {
  const db = readDatabase();
  const index = db.orders.findIndex(o => o.id === id);
  if (index === -1) return undefined;
  db.orders[index] = { ...db.orders[index], ...updates };
  writeDatabase(db);
  return db.orders[index];
};

// Meal helpers
export const getAllMeals = (): Meal[] => {
  const db = readDatabase();
  return db.meals;
};

export const findMealById = (id: string): Meal | undefined => {
  const db = readDatabase();
  return db.meals.find(m => m.id === id);
};

// Chef helpers
export const getPendingChefs = (): Chef[] => {
  const db = readDatabase();
  return db.users.filter(u => u.role === 'chef' && (u as Chef).status === 'pending') as Chef[];
};

export const getApprovedChefs = (): Chef[] => {
  const db = readDatabase();
  return db.users.filter(u => u.role === 'chef' && (u as Chef).status === 'approved') as Chef[];
};

// Admin stats
export const getAdminStats = () => {
  const db = readDatabase();
  return {
    totalCustomers: db.users.filter(u => u.role === 'customer').length,
    totalChefs: db.users.filter(u => u.role === 'chef').length,
    activeSubscriptions: db.subscriptions.filter(s => s.status === 'active').length,
    pendingChefs: db.users.filter(u => u.role === 'chef' && (u as Chef).status === 'pending').length,
    totalOrders: db.orders.length,
  };
};

// Reset database (for testing)
export const resetDatabase = (): void => {
  writeDatabase(initialDatabase);
};
