export type SampleChef = {
  fullName: string;
  email: string;
  specialty: string;
  bio: string;
  serviceArea: string;
  rating: number;
  reviewCount: number;
};

export type SampleDish = {
  chefEmail: string;
  name: string;
  description: string;
  category: 'veg' | 'non-veg';
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  allowsCustomization?: boolean;
  isSpecial?: boolean;
  imageUrl?: string;
};

export const sampleChefs: SampleChef[] = [
  {
    fullName: 'Chef Priya Sharma',
    email: 'priya@zynk.local',
    specialty: 'North Indian',
    bio: 'Butter gravies, slow-cooked dals, and homestyle classics.',
    serviceArea: 'Indiranagar',
    rating: 4.8,
    reviewCount: 124,
  },
  {
    fullName: 'Chef Arjun Patel',
    email: 'arjun@zynk.local',
    specialty: 'South Indian & Continental',
    bio: 'Crisp dosas, warm sambars, and fresh plates.',
    serviceArea: 'Koramangala',
    rating: 4.6,
    reviewCount: 92,
  },
  {
    fullName: 'Chef Meera Krishnan',
    email: 'meera@zynk.local',
    specialty: 'Healthy & Keto',
    bio: 'High-protein, low-carb meals without compromise.',
    serviceArea: 'HSR Layout',
    rating: 4.9,
    reviewCount: 156,
  },
  {
    fullName: 'Chef Rohan Das',
    email: 'rohan@zynk.local',
    specialty: 'Continental & Fusion',
    bio: 'Global comfort food with a modern twist.',
    serviceArea: 'MG Road',
    rating: 4.7,
    reviewCount: 101,
  },
];

export const sampleDishes: SampleDish[] = [
  {
    chefEmail: 'priya@zynk.local',
    name: 'Butter Chicken',
    description: 'Creamy tomato-based curry with tender chicken.',
    category: 'non-veg',
    calories: 640,
    protein: 32,
    carbs: 28,
    fat: 38,
    allowsCustomization: true,
    isSpecial: true,
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'priya@zynk.local',
    name: 'Paneer Butter Masala',
    description: 'Rich paneer curry finished with kasuri methi.',
    category: 'veg',
    calories: 560,
    protein: 22,
    carbs: 24,
    fat: 34,
    allowsCustomization: true,
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'priya@zynk.local',
    name: 'Dal Makhani',
    description: 'Slow-cooked black lentils with butter and cream.',
    category: 'veg',
    calories: 480,
    protein: 18,
    carbs: 45,
    fat: 20,
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'arjun@zynk.local',
    name: 'Masala Dosa',
    description: 'Crisp dosa filled with spiced potato masala.',
    category: 'veg',
    calories: 420,
    protein: 12,
    carbs: 68,
    fat: 12,
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-d23ad8411643?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'arjun@zynk.local',
    name: 'Idli & Sambar',
    description: 'Steamed idlis with tangy sambar and chutney.',
    category: 'veg',
    calories: 360,
    protein: 10,
    carbs: 60,
    fat: 8,
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'arjun@zynk.local',
    name: 'Tomato Rice',
    description: 'South Indian tomato rice with roasted spices.',
    category: 'veg',
    calories: 410,
    protein: 9,
    carbs: 70,
    fat: 10,
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-4314de63b5f3?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'meera@zynk.local',
    name: 'Grilled Chicken Bowl',
    description: 'Herb chicken, greens, and roasted veggies.',
    category: 'non-veg',
    calories: 520,
    protein: 45,
    carbs: 20,
    fat: 18,
    isSpecial: true,
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'meera@zynk.local',
    name: 'Keto Paneer Bowl',
    description: 'Paneer, broccoli, and pesto for clean fuel.',
    category: 'veg',
    calories: 490,
    protein: 28,
    carbs: 18,
    fat: 30,
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'meera@zynk.local',
    name: 'Power Salad',
    description: 'Leafy greens, quinoa, and citrus dressing.',
    category: 'veg',
    calories: 340,
    protein: 14,
    carbs: 38,
    fat: 12,
    allowsCustomization: true,
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'rohan@zynk.local',
    name: 'Thai Green Curry',
    description: 'Coconut curry with fresh vegetables.',
    category: 'veg',
    calories: 540,
    protein: 16,
    carbs: 42,
    fat: 30,
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'rohan@zynk.local',
    name: 'Butter Chicken with Naan',
    description: 'Classic butter chicken served with naan.',
    category: 'non-veg',
    calories: 680,
    protein: 34,
    carbs: 52,
    fat: 36,
    imageUrl: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=800&q=80',
  },
  {
    chefEmail: 'rohan@zynk.local',
    name: 'Veg Biryani',
    description: 'Fragrant basmati rice with mixed vegetables.',
    category: 'veg',
    calories: 520,
    protein: 12,
    carbs: 78,
    fat: 14,
    imageUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80',
  },
];

export const sampleMeals = [
  {
    id: 'meal-1',
    name: 'Butter Chicken with Naan',
    description: 'Creamy tomato-based curry with tender chicken',
    category: 'North Indian',
    imageUrl: 'https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=800&q=80',
    calories: 650,
    isVegetarian: false,
  },
  {
    id: 'meal-2',
    name: 'Paneer Tikka Masala',
    description: 'Grilled cottage cheese in spiced gravy',
    category: 'North Indian',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80',
    calories: 520,
    isVegetarian: true,
  },
  {
    id: 'meal-3',
    name: 'Dal Makhani with Rice',
    description: 'Creamy black lentils with steamed basmati',
    category: 'North Indian',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    calories: 480,
    isVegetarian: true,
  },
  {
    id: 'meal-4',
    name: 'Grilled Chicken Bowl',
    description: 'Protein-packed bowl with quinoa and veggies',
    category: 'Healthy',
    imageUrl: 'https://images.unsplash.com/photo-1532550907401-a500c9a57435?auto=format&fit=crop&w=800&q=80',
    calories: 420,
    isVegetarian: false,
  },
  {
    id: 'meal-5',
    name: 'Mediterranean Falafel Wrap',
    description: 'Crispy falafel with hummus and fresh veggies',
    category: 'Mediterranean',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80',
    calories: 380,
    isVegetarian: true,
  },
];
