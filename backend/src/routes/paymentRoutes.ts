import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment, verifyRazorpayAndCreateSubscription } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/razorpay/order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);
router.post("/razorpay/verify-and-subscribe", verifyRazorpayAndCreateSubscription);

export default router;
