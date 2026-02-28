import express from 'express';
import {
  attachPaymentOrder,
  createDeliveryEntries,
  createPendingSubscription,
  getActiveSubscriptionForUser,
  getAvailableChefsByPincode,
  getChefPlans,
  getCustomerProfileByUserId,
  getDeliveryById,
  getPlanById,
  getSubscriptionByOrderId,
  updateDeliveryAddress,
  updateDeliveryStatus,
  activateSubscription,
} from '../models/marketplaceQueries.js';
import { emitNotification } from '../services/notificationService.js';

const getNextCycleDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(0, 0, 0, 0);
  return d;
};

const beforePreviousDayCutoff = (deliveryDate: Date) => {
  const cutoff = new Date(deliveryDate);
  cutoff.setDate(cutoff.getDate() - 1);
  cutoff.setHours(20, 0, 0, 0);
  return new Date() < cutoff;
};

export const listChefs = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }

  const profile = await getCustomerProfileByUserId(req.user.userId);
  if (!profile) {
    res.status(400).json({ success: false, message: 'Complete customer profile first' });
    return;
  }

  const chefs = await getAvailableChefsByPincode(profile.pincode);
  res.status(200).json({ success: true, chefs });
};

export const listChefPlans = async (req: express.Request, res: express.Response): Promise<void> => {
  const chefId = Number(req.params.id);
  if (Number.isNaN(chefId)) {
    res.status(400).json({ success: false, message: 'Invalid chef id' });
    return;
  }

  const plans = await getChefPlans(chefId);
  res.status(200).json({ success: true, plans });
};

export const createSubscriptionPending = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user || req.user.role !== 'customer') {
    res.status(403).json({ success: false, message: 'Customer access required' });
    return;
  }

  const { planId } = req.body as { planId?: number };
  if (!planId) {
    res.status(400).json({ success: false, message: 'planId is required' });
    return;
  }

  const existing = await getActiveSubscriptionForUser(req.user.userId);
  if (existing) {
    res.status(409).json({ success: false, message: 'Active or pending subscription already exists' });
    return;
  }

  const [plan, profile] = await Promise.all([getPlanById(planId), getCustomerProfileByUserId(req.user.userId)]);
  if (!plan || !profile) {
    res.status(400).json({ success: false, message: 'Valid plan and customer profile are required' });
    return;
  }

  const subscription = await createPendingSubscription({
    userId: req.user.userId,
    chefId: plan.chefId,
    planId: plan.id,
    planName: plan.planName,
    mealsPerWeek: 7,
    priceInCents: plan.monthlyPrice,
    priceSnapshot: plan.monthlyPrice,
    deliveryAddress: profile.address,
    postalCode: profile.pincode,
    city: 'NA',
    status: 'pending',
    nextBillingDate: getNextCycleDate(),
    startDate: getNextCycleDate(),
  });

  emitNotification({
    userId: req.user.userId,
    type: 'subscription_created',
    title: 'Subscription created',
    message: 'Subscription created. Complete payment to activate.',
    metadata: { subscriptionId: subscription.id },
  });

  res.status(201).json({ success: true, subscription });
};

export const createOrder = async (req: express.Request, res: express.Response): Promise<void> => {
  const { subscriptionId } = req.body as { subscriptionId?: number };
  if (!subscriptionId) {
    res.status(400).json({ success: false, message: 'subscriptionId is required' });
    return;
  }

  const orderId = `order_${Date.now()}_${subscriptionId}`;
  await attachPaymentOrder(subscriptionId, orderId);
  res.status(201).json({ success: true, orderId });
};

