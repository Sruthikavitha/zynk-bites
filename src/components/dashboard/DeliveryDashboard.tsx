import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import * as db from '@/services/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Truck, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Package, 
  ChefHat, 
  Home, 
  Building2,
  PackageCheck,
  Lock,
  AlertCircle
} from 'lucide-react';
import type { Order, AddressType } from '@/types';

interface DeliveryOrder extends Order {
  chefName?: string;
  zone?: string;
  deliveryAddressType?: AddressType;
}

const CutoffBanner = () => {
  const [isLocked, setIsLocked] = useState(!db.isBeforeCutoff());

  useEffect(() => {
    const interval = setInterval(() => {
      setIsLocked(!db.isBeforeCutoff());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!isLocked) {
    return (
      <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-slate-400" />
        <div>
          <p className="font-medium text-slate-700">Kitchen still prepping</p>
          <p className="text-sm text-slate-500">Orders finalize after 8 PM. Check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-3">
      <Lock className="w-5 h-5 text-emerald-600" />
      <div>
        <p className="font-medium text-emerald-700">Routes are set</p>
        <p className="text-sm text-slate-500">Tomorrow's deliveries are ready for pickup.</p>
      </div>
    </div>
  );
};

const DeliveryCard = ({ 
  order, 
  onPickUp, 
  onDeliver,
  loading 
}: { 
  order: DeliveryOrder; 
  onPickUp: (id: string) => void;
  onDeliver: (id: string) => void;
  loading: boolean;
}) => {
  const isDelivered = order.status === 'delivered';
  const isPickedUp = order.status === 'picked_up' || order.status === 'out_for_delivery';

  return (
    <div 
      className={`p-4 rounded-2xl border transition-all ${
        isDelivered 
          ? 'bg-slate-50 border-slate-200 opacity-60' 
          : 'bg-white border-emerald-100 hover:border-emerald-200'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold truncate">{order.customerName}</h3>
            <Badge 
              variant="outline" 
              className={`text-xs capitalize ${
                order.deliveryAddressType === 'work' 
                  ? 'border-slate-300 text-slate-600' 
                  : 'border-emerald-300 text-emerald-700'
              }`}
            >
              {order.deliveryAddressType === 'work' ? (
                <><Building2 className="w-3 h-3 mr-1" />Work</>
              ) : (
                <><Home className="w-3 h-3 mr-1" />Home</>
              )}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">
              {order.mealTime}
            </Badge>
          </div>

          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">
                {order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.zipCode}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <ChefHat className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{order.chefName || 'Unassigned'}</span>
            </div>

            <div className="flex items-center gap-2">
              <Package className="w-3.5 h-3.5 flex-shrink-0 text-primary" />
              <span className="font-medium">{order.mealName}</span>
            </div>

            {order.selectedCustomizations && order.selectedCustomizations.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {order.selectedCustomizations.map((c, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {c.optionName}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {isDelivered ? (
            <Badge className="bg-emerald-600 text-white">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Delivered
            </Badge>
          ) : isPickedUp ? (
            <>
              <Badge className="bg-emerald-500 text-white">
                <Truck className="w-3 h-3 mr-1" />
                Picked Up
              </Badge>
              <Button 
                size="sm" 
                onClick={() => onDeliver(order.id)}
                disabled={loading}
              >
                <CheckCircle2 className="w-4 h-4 mr-1" />
                Delivered
              </Button>
            </>
          ) : (
            <>
              <Badge variant="outline" className="border-emerald-300 text-emerald-700">
                <Clock className="w-3 h-3 mr-1" />
                Ready
              </Badge>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => onPickUp(order.id)}
                disabled={loading}
              >
                <PackageCheck className="w-4 h-4 mr-1" />
                Pick Up
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="text-center py-12">
    <Package className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
    <h3 className="font-semibold text-lg mb-1">No Deliveries</h3>
    <p className="text-muted-foreground">There are no deliveries scheduled for tomorrow.</p>
  </div>
);

export const DeliveryDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<DeliveryOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDeliveries();
  }, []);

  const loadDeliveries = () => {
    setLoading(true);
    const response = api.getTomorrowDeliveries();
    if (response.success) {
      setOrders((response.data as DeliveryOrder[]) || []);
    }
    setLoading(false);
  };

  const handlePickUp = (orderId: string) => {
    if (!user) return;
    setActionLoading(true);
    const response = api.markPickedUp(user.id, orderId);
    if (response.success) {
      toast({ title: 'Picked Up!', description: 'Order marked as picked up.' });
      loadDeliveries();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
    setActionLoading(false);
  };

  const handleDeliver = (orderId: string) => {
    if (!user) return;
    setActionLoading(true);
    const response = api.markDelivered(user.id, orderId);
    if (response.success) {
      toast({ title: 'Delivered!', description: 'Order marked as delivered.' });
      loadDeliveries();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
    setActionLoading(false);
  };

  const pendingOrders = orders.filter(o => o.status !== 'delivered');
  const deliveredOrders = orders.filter(o => o.status === 'delivered');

  const groupedByZone = orders.reduce((acc, order) => {
    const zone = order.zone || 'Unknown Zone';
    if (!acc[zone]) acc[zone] = [];
    acc[zone].push(order);
    return acc;
  }, {} as Record<string, DeliveryOrder[]>);

  const groupedByChef = orders.reduce((acc, order) => {
    const chef = order.chefName || 'Unassigned';
    if (!acc[chef]) acc[chef] = [];
    acc[chef].push(order);
    return acc;
  }, {} as Record<string, DeliveryOrder[]>);

  return (
    <div className="min-h-screen relative overflow-hidden bg-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-white to-white" />
        <div className="absolute -top-24 right-10 h-64 w-64 rounded-full bg-emerald-100/60 blur-2xl" />
        <div className="absolute bottom-0 left-8 h-72 w-72 rounded-full bg-emerald-50 blur-2xl" />
      </div>

      <div className="container py-8 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <Truck className="w-7 h-7 text-emerald-600" />
            </div>
            <div>
              <h1 className="section-title">Delivery Routes</h1>
              <p className="mt-1 text-sm text-slate-500">Hello, {user?.name}! Here are your deliveries.</p>
            </div>
          </div>

        <CutoffBanner />

        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card className="card-base">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-emerald-700">{orders.length}</p>
              <p className="text-sm text-slate-500">Total Deliveries</p>
            </CardContent>
          </Card>
          <Card className="card-base">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-amber-500">{pendingOrders.length}</p>
              <p className="text-sm text-slate-500">Pending</p>
            </CardContent>
          </Card>
          <Card className="card-base">
            <CardContent className="pt-6">
              <p className="text-3xl font-bold text-emerald-600">{deliveredOrders.length}</p>
              <p className="text-sm text-slate-500">Completed</p>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading deliveries...</div>
        ) : orders.length === 0 ? (
          <Card className="card-base">
            <CardContent className="pt-6">
              <EmptyState />
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList className="grid grid-cols-3 w-full max-w-md">
              <TabsTrigger value="all">All ({orders.length})</TabsTrigger>
              <TabsTrigger value="zone">By Zone</TabsTrigger>
              <TabsTrigger value="chef">By Chef</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <Card className="card-base">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <Clock className="w-5 h-5 text-warning" />
                    Tomorrow's Deliveries
                  </CardTitle>
                  <CardDescription>All scheduled deliveries for tomorrow</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[...pendingOrders, ...deliveredOrders].map((order) => (
                    <DeliveryCard 
                      key={order.id} 
                      order={order}
                      onPickUp={handlePickUp}
                      onDeliver={handleDeliver}
                      loading={actionLoading}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="zone" className="space-y-4">
              {Object.entries(groupedByZone).map(([zone, zoneOrders]) => (
                <Card key={zone} className="card-base">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2 text-lg">
                      <MapPin className="w-5 h-5 text-primary" />
                      {zone}
                      <Badge variant="secondary" className="ml-2">{zoneOrders.length}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {zoneOrders.map((order) => (
                      <DeliveryCard 
                        key={order.id} 
                        order={order}
                        onPickUp={handlePickUp}
                        onDeliver={handleDeliver}
                        loading={actionLoading}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="chef" className="space-y-4">
              {Object.entries(groupedByChef).map(([chef, chefOrders]) => (
                <Card key={chef} className="card-base">
                  <CardHeader>
                    <CardTitle className="font-display flex items-center gap-2 text-lg">
                      <ChefHat className="w-5 h-5 text-chef" />
                      {chef}
                      <Badge variant="secondary" className="ml-2">{chefOrders.length}</Badge>
                    </CardTitle>
                    <CardDescription>Pickup from chef's kitchen</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {chefOrders.map((order) => (
                      <DeliveryCard 
                        key={order.id} 
                        order={order}
                        onPickUp={handlePickUp}
                        onDeliver={handleDeliver}
                        loading={actionLoading}
                      />
                    ))}
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
      </div>
    </div>
  );
};


