import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import * as api from '@/services/api';
import {
  getApiToken,
  getSubscriptions,
  getChefsWithRatings,
  getAllDishes,
  getAllMeals,
  updateSubscriptionChef,
  getCustomerMeals,
  skipCustomerMeal,
  unskipCustomerMeal,
  swapCustomerMeal,
  updateCustomerMealAddress,
  getOrdersForReview,
  getCustomerOrdersWithTracking,
  submitCustomerReview,
  type BackendSubscription,
} from '@/services/backend';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, Clock, UtensilsCrossed,
  CheckCircle2, Lock, ChefHat,
  Settings, Package
} from 'lucide-react';
import { OrderTracker } from '@/components/order/OrderTracker';
import { ReviewPrompt } from '@/components/review/ReviewPrompt';
import { StarRating } from '@/components/review/ReviewForm';
import { MealRecommendationWidget } from '@/components/MealRecommendationWidget';
import { MealCard } from '@/components/MealCard';
import { NotificationHighlightsCard } from '@/components/notifications/NotificationHighlightsCard';
import { WeeklyMenuView } from '@/components/WeeklyMenuView';
import type { Subscription, DailyMeal, Address, Meal, PlanType, Chef, Dish, Customer, AddressType, Order, MealSlot } from '@/types';

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
      <div className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center gap-3 animate-slide-up">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-slate-200">
          <Lock className="w-5 h-5 text-slate-400" />
        </div>
        <div>
          <p className="font-medium text-slate-700">Tomorrow's meal is locked</p>
          <p className="text-sm text-slate-500">Changes reopen Monday 8 AM.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-emerald-200">
          <Clock className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="font-medium text-emerald-700">Kitchen is still open</p>
          <p className="text-sm text-slate-500">You can still adjust tomorrow's meal</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-xs text-slate-500 uppercase tracking-wide">Closes in</p>
        <p className="font-mono text-xl font-bold text-emerald-700">{timeLeft}</p>
      </div>
    </div>
  );
};

