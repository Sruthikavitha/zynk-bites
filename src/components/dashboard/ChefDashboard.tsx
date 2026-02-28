import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { backendApi } from '@/services/backendApi';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChefHat, Clock, MapPin, UtensilsCrossed, AlertTriangle, Plus, Leaf, Drumstick, Flame, Dumbbell, Upload, FileText, CheckCircle2 } from 'lucide-react';
import type { Order, Chef, Dish, NutritionalInfo, CustomizationOption } from '@/types';

export const ChefDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDish, setShowAddDish] = useState(false);
  const [canModify] = useState(!api.canModifyMeal());

  // Menu card upload
  const [menuFile, setMenuFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New dish form
  const [dishName, setDishName] = useState('');
  const [dishDesc, setDishDesc] = useState('');
  const [dishCategory, setDishCategory] = useState<'veg' | 'non-veg'>('veg');
  const [allowsCustomization, setAllowsCustomization] = useState(false);
  const [customOptions, setCustomOptions] = useState<string[]>([]);
  const [newOption, setNewOption] = useState('');

  const chef = user as Chef;
  const isApproved = chef?.status === 'approved';

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = () => {
    if (!user) return;
    setLoading(true);

    const ordersResponse = api.getChefOrders(user.id);
    if (ordersResponse.success) {
      setOrders(ordersResponse.data || []);
    }

    const dishesResponse = api.getChefDishes(user.id);
    if (dishesResponse.success) {
      setDishes(dishesResponse.data || []);
    }

    setLoading(false);
  };

  const handleMenuUpload = async () => {
    if (!menuFile || !user) return;
    setUploading(true);
    try {
      const weekStart = new Date().toISOString().split('T')[0];
      const result = await backendApi.uploadMenuCard(user.id, menuFile, weekStart);
      setUploadedUrl(result.menuCardUrl || null);
      toast({ title: 'Menu Uploaded!', description: 'Your weekly menu card is now live for customers.' });
      setMenuFile(null);
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.message || 'Could not upload menu card.', variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleAddDish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const nutritionalInfo = api.generateNutritionalInfo(dishName);
    const customizationOptions: CustomizationOption[] = customOptions.map((opt, i) => ({
      id: `opt-${i}`,
      name: opt,
      type: 'add' as const,
    }));

    const response = api.addDish(
      user.id,
      dishName,
      dishDesc,
      dishCategory,
      nutritionalInfo,
      allowsCustomization,
      customizationOptions
    );

    if (response.success) {
      toast({ title: 'Dish Added!', description: 'Your new dish is now available.' });
      setShowAddDish(false);
      setDishName('');
      setDishDesc('');
      setCustomOptions([]);
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleUpdateOrderStatus = (orderId: string, status: 'preparing' | 'ready') => {
    if (!user) return;
    const response = api.updateOrderStatus(user.id, orderId, status);
    if (response.success) {
      toast({ title: 'Status Updated', description: `Order marked as ${status}` });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const addCustomOption = () => {
    if (newOption.trim()) {
      setCustomOptions([...customOptions, newOption.trim()]);
      setNewOption('');
    }
  };

  // Pending approval view
  if (!isApproved && chef?.status === 'pending') {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-warning/20 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-warning" />
            </div>
            <h1 className="font-display text-2xl font-bold mb-2">Pending Approval</h1>
            <p className="text-muted-foreground">You can add your dishes while waiting for admin approval.</p>
          </div>

          {/* Dish Management Section */}
          <Card className="shadow-elevated mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="font-display">Your Dishes</CardTitle>
                <Button onClick={() => setShowAddDish(true)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />Add Dish
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {dishes.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No dishes yet. Add your first dish!</p>
              ) : (
                <div className="space-y-3">
                  {dishes.map((dish) => (
                    <DishCard key={dish.id} dish={dish} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Add Dish Modal
  if (showAddDish) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-lg mx-auto">
          <Card className="shadow-elevated">
            <CardHeader>
              <CardTitle className="font-display">Add New Dish</CardTitle>
              <CardDescription>Nutritional info will be auto-generated</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddDish} className="space-y-4">
                <div className="space-y-2">
                  <Label>Dish Name</Label>
                  <Input value={dishName} onChange={(e) => setDishName(e.target.value)} placeholder="e.g., Butter Chicken Thali" required />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={dishDesc} onChange={(e) => setDishDesc(e.target.value)} placeholder="Brief description..." required />
                </div>

                <div className="space-y-2">
                  <Label>Category</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant={dishCategory === 'veg' ? 'default' : 'outline'} onClick={() => setDishCategory('veg')} className="flex-1">
                      <Leaf className="w-4 h-4 mr-2 text-accent" />Veg
                    </Button>
                    <Button type="button" variant={dishCategory === 'non-veg' ? 'default' : 'outline'} onClick={() => setDishCategory('non-veg')} className="flex-1">
                      <Drumstick className="w-4 h-4 mr-2 text-destructive" />Non-Veg
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <input type="checkbox" checked={allowsCustomization} onChange={(e) => setAllowsCustomization(e.target.checked)} className="rounded" />
                    Allow Customization
                  </Label>
                </div>

                {allowsCustomization && (
                  <div className="space-y-2 p-3 rounded-lg bg-secondary/50">
                    <Label>Customization Options</Label>
                    <div className="flex gap-2">
                      <Input value={newOption} onChange={(e) => setNewOption(e.target.value)} placeholder="e.g., Extra rice" />
                      <Button type="button" onClick={addCustomOption} size="sm">Add</Button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customOptions.map((opt, i) => (
                        <Badge key={i} variant="secondary">{opt}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setShowAddDish(false)} className="flex-1">Cancel</Button>
                  <Button type="submit" className="flex-1 gradient-primary">Add Dish</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main Dashboard (approved chef)
  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-chef/10 border border-chef/20 flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-chef" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Your Kitchen</h1>
            <p className="text-muted-foreground">Welcome back, Chef {user?.name}</p>
          </div>
        </div>

        {/* Finalization Banner */}
        <div className={`mb-6 p-4 rounded-2xl flex items-center gap-3 ${canModify ? 'bg-primary/5 border border-primary/20' : 'bg-muted/80 border border-border/50'}`}>
          <Clock className={`w-5 h-5 ${canModify ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className={canModify ? 'text-primary' : 'text-foreground'}>
            {canModify ? "Tomorrow's prep list is ready! Time to cook." : 'Orders still coming in. Final list after 8 PM.'}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-chef">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Tomorrow's Orders</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-muted-foreground">{orders.filter(o => o.status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">Waiting</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-info">{orders.filter(o => o.status === 'preparing').length}</p>
              <p className="text-sm text-muted-foreground">Cooking</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-primary">{orders.filter(o => o.status === 'ready').length}</p>
              <p className="text-sm text-muted-foreground">Ready for Pickup</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card className="shadow-soft mb-6">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Tomorrow's Prep List
            </CardTitle>
            <CardDescription>Orders confirmed after evening cutoff</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-center py-8 text-muted-foreground">Loading...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No orders for tomorrow yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="p-4 rounded-2xl bg-secondary/50 border border-border/30">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{order.mealName}</h3>
                        <p className="text-sm text-muted-foreground">For: {order.customerName}</p>
                      </div>
                      <Badge variant={order.status === 'ready' ? 'default' : 'outline'} className="capitalize rounded-full">
                        {order.status === 'pending' ? 'Waiting' : order.status === 'preparing' ? 'Cooking' : 'Ready'}
                      </Badge>
                    </div>

                    {order.selectedCustomizations && order.selectedCustomizations.length > 0 && (
                      <div className="mb-3 p-2 rounded-lg bg-primary/5">
                        <p className="text-xs font-medium text-primary mb-1">Customizations:</p>
                        <div className="flex flex-wrap gap-1">
                          {order.selectedCustomizations.map((c, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{c.optionName}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="w-3 h-3" />
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
                          <Button size="sm" className="gradient-herbal rounded-full" onClick={() => handleUpdateOrderStatus(order.id, 'ready')}>
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

        {/* Weekly Menu Card Upload */}
        <Card className="shadow-soft mb-6 border-primary/10">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Weekly Menu Card
            </CardTitle>
            <CardDescription>Upload a PDF or image of your weekly menu for customers to preview</CardDescription>
          </CardHeader>
          <CardContent>
            {uploadedUrl ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">Menu card uploaded successfully</p>
                  <a href={uploadedUrl} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-muted-foreground hover:underline truncate block">View menu card →</a>
                </div>
                <Button size="sm" variant="outline" onClick={() => setUploadedUrl(null)}>Replace</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border/60 rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="font-medium text-sm">{menuFile ? menuFile.name : 'Click to upload menu card'}</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF, JPG, or PNG up to 5MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setMenuFile(e.target.files?.[0] || null)}
                />
                {menuFile && (
                  <Button onClick={handleMenuUpload} disabled={uploading} className="w-full gradient-primary">
                    {uploading ? 'Uploading...' : 'Upload Menu Card'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dish Management */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="font-display">Your Dishes</CardTitle>
              <Button onClick={() => setShowAddDish(true)} size="sm">
                <Plus className="w-4 h-4 mr-2" />Add Dish
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dishes.map((dish) => (
                <DishCard key={dish.id} dish={dish} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const DishCard = ({ dish }: { dish: Dish }) => (
  <div className="p-4 rounded-2xl bg-secondary/50 border border-border/30 flex items-center justify-between">
    <div className="flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dish.category === 'veg' ? 'bg-primary/10' : 'bg-destructive/10'}`}>
        {dish.category === 'veg' ? <Leaf className="w-5 h-5 text-primary" /> : <Drumstick className="w-5 h-5 text-destructive" />}
      </div>
      <div>
        <h3 className="font-medium">{dish.name}</h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Flame className="w-3 h-3" />{dish.nutritionalInfo.calories} cal</span>
          <span className="flex items-center gap-1"><Dumbbell className="w-3 h-3" />{dish.nutritionalInfo.protein}g protein</span>
        </div>
      </div>
    </div>
    <Badge variant={dish.allowsCustomization ? 'default' : 'secondary'} className="rounded-full">
      {dish.allowsCustomization ? 'Flexible' : 'Set Menu'}
    </Badge>
  </div>
);
