/**
 * Dish Queries
 * Database operations for dishes
 */

import db from "../config/database.js";
import type { Dish } from "../types/index.js";

/**
 * Get all active dishes from the database
 * For the frontend mock API
 */
export const getAllDishes = (): Dish[] => {
  try {
    // If using real database (Drizzle ORM), use query like:
    // return db.query.dishes.findMany({ where: eq(dishes.isActive, true) });

    // For now, return sample dishes for demonstration
    return getSampleDishes();
  } catch (error) {
    console.error("Error fetching dishes:", error);
    return getSampleDishes();
  }
};

/**
 * Sample dishes for development
 */
const getSampleDishes = (): Dish[] => {
  return [
    {
      id: "dish-1",
      chefId: "chef-1",
      name: "Grilled Chicken Breast with Quinoa",
      description: "Lean protein with complete amino acids",
      category: "non-veg",
      nutritionalInfo: {
        calories: 450,
        protein: 42,
        carbs: 38,
        fat: 8,
      },
      allowsCustomization: true,
      customizationOptions: [
        { id: "opt-1", name: "Extra garlic", type: "add" },
        { id: "opt-2", name: "Less oil", type: "adjust" },
      ],
      isActive: true,
    },
    {
      id: "dish-2",
      chefId: "chef-1",
      name: "Veggie Buddha Bowl",
      description: "Mixed vegetables with tofu and tahini dressing",
      category: "veg",
      nutritionalInfo: {
        calories: 380,
        protein: 18,
        carbs: 48,
        fat: 12,
      },
      allowsCustomization: true,
      customizationOptions: [
        { id: "opt-3", name: "Extra tofu", type: "add" },
        { id: "opt-4", name: "No tahini", type: "remove" },
      ],
      isActive: true,
    },
    {
      id: "dish-3",
      chefId: "chef-2",
      name: "Salmon with Sweet Potato",
      description: "Omega-3 rich fish with complex carbs",
      category: "non-veg",
      nutritionalInfo: {
        calories: 520,
        protein: 38,
        carbs: 42,
        fat: 18,
      },
      allowsCustomization: true,
      customizationOptions: [
        { id: "opt-5", name: "Lemon zest", type: "add" },
        { id: "opt-6", name: "More herbs", type: "add" },
      ],
      isActive: true,
    },
    {
      id: "dish-4",
      chefId: "chef-2",
      name: "Paneer Tikka Masala",
      description: "Cottage cheese in aromatic tomato sauce",
      category: "veg",
      nutritionalInfo: {
        calories: 480,
        protein: 22,
        carbs: 32,
        fat: 28,
      },
      allowsCustomization: true,
      customizationOptions: [
        { id: "opt-7", name: "Less cream", type: "adjust" },
        { id: "opt-8", name: "More spice", type: "adjust" },
      ],
      isActive: true,
    },
    {
      id: "dish-5",
      chefId: "chef-3",
      name: "Oatmeal with Berries",
      description: "High fiber breakfast with antioxidants",
      category: "veg",
      nutritionalInfo: {
        calories: 320,
        protein: 12,
        carbs: 52,
        fat: 6,
      },
      allowsCustomization: true,
      customizationOptions: [
        { id: "opt-9", name: "Extra berries", type: "add" },
        { id: "opt-10", name: "Honey drizzle", type: "add" },
      ],
      isActive: true,
    },
    {
      id: "dish-6",
      chefId: "chef-3",
      name: "Egg White Omelet with Spinach",
      description: "Lean protein breakfast high in iron",
      category: "non-veg",
      nutritionalInfo: {
        calories: 280,
        protein: 32,
        carbs: 8,
        fat: 12,
      },
      allowsCustomization: true,
      customizationOptions: [
        { id: "opt-11", name: "Extra cheese", type: "add" },
        { id: "opt-12", name: "More vegetables", type: "add" },
      ],
      isActive: true,
    },
    {
      id: "dish-7",
      chefId: "chef-1",
      name: "Lentil Dal with Brown Rice",
      description: "Plant-based protein with complex carbs",
      category: "veg",
      nutritionalInfo: {
        calories: 420,
        protein: 20,
        carbs: 56,
        fat: 8,
      },
      allowsCustomization: true,
      customizationOptions: [
        { id: "opt-13", name: "Extra ghee", type: "add" },
        { id: "opt-14", name: "Mild spice", type: "adjust" },
      ],
      isActive: true,
    },
    {
      id: "dish-8",
      chefId: "chef-2",
      name: "Grilled Fish Fillet with Broccoli",
      description: "Low-calorie lean protein",
      category: "non-veg",
      nutritionalInfo: {
        calories: 340,
        protein: 40,
        carbs: 20,
        fat: 10,
      },
      allowsCustomization: true,
      customizationOptions: [
        { id: "opt-15", name: "Lemon pepper", type: "add" },
        { id: "opt-16", name: "Garlic butter", type: "add" },
      ],
      isActive: true,
    },
    {
      id: "dish-9",
      chefId: "chef-3",
      name: "Chickpea Salad",
      description: "Vegan protein-rich lunch option",
      category: "veg",
      nutritionalInfo: {
        calories: 360,
        protein: 16,
        carbs: 44,
        fat: 14,
      },
      allowsCustomization: true,
      customizationOptions: [
        { id: "opt-17", name: "Extra tahini", type: "add" },
        { id: "opt-18", name: "Feta cheese", type: "add" },
      ],
      isActive: true,
    },
    {
      id: "dish-10",
      chefId: "chef-1",
      name: "Turkey Meatballs with Zucchini Noodles",
      description: "Low-carb high-protein dinner",
      category: "non-veg",
      nutritionalInfo: {
        calories: 380,
        protein: 38,
        carbs: 18,
        fat: 16,
      },
      allowsCustomization: true,
      customizationOptions: [
        { id: "opt-19", name: "Marinara sauce", type: "add" },
        { id: "opt-20", name: "Parmesan cheese", type: "add" },
      ],
      isActive: true,
    },
  ];
};
