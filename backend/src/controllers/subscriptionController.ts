import express from 'express';
import {
  getUserSubscriptions,
  getSubscriptionById,
  getActiveSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  updateLockStatus,
} from '../models/subscriptionQueries.js';
import {
  isSkipSwapLockedByTime,
  getNextLockTime,
  getNextBillingDate,
  validateSubscriptionData,
} from '../utils/subscriptionUtils.js';

// Create a new subscription for the logged-in customer
export const createNewSubscription = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { planName, mealsPerWeek, priceInCents, deliveryAddress, postalCode, city } = req.body;

    // Validate subscription data
    const validation = validateSubscriptionData({
      planName,
      mealsPerWeek,
      priceInCents,
      deliveryAddress,
      postalCode,
      city,
    });

    if (!validation.valid) {
      res.status(400).json({ success: false, message: validation.error });
      return;
    }

    // Check if user already has an active subscription
    const existing = await getActiveSubscription(req.user.userId);
    if (existing) {
      res.status(409).json({ success: false, message: 'User already has an active subscription' });
      return;
    }

    // Create new subscription with next billing date
    const subscription = await createSubscription({
      userId: req.user.userId,
      planName,
      mealsPerWeek,
      priceInCents,
      deliveryAddress,
      postalCode,
      city,
      status: 'active',
      nextBillingDate: getNextBillingDate(),
      isSkipSwapLocked: isSkipSwapLockedByTime(),
      lockAppliedAt: isSkipSwapLockedByTime() ? new Date() : null,
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      subscription,
    });
  } catch (error: any) {
    console.error('Create subscription error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get all subscriptions for logged-in user
export const getSubscriptions = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    // Fetch all user subscriptions
    const subs = await getUserSubscriptions(req.user.userId);

    res.status(200).json({
      success: true,
      count: subs.length,
      subscriptions: subs,
    });
  } catch (error: any) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Get a specific subscription by ID
export const getSubscription = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const subscription = await getSubscriptionById(parseInt(id));

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Verify user owns this subscription
    if (subscription.userId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    res.status(200).json({
      success: true,
      subscription,
    });
  } catch (error: any) {
    console.error('Get subscription error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Update subscription address (allowed before lock time)
export const updateAddress = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { deliveryAddress, postalCode, city } = req.body;

    // Validate required fields
    if (!deliveryAddress || !postalCode || !city) {
      res.status(400).json({ success: false, message: 'deliveryAddress, postalCode, and city are required' });
      return;
    }

    const subscription = await getSubscriptionById(parseInt(id));

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Verify user owns this subscription
    if (subscription.userId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Check if skip/swap is locked
    if (subscription.isSkipSwapLocked) {
      res.status(423).json({ success: false, message: 'Address changes are locked (after 8 PM Friday)' });
      return;
    }

    // Update address
    const updated = await updateSubscription(subscription.id, {
      deliveryAddress,
      postalCode,
      city,
    });

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      subscription: updated,
    });
  } catch (error: any) {
    console.error('Update address error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Skip next week's meal (allowed before lock time)
export const skipMeal = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const subscription = await getSubscriptionById(parseInt(id));

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Verify user owns this subscription
    if (subscription.userId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Check if skip/swap is locked
    if (subscription.isSkipSwapLocked) {
      res.status(423).json({
        success: false,
        message: 'Meal skipping is locked (after 8 PM Friday). Available after Sunday.',
        nextAvailableAt: getNextLockTime(),
      });
      return;
    }

    // In production, this would mark the meal as skipped in a separate meals table
    // For MVP, we just return success
    res.status(200).json({
      success: true,
      message: 'Meal skipped successfully',
      subscription,
    });
  } catch (error: any) {
    console.error('Skip meal error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Swap meal for next week (allowed before lock time)
export const swapMeal = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const { newMealId } = req.body;

    if (!newMealId) {
      res.status(400).json({ success: false, message: 'newMealId is required' });
      return;
    }

    const subscription = await getSubscriptionById(parseInt(id));

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Verify user owns this subscription
    if (subscription.userId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Check if skip/swap is locked
    if (subscription.isSkipSwapLocked) {
      res.status(423).json({
        success: false,
        message: 'Meal swapping is locked (after 8 PM Friday). Available after Sunday.',
        nextAvailableAt: getNextLockTime(),
      });
      return;
    }

    // In production, this would update the meal record in a meals table
    // For MVP, we just return success
    res.status(200).json({
      success: true,
      message: 'Meal swapped successfully',
      subscription,
    });
  } catch (error: any) {
    console.error('Swap meal error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Pause subscription (no time restriction)
export const pauseSub = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const subscription = await getSubscriptionById(parseInt(id));

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Verify user owns this subscription
    if (subscription.userId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Pause subscription
    const updated = await pauseSubscription(subscription.id);

    res.status(200).json({
      success: true,
      message: 'Subscription paused successfully',
      subscription: updated,
    });
  } catch (error: any) {
    console.error('Pause subscription error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Resume paused subscription (no time restriction)
export const resumeSub = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const subscription = await getSubscriptionById(parseInt(id));

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Verify user owns this subscription
    if (subscription.userId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    if (subscription.status !== 'paused') {
      res.status(400).json({ success: false, message: 'Only paused subscriptions can be resumed' });
      return;
    }

    // Resume with new billing date
    const updated = await resumeSubscription(subscription.id, getNextBillingDate());

    res.status(200).json({
      success: true,
      message: 'Subscription resumed successfully',
      subscription: updated,
    });
  } catch (error: any) {
    console.error('Resume subscription error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Cancel subscription (no time restriction)
export const cancelSub = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated' });
      return;
    }

    const { id } = req.params;
    const subscription = await getSubscriptionById(parseInt(id));

    if (!subscription) {
      res.status(404).json({ success: false, message: 'Subscription not found' });
      return;
    }

    // Verify user owns this subscription
    if (subscription.userId !== req.user.userId) {
      res.status(403).json({ success: false, message: 'Access denied' });
      return;
    }

    // Cancel subscription
    const updated = await cancelSubscription(subscription.id);

    res.status(200).json({
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: updated,
    });
  } catch (error: any) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

// Check current lock status (helper endpoint)
export const checkLockStatus = async (req: express.Request, res: express.Response): Promise<void> => {
  try {
    const isLocked = isSkipSwapLockedByTime();

    res.status(200).json({
      success: true,
      isLocked,
      message: isLocked ? 'Skip/swap operations are currently locked' : 'Skip/swap operations are allowed',
      nextAvailableAt: isLocked ? getNextLockTime() : null,
    });
  } catch (error: any) {
    console.error('Check lock status error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
