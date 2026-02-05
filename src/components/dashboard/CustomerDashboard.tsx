import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, MapPin, Clock, UtensilsCrossed, SkipForward, RefreshCw,
  AlertCircle, CheckCircle2, Lock, Home, Briefcase, ChefHat, Star,
  Undo2, Settings, Package
} from 'lucide-react';
import { OrderTracker } from '@/components/order/OrderTracker';
import { ReviewPrompt } from '@/components/review/ReviewPrompt';
import { StarRating } from '@/components/review/ReviewForm';
import { MealRecommendationWidget } from '@/components/MealRecommendationWidget';
import { MealSkipDecisionWidget } from '@/components/MealSkipDecisionWidget';
import type { Subscription, DailyMeal, Address, Meal, PlanType, MealTime, Chef, Dish, Customer, AddressType, Order } from '@/types';

type CutoffStatus = 'OPEN' | 'LOCKED';

const useCutoffTimer = () => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [status, setStatus] = useState<CutoffStatus>('OPEN');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(20, 0, 0, 0);
      const diff = cutoff.getTime() - now.getTime();

      if (diff <= 0) {
        setStatus('LOCKED');
        setTimeLeft('');
        return;
      }

      setStatus('OPEN');
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  return { timeLeft, status };
};

const CutoffBanner = () => {
  const { timeLeft, status } = useCutoffTimer();

  if (status === 'LOCKED') {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-muted/80 border border-border/50 flex items-center gap-3 animate-slide-up">
        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <Lock className="w-5 h-5 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-foreground">Tomorrow's meal is in the oven</p>
          <p className="text-sm text-muted-foreground">Changes will apply from day after</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center justify-between animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-primary">Kitchen is still open</p>
          <p className="text-sm text-muted-foreground">You can still adjust tomorrow's meal</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">Closes in</p>
        <p className="font-mono text-xl font-bold text-primary">{timeLeft}</p>
      </div>
    </div>
  );
};

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [dailyMeals, setDailyMeals] = useState<DailyMeal[]>([]);
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [allDishes, setAllDishes] = useState<Dish[]>([]);
  const [selectedChef, setSelectedChef] = useState<Chef | null>(null);
  const [availableChefs, setAvailableChefs] = useState<Chef[]>([]);
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [showChefSelect, setShowChefSelect] = useState(false);
  const [canModify, setCanModify] = useState(api.canModifyMeal());
  const [ordersForReview, setOrdersForReview] = useState<Order[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);

  const [plan, setPlan] = useState<PlanType>('standard');
  const [mealTime, setMealTime] = useState<MealTime>('lunch');
  const [address, setAddress] = useState<Address>({ street: '', city: '', state: '', zipCode: '' });
  const [selectedChefId, setSelectedChefId] = useState<string>('');

  const customer = user as Customer;

  useEffect(() => {
    if (user) loadData();
    const interval = setInterval(() => setCanModify(api.canModifyMeal()), 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadData = () => {
    if (!user) return;
    
    const subResponse = api.getSubscription(user.id);
    if (subResponse.success) setSubscription(subResponse.data || null);

    const mealsResponse = api.getCustomerMeals(user.id);
    if (mealsResponse.success) setDailyMeals(mealsResponse.data || []);

    const allMealsResponse = api.getAllMeals();
    if (allMealsResponse.success) setAllMeals(allMealsResponse.data || []);

    const dishesResponse = api.getAllDishes();
    if (dishesResponse.success) setAllDishes(dishesResponse.data || []);

    const chefsResponse = api.getApprovedChefs();
    if (chefsResponse.success) setAvailableChefs(chefsResponse.data || []);

    const chefResponse = api.getSelectedChef(user.id);
    if (chefResponse.success) setSelectedChef(chefResponse.data || null);

    const reviewOrdersResponse = api.getOrdersForReview(user.id);
    if (reviewOrdersResponse.success) setOrdersForReview(reviewOrdersResponse.data || []);

    const trackingResponse = api.getCustomerOrdersWithTracking(user.id);
    if (trackingResponse.success) setCustomerOrders(trackingResponse.data || []);

    setCanModify(api.canModifyMeal());
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const response = api.subscribe(user.id, plan, mealTime, address, 'home', selectedChefId || undefined);
    if (response.success) {
      toast({ title: 'Subscribed!', description: 'Your meal subscription is now active.' });
      setShowSubscribe(false);
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleSkipMeal = (dailyMealId: string) => {
    if (!user) return;
    const response = api.skipMeal(user.id, dailyMealId);
    if (response.success) {
      toast({ title: 'Meal Skipped', description: 'Tomorrow\'s meal has been skipped.' });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleUnskipMeal = (dailyMealId: string) => {
    if (!user) return;
    const response = api.unskipMeal(user.id, dailyMealId);
    if (response.success) {
      toast({ title: 'Meal Restored', description: 'Tomorrow\'s meal has been restored.' });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleSwapMeal = (dailyMealId: string, newMealId: string) => {
    if (!user) return;
    const response = api.swapMeal(user.id, dailyMealId, newMealId);
    if (response.success) {
      toast({ title: 'Meal Swapped', description: 'Tomorrow\'s meal has been updated.' });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleSwitchAddress = (addressType: AddressType) => {
    if (!user) return;
    const response = api.switchDeliveryAddress(user.id, addressType);
    if (response.success) {
      toast({ title: 'Address Updated', description: `Delivery switched to ${addressType} address.` });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleSelectChef = (chefId: string) => {
    if (!user) return;
    const response = api.selectChef(user.id, chefId);
    if (response.success) {
      toast({ title: 'Chef Updated', description: 'Your chef has been changed.' });
      setShowChefSelect(false);
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleSubmitReview = (orderId: string, rating: number, comment?: string) => {
    if (!user) return;
    const response = api.submitReview(user.id, orderId, rating, comment);
    if (response.success) {
      toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.' });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const getMealName = (mealId: string) => {
    const dish = allDishes.find(d => d.id === mealId);
    if (dish) return dish.name;
    const meal = allMeals.find(m => m.id === mealId);
    return meal?.name || 'Unknown meal';
  };

  const getTomorrowMeal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dailyMeals.find(dm => dm.date === tomorrow.toISOString().split('T')[0]);
  };

  const tomorrowMeal = getTomorrowMeal();
  const chefDishes = selectedChef ? allDishes.filter(d => d.chefId === selectedChef.id) : [];
  const availableMealsForSwap = chefDishes.length > 0 ? chefDishes : allMeals;

  const plans = [
    { id: 'basic', name: 'Basic', price: '₹2,999/mo', meals: '20 meals' },
    { id: 'standard', name: 'Standard', price: '₹4,499/mo', meals: '30 meals' },
    { id: 'premium', name: 'Premium', price: '₹5,999/mo', meals: '60 meals' },
  ];

  // Chef Selection Modal
  if (showChefSelect) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="font-display text-2xl font-bold">Select Your Chef</h1>
            <Button variant="outline" onClick={() => setShowChefSelect(false)}>Cancel</Button>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {availableChefs.map((chef) => {
              const dishes = allDishes.filter(d => d.chefId === chef.id);
              return (
                <Card key={chef.id} className={`shadow-card cursor-pointer transition-all hover:shadow-elevated ${selectedChef?.id === chef.id ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 rounded-xl bg-chef flex items-center justify-center">
                        <ChefHat className="w-7 h-7 text-chef-foreground" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-display font-bold">{chef.name}</h3>
                        <p className="text-sm text-muted-foreground">{chef.specialty}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StarRating rating={chef.rating || 0} />
                          <span className="text-sm font-medium">{chef.rating || 0}</span>
                          <span className="text-xs text-muted-foreground">• {chef.serviceArea}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{dishes.length} dishes • Customization: {dishes.some(d => d.allowsCustomization) ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                    <Button className="w-full mt-4 gradient-primary" onClick={() => handleSelectChef(chef.id)}>
                      Select Chef
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // No subscription - show plans
  if (!subscription && !showSubscribe) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-3xl font-bold mb-2">Welcome, {user?.name}!</h1>
          <p className="text-muted-foreground mb-8">Ready to simplify your meals?</p>
          <Card className="shadow-elevated animate-slide-up">
            <CardHeader>
              <CardTitle className="font-display">Start Your Subscription</CardTitle>
              <CardDescription>Choose a plan and get delicious meals delivered daily</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                {plans.map((p) => (
                  <button key={p.id} onClick={() => { setPlan(p.id as PlanType); setShowSubscribe(true); }}
                    className="p-6 rounded-xl border-2 border-border hover:border-primary transition-all text-left group hover:shadow-card">
                    <h3 className="font-display font-bold text-lg group-hover:text-primary transition-colors">{p.name}</h3>
                    <p className="text-2xl font-bold text-primary mt-2">{p.price}</p>
                    <p className="text-sm text-muted-foreground mt-1">{p.meals}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Subscription form
  if (showSubscribe) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="shadow-elevated animate-slide-up">
            <CardHeader>
              <CardTitle className="font-display">Complete Subscription</CardTitle>
              <CardDescription>{plans.find(p => p.id === plan)?.name} Plan - {plans.find(p => p.id === plan)?.price}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="space-y-2">
                  <Label>Meal Time</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['lunch', 'dinner', 'both'] as MealTime[]).map((time) => (
                      <button key={time} type="button" onClick={() => setMealTime(time)}
                        className={`py-2 px-4 rounded-lg border text-sm font-medium capitalize transition-all ${mealTime === time ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:border-primary'}`}>
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Select Chef</Label>
                  <select className="w-full h-10 px-3 rounded-lg border border-border bg-background" value={selectedChefId} onChange={(e) => setSelectedChefId(e.target.value)}>
                    <option value="">Choose a chef...</option>
                    {availableChefs.map(chef => (
                      <option key={chef.id} value={chef.id}>{chef.name} - {chef.specialty}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Delivery Address</Label>
                  <Input id="street" value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} placeholder="Street address" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} placeholder="City" required />
                  <Input value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} placeholder="State" required />
                </div>
                <Input value={address.zipCode} onChange={(e) => setAddress({...address, zipCode: e.target.value})} placeholder="ZIP Code" required />

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowSubscribe(false)} className="flex-1">Back</Button>
                  <Button type="submit" className="flex-1 gradient-primary">Subscribe</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Dashboard
  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-2">Welcome home, {user?.name}!</h1>
        <p className="text-muted-foreground mb-6">Your personal kitchen is ready</p>

        <CutoffBanner />

        {/* Review Prompt */}
        <ReviewPrompt orders={ordersForReview} onSubmitReview={handleSubmitReview} />

        {/* Order Tracking */}
        {customerOrders.length > 0 && customerOrders.some(o => o.status !== 'scheduled') && (
          <Card className="mb-6 shadow-soft border-primary/20">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                Your Meal Journey
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customerOrders.filter(o => o.status !== 'scheduled').slice(0, 1).map(order => (
                <div key={order.id}>
                  <p className="text-sm mb-3">
                    <span className="font-medium">{order.mealName}</span>
                    <span className="text-muted-foreground"> • {order.date}</span>
                  </p>
                  <OrderTracker order={order} showTimestamps />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Health Snapshot Card */}
        <Card className="mb-6 shadow-soft bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="font-display text-lg flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              Your Health Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-xl bg-card/80">
                <p className="text-2xl font-bold text-primary">{dailyMeals.filter(m => !m.isSkipped).length}</p>
                <p className="text-xs text-muted-foreground">Meals this week</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-card/80">
                <p className="text-2xl font-bold text-primary">~{Math.round((dailyMeals.filter(m => !m.isSkipped).length || 1) * 450)}</p>
                <p className="text-xs text-muted-foreground">Avg. calories</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-card/80">
                <p className="text-2xl font-bold text-primary">{dailyMeals.filter(m => m.isSkipped).length}</p>
                <p className="text-xs text-muted-foreground">Days skipped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Subscription & Chef Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Your Plan</p>
                  <p className="text-sm text-muted-foreground capitalize">{subscription?.plan} • {subscription?.mealTime} meals</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-chef/10 flex items-center justify-center">
                    <ChefHat className="w-6 h-6 text-chef" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedChef?.name || 'Choose Your Chef'}</p>
                    <p className="text-sm text-muted-foreground">{selectedChef?.specialty || 'Pick a home cook'}</p>
                  </div>
                </div>
                {canModify && (
                  <Button size="sm" variant="outline" className="rounded-full" onClick={() => setShowChefSelect(true)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Address Toggle */}
        {(customer?.homeAddress || customer?.workAddress) && (
          <Card className="mb-6 shadow-soft">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">Delivering to: {subscription?.activeAddressType || 'home'}</p>
                    <p className="text-sm text-muted-foreground">{subscription?.address.street}, {subscription?.address.city}</p>
                  </div>
                </div>
                {canModify && (
                  <div className="flex gap-2">
                    <Button size="sm" variant={subscription?.activeAddressType === 'home' ? 'default' : 'outline'} 
                      className="rounded-full"
                      onClick={() => handleSwitchAddress('home')} disabled={!customer?.homeAddress}>
                      <Home className="w-4 h-4 mr-1" /> Home
                    </Button>
                    <Button size="sm" variant={subscription?.activeAddressType === 'work' ? 'default' : 'outline'}
                      onClick={() => handleSwitchAddress('work')} disabled={!customer?.workAddress}>
                      <Briefcase className="w-4 h-4 mr-1" /> Work
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tomorrow's Meal */}
        {tomorrowMeal && (
          <Card className="mb-6 shadow-elevated border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Tomorrow's Meal
                  </CardTitle>
                  <CardDescription>{canModify ? 'Modifications allowed until 8 PM' : 'Meal finalized for delivery'}</CardDescription>
                </div>
                {!canModify && <Badge variant="destructive"><Lock className="w-3 h-3 mr-1" />Locked</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              {tomorrowMeal.isSkipped ? (
                <div className="text-center py-8">
                  <SkipForward className="w-12 h-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">This meal has been skipped</p>
                  {canModify && (
                    <Button className="mt-4" variant="outline" onClick={() => handleUnskipMeal(tomorrowMeal.id)}>
                      <Undo2 className="w-4 h-4 mr-2" />Restore Meal
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl mb-4">
                    <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
                      <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg">{getMealName(tomorrowMeal.currentMealId)}</h3>
                      {tomorrowMeal.isSwapped && <Badge variant="secondary">Swapped</Badge>}
                    </div>
                  </div>
                  {canModify && (
                    <div className="flex gap-3">
                      <Button variant="outline" className="flex-1" onClick={() => handleSkipMeal(tomorrowMeal.id)}>
                        <SkipForward className="w-4 h-4 mr-2" />Skip
                      </Button>
                      <select className="flex-1 h-10 px-3 rounded-lg border border-border bg-background text-sm"
                        onChange={(e) => handleSwapMeal(tomorrowMeal.id, e.target.value)} value="">
                        <option value="" disabled>Swap with...</option>
                        {availableMealsForSwap.filter(m => m.id !== tomorrowMeal.currentMealId).map(meal => (
                          <option key={meal.id} value={meal.id}>{meal.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Meal Recommendation Widget */}
        <Card className="mb-6 shadow-soft border-primary/10">
          <CardHeader>
            <CardTitle className="font-display">Get Personalized Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <MealRecommendationWidget />
          </CardContent>
        </Card>

        {/* Meal Skip Decision Assistant */}
        <Card className="mb-6 shadow-soft border-primary/10">
          <CardHeader>
            <CardTitle className="font-display">Meal Skip Decision Assistant</CardTitle>
          </CardHeader>
          <CardContent>
            <MealSkipDecisionWidget />
          </CardContent>
        </Card>

        {/* Upcoming Meals */}
        <Card className="shadow-card">
          <CardHeader><CardTitle className="font-display">Upcoming Meals</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyMeals.filter(dm => !dm.isSkipped).slice(0, 7).map((meal) => (
                <div key={meal.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UtensilsCrossed className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{getMealName(meal.currentMealId)}</p>
                      <p className="text-xs text-muted-foreground capitalize">{meal.mealTime}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{new Date(meal.date).toLocaleDateString('en-US', { weekday: 'short' })}</p>
                    <p className="text-xs text-muted-foreground">{meal.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
