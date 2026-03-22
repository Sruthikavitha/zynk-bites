import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import * as db from '@/services/db';
import {
  createChefWorkspaceDish,
  getApiToken,
  getChefWorkspaceDishes,
} from '@/services/backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NotificationHighlightsCard } from '@/components/notifications/NotificationHighlightsCard';
import { useToast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  ChefHat,
  Clock,
  Drumstick,
  Flame,
  Dumbbell,
  Leaf,
  MapPin,
  Plus,
  UtensilsCrossed,
} from 'lucide-react';
import type { Chef, ChefMenuChart, ChefMenuDay, CustomizationOption, Dish, MealSlot, Order } from '@/types';

const MENU_STORAGE_KEY = 'zynk_chef_workspace_menu_charts';
const BACKEND_UNREACHABLE_MESSAGE = 'Unable to reach the backend';

const buildMenuDays = (startDate: string, duration: 7 | 14): ChefMenuDay[] => {
  const start = new Date(`${startDate}T00:00:00`);
  return Array.from({ length: duration }).map((_, index) => {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    return {
      date: day.toISOString().split('T')[0],
      slots: {},
    };
  });
};

const readStoredMenuCharts = (chefId: string): ChefMenuChart[] => {
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as Record<string, ChefMenuChart[]>;
    return Array.isArray(parsed[chefId]) ? parsed[chefId] : [];
  } catch {
    return [];
  }
};

const writeStoredMenuCharts = (chefId: string, charts: ChefMenuChart[]) => {
  try {
    const raw = localStorage.getItem(MENU_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, ChefMenuChart[]>) : {};
    parsed[chefId] = charts;
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // Ignore local storage failures for menu drafts.
  }
};

const ensureLocalChefMirror = (chef: Chef) => {
  const existing = db.findUserById(chef.id);
  if (existing) return;

  db.createUser({
    id: chef.id,
    email: chef.email,
    password: chef.password || '',
    name: chef.name,
    role: 'chef',
    status: chef.status || 'approved',
    specialty: chef.specialty || 'Home Chef',
    bio: chef.bio,
    kitchenLocation: chef.kitchenLocation,
    serviceArea: chef.serviceArea || '',
    deliverySlots: chef.deliverySlots || ['lunch', 'dinner'],
    rating: chef.rating,
    totalOrders: chef.totalOrders,
    isDisabled: false,
    createdAt: chef.createdAt || new Date().toISOString(),
    menuCharts: readStoredMenuCharts(chef.id),
  } as Chef);
};