export const CustomerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const activatedSubscription = (location.state as { activatedSubscription?: Subscription } | null)?.activatedSubscription || null;
  const [subscription, setSubscription] = useState<Subscription | null>(activatedSubscription);
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
  const [address, setAddress] = useState<Address>({ street: '', city: '', state: '', zipCode: '' });
  const [selectedChefId, setSelectedChefId] = useState<string>('');

  const customer = user as Customer;

  useEffect(() => {
    if (user) void loadData();
    const interval = setInterval(() => setCanModify(api.canModifyMeal()), 1000);
    return () => clearInterval(interval);
  }, [user]);

  const mapBackendPlan = (planName: string): PlanType => {
    const normalized = planName?.toLowerCase() || '';
    if (normalized.includes('basic')) return 'basic';
    if (normalized.includes('premium')) return 'premium';
    return 'standard';
  };

  const getMealSlotsForPlan = (planType?: PlanType): MealSlot[] => {
    switch (planType) {
      case 'basic':
        return ['lunch'];
      case 'standard':
        return ['lunch', 'dinner'];
      case 'premium':
        return ['breakfast', 'lunch', 'dinner'];
      default:
        return ['lunch'];
    }
  };

  const buildSubscriptionFromBackend = (sub: BackendSubscription): Subscription => {
    const mappedPlan = mapBackendPlan(sub.planName);
    return {
      id: String(sub.id),
      customerId: user?.id || '',
      plan: mappedPlan,
      mealTime: mappedPlan === 'basic' ? 'lunch' : 'both',
      mealSlots: getMealSlotsForPlan(mappedPlan),
      startDate: new Date().toISOString(),
      status: (sub.status as Subscription['status']) || 'active',
      address: {
        street: sub.deliveryAddress,
        city: sub.city,
        state: '',
        zipCode: sub.postalCode,
      },
      activeAddressType: 'home',
      selectedChefId: sub.chefId ? String(sub.chefId) : undefined,
    };
  };

  const loadData = async () => {
    if (!user) return;

    const token = getApiToken();
    let backendSub: Subscription | null = null;
    if (token) {
      const subs = await getSubscriptions(token);
      const active = subs?.find((s) => s.status === 'active') || subs?.[0];
      if (active) {
        backendSub = buildSubscriptionFromBackend(active);
      }
    }

    if (backendSub) {
      setSubscription(backendSub);
    } else {
      const subResponse = api.getSubscription(user.id);
      if (subResponse.success && subResponse.data) {
        setSubscription(subResponse.data || null);
      } else if (activatedSubscription) {
        setSubscription(activatedSubscription);
      } else {
        setSubscription(null);
      }
    }

    let backendDailyMeals: DailyMeal[] | null = null;
    if (token) {
      backendDailyMeals = await getCustomerMeals(token);
    }
    if (backendDailyMeals) {
      setDailyMeals(backendDailyMeals);
    } else {
      const mealsResponse = api.getCustomerMeals(user.id);
      if (mealsResponse.success) setDailyMeals(mealsResponse.data || []);
    }

    const backendMeals = await getAllMeals();
    if (backendMeals) {
      setAllMeals(backendMeals as Meal[]);
    } else {
      const allMealsResponse = api.getAllMeals();
      if (allMealsResponse.success) setAllMeals(allMealsResponse.data || []);
    }

    const backendDishes = await getAllDishes();
    if (backendDishes) {
      setAllDishes(backendDishes as Dish[]);
    } else {
      const dishesResponse = api.getAllDishes();
      if (dishesResponse.success) setAllDishes(dishesResponse.data || []);
    }

    const backendChefs = await getChefsWithRatings();
    if (backendChefs) {
      setAvailableChefs(backendChefs as Chef[]);
      const chefIdToFind = backendSub?.selectedChefId;
      if (chefIdToFind) {
        setSelectedChef((backendChefs as Chef[]).find((chef) => chef.id === chefIdToFind) || null);
      } else {
        setSelectedChef(null);
      }
    } else {
      const chefsResponse = api.getApprovedChefs();
      if (chefsResponse.success) setAvailableChefs(chefsResponse.data || []);

      const chefResponse = api.getSelectedChef(user.id);
      if (chefResponse.success) setSelectedChef(chefResponse.data || null);
    }

    if (token) {
      const backendReviewOrders = await getOrdersForReview(token);
      if (backendReviewOrders) {
        setOrdersForReview(backendReviewOrders as Order[]);
      } else {
        const reviewOrdersResponse = api.getOrdersForReview(user.id);
        if (reviewOrdersResponse.success) setOrdersForReview(reviewOrdersResponse.data || []);
      }

      const backendTracking = await getCustomerOrdersWithTracking(token);
      if (backendTracking) {
        setCustomerOrders(backendTracking as Order[]);
      } else {
        const trackingResponse = api.getCustomerOrdersWithTracking(user.id);
        if (trackingResponse.success) setCustomerOrders(trackingResponse.data || []);
      }
    } else {
      const reviewOrdersResponse = api.getOrdersForReview(user.id);
      if (reviewOrdersResponse.success) setOrdersForReview(reviewOrdersResponse.data || []);

      const trackingResponse = api.getCustomerOrdersWithTracking(user.id);
      if (trackingResponse.success) setCustomerOrders(trackingResponse.data || []);
    }

    setCanModify(api.canModifyMeal());
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedChefId) {
      toast({ title: 'Select a chef', description: 'Choose a chef before continuing.', variant: 'destructive' });
      return;
    }
    toast({ title: 'Almost there', description: 'Continue to payment to activate your plan.' });
    setShowSubscribe(false);
    navigate('/subscribe', {
      state: {
        selectedChefId,
        selectedPlan: plan,
        homeAddress: address,
      },
    });
  };

  const handleSkipMeal = async (dailyMealId: string) => {
    if (!user) return;
    const token = getApiToken();
    if (token) {
      const response = await skipCustomerMeal(token, dailyMealId);
      if (response.success) {
        toast({ title: 'Meal Skipped', description: 'This meal has been skipped.' });
        void loadData();
      } else {
        const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
        const description = nextAt ? `${response.message} Next available: ${nextAt}.` : response.message;
        toast({ title: response.nextAvailableAt ? 'Locked' : 'Error', description, variant: 'destructive' });
      }
      return;
    }

    const response = api.skipMeal(user.id, dailyMealId);
    if (response.success) {
      toast({ title: 'Meal Skipped', description: 'This meal has been skipped.' });
      loadData();
    } else {
      const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
      const description = nextAt ? `${response.error} Next available: ${nextAt}.` : response.error;
      toast({ title: response.statusCode === 423 ? 'Locked' : 'Error', description, variant: 'destructive' });
    }
  };

  const handleUnskipMeal = async (dailyMealId: string) => {
    if (!user) return;
    const token = getApiToken();
    if (token) {
      const response = await unskipCustomerMeal(token, dailyMealId);
      if (response.success) {
        toast({ title: 'Meal Restored', description: 'This meal has been restored.' });
        void loadData();
      } else {
        const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
        const description = nextAt ? `${response.message} Next available: ${nextAt}.` : response.message;
        toast({ title: response.nextAvailableAt ? 'Locked' : 'Error', description, variant: 'destructive' });
      }
      return;
    }

    const response = api.unskipMeal(user.id, dailyMealId);
    if (response.success) {
      toast({ title: 'Meal Restored', description: 'This meal has been restored.' });
      loadData();
    } else {
      const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
      const description = nextAt ? `${response.error} Next available: ${nextAt}.` : response.error;
      toast({ title: response.statusCode === 423 ? 'Locked' : 'Error', description, variant: 'destructive' });
    }
  };

  const handleSwapMeal = async (dailyMealId: string, newMealId: string) => {
    if (!user) return;
    const token = getApiToken();
    if (token) {
      const response = await swapCustomerMeal(token, dailyMealId, newMealId);
      if (response.success) {
        toast({ title: 'Meal Swapped', description: 'This meal has been updated.' });
        void loadData();
      } else {
        const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
        const description = nextAt ? `${response.message} Next available: ${nextAt}.` : response.message;
        toast({ title: response.nextAvailableAt ? 'Locked' : 'Error', description, variant: 'destructive' });
      }
      return;
    }

    const response = api.swapMeal(user.id, dailyMealId, newMealId);
    if (response.success) {
      toast({ title: 'Meal Swapped', description: 'This meal has been updated.' });
      loadData();
    } else {
      const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
      const description = nextAt ? `${response.error} Next available: ${nextAt}.` : response.error;
      toast({ title: response.statusCode === 423 ? 'Locked' : 'Error', description, variant: 'destructive' });
    }
  };

  const handleUpdateMealAddress = async (
    dailyMealId: string,
    addressType: AddressType | 'custom',
    customAddress?: Address
  ) => {
    if (!user) return;
    const token = getApiToken();
    if (token) {
      const response = await updateCustomerMealAddress(token, dailyMealId, addressType, customAddress);
      if (response.success) {
        toast({ title: 'Address Updated', description: 'Delivery address updated for this meal.' });
        void loadData();
      } else {
        const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
        const description = nextAt ? `${response.message} Next available: ${nextAt}.` : response.message;
        toast({ title: response.nextAvailableAt ? 'Locked' : 'Error', description, variant: 'destructive' });
      }
      return;
    }

    const response = api.updateMealAddress(user.id, dailyMealId, addressType, customAddress);
    if (response.success) {
      toast({ title: 'Address Updated', description: 'Delivery address updated for this meal.' });
      loadData();
    } else {
      const nextAt = response.nextAvailableAt ? format(new Date(response.nextAvailableAt), 'EEE, MMM d h:mm a') : undefined;
      const description = nextAt ? `${response.error} Next available: ${nextAt}.` : response.error;
      toast({ title: response.statusCode === 423 ? 'Locked' : 'Error', description, variant: 'destructive' });
    }
  };

  const handleSelectChef = async (chefId: string) => {
    if (!user) return;
    const token = getApiToken();
    if (token && subscription?.id) {
      const response = await updateSubscriptionChef(token, subscription.id, chefId);
      if (response.success) {
        toast({ title: 'Chef Updated', description: 'Your chef has been changed.' });
        setShowChefSelect(false);
        void loadData();
        return;
      }
      toast({ title: 'Error', description: response.message, variant: 'destructive' });
      return;
    }

    const response = api.selectChef(user.id, chefId);
    if (response.success) {
      toast({ title: 'Chef Updated', description: 'Your chef has been changed.' });
      setShowChefSelect(false);
      void loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleSubmitReview = async (orderId: string, rating: number, comment?: string) => {
    if (!user) return;
    const token = getApiToken();
    if (token) {
      const response = await submitCustomerReview(token, orderId, rating, comment);
      if (response.success) {
        toast({ title: 'Review Submitted!', description: 'Thank you for your feedback.' });
        void loadData();
      } else {
        toast({ title: 'Error', description: response.message, variant: 'destructive' });
      }
      return;
    }

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

  const getMealDescription = (mealId: string) => {
    const dish = allDishes.find(d => d.id === mealId);
    if (dish) return dish.description;
    const meal = allMeals.find(m => m.id === mealId);
    return meal?.description || '';
  };

  const getMealSlotLabel = (slot: MealSlot) => {
    if (slot === 'breakfast') return 'Breakfast';
    if (slot === 'lunch') return 'Lunch';
    return 'Dinner';
  };

  const resolveMealSlot = (meal: DailyMeal): MealSlot => {
    const slot = meal.mealSlot || meal.mealTime;
    return slot === 'both' ? 'lunch' : (slot as MealSlot);
  };

  const getCutoffForDate = (dateStr: string) => {
    const date = new Date(`${dateStr}T00:00:00`);
    const cutoff = new Date(date);
    cutoff.setDate(date.getDate() - 1);
    cutoff.setHours(20, 0, 0, 0);
    return cutoff;
  };

  const isMealLocked = (dateStr: string) => {
    return new Date().getTime() >= getCutoffForDate(dateStr).getTime();
  };

  const planSlots = getMealSlotsForPlan(subscription?.plan || plan);
  const planSlotsLabel = planSlots.map(getMealSlotLabel).join(' • ');

  const plans = [
    { id: 'basic', name: 'Basic', price: 'â‚¹2,999/mo', meals: '20 meals' },
    { id: 'standard', name: 'Standard', price: 'â‚¹4,499/mo', meals: '30 meals' },
    { id: 'premium', name: 'Premium', price: 'â‚¹5,999/mo', meals: '60 meals' },
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
                          <span className="text-xs text-muted-foreground">â€¢ {chef.serviceArea}</span>
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
    <div className="min-h-screen relative overflow-hidden bg-white">
      {/* Soft green background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-white to-white" />
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-emerald-100/60 blur-2xl" />
        <div className="absolute bottom-0 left-8 h-72 w-72 rounded-full bg-emerald-50 blur-2xl" />
      </div>

      <div className="container py-8 px-4 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Welcome Header */}
          <div className="animate-slide-up">
            <h1 className="section-title">Welcome back, {user?.name}!</h1>
            <p className="mt-2 text-sm text-slate-500">
              Your subscription schedule, chef, and meals - all in one place.
            </p>
          </div>

          <CutoffBanner />
          <NotificationHighlightsCard role="customer" />

        {/* Review Prompt */}
        <ReviewPrompt orders={ordersForReview} onSubmitReview={handleSubmitReview} />

        {/* Order Tracking */}
        {customerOrders.length > 0 && customerOrders.some(o => o.status !== 'scheduled') && (
          <Card className="mb-6 card-base animate-slide-up" style={{ animationDelay: '100ms' }}>
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
        <Card className="mb-6 card-base animate-slide-up" style={{ animationDelay: '200ms' }}>
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
              <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-3xl font-bold text-green-600">{dailyMeals.filter(m => !m.isSkipped).length}</p>
                <p className="text-xs text-muted-foreground mt-1">Meals this week</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-3xl font-bold text-green-600">~{Math.round((dailyMeals.filter(m => !m.isSkipped).length || 1) * 450)}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg. calories</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-3xl font-bold text-green-600">{dailyMeals.filter(m => m.isSkipped).length}</p>
                <p className="text-xs text-muted-foreground mt-1">Days skipped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        {/* Subscription & Chef Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <Card className="card-base animate-slide-up" style={{ animationDelay: '300ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/20">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-medium">Your Plan</p>
                  <p className="text-sm text-muted-foreground capitalize">{subscription?.plan} • {planSlotsLabel}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card-base animate-slide-up" style={{ animationDelay: '350ms' }}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center shadow-lg">
                    <ChefHat className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <p className="font-medium">{selectedChef?.name || 'Choose Your Chef'}</p>
                    <p className="text-sm text-muted-foreground">{selectedChef?.specialty || 'Pick a home cook'}</p>
                  </div>
                </div>
                {canModify && (
                  <Button size="sm" variant="outline" className="rounded-full hover:bg-green-50 hover:border-green-300" onClick={() => setShowChefSelect(true)}>
                    <Settings className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Meals */}
        <Card className="mb-6 card-base border-2 border-emerald-200 animate-slide-up" style={{ animationDelay: '450ms' }}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-md">
                    <Calendar className="w-4 h-4 text-white" />
                  </div>
                  Today's Meals
                </CardTitle>
                <CardDescription>Confirmed by 8 PM the day before delivery</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {dailyMeals.filter(dm => dm.date === new Date().toISOString().split('T')[0]).length === 0 ? (
              <p className="text-sm text-muted-foreground">No meals scheduled for today.</p>
            ) : (
              dailyMeals
                .filter(dm => dm.date === new Date().toISOString().split('T')[0])
                .filter(dm => planSlots.includes(resolveMealSlot(dm)))
                .map((meal) => {
                  const slot = resolveMealSlot(meal);
                  const cutoffAt = getCutoffForDate(meal.date);
                  const alternatives = (meal.alternativeMealIds || [])
                    .map(id => ({
                      id,
                      name: getMealName(id),
                    }))
                    .filter(alt => alt.id !== meal.currentMealId);

                  return (
                    <MealCard
                      key={meal.id}
                      meal={meal}
                      mealLabel={getMealSlotLabel(slot)}
                      mealName={getMealName(meal.currentMealId)}
                      mealDescription={getMealDescription(meal.currentMealId)}
                      alternatives={alternatives}
                      isLocked={isMealLocked(meal.date)}
                      cutoffAt={cutoffAt}
                      homeAddress={customer?.homeAddress}
                      workAddress={customer?.workAddress}
                      onSkip={() => handleSkipMeal(meal.id)}
                      onUnskip={() => handleUnskipMeal(meal.id)}
                      onSwap={(newMealId) => handleSwapMeal(meal.id, newMealId)}
                      onUpdateAddress={(type, custom) => handleUpdateMealAddress(meal.id, type, custom)}
                    />
                  );
                })
            )}
          </CardContent>
        </Card>

        {/* Meal Recommendation Widget */}
        <Card className="mb-6 card-base animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <span className="text-green-500">âœ¨</span>
              Get Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MealRecommendationWidget />
          </CardContent>
        </Card>

        {/* Weekly Meals */}
        <div className="animate-slide-up" style={{ animationDelay: '550ms' }}>
          <WeeklyMenuView
            dailyMeals={dailyMeals}
            planSlots={planSlots}
            getMealName={getMealName}
            getMealDescription={getMealDescription}
            getMealSlotLabel={getMealSlotLabel}
            isMealLocked={isMealLocked}
            getCutoffForDate={getCutoffForDate}
            homeAddress={customer?.homeAddress}
            workAddress={customer?.workAddress}
            onSkip={handleSkipMeal}
            onUnskip={handleUnskipMeal}
            onSwap={handleSwapMeal}
            onUpdateAddress={handleUpdateMealAddress}
          />
        </div>

        {/* Dishes Chart removed */}

        {/* Meal Skip Decision Assistant removed */}

        </div>
      </div>
    </div>
  );
};



