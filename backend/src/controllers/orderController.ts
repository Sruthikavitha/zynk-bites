import { Request, Response } from 'express';
import { db } from '../config/database.js';
import { orders, orderItems, chefs, meals, chefDeliveryZones, users } from '../models/schema.js';
import { eq, and, sql, inArray } from 'drizzle-orm';

// Create a new order
export const createOrder = async (req: Request, res: Response) => {
    try {
        const { customerId, chefId, items, deliveryAddress, deliveryPincode, deliveryDate } = req.body;

        // 1. Basic Validation
        if (!customerId || !chefId || !items || items.length === 0 || !deliveryDate) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // 2. Validate Delivery Zone
        const zone = await db.query.chefDeliveryZones.findFirst({
            where: and(
                eq(chefDeliveryZones.chefId, chefId),
                eq(chefDeliveryZones.pincode, deliveryPincode)
            )
        });

        if (!zone) {
            return res.status(400).json({ error: 'Chef does not deliver to this pincode' });
        }

        // 3. Validate Cutoff Time (8 PM previous day)
        const orderDate = new Date();
        const delivery = new Date(deliveryDate);
        const dayBeforeDelivery = new Date(delivery);
        dayBeforeDelivery.setDate(delivery.getDate() - 1);
        dayBeforeDelivery.setHours(20, 0, 0, 0); // 8 PM

        if (orderDate > dayBeforeDelivery) {
            return res.status(400).json({ error: 'Order cutoff time passed (8 PM previous day)' });
        }

        // 4. Validate Capacity
        // Count orders for this chef on this date
        const orderCountResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(orders)
            .where(and(
                eq(orders.chefId, chefId),
                eq(orders.deliveryDate, deliveryDate)
                // Note: deliveryDate string 'YYYY-MM-DD' usually works with date columns in postgres/drizzle
            ));

        const currentOrders = Number(orderCountResult[0].count);

        const chef = await db.query.chefs.findFirst({
            where: eq(chefs.id, chefId)
        });

        if (!chef || currentOrders >= chef.maxDailyCapacity) {
            return res.status(400).json({ error: 'Chef is fully booked for this date' });
        }

        // 5. Calculate Total Price & Verify Items
        let totalPrice = 0;
        const orderItemsData: any[] = [];

        // Fetch all meals in one go
        const mealIds = items.map((i: any) => i.mealId);
        const dbMeals = await db.select().from(meals).where(inArray(meals.id, mealIds));

        for (const item of items) {
            const meal = dbMeals.find(m => m.id === item.mealId);
            if (!meal) {
                return res.status(400).json({ error: `Meal ${item.mealId} not found` });
            }
            if (meal.chefId !== chefId) {
                return res.status(400).json({ error: `Meal ${meal.name} does not belong to this chef` });
            }

            totalPrice += meal.price * item.quantity;
            orderItemsData.push({
                mealId: meal.id,
                quantity: item.quantity,
                priceAtOrder: meal.price
            });
        }

        // 6. Transaction: Create Order & Items
        await db.transaction(async (tx) => {
            const [newOrder] = await tx.insert(orders).values({
                customerId,
                chefId,
                status: 'pending', // Pending payment usually
                totalPrice,
                deliveryAddress,
                deliveryPincode,
                deliveryDate: deliveryDate,
                orderDate: new Date(),
            }).returning();

            // Prepare order items with the new order ID
            const finalItems = orderItemsData.map(i => ({
                ...i,
                orderId: newOrder.id
            }));

            await tx.insert(orderItems).values(finalItems);
        });

        res.status(201).json({ success: true, message: 'Order placed successfully' });

    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Customer Order History
export const getCustomerOrders = async (req: Request, res: Response) => {
    try {
        const { customerId } = req.params;

        const customerOrders = await db.query.orders.findMany({
            where: eq(orders.customerId, parseInt(customerId)),
            orderBy: (orders, { desc }) => [desc(orders.orderDate)],
            with: {
                chef: {
                    with: {
                        user: true // To get chef name
                    }
                },
                items: {
                    with: {
                        meal: true
                    }
                }
            }
        });

        res.json(customerOrders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
