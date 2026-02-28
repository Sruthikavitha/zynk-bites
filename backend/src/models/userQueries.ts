import { eq } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { users, customerProfiles, NewUser, User, NewCustomerProfile, CustomerProfile } from './schema.js';

// Fetch user by email (for login lookup)
export const getUserByEmail = async (email: string): Promise<User | undefined> => {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return result[0];
};

// Fetch user by ID
export const getUserById = async (id: number): Promise<User | undefined> => {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
};

// Check if phone already exists
export const phoneExists = async (phone: string): Promise<boolean> => {
  const db = getDb();
  const result = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return result.length > 0;
};

// Create a new user in database
export const createUser = async (userData: NewUser): Promise<User> => {
  const db = getDb();
  const result = await db.insert(users).values({
    ...userData,
    email: userData.email.toLowerCase(),
  }).returning();
  return result[0];
};

// Update user data by ID
export const updateUser = async (id: number, updates: Partial<NewUser>): Promise<User | undefined> => {
  const db = getDb();
  const result = await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, id)).returning();
  return result[0];
};

// Delete user by ID
export const deleteUser = async (id: number): Promise<void> => {
  const db = getDb();
  await db.delete(users).where(eq(users.id, id));
};

// Check if email already exists
export const emailExists = async (email: string): Promise<boolean> => {
  const user = await getUserByEmail(email.toLowerCase());
  return !!user;
};

// --- Customer Profile Queries ---

// Get customer profile by user ID
export const getCustomerProfile = async (userId: number): Promise<CustomerProfile | undefined> => {
  const db = getDb();
  const result = await db.select().from(customerProfiles).where(eq(customerProfiles.userId, userId)).limit(1);
  return result[0];
};

// Create customer profile
export const createCustomerProfile = async (profileData: NewCustomerProfile): Promise<CustomerProfile> => {
  const db = getDb();
  const result = await db.insert(customerProfiles).values(profileData).returning();
  return result[0];
};

// Update customer profile
export const updateCustomerProfile = async (userId: number, updates: Partial<NewCustomerProfile>): Promise<CustomerProfile | undefined> => {
  const db = getDb();
  const result = await db.update(customerProfiles).set({ ...updates, updatedAt: new Date() }).where(eq(customerProfiles.userId, userId)).returning();
  return result[0];
};
