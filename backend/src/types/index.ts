export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CustomizationOption {
  id: string;
  name: string;
  type: 'add' | 'remove' | 'adjust';
}

export interface Dish {
  id: string;
  chefId: string;
  name: string;
  description: string;
  category: 'veg' | 'non-veg';
  nutritionalInfo: NutritionalInfo;
  allowsCustomization: boolean;
  customizationOptions: CustomizationOption[];
  imageUrl?: string;
  isActive: boolean;
  isSpecial?: boolean;
}
