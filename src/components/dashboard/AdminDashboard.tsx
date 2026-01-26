import { useState, useEffect } from 'react';
import * as api from '@/services/api';
import * as db from '@/services/db';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Users, 
  ChefHat, 
  Calendar, 
  TrendingUp,
  Check,
  X,
  Clock,
  MapPin,
  Package,
  Pause,
  Play,
  Lock,
  AlertCircle,
  Ban,
  CheckCircle2
} from 'lucide-react';
import type { Chef, Subscription } from '@/types';

interface EnhancedStats {
  totalCustomers: number;
  totalChefs: number;
  approvedChefs: number;
  activeSubscriptions: number;
  pendingChefs: number;
  totalOrders: number;
  tomorrowMeals: number;
  pausedSubscriptions: number;
  disabledChefs: number;
}

interface OperationsSummary {
  chefBreakdown: Array<{
    chefId: string;
    chefName: string;
    totalMeals: number;
    customizationCount: number;
  }>;
  zoneBreakdown: Array<{
    zone: string;
    totalDeliveries: number;
  }>;
  totalMeals: number;
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
      <div className="mb-6 p-4 rounded-2xl bg-muted/80 border border-border/50 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-medium text-foreground">Before evening cutoff</p>
          <p className="text-sm text-muted-foreground">Members can still modify tomorrow's meals until 8 PM.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/20 flex items-center gap-3">
      <Lock className="w-5 h-5 text-primary" />
      <div>
        <p className="font-medium text-primary">Kitchen orders locked</p>
        <p className="text-sm text-muted-foreground">Tomorrow's meals are confirmed and sent to chefs.</p>
      </div>
    </div>
  );
};

