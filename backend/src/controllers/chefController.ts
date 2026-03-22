import type { Request, Response } from 'express';
import { createDish, getDishesByChefId } from '../models/dishQueries.js';
import { getUserById } from '../models/userQueries.js';
import type { Dish } from '../models/schema.js';

const mapDish = (dish: Dish) => ({
  id: String(dish.id),
  chefId: String(dish.chefId),
  name: dish.name,
  description: dish.description,
  category: dish.category === 'veg' ? 'veg' : 'non-veg',
  nutritionalInfo: {
    calories: dish.calories,
    protein: dish.protein,
    carbs: dish.carbs,
    fat: dish.fat,
  },
  allowsCustomization: dish.allowsCustomization,
  customizationOptions: [],
  imageUrl: dish.imageUrl || undefined,
  isActive: dish.isActive,
  isSpecial: dish.isSpecial,
});

const requireChefUserId = (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId || typeof userId !== 'number') {
    res.status(401).json({ success: false, message: 'Chef not authenticated' });
    return null;
  }
  return userId;
};

export const getMyChefDishes = async (req: Request, res: Response) => {
  try {
    const chefId = requireChefUserId(req, res);
    if (!chefId) return;

    const chef = await getUserById(chefId);
    if (!chef || chef.role !== 'chef') {
      return res.status(404).json({ success: false, message: 'Chef not found' });
    }

    const dishes = await getDishesByChefId(chefId);
    return res.json({ success: true, data: dishes.map(mapDish) });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'Failed to load dishes' });
  }
};

export const createMyChefDish = async (req: Request, res: Response) => {
  try {
    const chefId = requireChefUserId(req, res);
    if (!chefId) return;

    const chef = await getUserById(chefId);
    if (!chef || chef.role !== 'chef') {
      return res.status(404).json({ success: false, message: 'Chef not found' });
    }

    const { name, description, category, nutritionalInfo, allowsCustomization, imageUrl } = req.body || {};

    if (!name?.trim() || !description?.trim()) {
      return res.status(400).json({ success: false, message: 'Dish name and description are required' });
    }

    if (!['veg', 'non-veg'].includes(category)) {
      return res.status(400).json({ success: false, message: 'Dish category must be veg or non-veg' });
    }

    const calories = Number(nutritionalInfo?.calories);
    const protein = Number(nutritionalInfo?.protein);
    const carbs = Number(nutritionalInfo?.carbs);
    const fat = Number(nutritionalInfo?.fat);

    if ([calories, protein, carbs, fat].some((value) => Number.isNaN(value) || value < 0)) {
      return res.status(400).json({ success: false, message: 'Valid nutritional info is required' });
    }

    const dish = await createDish({
      chefId,
      name: name.trim(),
      description: description.trim(),
      category,
      calories,
      protein,
      carbs,
      fat,
      allowsCustomization: Boolean(allowsCustomization),
      isSpecial: false,
      imageUrl: imageUrl?.trim() || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      data: mapDish(dish),
      message: 'Dish added successfully',
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error?.message || 'Failed to add dish' });
  }
};
