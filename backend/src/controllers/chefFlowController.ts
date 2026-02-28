import express from 'express';
import { and, eq } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { createChefProfile, getChefDeliveriesByDate, upsertMealPlan } from '../models/marketplaceQueries.js';
import { chefProfiles, users } from '../models/schema.js';
import { emitNotification } from '../services/notificationService.js';

export const completeChefProfile = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user || req.user.role !== 'chef') {
    res.status(403).json({ success: false, message: 'Chef access required' });
    return;
  }

  const { kitchenName, fssaiNumber, serviceZones, dailyCapacity, bankDetails } = req.body;
  if (!kitchenName || !fssaiNumber || !serviceZones || !dailyCapacity || !bankDetails) {
    res.status(400).json({ success: false, message: 'All profile fields are required' });
    return;
  }

  const profile = await createChefProfile({
    userId: req.user.userId,
    kitchenName,
    fssaiNumber,
    serviceZones: Array.isArray(serviceZones) ? serviceZones.join(',') : String(serviceZones),
    dailyCapacity: Number(dailyCapacity),
    bankDetails,
    verificationStatus: 'pending',
  });

  emitNotification({ userId: 1, type: 'chef_awaiting_approval', title: 'New chef awaiting approval', message: `Chef ${kitchenName} submitted profile` });

  res.status(201).json({ success: true, profile });
};

export const approveChef = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required' });
    return;
  }

  const chefId = Number(req.params.id);
  const db = getDb();

  const chefProfileRows = await db
    .update(chefProfiles)
    .set({ verificationStatus: 'approved', updatedAt: new Date() })
    .where(eq(chefProfiles.userId, chefId))
    .returning();

  await db.update(users).set({ status: 'active', updatedAt: new Date() }).where(and(eq(users.id, chefId), eq(users.role, 'chef')));

  if (chefProfileRows.length === 0) {
    res.status(404).json({ success: false, message: 'Chef profile not found' });
    return;
  }

  emitNotification({ userId: chefId, type: 'chef_approved', title: 'Kitchen approved', message: 'Your kitchen is approved. You can now publish meal plans.' });

  res.status(200).json({ success: true, profile: chefProfileRows[0] });
};

export const addMealPlan = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user || req.user.role !== 'chef') {
    res.status(403).json({ success: false, message: 'Chef access required' });
    return;
  }

  const db = getDb();
  const profile = await db.select().from(chefProfiles).where(eq(chefProfiles.userId, req.user.userId)).limit(1);
  if (!profile[0] || profile[0].verificationStatus !== 'approved') {
    res.status(403).json({ success: false, message: 'Chef must be approved before adding plans' });
    return;
  }

  const { planName, price, frequency, type, availability } = req.body;
  if (!planName || !price || !frequency || !type) {
    res.status(400).json({ success: false, message: 'planName, price, frequency, type are required' });
    return;
  }

  const plan = await upsertMealPlan({
    chefId: req.user.userId,
    planName,
    monthlyPrice: Number(price),
    frequency,
    mealType: type,
    availability: availability ?? true,
  });

  res.status(201).json({ success: true, plan });
};

export const getChefDeliveries = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user || req.user.role !== 'chef') {
    res.status(403).json({ success: false, message: 'Chef access required' });
    return;
  }

  const date = req.query.date ? new Date(String(req.query.date)) : new Date();
  const deliveries = await getChefDeliveriesByDate(req.user.userId, date);
  res.status(200).json({ success: true, deliveries });
};
