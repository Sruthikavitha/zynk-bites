import { pgTable, text, varchar, timestamp, integer, boolean, serial, pgEnum, index, unique, real, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['customer', 'chef', 'delivery', 'admin']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['pending', 'active', 'paused', 'cancelled']);
export const userStatusEnum = pgEnum('user_status', ['pending', 'active', 'suspended']);
export const chefVerificationStatusEnum = pgEnum('chef_verification_status', ['pending', 'approved', 'rejected']);
export const deliveryStatusEnum = pgEnum('delivery_status', ['scheduled', 'skipped', 'delivered']);

export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    fullName: varchar('full_name', { length: 255 }).notNull(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').default('customer').notNull(),
    chefBusinessName: varchar('chef_business_name', { length: 255 }),
    phone: varchar('phone', { length: 20 }),
    isActive: boolean('is_active').default(true).notNull(),
    isVerified: boolean('is_verified').default(false).notNull(),
    status: userStatusEnum('status').default('pending').notNull(),
    otpCode: varchar('otp_code', { length: 6 }),
    otpExpiresAt: timestamp('otp_expires_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    emailIdx: index('email_idx').on(table.email),
    roleIdx: index('role_idx').on(table.role),
    phoneIdx: index('phone_idx').on(table.phone),
  })
);

export const customerProfiles = pgTable(
  'customer_profiles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().unique(),
    address: text('address').notNull(),
    pincode: varchar('pincode', { length: 10 }).notNull(),
    lat: real('lat'),
    lng: real('lng'),
    preference: varchar('preference', { length: 50 }).default('vegetarian').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index('cp_user_id_idx').on(table.userId),
    pincodeIdx: index('cp_pincode_idx').on(table.pincode),
  })
);

export const chefProfiles = pgTable(
  'chef_profiles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull().unique(),
    kitchenName: varchar('kitchen_name', { length: 255 }).notNull(),
    fssaiNumber: varchar('fssai_number', { length: 50 }).notNull(),
    serviceZones: text('service_zones').notNull(),
    dailyCapacity: integer('daily_capacity').notNull(),
    bankDetails: text('bank_details').notNull(),
    verificationStatus: chefVerificationStatusEnum('verification_status').default('pending').notNull(),
    rating: real('rating').default(0).notNull(),
    deliveryWindow: varchar('delivery_window', { length: 100 }).default('12:00 PM - 2:00 PM').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    chefUserIdx: index('chef_user_idx').on(table.userId),
  })
);

export const mealPlans = pgTable('meal_plans', {
  id: serial('id').primaryKey(),
  chefId: integer('chef_id').notNull(),
  planName: varchar('plan_name', { length: 100 }).notNull(),
  monthlyPrice: integer('monthly_price').notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(),
  mealType: varchar('meal_type', { length: 50 }).notNull(),
  availability: boolean('availability').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const subscriptions = pgTable(
  'subscriptions',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id').notNull(),
    chefId: integer('chef_id'),
    planId: integer('plan_id'),
    planName: varchar('plan_name', { length: 100 }).notNull(),
    mealsPerWeek: integer('meals_per_week').notNull(),
    priceInCents: integer('price_in_cents').notNull(),
    priceSnapshot: integer('price_snapshot'),
    deliveryAddress: text('delivery_address').notNull(),
    postalCode: varchar('postal_code', { length: 20 }).notNull(),
    city: varchar('city', { length: 100 }).notNull(),
    status: subscriptionStatusEnum('status').default('pending').notNull(),
    startDate: timestamp('start_date'),
    nextBillingDate: timestamp('next_billing_date').notNull(),
    paymentOrderId: varchar('payment_order_id', { length: 150 }),
    paymentId: varchar('payment_id', { length: 150 }),
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

export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  subscriptionId: integer('subscription_id').notNull(),
  chefId: integer('chef_id').notNull(),
  customerId: integer('customer_id').notNull(),
  deliveryDate: timestamp('delivery_date').notNull(),
  addressSnapshot: text('address_snapshot').notNull(),
  mealType: varchar('meal_type', { length: 50 }).notNull(),
  status: deliveryStatusEnum('status').default('scheduled').notNull(),
  deliveredAt: timestamp('delivered_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  title: varchar('title', { length: 150 }).notNull(),
  message: text('message').notNull(),
  read: boolean('read').default(false).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const userRelations = relations(users, ({ many, one }) => ({
  subscriptions: many(subscriptions),
  profile: one(customerProfiles, {
    fields: [users.id],
    references: [customerProfiles.userId],
  }),
}));

export const customerProfileRelations = relations(customerProfiles, ({ one }) => ({
  user: one(users, {
    fields: [customerProfiles.userId],
    references: [users.id],
  }),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
}));

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type NewCustomerProfile = typeof customerProfiles.$inferInsert;
export type ChefProfile = typeof chefProfiles.$inferSelect;
export type NewChefProfile = typeof chefProfiles.$inferInsert;
export type MealPlan = typeof mealPlans.$inferSelect;
export type NewMealPlan = typeof mealPlans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type Delivery = typeof deliveries.$inferSelect;
export type NewDelivery = typeof deliveries.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type UserRole = 'customer' | 'chef' | 'delivery' | 'admin';
export type SubscriptionStatus = 'pending' | 'active' | 'paused' | 'cancelled';
export type UserStatus = 'pending' | 'active' | 'suspended';
