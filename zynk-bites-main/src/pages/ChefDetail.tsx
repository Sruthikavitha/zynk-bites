import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ChefHat, Star, MapPin, Clock, ArrowLeft, Sparkles, Award,
  Leaf, Drumstick, Flame, Dumbbell, Check, X, Utensils, Heart
} from 'lucide-react';
import * as api from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Chef, Dish, Review, Customer } from '@/types';

export const ChefDetail = () => {
  const { chefId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [chef, setChef] = useState<Chef | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);

  useEffect(() => {
    if (chefId) {
      loadChefData();
    }
  }, [chefId]);

  const loadChefData = () => {
    if (!chefId) return;
    setLoading(true);

    const chefResponse = api.getChefProfile(chefId);
    if (chefResponse.success && chefResponse.data) {
      setChef(chefResponse.data.chef);
      setDishes(chefResponse.data.dishes);
      setReviews(chefResponse.data.reviews);
      setAvgRating(chefResponse.data.avgRating);
    }
    
    setLoading(false);
  };

  const handleSelectChef = () => {
    if (!user || user.role !== 'customer') {
      toast({ 
        title: 'Sign in required', 
        description: 'Please sign in as a customer to select a chef',
        variant: 'destructive' 
      });
      navigate('/login');
      return;
    }

    // Navigate to subscription flow with chef pre-selected
    navigate('/subscribe', { state: { selectedChefId: chefId, selectedDishes } });
  };

  const toggleDishSelection = (dishId: string) => {
    setSelectedDishes(prev => 
      prev.includes(dishId) 
        ? prev.filter(id => id !== dishId)
        : [...prev, dishId]
    );
  };

  const specialDishes = dishes.filter(d => (d as any).isSpecial);
  const regularDishes = dishes.filter(d => !(d as any).isSpecial);
  const vegDishes = dishes.filter(d => d.category === 'veg');
  const nonVegDishes = dishes.filter(d => d.category === 'non-veg');

  if (loading) {
    return (
      <Layout>
        <div className="container py-8 px-4">
          <div className="max-w-4xl mx-auto animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-40 bg-muted rounded-xl" />
            <div className="grid grid-cols-3 gap-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl" />)}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!chef) {
    return (
      <Layout>
        <div className="container py-16 px-4 text-center">
          <ChefHat className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">Chef not found</h2>
          <p className="text-muted-foreground mb-4">This chef may no longer be available</p>
          <Button onClick={() => navigate('/chefs')}>Browse Chefs</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/chefs')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Chefs
          </Button>

          {/* Chef Profile Header */}
          <Card className="shadow-elevated mb-8 overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-chef/20 to-primary/20" />
              <CardContent className="relative pt-8 pb-6">
                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Avatar */}
                  <div className="relative">
                    <div className="w-28 h-28 rounded-2xl bg-chef flex items-center justify-center shadow-lg">
                      <ChefHat className="w-14 h-14 text-chef-foreground" />
                    </div>
                    {avgRating >= 4.5 && (
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-warning flex items-center justify-center shadow-md">
                        <Award className="w-4 h-4 text-warning-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <h1 className="font-display text-3xl font-bold mb-2">{chef.name}</h1>
                    <p className="text-lg text-muted-foreground mb-4">{chef.specialty}</p>
                    
                    {/* Stats Row */}
                    <div className="flex flex-wrap gap-4 mb-4">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-warning/10">
                        <Star className="w-4 h-4 fill-warning text-warning" />
                        <span className="font-bold">{avgRating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                        <Utensils className="w-4 h-4 text-primary" />
                        <span className="font-medium">{dishes.length} dishes</span>
                      </div>
                      {chef.totalOrders && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                          <Heart className="w-4 h-4 text-destructive" />
                          <span className="font-medium">{chef.totalOrders}+ orders</span>
                        </div>
                      )}
                    </div>

                    {/* Location & Slots */}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {chef.serviceArea}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {chef.deliverySlots?.join(' & ')}
                      </div>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="w-full md:w-auto">
                    <Button 
                      size="lg" 
                      className="w-full gradient-primary"
                      onClick={handleSelectChef}
                    >
                      Select This Chef
                    </Button>
                    {selectedDishes.length > 0 && (
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        {selectedDishes.length} dish{selectedDishes.length > 1 ? 'es' : ''} selected
                      </p>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {chef.bio && (
                  <p className="mt-6 text-muted-foreground border-t pt-6">{chef.bio}</p>
                )}
              </CardContent>
            </div>
          </Card>

          {/* Menu Tabs */}
          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="all">All ({dishes.length})</TabsTrigger>
              <TabsTrigger value="specials">Specials ({specialDishes.length})</TabsTrigger>
              <TabsTrigger value="veg">Veg ({vegDishes.length})</TabsTrigger>
              <TabsTrigger value="nonveg">Non-Veg ({nonVegDishes.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {specialDishes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-warning" />
                    Chef's Specials
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {specialDishes.map(dish => (
                      <DishCard 
                        key={dish.id} 
                        dish={dish} 
                        isSpecial 
                        isSelected={selectedDishes.includes(dish.id)}
                        onToggle={() => toggleDishSelection(dish.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
              <h3 className="font-display font-bold text-lg mb-3">Full Menu</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {regularDishes.map(dish => (
                  <DishCard 
                    key={dish.id} 
                    dish={dish}
                    isSelected={selectedDishes.includes(dish.id)}
                    onToggle={() => toggleDishSelection(dish.id)}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="specials" className="space-y-4">
              {specialDishes.length === 0 ? (
                <EmptyState message="No special dishes yet" />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {specialDishes.map(dish => (
                    <DishCard 
                      key={dish.id} 
                      dish={dish} 
                      isSpecial
                      isSelected={selectedDishes.includes(dish.id)}
                      onToggle={() => toggleDishSelection(dish.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="veg" className="space-y-4">
              {vegDishes.length === 0 ? (
                <EmptyState message="No vegetarian dishes" />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {vegDishes.map(dish => (
                    <DishCard 
                      key={dish.id} 
                      dish={dish}
                      isSelected={selectedDishes.includes(dish.id)}
                      onToggle={() => toggleDishSelection(dish.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="nonveg" className="space-y-4">
              {nonVegDishes.length === 0 ? (
                <EmptyState message="No non-vegetarian dishes" />
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {nonVegDishes.map(dish => (
                    <DishCard 
                      key={dish.id} 
                      dish={dish}
                      isSelected={selectedDishes.includes(dish.id)}
                      onToggle={() => toggleDishSelection(dish.id)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Reviews Section */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Star className="w-5 h-5 text-warning" />
                Customer Reviews ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No reviews yet</p>
              ) : (
                <div className="space-y-4">
                  {reviews.slice(0, 5).map(review => (
                    <div key={review.id} className="p-4 rounded-lg bg-secondary/50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'fill-warning text-warning' : 'text-muted'}`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-1">{review.mealName}</p>
                      {review.comment && (
                        <p className="text-sm text-muted-foreground">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

interface DishCardProps {
  dish: Dish;
  isSpecial?: boolean;
  isSelected?: boolean;
  onToggle?: () => void;
}

const DishCard = ({ dish, isSpecial, isSelected, onToggle }: DishCardProps) => (
  <div 
    onClick={onToggle}
    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
      isSpecial ? 'bg-warning/5 border-warning/20 hover:border-warning/40' : 
      isSelected ? 'bg-primary/5 border-primary' : 
      'bg-card border-border hover:border-primary/30'
    }`}
  >
    <div className="flex items-start gap-4">
      {/* Category Icon */}
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
        dish.category === 'veg' ? 'bg-accent/20' : 'bg-destructive/20'
      }`}>
        {dish.category === 'veg' ? (
          <Leaf className="w-6 h-6 text-accent" />
        ) : (
          <Drumstick className="w-6 h-6 text-destructive" />
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium flex items-center gap-2">
              {dish.name}
              {isSpecial && <Sparkles className="w-4 h-4 text-warning" />}
            </h4>
            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{dish.description}</p>
          </div>
          {isSelected && (
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
              <Check className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Nutrition */}
        <div className="flex flex-wrap gap-3 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame className="w-3 h-3 text-warning" />
            {dish.nutritionalInfo.calories} cal
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="w-3 h-3 text-info" />
            {dish.nutritionalInfo.protein}g protein
          </span>
          <span>{dish.nutritionalInfo.carbs}g carbs</span>
          <span>{dish.nutritionalInfo.fat}g fat</span>
        </div>

        {/* Customization */}
        {dish.allowsCustomization && dish.customizationOptions.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-primary mb-1">Customization options:</p>
            <div className="flex flex-wrap gap-1">
              {dish.customizationOptions.slice(0, 3).map(opt => (
                <Badge key={opt.id} variant="secondary" className="text-xs">
                  {opt.name}
                </Badge>
              ))}
              {dish.customizationOptions.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{dish.customizationOptions.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-12">
    <Utensils className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
    <p className="text-muted-foreground">{message}</p>
  </div>
);

export default ChefDetail;
