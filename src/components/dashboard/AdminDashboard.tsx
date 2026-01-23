import { useState, useEffect } from 'react';
import * as api from '@/services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  ShieldCheck, 
  Users, 
  ChefHat, 
  Calendar, 
  TrendingUp,
  Check,
  X,
  Clock
} from 'lucide-react';
import type { Chef } from '@/types';

export const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalChefs: 0,
    activeSubscriptions: 0,
    pendingChefs: 0,
    totalOrders: 0,
  });
  const [pendingChefs, setPendingChefs] = useState<Chef[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    
    const statsResponse = api.getAdminOverview();
    if (statsResponse.success) {
      setStats(statsResponse.data!);
    }

    const chefsResponse = api.getPendingChefs();
    if (chefsResponse.success) {
      setPendingChefs(chefsResponse.data || []);
    }
    
    setLoading(false);
  };

  const handleApproveChef = (chefId: string) => {
    const response = api.approveChef(chefId);
    if (response.success) {
      toast({ title: 'Chef Approved', description: 'The chef can now access orders.' });
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

  return (
    <div className="container py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-admin flex items-center justify-center">
            <ShieldCheck className="w-7 h-7 text-admin-foreground" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground">ZYNK Platform Overview</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalCustomers}</p>
                  <p className="text-xs text-muted-foreground">Customers</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-chef/10 flex items-center justify-center">
                  <ChefHat className="w-5 h-5 text-chef" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalChefs}</p>
                  <p className="text-xs text-muted-foreground">Chefs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
                  <p className="text-xs text-muted-foreground">Active Subs</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.pendingChefs}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-card">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">Orders</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Chef Approvals */}
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
                        {chef.specialty && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {chef.specialty}
                          </Badge>
                        )}
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
      </div>
    </div>
  );
};
