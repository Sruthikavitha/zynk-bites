import { eq } from 'drizzle-orm';
import { getDb } from '../config/database.js';
import { users, dishes } from '../models/schema.js';
import { hashPassword } from '../utils/bcrypt.js';
import { sampleChefs, sampleDishes } from './sampleCatalog.js';

export const seedCatalogIfEmpty = async () => {
  const db = getDb();

  const existingChefs = await db.select().from(users).where(eq(users.role, 'chef'));
  const existingEmails = new Set(existingChefs.map((chef) => chef.email));
  const missingChefs = sampleChefs.filter((chef) => !existingEmails.has(chef.email));

  if (missingChefs.length > 0) {
    const passwordHash = await hashPassword('chef123');
    const chefRows = missingChefs.map((chef) => ({
      fullName: chef.fullName,
      email: chef.email,
      passwordHash,
      role: 'chef' as const,
      chefBusinessName: chef.specialty,
      specialty: chef.specialty,
      bio: chef.bio,
      serviceArea: chef.serviceArea,
      rating: chef.rating,
      reviewCount: chef.reviewCount,
      phone: null,
      isActive: true,
    }));

    await db.insert(users).values(chefRows);
  }

  const existingDishes = await db.select({ id: dishes.id }).from(dishes).limit(1);
  if (existingDishes.length === 0) {
    const chefs = await db.select().from(users).where(eq(users.role, 'chef'));
    const chefIdMap = new Map<string, number>();
    chefs.forEach((chef) => chefIdMap.set(chef.email, chef.id));

    const dishRows = sampleDishes
      .map((dish) => {
        const chefId = chefIdMap.get(dish.chefEmail);
        if (!chefId) return null;
        return {
          chefId,
          name: dish.name,
          description: dish.description,
          category: dish.category,
          calories: dish.calories,
          protein: dish.protein,
          carbs: dish.carbs,
          fat: dish.fat,
          allowsCustomization: dish.allowsCustomization ?? false,
          isSpecial: dish.isSpecial ?? false,
          imageUrl: dish.imageUrl || null,
          isActive: true,
        };
      })
      .filter(Boolean) as Array<{
        chefId: number;
        name: string;
        description: string;
        category: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        allowsCustomization: boolean;
        isSpecial: boolean;
        imageUrl: string | null;
        isActive: boolean;
      }>;

    if (dishRows.length > 0) {
      await db.insert(dishes).values(dishRows);
    }
  }
};
