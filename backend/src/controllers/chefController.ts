import { Request, Response } from 'express';
import { db } from '../config/database.js';
import { chefs, chefDeliveryZones, menus, meals, dailyMenuItems, users } from '../models/schema.js';
import { eq, and, sql } from 'drizzle-orm';

// Get available chefs for a pincode
export const getAvailableChefs = async (req: Request, res: Response) => {
  try {
    const { pincode } = req.query;

    if (!pincode) {
      return res.status(400).json({ error: 'Pincode is required' });
    }

    // Find chefs who serve this pincode
    const availableChefs = await db
      .select({
        id: chefs.id,
        name: users.fullName,
        businessName: chefs.businessName,
        rating: chefs.rating,
        specialty: chefs.bio, // Using bio as specialty for now
        image: users.role, // Placeholder, normally user would have profile image
      })
      .from(chefs)
      .innerJoin(users, eq(chefs.userId, users.id))
      .innerJoin(chefDeliveryZones, eq(chefs.id, chefDeliveryZones.chefId))
      .where(and(
        eq(chefDeliveryZones.pincode, pincode as string),
        eq(chefs.isVerified, true), // Only verified chefs
        eq(users.isActive, true)
      ));

    res.json(availableChefs);
  } catch (error) {
    console.error('Error fetching chefs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Chef's structured menu
export const getChefMenu = async (req: Request, res: Response) => {
  try {
    const { chefId } = req.params;
    const { weekStart } = req.query;

    if (!weekStart) {
      return res.status(400).json({ error: 'weekStart date is required' });
    }

    // Get the menu for this week
    const menu = await db.query.menus.findFirst({
      where: and(
        eq(menus.chefId, parseInt(chefId)),
        eq(menus.weekStartDate, weekStart as string) // Ensure date format matches
      ),
      with: {
        dailyItems: {
          with: {
            meal: true
          }
        }
      }
    });

    if (!menu) {
      return res.status(404).json({ error: 'No menu found for this week' });
    }

    // Structure the response
    const formattedMenu = {
      menuId: menu.id,
      weekStart: menu.weekStartDate,
      status: menu.status,
      menuCardUrl: menu.menuCardUrl,
      days: {} as Record<string, any[]>
    };

    // Group meals by day
    if (menu.dailyItems) {
      menu.dailyItems.forEach(item => {
        const dayKey = item.dayOfWeek.toString(); // 0-6
        if (!formattedMenu.days[dayKey]) {
          formattedMenu.days[dayKey] = [];
        }
        formattedMenu.days[dayKey].push({
          mealId: item.meal.id,
          name: item.meal.name,
          description: item.meal.description,
          price: item.meal.price,
          image: item.meal.imageUrl,
          stock: item.stock,
          diet: item.meal.dietCategory
        });
      });
    }

    res.json(formattedMenu);
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Upload Menu Card
export const uploadMenuCard = async (req: Request, res: Response) => {
  try {
    const { chefId } = req.params;
    const { weekStart } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // In a real app, upload to S3/Cloudinary here.
    // For local dev, we'll assume multer saved it to 'uploads/' and we store the path.
    const menuCardUrl = `/uploads/${req.file.filename}`;

    // Find or Create Menu
    // We try to update existing menu for this week, or create a new draft
    
    // Note: upsert supported in newer drizzle, or use check-then-insert
    let menu = await db.query.menus.findFirst({
        where: and(
            eq(menus.chefId, parseInt(chefId)),
            eq(menus.weekStartDate, weekStart)
        )
    });

    if (menu) {
        await db.update(menus)
            .set({ menuCardUrl })
            .where(eq(menus.id, menu.id));
    } else {
        await db.insert(menus).values({
            chefId: parseInt(chefId),
            weekStartDate: weekStart, // Ensure this is a Date object or valid string
            menuCardUrl,
            status: 'draft'
        });
    }

    res.json({ success: true, url: menuCardUrl });

  } catch (error) {
    console.error('Error uploading menu card:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