export const paymentWebhook = async (req: express.Request, res: express.Response): Promise<void> => {
  const { orderId, paymentId, signature } = req.body as { orderId?: string; paymentId?: string; signature?: string };
  if (!orderId || !paymentId || !signature) {
    res.status(400).json({ success: false, message: 'orderId, paymentId, signature are required' });
    return;
  }

  if (signature !== `valid_${orderId}`) {
    res.status(401).json({ success: false, message: 'Invalid webhook signature' });
    return;
  }

  const subscription = await getSubscriptionByOrderId(orderId);
  if (!subscription) {
    res.status(404).json({ success: false, message: 'Subscription not found for order' });
    return;
  }

  if (subscription.status === 'active') {
    res.status(200).json({ success: true, message: 'Already processed' });
    return;
  }

  const active = await activateSubscription(subscription.id, paymentId);
  if (!active || !active.chefId) {
    res.status(500).json({ success: false, message: 'Failed to activate subscription' });
    return;
  }

  const schedule = [1, 2, 3, 4, 5, 6, 7].map((d) => {
    const date = new Date();
    date.setDate(date.getDate() + d);
    return {
      subscriptionId: active.id,
      chefId: active.chefId!,
      customerId: active.userId,
      deliveryDate: date,
      addressSnapshot: active.deliveryAddress,
      mealType: 'standard',
      status: 'scheduled' as const,
    };
  });

  await createDeliveryEntries(schedule);

  emitNotification({ userId: active.userId, type: 'subscription_activated', title: 'Subscription activated', message: 'Subscription activated successfully' });
  emitNotification({ userId: active.chefId, type: 'new_subscriber', title: 'New subscriber', message: 'New subscriber added' });

  res.status(200).json({ success: true, message: 'Webhook processed' });
};

export const skipDelivery = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const deliveryId = Number(req.params.id);
  const delivery = await getDeliveryById(deliveryId);
  if (!delivery) {
    res.status(404).json({ success: false, message: 'Delivery not found' });
    return;
  }
  if (delivery.customerId !== req.user.userId) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }
  if (!beforePreviousDayCutoff(delivery.deliveryDate)) {
    res.status(400).json({ success: false, message: 'Cutoff time passed' });
    return;
  }
  const updated = await updateDeliveryStatus(deliveryId, 'skipped');
  emitNotification({ userId: delivery.chefId, type: 'delivery_skipped', title: 'Meal skipped', message: `Meal skipped for ${delivery.deliveryDate.toISOString().slice(0, 10)}` });
  res.status(200).json({ success: true, delivery: updated });
};

export const changeDeliveryAddress = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Not authenticated' });
    return;
  }
  const deliveryId = Number(req.params.id);
  const { address } = req.body as { address?: string };
  const delivery = await getDeliveryById(deliveryId);
  if (!delivery || !address) {
    res.status(400).json({ success: false, message: 'Valid delivery and address are required' });
    return;
  }
  if (delivery.customerId !== req.user.userId) {
    res.status(403).json({ success: false, message: 'Access denied' });
    return;
  }
  if (!beforePreviousDayCutoff(delivery.deliveryDate)) {
    res.status(400).json({ success: false, message: 'Cutoff time passed' });
    return;
  }
  const updated = await updateDeliveryAddress(deliveryId, address);
  emitNotification({ userId: delivery.chefId, type: 'delivery_address_changed', title: 'Delivery address updated', message: 'Delivery address has been updated by customer' });
  res.status(200).json({ success: true, delivery: updated });
};

export const markDelivered = async (req: express.Request, res: express.Response): Promise<void> => {
  if (!req.user || req.user.role !== 'chef') {
    res.status(403).json({ success: false, message: 'Chef access required' });
    return;
  }

  const deliveryId = Number(req.params.id);
  const delivery = await getDeliveryById(deliveryId);
  if (!delivery || delivery.chefId !== req.user.userId) {
    res.status(404).json({ success: false, message: 'Delivery not found' });
    return;
  }

  const updated = await updateDeliveryStatus(deliveryId, 'delivered');
  emitNotification({ userId: delivery.customerId, type: 'meal_delivered', title: 'Meal delivered', message: 'Meal delivered successfully' });
  res.status(200).json({ success: true, delivery: updated });
};
