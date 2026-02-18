import { pgTable, text, varchar, timestamp, integer, boolean, serial, pgEnum, index, unique, date, decimal } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['customer', 'chef', 'delivery', 'admin']);

// Enum for subscription status
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'paused', 'cancelled']);

// Enum for order status
export const orderStatusEnum = pgEnum('order_status', ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled']);

// Enum for diet category
export const dietCategoryEnum = pgEnum('diet_category', ['veg', 'non-veg', 'vegan', 'gluten-free', 'keto']);

// Users table: Stores customer, chef, delivery, and admin accounts
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').default('customer').notNull(),
    phone: varchar('phone', { length: 20 }),
    // Customer specific fields
    pincode: varchar('pincode', { length: 10 }),
    dietaryPreferences: text('dietary_preferences'), // Comma separated values
    // Common fields
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email),
    roleIdx: index('role_idx').on(table.role),
    pincodeIdx: index('pincode_idx').on(table.pincode),
  })
);

// Chefs table: Extended profile for chefs
export const chefs = pgTable(
  'chefs',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().references(() => users.id),
    businessName: varchar('business_name', { length: 255 }).notNull(),
    bio: text('bio'),
    rating: decimal('rating', { precision: 3, scale: 2 }).default('0.00'),
    ratingCount: integer('rating_count').default(0),
    isVerified: boolean('is_verified').default(false),
    maxDailyCapacity: integer('max_daily_capacity').default(50).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('chef_user_id_idx').on(table.userId),
  })
);

// Chef Delivery Zones: Pincodes a chef serves
export const chefDeliveryZones = pgTable(
  'chef_delivery_zones',
  {
    id: serial('id').primaryKey(),
    chefId: integer('chef_id').notNull().references(() => chefs.id),
    pincode: varchar('pincode', { length: 10 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    chefPincodeUnique: unique('chef_pincode_unique').on(table.chefId, table.pincode),
    pincodeIdx: index('delivery_zone_pincode_idx').on(table.pincode),
  })
);

// Items/Meals Table: Catalog of meals a chef can cook
export const meals = pgTable(
  'meals',
  {
    id: serial('id').primaryKey(),
    chefId: integer('chef_id').notNull().references(() => chefs.id),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description'),
    price: integer('price').notNull(), // In cents/paise
    dietCategory: dietCategoryEnum('diet_category').notNull(),
    imageUrl: text('image_url'),
    isAvailable: boolean('is_available').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
);

// Menus Table: Weekly menu definition
export const menus = pgTable(
  'menus',
  {
    id: serial('id').primaryKey(),
    chefId: integer('chef_id').notNull().references(() => chefs.id),
    weekStartDate: date('week_start_date').notNull(), // Monday of the week
    status: varchar('status', { length: 20 }).default('draft'), // draft, published, archived
    menuCardUrl: text('menu_card_url'), // URL to uploaded brochure/image
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    chefWeekUnique: unique('chef_week_unique').on(table.chefId, table.weekStartDate),
  })
);

// Daily Menu Items: Which meals are available on which day of a specific menu
export const dailyMenuItems = pgTable(
  'daily_menu_items',
  {
    id: serial('id').primaryKey(),
    menuId: integer('menu_id').notNull().references(() => menus.id),
    mealId: integer('meal_id').notNull().references(() => meals.id),
    dayOfWeek: integer('day_of_week').notNull(), // 0=Sunday, 1=Monday, etc.
    stock: integer('stock').default(100), // Daily stock for this item
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => ({
    menuDayMealUnique: unique('menu_day_meal_unique').on(table.menuId, table.dayOfWeek, table.mealId),
  })
);

// Orders Table
export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    customerId: integer('customer_id').notNull().references(() => users.id),
    chefId: integer('chef_id').notNull().references(() => chefs.id),
    status: orderStatusEnum('status').default('pending').notNull(),
    totalPrice: integer('total_price').notNull(),
    deliveryAddress: text('delivery_address').notNull(),
    deliveryPincode: varchar('delivery_pincode', { length: 10 }).notNull(),
    orderDate: timestamp('order_date').defaultNow().notNull(), // When order was placed
    deliveryDate: date('delivery_date').notNull(), // When meal is needed
    stripePaymentId: varchar('stripe_payment_id', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  }
);

// Order Items
export const orderItems = pgTable(
  'order_items',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull().references(() => orders.id),
    mealId: integer('meal_id').notNull().references(() => meals.id),
    quantity: integer('quantity').default(1).notNull(),
    priceAtOrder: integer('price_at_order').notNull(), // Snapshot price
    createdAt: timestamp('created_at').defaultNow().notNull(),
  }
);

// Subscriptions table (Keeping legacy for now, but might need refactor to link to orders)
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    planName: varchar('plan_name', { length: 100 }).notNull(),
    mealsPerWeek: integer('meals_per_week').notNull(),
    priceInCents: integer('price_in_cents').notNull(),
    deliveryAddress: text('delivery_address').notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    status: subscriptionStatusEnum('status').default('active').notNull(),
    nextBillingDate: timestamp('next_billing_date').notNull(),
    lastModifiedAt: timestamp('last_modified_at').defaultNow().notNull(),
    isSkipSwapLocked: boolean('is_skip_swap_locked').default(false).notNull(),
    lockAppliedAt: timestamp('lock_applied_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdRef: index('user_id_idx').on(table.userId),
    userStatusUnique: unique('user_active_subscription').on(table.userId, table.status),
  })
);

// RELATIONS
export const userRelations = relations(users, ({ one, many }) => ({
  subscriptions: many(subscriptions),
  chefProfile: one(chefs, {
    fields: [users.id],
    references: [chefs.userId],
  }),
  orders: many(orders),
}));

export const chefRelations = relations(chefs, ({ one, many }) => ({
  user: one(users, {
    fields: [chefs.userId],
    references: [users.id],
  }),
  deliveryZones: many(chefDeliveryZones),
  meals: many(meals),
  menus: many(menus),
  orders: many(orders),
}));

export const chefDeliveryZoneRelations = relations(chefDeliveryZones, ({ one }) => ({
  chef: one(chefs, {
    fields: [chefDeliveryZones.chefId],
    references: [chefs.id],
  }),
}));

export const mealRelations = relations(meals, ({ one, many }) => ({
  chef: one(chefs, {
    fields: [meals.chefId],
    references: [chefs.id],
  }),
  dailyMenuItems: many(dailyMenuItems),
}));

export const menuRelations = relations(menus, ({ one, many }) => ({
  chef: one(chefs, {
    fields: [menus.chefId],
    references: [chefs.id],
  }),
  dailyItems: many(dailyMenuItems),
}));

export const dailyMenuItemRelations = relations(dailyMenuItems, ({ one }) => ({
  menu: one(menus, {
    fields: [dailyMenuItems.menuId],
    references: [menus.id],
  }),
  meal: one(meals, {
    fields: [dailyMenuItems.mealId],
    references: [meals.id],
  }),
}));

// TypeScript Types
export type User = typeof users.$inferSelect;
export type Chef = typeof chefs.$inferSelect;
export type Meal = typeof meals.$inferSelect;
export type Menu = typeof menus.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
