import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import * as api from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import type { MealRecommendation, UserPreferences } from '@/types';

export const MealRecommendationWidget = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MealRecommendation | null>(null);
  const [showForm, setShowForm] = useState(true);

  const [preferences, setPreferences] = useState<UserPreferences>({
    dietType: 'non-vegetarian',
    healthGoal: 'balanced',
    allergies: [],
    dislikedFoods: [],
    mealHistory: [],
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [dislikeInput, setDislikeInput] = useState('');

  const handleAddAllergy = () => {
    if (allergyInput.trim() && !preferences.allergies.includes(allergyInput.trim())) {
      setPreferences({
        ...preferences,
        allergies: [...preferences.allergies, allergyInput.trim()],
      });
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (allergen: string) => {
    setPreferences({
      ...preferences,
      allergies: preferences.allergies.filter((a) => a !== allergen),
    });
  };

  const handleAddDislike = () => {
    if (dislikeInput.trim() && !preferences.dislikedFoods.includes(dislikeInput.trim())) {
      setPreferences({
        ...preferences,
        dislikedFoods: [...preferences.dislikedFoods, dislikeInput.trim()],
      });
      setDislikeInput('');
    }
  };

  const handleRemoveDislike = (food: string) => {
    setPreferences({
      ...preferences,
      dislikedFoods: preferences.dislikedFoods.filter((f) => f !== food),
    });
  };

  const handleGetRecommendations = async () => {
    setLoading(true);
    try {
      const response = api.getMealRecommendations(preferences);
      if (response.success && response.data) {
        setRecommendations(response.data);
        setShowForm(false);
        toast({
          title: 'Recommendations Generated!',
          description: 'Check out your personalized meal recommendations below.',
        });
      } else {
        toast({
          title: 'Error',
          description: response.error || 'Failed to generate recommendations',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate recommendations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {showForm ? (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Get Personalized Meal Recommendations
            </CardTitle>
            <CardDescription>
              Tell us about your preferences and we'll recommend the perfect meals for you
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Diet Type */}
            <div className="space-y-2">
              <Label htmlFor="diet-type" className="text-sm font-medium">
                Diet Preference
              </Label>
              <Select
                value={preferences.dietType}
                onValueChange={(value: any) =>
                  setPreferences({ ...preferences, dietType: value })
                }
              >
                <SelectTrigger id="diet-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vegetarian">Vegetarian</SelectItem>
                  <SelectItem value="non-vegetarian">Non-Vegetarian</SelectItem>
                  <SelectItem value="vegan">Vegan</SelectItem>
                  <SelectItem value="keto">Keto</SelectItem>
                  <SelectItem value="gluten-free">Gluten-Free</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Health Goal */}
            <div className="space-y-2">
              <Label htmlFor="health-goal" className="text-sm font-medium">
                Health Goal
              </Label>
              <Select
                value={preferences.healthGoal}
                onValueChange={(value: any) =>
                  setPreferences({ ...preferences, healthGoal: value })
                }
              >
                <SelectTrigger id="health-goal">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="weight-loss">Weight Loss</SelectItem>
                  <SelectItem value="muscle-gain">Muscle Gain</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="energy">Energy & Stamina</SelectItem>
                  <SelectItem value="balanced">Balanced Nutrition</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Allergies */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Allergies</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., peanuts, dairy, shellfish"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddAllergy();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddAllergy}
                  className="whitespace-nowrap"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences.allergies.map((allergen) => (
                  <Badge
                    key={allergen}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => handleRemoveAllergy(allergen)}
                  >
                    {allergen} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Disliked Foods */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Foods You Dislike</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="e.g., broccoli, mushrooms, olives"
                  value={dislikeInput}
                  onChange={(e) => setDislikeInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddDislike();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddDislike}
                  className="whitespace-nowrap"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {preferences.dislikedFoods.map((food) => (
                  <Badge
                    key={food}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => handleRemoveDislike(food)}
                  >
                    {food} ×
                  </Badge>
                ))}
              </div>
            </div>

            {/* Get Recommendations Button */}
            <Button
              onClick={handleGetRecommendations}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Recommendations...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Get My Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      ) : recommendations ? (
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Your Personalized Meal Plan
              </span>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowForm(true);
                  setRecommendations(null);
                }}
              >
                ← Modify
              </Button>
            </CardTitle>
            <CardDescription>{recommendations.shortReason}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Breakfast */}
            <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-semibold text-lg text-amber-900">🌅 Breakfast</h3>
              <h4 className="text-base font-medium text-amber-800">
                {recommendations.breakfast.mealName}
              </h4>
              <p className="text-sm text-amber-700">{recommendations.breakfast.reason}</p>
            </div>

            {/* Lunch */}
            <div className="space-y-2 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <h3 className="font-semibold text-lg text-orange-900">🍽️ Lunch</h3>
              <h4 className="text-base font-medium text-orange-800">
                {recommendations.lunch.mealName}
              </h4>
              <p className="text-sm text-orange-700">{recommendations.lunch.reason}</p>
            </div>

            {/* Dinner */}
            <div className="space-y-2 p-4 bg-red-50 rounded-lg border border-red-200">
              <h3 className="font-semibold text-lg text-red-900">🌙 Dinner</h3>
              <h4 className="text-base font-medium text-red-800">
                {recommendations.dinner.mealName}
              </h4>
              <p className="text-sm text-red-700">{recommendations.dinner.reason}</p>
            </div>

            <Button
              onClick={() => {
                setShowForm(true);
                setRecommendations(null);
              }}
              className="w-full"
              variant="outline"
            >
              Get New Recommendations
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};
