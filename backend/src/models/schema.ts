import { pgTable, text, varchar, timestamp, integer, boolean, serial, pgEnum, index, unique, real, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['customer', 'chef', 'delivery', 'admin']);

// Enum for subscription status
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'paused', 'cancelled']);

// Notification delivery and queue enums
export const notificationTypeEnum = pgEnum('notification_type', [
  'subscription_success',
  'payment_failed',
  'meal_reminder',
  'daily_meal_count',
  'skip_swap_deadline',
  'delivery_update',
  'new_subscriber',
  'chef_menu_update',
  'chef_pending_approval',
  'chef_approved',
  'system_alert',
]);
export const notificationPriorityEnum = pgEnum('notification_priority', ['normal', 'critical']);
export const notificationStatusEnum = pgEnum('notification_status', ['queued', 'processing', 'delivered', 'failed']);
export const notificationChannelEnum = pgEnum('notification_channel', ['in_app']);

// Users table: Stores customer, chef, delivery, and admin accounts
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    // User's full name
    fullName: varchar('full_name', { length: 255 }).notNull(),
    // Unique email for authentication
    email: varchar('email', { length: 255 }).notNull().unique(),
    // Hashed password (bcrypt)
    passwordHash: text('password_hash').notNull(),
    // User role: customer, chef, delivery, or admin
    role: userRoleEnum('role').default('customer').notNull(),
    // Chef's business name (optional, only for chefs)
    chefBusinessName: varchar('chef_business_name', { length: 255 }),
    // Chef profile fields
    specialty: varchar('specialty', { length: 255 }),
    bio: text('bio'),
    serviceArea: varchar('service_area', { length: 255 }),
    rating: real('rating'),
    reviewCount: integer('review_count').default(0),
    // Phone number for contact
    phone: varchar('phone', { length: 20 }),
    // Account status
    isActive: boolean('is_active').default(true).notNull(),
    // Timestamps for record management
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Index on email for faster lookups during login
    emailIdx: index('email_idx').on(table.email),
    // Index on role for filtering users by role
    roleIdx: index('role_idx').on(table.role),
  })
);

// Subscriptions table: Stores customer subscriptions with meal plans and addresses
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: serial('id').primaryKey(),
    // Foreign key: Links to users table (customer who owns the subscription)
    userId: integer('user_id').notNull(),
    // Monthly subscription plan (e.g., "Basic", "Premium", "Deluxe")
    planName: varchar('plan_name', { length: 100 }).notNull(),
    // Selected chef (optional)
    chefId: integer('chef_id'),
    // Number of meals per week
    mealsPerWeek: integer('meals_per_week').notNull(),
    // Monthly price in cents
    priceInCents: integer('price_in_cents').notNull(),
    // Delivery address for meals
    deliveryAddress: text('delivery_address').notNull(),
    // Postal/ZIP code
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    // City of delivery
    city: varchar('city', { length: 100 }).notNull(),
    // Subscription status: active, paused, or cancelled
    status: subscriptionStatusEnum('status').default('active').notNull(),
    // Next billing date
    nextBillingDate: timestamp('next_billing_date').notNull(),
    // When a customer can skip/swap the next week's meal (locked after 8 PM on Friday)
    lastModifiedAt: timestamp('last_modified_at').defaultNow().notNull(),
    // Tracks if skip/swap is locked (set automatically after 8 PM Friday)
    isSkipSwapLocked: boolean('is_skip_swap_locked').default(false).notNull(),
    // When the lock was applied (to track reset timing)
    lockAppliedAt: timestamp('lock_applied_at'),
    // Timestamps for record management
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    // Foreign key constraint
    userIdRef: index('user_id_idx').on(table.userId),
    // Ensure one active subscription per user (for customer role)
    userStatusUnique: unique('user_active_subscription').on(table.userId, table.status),
  })
);

// Dishes table: Stores chef-created dishes
export const dishes = pgTable(
  'dishes',
  {
    id: serial('id').primaryKey(),
    chefId: integer('chef_id').notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    description: text('description').notNull(),
    category: varchar('category', { length: 20 }).notNull(),
    calories: integer('calories').notNull(),
    protein: integer('protein').notNull(),
    carbs: integer('carbs').notNull(),
    fat: integer('fat').notNull(),
    allowsCustomization: boolean('allows_customization').default(false).notNull(),
    isSpecial: boolean('is_special').default(false).notNull(),
    imageUrl: text('image_url'),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    chefIdx: index('dish_chef_idx').on(table.chefId),
  })
);

// Daily meals table: stores scheduled meals for customers
export const dailyMeals = pgTable(
  'daily_meals',
  {
    id: serial('id').primaryKey(),
    subscriptionId: integer('subscription_id').notNull(),
    customerId: integer('customer_id').notNull(),
    date: varchar('date', { length: 10 }).notNull(),
    mealSlot: varchar('meal_slot', { length: 20 }).notNull(),
    originalMealId: varchar('original_meal_id', { length: 50 }).notNull(),
    currentMealId: varchar('current_meal_id', { length: 50 }).notNull(),
    isSkipped: boolean('is_skipped').default(false).notNull(),
    isSwapped: boolean('is_swapped').default(false).notNull(),
    status: varchar('status', { length: 30 }).default('scheduled').notNull(),
    alternativeMealIds: jsonb('alternative_meal_ids').default([]).notNull(),
    deliveryAddressType: varchar('delivery_address_type', { length: 20 }),
    deliveryAddressOverride: jsonb('delivery_address_override'),
    isFinalized: boolean('is_finalized').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    customerIdx: index('daily_meals_customer_idx').on(table.customerId),
    subscriptionIdx: index('daily_meals_subscription_idx').on(table.subscriptionId),
  })
);

