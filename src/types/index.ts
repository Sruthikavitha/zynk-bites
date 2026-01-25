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

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  landmark?: string;
}

export interface Customer extends User {
  role: 'customer';
  subscription?: Subscription;
  homeAddress?: Address;
  workAddress?: Address;
  selectedChefId?: string;
}

// Nutritional info for dishes
export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// Customization options for dishes
export interface CustomizationOption {
  id: string;
  name: string;
  type: 'add' | 'remove' | 'adjust';
}

// Chef's dish
export interface Dish {
  id: string;
  chefId: string;
  name: string;
  description: string;
  category: 'veg' | 'non-veg';
  nutritionalInfo: NutritionalInfo;
  allowsCustomization: boolean;
  customizationOptions: CustomizationOption[];
  imageUrl?: string;
  isActive: boolean;
}

export interface Chef extends User {
  role: 'chef';
  status: 'pending' | 'approved' | 'rejected' | 'disabled';
  specialty?: string;
  bio?: string;
  kitchenLocation?: Address;
  serviceArea?: string;
  deliverySlots?: string[];
  rating?: number;
  totalOrders?: number;
  isDisabled?: boolean;
}

export interface DeliveryPartner extends User {
  role: 'delivery';
  vehicleType?: string;
  zone?: string;
}

export interface Admin extends User {
  role: 'admin';
}

export type PlanType = 'basic' | 'standard' | 'premium';
export type MealTime = 'lunch' | 'dinner' | 'both';
export type AddressType = 'home' | 'work';

export interface Subscription {
  id: string;
  customerId: string;
  customerName?: string;
  plan: PlanType;
  mealTime: MealTime;
  startDate: string;
  endDate?: string;
  status: 'active' | 'paused' | 'cancelled';
  address: Address;
  activeAddressType: AddressType;
  selectedChefId?: string;
}

// Legacy Meal type (for backwards compatibility)
export interface Meal {
  id: string;
  name: string;
  description: string;
  category: string;
  imageUrl?: string;
  calories?: number;
  isVegetarian: boolean;
}

// Selected customization for an order
export interface SelectedCustomization {
  optionId: string;
  optionName: string;
}

export interface DailyMeal {
  id: string;
  date: string;
  mealTime: MealTime;
  subscriptionId: string;
  customerId: string;
  originalMealId: string;
  currentMealId: string;
  originalDishId?: string;
  currentDishId?: string;
  isSkipped: boolean;
  isSwapped: boolean;
  status: 'scheduled' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered';
  deliveryPartnerId?: string;
  selectedCustomizations?: SelectedCustomization[];
  deliveryAddressType?: AddressType;
  isFinalized: boolean;
}

export interface Order {
  id: string;
  dailyMealId: string;
  customerId: string;
  chefId?: string;
  chefName?: string;
  mealId: string;
  mealName: string;
  customerName: string;
  deliveryAddress: Address;
  deliveryAddressType?: AddressType;
  status: 'pending' | 'preparing' | 'ready' | 'picked_up' | 'out_for_delivery' | 'delivered';
  date: string;
  mealTime: MealTime;
  selectedCustomizations?: SelectedCustomization[];
  dishId?: string;
  zone?: string;
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
  dishes: Dish[];
  dailyMeals: DailyMeal[];
  orders: Order[];
}