export const ChefDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDish, setShowAddDish] = useState(false);
  const [isSavingDish, setIsSavingDish] = useState(false);
  const [isSavingMenu, setIsSavingMenu] = useState(false);
  const [canModify] = useState(!api.canModifyMeal());

  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishCategory, setDishCategory] = useState<'veg' | 'non-veg'>('veg');
  const [allowsCustomization, setAllowsCustomization] = useState(false);
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  const [menuChart, setMenuChart] = useState<ChefMenuChart | null>(null);
  const [menuStartDate, setMenuStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [menuDuration, setMenuDuration] = useState<7 | 14>(7);
  const [menuDays, setMenuDays] = useState<ChefMenuDay[]>([]);
  const [menuImageUrl, setMenuImageUrl] = useState<string | undefined>(undefined);

  const chef = user as Chef | null;
  const isApproved = chef?.status ? chef.status === 'approved' : true;
  const slotOptions: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

  const hydrateMenuChartState = useCallback(
    (charts: ChefMenuChart[]) => {
      const existing = charts[0] || null;
      setMenuChart(existing);

      if (existing) {
        setMenuStartDate(existing.startDate);
        const diff =
          Math.max(
            1,
            Math.round(
              (new Date(existing.endDate).getTime() - new Date(existing.startDate).getTime()) / (1000 * 60 * 60 * 24)
            ) + 1
          ) === 14
            ? 14
            : 7;
        setMenuDuration(diff);
        setMenuDays(existing.days);
        setMenuImageUrl(existing.imageUrl);
        return;
      }

      setMenuImageUrl(undefined);
      setMenuDays(buildMenuDays(menuStartDate, menuDuration));
    },
    [menuDuration, menuStartDate]
  );

  const resetDishForm = () => {
    setDishName('');
    setDishDesc('');
    setDishCategory('veg');
    setAllowsCustomization(false);
    setCustomOptions([]);
    setNewOption('');
  };

  const loadData = useCallback(async () => {
    if (!chef) return;

    setLoading(true);
    ensureLocalChefMirror(chef);

    const token = getApiToken();
    const ordersResponse = api.getChefOrders(chef.id);
    setOrders(ordersResponse.success ? ordersResponse.data || [] : []);

    let nextDishes: Dish[] = [];
    if (token) {
      const backendDishes = await getChefWorkspaceDishes(token);
      if (backendDishes.success && backendDishes.dishes) {
        nextDishes = backendDishes.dishes;
      } else {
        const localDishes = api.getChefDishes(chef.id);
        nextDishes = localDishes.success ? localDishes.data || [] : [];
      }
    } else {
      const localDishes = api.getChefDishes(chef.id);
      nextDishes = localDishes.success ? localDishes.data || [] : [];
    }
    setDishes(nextDishes);
    setShowAddDish(nextDishes.length === 0);

    hydrateMenuChartState(readStoredMenuCharts(chef.id));
    setLoading(false);
  }, [chef, hydrateMenuChartState]);

  useEffect(() => {
    if (chef) {
      void loadData();
    }
  }, [chef, loadData]);

  useEffect(() => {
    if (!menuChart) {
      setMenuDays(buildMenuDays(menuStartDate, menuDuration));
    }
  }, [menuStartDate, menuDuration, menuChart]);

  const addCustomOption = () => {
    if (newOption.trim()) {
      setCustomOptions((current) => [...current, newOption.trim()]);
      setNewOption('');
    }
  };

  const updateMenuSlot = (date: string, slot: MealSlot, mealId: string) => {
    setMenuDays((current) =>
      current.map((day) => {
        if (day.date !== date) return day;
        const slotState = day.slots[slot] || { mealId: '', alternativeMealIds: [] };
        return {
          ...day,
          slots: {
            ...day.slots,
            [slot]: {
              ...slotState,
              mealId,
            },
          },
        };
      })
    );
  };

  const updateMenuAlternatives = (date: string, slot: MealSlot, alternativeMealIds: string[]) => {
    setMenuDays((current) =>
      current.map((day) => {
        if (day.date !== date) return day;
        const slotState = day.slots[slot] || { mealId: '', alternativeMealIds: [] };
        return {
          ...day,
          slots: {
            ...day.slots,
            [slot]: {
              ...slotState,
              alternativeMealIds,
            },
          },
        };
      })
    );
  };

  const handleMenuImageUpload = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setMenuImageUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAddDish = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!chef) return;

    setIsSavingDish(true);

    const nutritionalInfo = api.generateNutritionalInfo(dishName);
    const customizationOptions: CustomizationOption[] = customOptions.map((option, index) => ({
      id: `opt-${index}`,
      name: option,
      type: 'add',
    }));

    const token = getApiToken();

    if (token) {
      const backendResponse = await createChefWorkspaceDish(token, {
        name: dishName,
        description: dishDesc,
        category: dishCategory,
        nutritionalInfo,
        allowsCustomization,
        customizationOptions,
      });

      if (backendResponse.success) {
        toast({ title: 'Dish added', description: 'Your dish is now available in the chef workspace.' });
        resetDishForm();
        setShowAddDish(false);
        setIsSavingDish(false);
        await loadData();
        return;
      }

      if (!backendResponse.message?.includes(BACKEND_UNREACHABLE_MESSAGE)) {
        toast({ title: 'Error', description: backendResponse.message, variant: 'destructive' });
        setIsSavingDish(false);
        return;
      }
    }

    ensureLocalChefMirror(chef);
    const fallbackResponse = api.addDish(
      chef.id,
      dishName,
      dishDesc,
      dishCategory,
      nutritionalInfo,
      allowsCustomization,
      customizationOptions
    );

    if (fallbackResponse.success) {
      toast({ title: 'Dish added', description: 'Saved locally in draft mode.' });
      resetDishForm();
      setShowAddDish(false);
      await loadData();
    } else {
      toast({ title: 'Error', description: fallbackResponse.error, variant: 'destructive' });
    }

    setIsSavingDish(false);
  };

  const handleSaveMenuChart = async () => {
    if (!chef) return;

    setIsSavingMenu(true);

    const start = new Date(`${menuStartDate}T00:00:00`);
    const end = new Date(start);
    end.setDate(start.getDate() + menuDuration - 1);

    const nextChart: ChefMenuChart = {
      id: menuChart?.id || `chart-${chef.id}-${Date.now()}`,
      chefId: chef.id,
      startDate: menuStartDate,
      endDate: end.toISOString().split('T')[0],
      imageUrl: menuImageUrl,
      days: menuDays,
    };

    const existingCharts = readStoredMenuCharts(chef.id);
    const nextCharts = existingCharts.some((chart) => chart.id === nextChart.id)
      ? existingCharts.map((chart) => (chart.id === nextChart.id ? nextChart : chart))
      : [nextChart, ...existingCharts].slice(0, 3);

    writeStoredMenuCharts(chef.id, nextCharts);
    hydrateMenuChartState(nextCharts);
    toast({ title: 'Schedule saved', description: 'Your weekly menu schedule has been updated.' });

    setIsSavingMenu(false);
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'preparing' | 'ready') => {
    if (!chef) return;
    ensureLocalChefMirror(chef);

    const response = api.updateOrderStatus(chef.id, orderId, status);
    if (response.success) {
      toast({ title: 'Status updated', description: `Order marked as ${status}.` });
      void loadData();
      return;
    }

    toast({ title: 'Error', description: response.error, variant: 'destructive' });
  };

  const renderDishManagementSection = (delay: string) => (
    <Card className="card-base mb-6 animate-slide-up" style={{ animationDelay: delay }}>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="font-display">Dish Studio</CardTitle>
            <CardDescription>Add dishes first, then place them into the weekly schedule below.</CardDescription>
          </div>
          <Button onClick={() => setShowAddDish((current) => !current)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {showAddDish ? 'Hide Form' : 'Add Dish'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {(showAddDish || dishes.length === 0) && (
          <form onSubmit={handleAddDish} className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Dish Name</Label>
                <Input
                  value={dishName}
                  onChange={(event) => setDishName(event.target.value)}
                  placeholder="e.g., Rava Dosa"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Description</Label>
                <Input
                  value={dishDesc}
                  onChange={(event) => setDishDesc(event.target.value)}
                  placeholder="Brief description of the dish"
                  required
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Category</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={dishCategory === 'veg' ? 'default' : 'outline'}
                    onClick={() => setDishCategory('veg')}
                    className="flex-1"
                  >
                    <Leaf className="mr-2 h-4 w-4 text-accent" />
                    Veg
                  </Button>
                  <Button
                    type="button"
                    variant={dishCategory === 'non-veg' ? 'default' : 'outline'}
                    onClick={() => setDishCategory('non-veg')}
                    className="flex-1"
                  >
                    <Drumstick className="mr-2 h-4 w-4 text-destructive" />
                    Non-Veg
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={allowsCustomization}
                  onChange={(event) => setAllowsCustomization(event.target.checked)}
                  className="rounded"
                />
                Allow customization
              </Label>
            </div>

            {allowsCustomization && (
              <div className="rounded-xl bg-white p-4 border border-emerald-100 space-y-3">
                <Label>Customization Options</Label>
                <div className="flex gap-2">
                  <Input
                    value={newOption}
                    onChange={(event) => setNewOption(event.target.value)}
                    placeholder="e.g., Extra chutney"
                  />
                  <Button type="button" onClick={addCustomOption} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customOptions.map((option, index) => (
                    <Badge key={`${option}-${index}`} variant="secondary">
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setShowAddDish(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-1" disabled={isSavingDish}>
                {isSavingDish ? 'Saving Dish...' : 'Add Dish'}
              </Button>
            </div>
          </form>
        )}

        {dishes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
            No dishes yet. Add your first dish here before setting the weekly schedule.
          </div>
        ) : (
          <div className="space-y-3">
            {dishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderScheduleSection = (delay: string) => (
    <Card className="card-base mb-6 animate-slide-up" style={{ animationDelay: delay }}>
      <CardHeader>
        <CardTitle className="font-display">Weekly Menu Schedule</CardTitle>
        <CardDescription>Map your dishes into breakfast, lunch, and dinner slots for the coming week.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={menuStartDate}
              onChange={(event) => {
                setMenuStartDate(event.target.value);
                setMenuChart(null);
              }}
            />
          </div>
          <div className="space-y-2">
            <Label>Duration</Label>
            <select
              className="h-10 w-full rounded-lg border border-border bg-background px-3"
              value={menuDuration}
              onChange={(event) => {
                setMenuDuration((event.target.value === '14' ? 14 : 7) as 7 | 14);
                setMenuChart(null);
              }}
            >
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Brochure Image (optional)</Label>
            <Input type="file" accept="image/*" onChange={(event) => handleMenuImageUpload(event.target.files?.[0])} />
          </div>
        </div>

        {menuImageUrl && (
          <div className="rounded-xl border border-border/50 bg-white/70 p-3">
            <p className="mb-2 text-xs text-muted-foreground">Uploaded brochure preview</p>
            <img src={menuImageUrl} alt="Menu brochure" className="max-h-64 w-full rounded-lg border object-contain" />
          </div>
        )}

        <div className="space-y-4">
          {menuDays.map((day) => (
            <div key={day.date} className="rounded-xl border border-border/50 bg-white/70 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="font-medium">{day.date}</p>
                <Badge variant="secondary">Schedule Day</Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {slotOptions.map((slot) => {
                  const slotData = day.slots[slot];
                  const selectedMealId = slotData?.mealId || '';
                  return (
                    <div key={`${day.date}-${slot}`} className="space-y-2">
                      <Label className="capitalize">{slot}</Label>
                      <select
                        className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
                        value={selectedMealId}
                        onChange={(event) => updateMenuSlot(day.date, slot, event.target.value)}
                      >
                        <option value="">Select dish</option>
                        {dishes.map((dish) => (
                          <option key={dish.id} value={dish.id}>
                            {dish.name}
                          </option>
                        ))}
                      </select>
                      <select
                        multiple
                        className="h-20 w-full rounded-lg border border-border bg-background px-3 text-xs"
                        value={slotData?.alternativeMealIds || []}
                        onChange={(event) => {
                          const values = Array.from(event.target.selectedOptions).map((option) => option.value);
                          updateMenuAlternatives(
                            day.date,
                            slot,
                            values.filter((dishId) => dishId !== selectedMealId)
                          );
                        }}
                      >
                        {dishes
                          .filter((dish) => dish.id !== selectedMealId)
                          .map((dish) => (
                            <option key={dish.id} value={dish.id}>
                              {dish.name}
                            </option>
                          ))}
                      </select>
                      <p className="text-xs text-muted-foreground">Choose alternatives for swaps if needed.</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <Button onClick={() => void handleSaveMenuChart()} disabled={isSavingMenu}>
            {isSavingMenu ? 'Saving Schedule...' : 'Save Schedule'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderOrdersSection = () => (
    <Card className="card-base mb-6 animate-slide-up" style={{ animationDelay: '450ms' }}>
      <CardHeader>
        <CardTitle className="font-display flex items-center gap-2">
          <UtensilsCrossed className="h-5 w-5 text-primary" />
          Tomorrow&apos;s Orders
        </CardTitle>
        <CardDescription>Orders confirmed after the evening cutoff.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="py-8 text-center text-muted-foreground">Loading...</p>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <UtensilsCrossed className="mx-auto mb-2 h-12 w-12 opacity-50" />
            <p>No orders for tomorrow yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="rounded-2xl border border-border/30 bg-secondary/50 p-4">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="font-medium">{order.mealName}</h3>
                    <p className="text-sm text-muted-foreground">For: {order.customerName}</p>
                  </div>
                  <Badge variant={order.status === 'ready' ? 'default' : 'outline'} className="capitalize rounded-full">
                    {order.status === 'pending' ? 'Waiting' : order.status === 'preparing' ? 'Cooking' : 'Ready'}
                  </Badge>
                </div>

                {order.selectedCustomizations && order.selectedCustomizations.length > 0 && (
                  <div className="mb-3 rounded-lg bg-primary/5 p-2">
                    <p className="mb-1 text-xs font-medium text-primary">Customizations:</p>
                    <div className="flex flex-wrap gap-1">
                      {order.selectedCustomizations.map((customization, index) => (
                        <Badge key={`${customization.optionName}-${index}`} variant="secondary" className="text-xs">
                          {customization.optionName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {order.deliveryAddress.street}, {order.deliveryAddress.city}
                </div>

                {canModify && order.status !== 'ready' && (
                  <div className="flex gap-2">
                    {order.status === 'pending' && (
                      <Button size="sm" variant="outline" className="rounded-full" onClick={() => handleUpdateOrderStatus(order.id, 'preparing')}>
                        Start Cooking
                      </Button>
                    )}
                    {order.status === 'preparing' && (
                      <Button size="sm" onClick={() => handleUpdateOrderStatus(order.id, 'ready')}>
                        Mark Ready
                      </Button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (!chef) return null;

  if (!isApproved && chef.status === 'pending') {
    return (
      <div className="container px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-warning/20">
              <AlertTriangle className="h-10 w-10 text-warning" />
            </div>
            <h1 className="section-title">Pending approval</h1>
            <p className="mt-2 text-sm text-slate-500">
              Build your dish list and weekly schedule while the admin reviews your profile.
            </p>
          </div>

          {renderDishManagementSection('0ms')}
          {renderScheduleSection('100ms')}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-white to-white" />
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-emerald-100/60 blur-2xl" />
        <div className="absolute bottom-0 left-8 h-72 w-72 rounded-full bg-emerald-50 blur-2xl" />
      </div>

      <div className="container px-4 py-8 relative z-10">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 flex items-center gap-4 animate-slide-up">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl">
              <ChefHat className="h-7 w-7 text-green-400" />
            </div>
            <div>
              <h1 className="section-title">Your Kitchen</h1>
              <p className="mt-1 flex items-center gap-2 text-sm text-slate-500">
                <span className="inline-block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                Welcome back, Chef {chef.name}
              </p>
            </div>
          </div>

          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl border p-4 animate-slide-up ${
              canModify ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
            }`}
            style={{ animationDelay: '100ms' }}
          >
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-full ${
                canModify ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            >
              <Clock className="h-5 w-5 text-white" />
            </div>
            <p className={canModify ? 'font-medium text-emerald-700' : 'text-slate-600'}>
              {canModify ? "Tomorrow's prep list is ready. Add dishes first, then finish your schedule below." : 'Orders are still coming in. Final list appears after 8 PM.'}
            </p>
          </div>

          <NotificationHighlightsCard role="chef" />

          <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card className="card-base animate-slide-up" style={{ animationDelay: '150ms' }}>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-green-600">{orders.length}</p>
                <p className="text-sm text-muted-foreground">Tomorrow&apos;s Orders</p>
              </CardContent>
            </Card>
            <Card className="card-base animate-slide-up" style={{ animationDelay: '200ms' }}>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-gray-500">{orders.filter((order) => order.status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Waiting</p>
              </CardContent>
            </Card>
            <Card className="card-base animate-slide-up" style={{ animationDelay: '250ms' }}>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-blue-500">{orders.filter((order) => order.status === 'preparing').length}</p>
                <p className="text-sm text-muted-foreground">Cooking</p>
              </CardContent>
            </Card>
            <Card className="card-base animate-slide-up" style={{ animationDelay: '300ms' }}>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold text-green-500">{orders.filter((order) => order.status === 'ready').length}</p>
                <p className="text-sm text-muted-foreground">Ready for Pickup</p>
              </CardContent>
            </Card>
          </div>

          {renderDishManagementSection('320ms')}
          {renderScheduleSection('370ms')}
          {renderOrdersSection()}
        </div>
      </div>
    </div>
  );
};

const DishCard = ({ dish }: { dish: Dish }) => (
  <div className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 p-4 transition-all hover:shadow-md">
    <div className="flex items-center gap-4">
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ${
          dish.category === 'veg' ? 'bg-green-500' : 'bg-red-500'
        }`}
      >
        {dish.category === 'veg' ? <Leaf className="h-5 w-5 text-white" /> : <Drumstick className="h-5 w-5 text-white" />}
      </div>
      <div>
        <h3 className="font-medium">{dish.name}</h3>
        <p className="text-sm text-muted-foreground">{dish.description}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3" />
            {dish.nutritionalInfo.calories} cal
          </span>
          <span className="flex items-center gap-1">
            <Dumbbell className="h-3 w-3" />
            {dish.nutritionalInfo.protein}g protein
          </span>
        </div>
      </div>
    </div>
    <Badge variant={dish.allowsCustomization ? 'default' : 'secondary'} className="rounded-full">
      {dish.allowsCustomization ? 'Flexible' : 'Set Menu'}
    </Badge>
  </div>
);
