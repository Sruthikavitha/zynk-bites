import { useCallback, useEffect, useState, type ElementType } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/services/api";
import {
  approveChefApproval,
  getAllChefApprovals,
  getApiToken,
  getPendingChefApprovals,
  type BackendAdminChef,
} from "@/services/backend";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock3, MapPin, ShieldCheck, Users } from "lucide-react";
import type { Chef } from "@/types";

const mapLocalChefToAdminChef = (chef: Chef): BackendAdminChef => ({
  id: chef.id,
  name: chef.name,
  email: chef.email,
  role: "chef",
  status: chef.status === "approved" ? "approved" : "pending",
  specialty: chef.specialty,
  bio: chef.bio,
  serviceArea: chef.serviceArea,
  phone: null,
  isDisabled: chef.isDisabled,
  createdAt: chef.createdAt,
});

const dedupeChefs = (chefs: BackendAdminChef[]) => {
  const chefMap = new Map<string, BackendAdminChef>();
  chefs.forEach((chef) => chefMap.set(chef.id, chef));
  return Array.from(chefMap.values());
};

const Admin = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const token = getApiToken();

  const [pendingChefs, setPendingChefs] = useState<BackendAdminChef[]>([]);
  const [approvedChefs, setApprovedChefs] = useState<BackendAdminChef[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingChefId, setSubmittingChefId] = useState<string | null>(null);

  const canAccessAdmin = Boolean(token && user?.role === "admin");

  const loadData = useCallback(async () => {
    if (!token || user?.role !== "admin") {
      setLoading(false);
      return;
    }

    setLoading(true);
    const [pending, all] = await Promise.all([
      getPendingChefApprovals(token),
      getAllChefApprovals(token),
    ]);

    const localPending = (api.getPendingChefs().data || []).map(mapLocalChefToAdminChef);
    const localAll = (api.getAllChefs().data || []).map(mapLocalChefToAdminChef);

    setPendingChefs(dedupeChefs([...(pending || []), ...localPending]).filter((chef) => chef.status !== "approved"));
    setApprovedChefs(dedupeChefs([...(all || []), ...localAll]).filter((chef) => chef.status === "approved"));
    setLoading(false);
  }, [token, user?.role]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleApprove = async (chefId: string) => {
    if (!token) return;
    setSubmittingChefId(chefId);

    const isBackendChefId = /^\d+$/.test(chefId);
    const response = isBackendChefId
      ? await approveChefApproval(token, chefId)
      : (() => {
          const localResponse = api.approveChef(chefId);
          return {
            success: localResponse.success,
            message: localResponse.message || localResponse.error,
          };
        })();

    if (response.success) {
      toast({
        title: "Chef approved",
        description: "The chef is now visible in customer discovery and checkout.",
      });
      await loadData();
    } else {
      toast({
        title: "Approval failed",
        description: response.message || "Could not approve chef",
        variant: "destructive",
      });
    }

    setSubmittingChefId(null);
  };

  if (!canAccessAdmin) {
    return (
      <Layout>
        <section className="container px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-emerald-100 bg-white p-8 shadow-soft">
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Admin approval</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">Admin sign-in required</h1>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Chef approval now happens through the real backend before chefs become visible to customers. Sign in with an admin account to review pending chefs.
            </p>
            <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Local admin credentials</p>
              <p className="mt-1">Email: <span className="font-mono">admin@zynk.com</span></p>
              <p>Password: <span className="font-mono">admin123</span></p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button asChild className="rounded-full px-6">
                <Link to="/login">Sign in as admin</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link to="/">Back home</Link>
              </Button>
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_35%),linear-gradient(180deg,#f7fff8_0%,#ffffff_60%,#f8fafc_100%)]">
        <div className="container px-4 py-10">
          <div className="mx-auto max-w-6xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Real backend approval
                </Badge>
                <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Chef approval console</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                  Pending chefs stay hidden from customer discovery and checkout until an admin approves them here.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricCard value={pendingChefs.length} label="Pending chefs" icon={Clock3} />
                <MetricCard value={approvedChefs.length} label="Approved chefs" icon={CheckCircle2} />
                <MetricCard value={pendingChefs.length + approvedChefs.length} label="Total chefs" icon={Users} />
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-slate-900">Pending approval</h2>
                    <p className="mt-2 text-sm text-slate-500">Approve chefs here before they appear to customers.</p>
                  </div>

                  {loading ? (
                    <p className="text-sm text-slate-500">Loading pending chefs...</p>
                  ) : pendingChefs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                      No pending chefs right now.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingChefs.map((chef) => (
                        <div key={chef.id} className="rounded-[24px] border border-slate-200 bg-white p-5">
                          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                            <div>
                              <p className="text-lg font-semibold text-slate-900">{chef.name}</p>
                              <p className="text-sm text-slate-500">{chef.email}</p>
                              <div className="mt-3 flex flex-wrap gap-2">
                                {chef.specialty && (
                                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                    {chef.specialty}
                                  </Badge>
                                )}
                                {chef.serviceArea && (
                                  <Badge variant="outline">
                                    <MapPin className="mr-1 h-3 w-3" />
                                    {chef.serviceArea}
                                  </Badge>
                                )}
                              </div>
                              {chef.bio && <p className="mt-3 text-sm text-slate-500">{chef.bio}</p>}
                            </div>
                            <Button
                              className="rounded-full px-6"
                              disabled={submittingChefId === chef.id}
                              onClick={() => handleApprove(chef.id)}
                            >
                              {submittingChefId === chef.id ? "Approving..." : "Approve chef"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                <CardContent className="p-6">
                  <div className="mb-4">
                    <h2 className="text-2xl font-semibold text-slate-900">Approved chefs</h2>
                    <p className="mt-2 text-sm text-slate-500">These chefs are currently visible to customers.</p>
                  </div>

                  {loading ? (
                    <p className="text-sm text-slate-500">Loading approved chefs...</p>
                  ) : approvedChefs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                      No approved chefs yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {approvedChefs.map((chef) => (
                        <div key={chef.id} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                          <div>
                            <p className="font-semibold text-slate-900">{chef.name}</p>
                            <p className="text-sm text-slate-500">{chef.specialty || "Home Chef"}</p>
                          </div>
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Live</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

const MetricCard = ({
  value,
  label,
  icon: Icon,
}: {
  value: number;
  label: string;
  icon: ElementType;
}) => (
  <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-soft">
    <Icon className="h-5 w-5 text-emerald-600" />
    <p className="mt-4 text-2xl font-semibold text-slate-900">{value}</p>
    <p className="mt-1 text-sm text-slate-500">{label}</p>
  </div>
);

export default Admin;
