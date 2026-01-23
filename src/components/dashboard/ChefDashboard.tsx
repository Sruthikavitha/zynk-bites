import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChefHat, Clock, MapPin, UtensilsCrossed, AlertTriangle } from 'lucide-react';
import type { Order, Chef } from '@/types';

export const ChefDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    }
  }, [user]);

  const loadOrders = () => {
    if (!user) return;
    setLoading(true);
    const response = api.getChefOrders(user.id);
    if (response.success) {
      setOrders(response.data || []);
    }
    setLoading(false);
  };

  const chef = user as Chef;
  const isApproved = chef?.status === 'approved';

  if (!isApproved) {
    return (
      <div className="container py-8 px-4">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-warning" />
          </div>
          <h1 className="font-display text-2xl font-bold mb-2">Pending Approval</h1>
          <p className="text-muted-foreground">
            Your chef application is currently being reviewed. You'll be able to access orders once approved by an admin.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-chef flex items-center justify-center">
            <ChefHat className="w-7 h-7 text-chef-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Chef Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-chef">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Tomorrow's Orders</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-accent">{orders.filter(o => o.status === 'pending').length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-info">{orders.filter(o => o.mealTime === 'lunch').length}</p>
              <p className="text-sm text-muted-foreground">Lunch Orders</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-primary">{orders.filter(o => o.mealTime === 'dinner').length}</p>
              <p className="text-sm text-muted-foreground">Dinner Orders</p>
            </CardContent>
          </Card>
        </div>

        {/* Orders List */}
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Tomorrow's Preparation
            </CardTitle>
            <CardDescription>
              Orders after 8 PM cutoff - skips/swaps are finalized
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading orders...</div>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <UtensilsCrossed className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No orders for tomorrow yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-chef/20 flex items-center justify-center">
                        <UtensilsCrossed className="w-6 h-6 text-chef" />
                      </div>
                      <div>
                        <h3 className="font-medium">{order.mealName}</h3>
                        <p className="text-sm text-muted-foreground">
                          For: {order.customerName}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="capitalize">
                        {order.mealTime}
                      </Badge>
                      <div className="text-right text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-3 h-3" />
                          {order.deliveryAddress.city}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