// Orders table: tracks delivery status for meals
export const orders = pgTable(
  'orders',
  {
    id: serial('id').primaryKey(),
    dailyMealId: integer('daily_meal_id').notNull(),
    customerId: integer('customer_id').notNull(),
    chefId: integer('chef_id'),
    mealId: varchar('meal_id', { length: 50 }).notNull(),
    mealName: varchar('meal_name', { length: 255 }).notNull(),
    status: varchar('status', { length: 30 }).default('scheduled').notNull(),
    statusHistory: jsonb('status_history').default([]).notNull(),
    date: varchar('date', { length: 10 }).notNull(),
    mealTime: varchar('meal_time', { length: 20 }).notNull(),
    isReviewed: boolean('is_reviewed').default(false).notNull(),
    deliveredAt: timestamp('delivered_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    customerIdx: index('orders_customer_idx').on(table.customerId),
    dailyMealIdx: index('orders_daily_meal_idx').on(table.dailyMealId),
  })
);

// Reviews table: stores customer reviews for orders
export const reviews = pgTable(
  'reviews',
  {
    id: serial('id').primaryKey(),
    orderId: integer('order_id').notNull(),
    customerId: integer('customer_id').notNull(),
    chefId: integer('chef_id').notNull(),
    mealId: varchar('meal_id', { length: 50 }).notNull(),
    mealName: varchar('meal_name', { length: 255 }).notNull(),
    rating: integer('rating').notNull(),
    comment: text('comment'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    isHidden: boolean('is_hidden').default(false).notNull(),
    hiddenReason: text('hidden_reason'),
  },
  (table) => ({
    orderIdx: index('reviews_order_idx').on(table.orderId),
    chefIdx: index('reviews_chef_idx').on(table.chefId),
  })
);

// Notifications table: persistent inbox + async queue state
export const notifications = pgTable(
  'notifications',
  {
    id: serial('id').primaryKey(),
    recipientId: integer('recipient_id').notNull(),
    recipientRole: userRoleEnum('recipient_role').notNull(),
    type: notificationTypeEnum('type').notNull(),
    channel: notificationChannelEnum('channel').default('in_app').notNull(),
    priority: notificationPriorityEnum('priority').default('normal').notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    actionUrl: text('action_url'),
    metadata: jsonb('metadata').default({}).notNull(),
    status: notificationStatusEnum('status').default('queued').notNull(),
    scheduledFor: timestamp('scheduled_for').defaultNow().notNull(),
    processingStartedAt: timestamp('processing_started_at'),
    lastAttemptAt: timestamp('last_attempt_at'),
    attempts: integer('attempts').default(0).notNull(),
    maxAttempts: integer('max_attempts').default(3).notNull(),
    deliveredAt: timestamp('delivered_at'),
    readAt: timestamp('read_at'),
    errorMessage: text('error_message'),
    dedupeKey: varchar('dedupe_key', { length: 255 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    recipientIdx: index('notifications_recipient_idx').on(table.recipientId, table.createdAt),
    queueIdx: index('notifications_queue_idx').on(table.status, table.priority, table.scheduledFor),
    dedupeKeyUnique: unique('notifications_dedupe_key_unique').on(table.dedupeKey),
  })
);

// Define relationships between tables
export const userRelations = relations(users, ({ many }) => ({
  // One user can have multiple subscriptions
  subscriptions: many(subscriptions),
  dishes: many(dishes),
  notifications: many(notifications),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  // Each subscription belongs to one user
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export const dishRelations = relations(dishes, ({ one }) => ({
  chef: one(users, {
    fields: [dishes.chefId],
    references: [users.id],
  }),
}));

export const notificationRelations = relations(notifications, ({ one }) => ({
  recipient: one(users, {
    fields: [notifications.recipientId],
    references: [users.id],
  }),
}));

// TypeScript types extracted from schema (for type safety)
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

export type Dish = typeof dishes.$inferSelect;
export type NewDish = typeof dishes.$inferInsert;

export type DailyMeal = typeof dailyMeals.$inferSelect;
export type NewDailyMeal = typeof dailyMeals.$inferInsert;

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

// Enum types for TypeScript
export type UserRole = 'customer' | 'chef' | 'delivery' | 'admin';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type NotificationType =
  | 'subscription_success'
  | 'payment_failed'
  | 'meal_reminder'
  | 'daily_meal_count'
  | 'skip_swap_deadline'
  | 'delivery_update'
  | 'new_subscriber'
  | 'chef_menu_update'
  | 'chef_pending_approval'
  | 'chef_approved'
  | 'system_alert';
export type NotificationPriority = 'normal' | 'critical';
export type NotificationStatus = 'queued' | 'processing' | 'delivered' | 'failed';
export type NotificationChannel = 'in_app';
