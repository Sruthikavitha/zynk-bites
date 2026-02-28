import { pgTable, text, varchar, timestamp, integer, boolean, serial, pgEnum, index, unique, real } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enum for user roles
export const userRoleEnum = pgEnum('user_role', ['customer', 'chef', 'delivery', 'admin']);

// Enum for subscription status
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'paused', 'cancelled']);

// Enum for user account status
export const userStatusEnum = pgEnum('user_status', ['pending', 'active', 'suspended']);

// Users table
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

// Customer profiles table (separate from users)
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

// Subscriptions table
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

// Relations
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

// TypeScript types
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CustomerProfile = typeof customerProfiles.$inferSelect;
export type NewCustomerProfile = typeof customerProfiles.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;
export type UserRole = 'customer' | 'chef' | 'delivery' | 'admin';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';
export type UserStatus = 'pending' | 'active' | 'suspended';
