import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  UtensilsCrossed,
  SkipForward,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';
import type { Subscription, DailyMeal, Address, Meal, PlanType, MealTime } from '@/types';

type CutoffStatus = 'OPEN' | 'LOCKED';

const useCutoffTimer = () => {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [status, setStatus] = useState<CutoffStatus>('OPEN');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(20, 0, 0, 0); // 8 PM today

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

      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      );
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
      <div className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-3 animate-slide-up">
        <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
          <Lock className="w-5 h-5 text-destructive" />
        </div>
        <div>
          <p className="font-medium text-destructive">Tomorrow's meal is locked</p>
          <p className="text-sm text-destructive/80">Changes will apply from day after tomorrow</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-between animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
          <Clock className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="font-medium text-accent">Meal modifications open</p>
          <p className="text-sm text-accent/80">You can skip or swap tomorrow's meal</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-accent/70 uppercase tracking-wide">Time left</p>
        <p className="font-mono text-xl font-bold text-accent">{timeLeft}</p>
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
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [canModify, setCanModify] = useState(api.canModifyMeal());

  // Subscription form state
  const [plan, setPlan] = useState<PlanType>('standard');
  const [mealTime, setMealTime] = useState<MealTime>('lunch');
  const [address, setAddress] = useState<Address>({
    street: '',
    city: '',
    state: '',
    zipCode: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    if (!user) return;
    
    const subResponse = api.getSubscription(user.id);
    if (subResponse.success) {
      setSubscription(subResponse.data || null);
    }

    const mealsResponse = api.getCustomerMeals(user.id);
    if (mealsResponse.success) {
      setDailyMeals(mealsResponse.data || []);
    }

    const allMealsResponse = api.getAllMeals();
    if (allMealsResponse.success) {
      setAllMeals(allMealsResponse.data || []);
    }

    setCanModify(api.canModifyMeal());
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const response = api.subscribe(user.id, plan, mealTime, address);
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

  const getMealName = (mealId: string) => {
    const meal = allMeals.find(m => m.id === mealId);
    return meal?.name || 'Unknown meal';
  };

  const getTomorrowMeal = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    return dailyMeals.find(dm => dm.date === tomorrowStr);
  };

  const tomorrowMeal = getTomorrowMeal();

  const plans = [
    { id: 'basic', name: 'Basic', price: '₹2,999/mo', meals: '20 meals' },
    { id: 'standard', name: 'Standard', price: '₹4,499/mo', meals: '30 meals' },
    { id: 'premium', name: 'Premium', price: '₹5,999/mo', meals: '60 meals' },
  ];

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
                  <button
                    key={p.id}
                    onClick={() => { setPlan(p.id as PlanType); setShowSubscribe(true); }}
                    className="p-6 rounded-xl border-2 border-border hover:border-primary transition-all text-left group hover:shadow-card"
                  >
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

  if (showSubscribe) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="shadow-elevated animate-slide-up">
            <CardHeader>
              <CardTitle className="font-display">Complete Subscription</CardTitle>
              <CardDescription>
                {plans.find(p => p.id === plan)?.name} Plan - {plans.find(p => p.id === plan)?.price}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="space-y-2">
                  <Label>Meal Time</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['lunch', 'dinner', 'both'] as MealTime[]).map((time) => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setMealTime(time)}
                        className={`py-2 px-4 rounded-lg border text-sm font-medium capitalize transition-all ${
                          mealTime === time 
                            ? 'border-primary bg-primary text-primary-foreground' 
                            : 'border-border hover:border-primary'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="street">Street Address</Label>
                  <Input
                    id="street"
                    value={address.street}
                    onChange={(e) => setAddress({...address, street: e.target.value})}
                    placeholder="123 Main Street, Apt 4B"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={address.city}
                      onChange={(e) => setAddress({...address, city: e.target.value})}
                      placeholder="Mumbai"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={address.state}
                      onChange={(e) => setAddress({...address, state: e.target.value})}
                      placeholder="Maharashtra"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    value={address.zipCode}
                    onChange={(e) => setAddress({...address, zipCode: e.target.value})}
                    placeholder="400001"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowSubscribe(false)} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" className="flex-1 gradient-primary">
                    Subscribe
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl font-bold mb-2">Hey, {user?.name}!</h1>
        <p className="text-muted-foreground mb-6">Here's what's cooking for you</p>

        {/* Cutoff Status Banner */}
        <CutoffBanner />

        {/* Subscription Status */}
        <Card className="mb-6 shadow-card animate-slide-up">
          <CardContent className="pt-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Active Subscription</p>
                  <p className="text-sm text-muted-foreground capitalize">
                    {subscription?.plan} Plan • {subscription?.mealTime} meals
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{subscription?.address.city}, {subscription?.address.state}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tomorrow's Meal Card */}
        {tomorrowMeal && (
          <Card className="mb-6 shadow-elevated animate-slide-up border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Tomorrow's Meal
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {canModify ? 'Modifications allowed until 8 PM' : 'Meal locked for delivery'}
                  </CardDescription>
                </div>
                {!canModify && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-warning/10 text-warning rounded-full text-sm">
                    <AlertCircle className="w-4 h-4" />
                    Locked
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {tomorrowMeal.isSkipped ? (
                <div className="text-center py-8 text-muted-foreground">
                  <SkipForward className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>This meal has been skipped</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 p-4 bg-secondary rounded-xl mb-4">
                    <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center">
                      <UtensilsCrossed className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-display font-bold text-lg">
                        {getMealName(tomorrowMeal.currentMealId)}
                      </h3>
                      {tomorrowMeal.isSwapped && (
                        <p className="text-sm text-accent">Swapped from original</p>
                      )}
                    </div>
                  </div>

                  {canModify && (
                    <div className="flex gap-3">
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleSkipMeal(tomorrowMeal.id)}
                      >
                        <SkipForward className="w-4 h-4 mr-2" />
                        Skip Meal
                      </Button>
                      <div className="flex-1">
                        <select
                          className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm"
                          onChange={(e) => handleSwapMeal(tomorrowMeal.id, e.target.value)}
                          value=""
                        >
                          <option value="" disabled>Swap with...</option>
                          {allMeals
                            .filter(m => m.id !== tomorrowMeal.currentMealId)
                            .map(meal => (
                              <option key={meal.id} value={meal.id}>
                                {meal.name}
                              </option>
                            ))
                          }
                        </select>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Upcoming Meals */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-display">Upcoming Meals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dailyMeals
                .filter(dm => !dm.isSkipped)
                .slice(0, 7)
                .map((meal) => (
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
