// ZYNK Types - Food Subscription App

export type UserRole = 'customer' | 'chef' | 'delivery' | 'admin';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
}

export interface Customer extends User {
  role: 'customer';
  subscription?: Subscription;
  address?: Address;
}

export interface Chef extends User {
  role: 'chef';
  status: 'pending' | 'approved' | 'rejected';
  specialty?: string;
  bio?: string;
}

export interface DeliveryPartner extends User {
  role: 'delivery';
  vehicleType?: string;
  zone?: string;
}

export interface Admin extends User {
  role: 'admin';
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
}

export type PlanType = 'basic' | 'standard' | 'premium';
export type MealTime = 'lunch' | 'dinner' | 'both';

export interface Subscription {
  id: string;
  customerId: string;
  plan: PlanType;
  mealTime: MealTime;
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'cancelled';
  address: Address;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  calories?: number;
  isVegetarian: boolean;
}

export interface DailyMeal {
  id: string;
  date: string;
  mealTime: MealTime;
  subscriptionId: string;
  customerId: string;
  originalMealId: string;
  currentMealId: string;
  isSkipped: boolean;
  isSwapped: boolean;
  status: 'scheduled' | 'preparing' | 'out_for_delivery' | 'delivered';
  deliveryPartnerId?: string;
}

export interface Order {
  id: string;
  dailyMealId: string;
  customerId: string;
  chefId?: string;
  mealId: string;
  mealName: string;
  customerName: string;
  deliveryAddress: Address;
  status: 'pending' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered';
  date: string;
  mealTime: MealTime;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface Database {
  users: User[];
  subscriptions: Subscription[];
  meals: Meal[];
  dailyMeals: DailyMeal[];
  orders: Order[];
}
