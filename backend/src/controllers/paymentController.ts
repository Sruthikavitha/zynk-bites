import Razorpay from "razorpay";
import crypto from "crypto";
import type { Request, Response } from "express";
import { getUserByEmail, createUser } from "../models/userQueries.js";
import { getActiveSubscription, createSubscription } from "../models/subscriptionQueries.js";
import { hashPassword } from "../utils/bcrypt.js";
import { getNextBillingDate, isSkipSwapLockedByTime } from "../utils/subscriptionUtils.js";
import { signToken } from "../utils/jwt.js";
import { ensureUpcomingMealsForCustomer } from "../services/mealPlannerService.js";

const getRazorpayClient = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error("Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export const createRazorpayOrder = async (req: Request, res: Response) => {
  try {
    const { amount, currency = "INR", receipt, notes } = req.body || {};

    if (!amount || Number.isNaN(Number(amount))) {
      return res.status(400).json({ success: false, error: "Amount is required" });
    }

    const amountInPaise = Math.round(Number(amount) * 100);
    const razorpay = getRazorpayClient();

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency,
      receipt: receipt || `zynk_${Date.now()}`,
      notes,
    });

    return res.json({
      success: true,
      data: {
        keyId: process.env.RAZORPAY_KEY_ID,
        order,
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to create Razorpay order",
    });
  }
};

export const verifyRazorpayPayment = (req: Request, res: Response) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Payment verification data missing" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, error: "Missing Razorpay secret" });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    const isValid = expectedSignature === razorpay_signature;

    if (!isValid) {
      return res.status(400).json({ success: false, error: "Invalid Razorpay signature" });
    }

    return res.json({ success: true, data: { verified: true } });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to verify Razorpay payment",
    });
  }
};

export const verifyRazorpayAndCreateSubscription = async (req: Request, res: Response) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customer,
      subscription,
    } = req.body || {};

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, error: "Payment verification data missing" });
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) {
      return res.status(500).json({ success: false, error: "Missing Razorpay secret" });
    }

    const payload = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(payload)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, error: "Invalid Razorpay signature" });
    }

    if (!customer?.email || !customer?.fullName) {
      return res.status(400).json({ success: false, error: "Customer details missing" });
    }

    if (
      !subscription?.planName ||
      !subscription?.mealsPerWeek ||
      subscription?.priceInCents === undefined ||
      !subscription?.deliveryAddress ||
      !subscription?.postalCode ||
      !subscription?.city
    ) {
      return res.status(400).json({ success: false, error: "Subscription details missing" });
    }

    let user = await getUserByEmail(customer.email);
    if (!user) {
      const randomPassword = crypto.randomBytes(16).toString("hex");
      const passwordHash = await hashPassword(randomPassword);
      user = await createUser({
        fullName: customer.fullName,
        email: customer.email,
        passwordHash,
        role: "customer",
        chefBusinessName: null,
        phone: customer.phone || null,
        isActive: true,
      });
    }

    const existing = await getActiveSubscription(user.id);
    if (existing) {
      return res.status(409).json({ success: false, error: "User already has an active subscription" });
    }

    const isLocked = isSkipSwapLockedByTime();
    const parsedChefId = subscription.chefId ? Number(subscription.chefId) : null;
    const chefIdValue = parsedChefId && !Number.isNaN(parsedChefId) ? parsedChefId : null;

    const createdSubscription = await createSubscription({
      userId: user.id,
      planName: subscription.planName,
      chefId: chefIdValue,
      mealsPerWeek: subscription.mealsPerWeek,
      priceInCents: subscription.priceInCents,
      deliveryAddress: subscription.deliveryAddress,
      postalCode: subscription.postalCode,
      city: subscription.city,
      status: "active",
      nextBillingDate: getNextBillingDate(),
      isSkipSwapLocked: isLocked,
      lockAppliedAt: isLocked ? new Date() : null,
    });

    try {
      await ensureUpcomingMealsForCustomer(user.id);
    } catch (seedError) {
      console.error("Failed to seed meals after payment:", seedError);
    }

    return res.json({
      success: true,
      data: {
        verified: true,
        token: signToken({
          userId: user.id,
          email: user.email,
          role: user.role,
        }),
        subscription: createdSubscription,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error?.message || "Failed to verify payment and create subscription",
    });
  }
};