const StatCard = ({ 
  icon: Icon, 
  value, 
  label, 
  color = 'primary' 
}: { 
  icon: React.ElementType; 
  value: number; 
  label: string;
  color?: string;
}) => (
  <Card className="shadow-card">
    <CardContent className="pt-6">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg bg-${color}/10 flex items-center justify-center`}>
          <Icon className={`w-5 h-5 text-${color}`} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<EnhancedStats>({
    totalCustomers: 0,
    totalChefs: 0,
    approvedChefs: 0,
    activeSubscriptions: 0,
    pendingChefs: 0,
    totalOrders: 0,
    tomorrowMeals: 0,
    pausedSubscriptions: 0,
    disabledChefs: 0,
  });
  const [pendingChefs, setPendingChefs] = useState<Chef[]>([]);
  const [allChefs, setAllChefs] = useState<Chef[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [operationsSummary, setOperationsSummary] = useState<OperationsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    const statsResponse = api.getEnhancedAdminOverview();
    if (statsResponse.success && statsResponse.data) {
      setStats(statsResponse.data);
    }

    const pendingResponse = api.getPendingChefs();
    if (pendingResponse.success) {
      setPendingChefs(pendingResponse.data || []);
    }

    const allChefsResponse = api.getAllChefs();
    if (allChefsResponse.success) {
      setAllChefs(allChefsResponse.data || []);
    }

    const subsResponse = api.getAllSubscriptions();
    if (subsResponse.success) {
      setSubscriptions(subsResponse.data || []);
    }

    const opsResponse = api.getTomorrowOperationsSummary();
    if (opsResponse.success && opsResponse.data) {
      setOperationsSummary(opsResponse.data);
    }
    
    setLoading(false);
  };

  const handleApproveChef = (chefId: string) => {
    const response = api.approveChef(chefId);
    if (response.success) {
      toast({ title: 'Chef Approved', description: 'The chef can now accept orders.' });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleRejectChef = (chefId: string) => {
    const response = api.rejectChef(chefId);
    if (response.success) {
      toast({ title: 'Chef Rejected', description: 'The application has been rejected.' });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleToggleChef = (chef: Chef) => {
    const response = chef.isDisabled 
      ? api.enableChef(chef.id) 
      : api.disableChef(chef.id);
    
    if (response.success) {
      toast({ 
        title: chef.isDisabled ? 'Chef Enabled' : 'Chef Disabled', 
        description: chef.isDisabled 
          ? 'The chef is now visible to customers.' 
          : 'The chef is now hidden from customers.'
      });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const handleToggleSubscription = (sub: Subscription) => {
    const response = sub.status === 'paused' 
      ? api.resumeSubscription(sub.id) 
      : api.pauseSubscription(sub.id);
    
    if (response.success) {
      toast({ 
        title: sub.status === 'paused' ? 'Subscription Resumed' : 'Subscription Paused',
        description: response.message
      });
      loadData();
    } else {
      toast({ title: 'Error', description: response.error, variant: 'destructive' });
    }
  };

  const approvedChefsList = allChefs.filter(c => c.status === 'approved');

  return (
    <div className="container py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-admin/10 border border-admin/20 flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-admin" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Kitchen Command</h1>
            <p className="text-muted-foreground">ZYNK Platform Overview</p>
          </div>
        </div>

        <CutoffBanner />

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatCard icon={Users} value={stats.totalCustomers} label="Members" color="primary" />
          <StatCard icon={ChefHat} value={stats.approvedChefs} label="Home Chefs" color="chef" />
          <StatCard icon={Calendar} value={stats.activeSubscriptions} label="Active Plans" color="primary" />
          <StatCard icon={Clock} value={stats.pendingChefs} label="Awaiting Review" color="warning" />
          <StatCard icon={TrendingUp} value={stats.tomorrowMeals} label="Tomorrow's Meals" color="info" />
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="approvals">
              Chef Approvals {pendingChefs.length > 0 && <Badge className="ml-2" variant="destructive">{pendingChefs.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="operations">Operations</TabsTrigger>
            <TabsTrigger value="chefs">Manage Chefs</TabsTrigger>
            <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-warning" />
                  Pending Chef Approvals
                </CardTitle>
                <CardDescription>Review and approve chef partner applications</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading...</div>
                ) : pendingChefs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No pending applications</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingChefs.map((chef) => (
                      <div 
                        key={chef.id} 
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/50"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-chef/20 flex items-center justify-center">
                            <ChefHat className="w-6 h-6 text-chef" />
                          </div>
                          <div>
                            <h3 className="font-medium">{chef.name}</h3>
                            <p className="text-sm text-muted-foreground">{chef.email}</p>
                            <div className="flex gap-2 mt-1">
                              {chef.specialty && (
                                <Badge variant="outline" className="text-xs">
                                  {chef.specialty}
                                </Badge>
                              )}
                              {chef.serviceArea && (
                                <Badge variant="secondary" className="text-xs">
                                  <MapPin className="w-3 h-3 mr-1" />
                                  {chef.serviceArea}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-destructive border-destructive/50 hover:bg-destructive/10"
                            onClick={() => handleRejectChef(chef.id)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm"
                            className="gradient-accent"
                            onClick={() => handleApproveChef(chef.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="operations">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="shadow-elevated">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-chef" />
                    Chef-wise Breakdown
                  </CardTitle>
                  <CardDescription>Tomorrow's orders by chef</CardDescription>
                </CardHeader>
                <CardContent>
                  {!operationsSummary || operationsSummary.chefBreakdown.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No orders for tomorrow</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Chef</TableHead>
                          <TableHead className="text-center">Meals</TableHead>
                          <TableHead className="text-center">Customizations</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operationsSummary.chefBreakdown.map((chef) => (
                          <TableRow key={chef.chefId}>
                            <TableCell className="font-medium">{chef.chefName}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{chef.totalMeals}</Badge>
                            </TableCell>
                            <TableCell className="text-center">
                              {chef.customizationCount > 0 ? (
                                <Badge variant="outline" className="text-warning border-warning">
                                  {chef.customizationCount}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="shadow-elevated">
                <CardHeader>
                  <CardTitle className="font-display flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-delivery" />
                    Delivery Zone Breakdown
                  </CardTitle>
                  <CardDescription>Tomorrow's deliveries by area</CardDescription>
                </CardHeader>
                <CardContent>
                  {!operationsSummary || operationsSummary.zoneBreakdown.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No deliveries for tomorrow</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Zone / Area</TableHead>
                          <TableHead className="text-center">Deliveries</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {operationsSummary.zoneBreakdown.map((zone) => (
                          <TableRow key={zone.zone}>
                            <TableCell className="font-medium">{zone.zone}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="secondary">{zone.totalDeliveries}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            {operationsSummary && operationsSummary.totalMeals > 0 && (
              <Card className="shadow-card mt-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Meals Tomorrow</p>
                      <p className="text-3xl font-bold text-primary">{operationsSummary.totalMeals}</p>
                    </div>
                    <div className="flex gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-chef">{operationsSummary.chefBreakdown.length}</p>
                        <p className="text-xs text-muted-foreground">Active Chefs</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-delivery">{operationsSummary.zoneBreakdown.length}</p>
                        <p className="text-xs text-muted-foreground">Delivery Zones</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="chefs">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <ChefHat className="w-5 h-5 text-chef" />
                  Chef Management
                </CardTitle>
                <CardDescription>Enable or disable chef availability</CardDescription>
              </CardHeader>
              <CardContent>
                {approvedChefsList.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ChefHat className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No approved chefs</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Chef</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Service Area</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {approvedChefsList.map((chef) => (
                        <TableRow key={chef.id} className={chef.isDisabled ? 'opacity-60' : ''}>
                          <TableCell className="font-medium">{chef.name}</TableCell>
                          <TableCell>{chef.specialty || '-'}</TableCell>
                          <TableCell>{chef.serviceArea || '-'}</TableCell>
                          <TableCell>
                            {chef.rating ? (
                              <Badge variant="outline">⭐ {chef.rating}</Badge>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {chef.isDisabled ? (
                              <Badge variant="destructive">Disabled</Badge>
                            ) : (
                              <Badge className="bg-accent">Active</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={chef.isDisabled ? 'default' : 'outline'}
                              onClick={() => handleToggleChef(chef)}
                              className={chef.isDisabled ? 'gradient-accent' : ''}
                            >
                              {chef.isDisabled ? (
                                <><CheckCircle2 className="w-4 h-4 mr-1" />Enable</>
                              ) : (
                                <><Ban className="w-4 h-4 mr-1" />Disable</>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subscriptions">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="font-display flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-accent" />
                  Subscription Management
                </CardTitle>
                <CardDescription>Pause or resume customer subscriptions</CardDescription>
              </CardHeader>
              <CardContent>
                {subscriptions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No subscriptions found</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Meal Time</TableHead>
                        <TableHead>Start Date</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {subscriptions.map((sub) => (
                        <TableRow key={sub.id} className={sub.status === 'paused' ? 'opacity-60' : ''}>
                          <TableCell className="font-medium">{sub.customerName || 'Unknown'}</TableCell>
                          <TableCell className="capitalize">{sub.plan}</TableCell>
                          <TableCell className="capitalize">{sub.mealTime}</TableCell>
                          <TableCell>{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-center">
                            {sub.status === 'active' ? (
                              <Badge className="bg-accent">Active</Badge>
                            ) : sub.status === 'paused' ? (
                              <Badge variant="secondary">Paused</Badge>
                            ) : (
                              <Badge variant="destructive">Cancelled</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {sub.status !== 'cancelled' && (
                              <Button
                                size="sm"
                                variant={sub.status === 'paused' ? 'default' : 'outline'}
                                onClick={() => handleToggleSubscription(sub)}
                                className={sub.status === 'paused' ? 'gradient-accent' : ''}
                              >
                                {sub.status === 'paused' ? (
                                  <><Play className="w-4 h-4 mr-1" />Resume</>
                                ) : (
                                  <><Pause className="w-4 h-4 mr-1" />Pause</>
                                )}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
