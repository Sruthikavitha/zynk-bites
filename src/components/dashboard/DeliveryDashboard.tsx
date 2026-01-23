import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Truck, MapPin, CheckCircle2, Clock, Package } from 'lucide-react';
import type { Order } from '@/types';

export const DeliveryDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = () => {
    setLoading(true);
    const response = api.getTomorrowDeliveries();
    if (response.success) {
      setOrders(response.data || []);
    }
    setLoading(false);
  };

  const handleMarkDelivered = (orderId: string) => {
    if (!user) return;
    const response = api.markDelivered(user.id, orderId);
    if (response.success) {
      toast({ title: 'Delivered!', description: 'Order marked as delivered.' });
      loadDeliveries();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const pendingOrders = orders.filter(o => o.status !== 'delivered');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  return (
    <div className="container py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-delivery flex items-center justify-center">
            <Truck className="w-7 h-7 text-delivery-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Delivery Dashboard</h1>
            <p className="text-muted-foreground">Welcome, {user?.name}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-delivery">{orders.length}</p>
              <p className="text-sm text-muted-foreground">Total Deliveries</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-warning">{pendingOrders.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-accent">{deliveredOrders.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Deliveries */}
        <Card className="shadow-elevated mb-6">
          <CardHeader>
            <CardTitle className="font-display flex items-center gap-2">
              <Clock className="w-5 h-5 text-warning" />
              Pending Deliveries
            </CardTitle>
            <CardDescription>Tomorrow's deliveries to complete</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : pendingOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No pending deliveries</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{order.mealName}</h3>
                        <Badge variant="outline" className="capitalize text-xs">
                          {order.mealTime}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        For: {order.customerName}
                      </p>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.zipCode}
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className="gradient-accent"
                      onClick={() => handleMarkDelivered(order.id)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Delivered
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Completed Deliveries */}
        {deliveredOrders.length > 0 && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deliveredOrders.map((order) => (
                  <div 
                    key={order.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-accent/10"
                  >
                    <div>
                      <p className="font-medium text-sm">{order.mealName}</p>
                      <p className="text-xs text-muted-foreground">{order.customerName}</p>
                    </div>
                    <Badge className="bg-accent text-accent-foreground">Delivered</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
