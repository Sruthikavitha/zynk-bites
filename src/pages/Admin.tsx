import { useCallback, useEffect, useMemo, useState, type ElementType } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { useAuth } from "@/contexts/AuthContext";
import * as api from "@/services/api";
import {
  approveChefApproval,
  getAllChefApprovals,
  getAllDishes,
  getApiToken,
  getCurrentUserProfile,
  getMyNotifications,
  getPendingChefApprovals,
  type BackendAdminChef,
} from "@/services/backend";
import type { AppNotification, Dish, PlanType } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { cn } from "@/lib/utils";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  ChefHat,
  ChevronRight,
  Clock3,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Menu,
  PackageCheck,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import type { Chef } from "@/types";

type DashboardSection =
  | "overview"
  | "customers"
  | "chefs"
  | "subscriptions"
  | "meals"
  | "delivery"
  | "billing"
  | "notifications"
  | "security";

type AdminChefRecord = BackendAdminChef & {
  dishes: Dish[];
  capacity: number;
  load: number;
  utilization: number;
  servedPincodes: string[];
  onTimeRate: number;
  menuHealth: number;
};

type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  location: string;
  plan: string;
  status: "active" | "paused" | "cancelled";
  chefName: string;
  nextMeal: string;
  mealsThisMonth: number;
};

type SubscriptionRow = {
  id: string;
  user: string;
  planType: string;
  startDate: string;
  endDate: string;
  status: "active" | "paused" | "cancelled";
  chefName: string;
};

type DeliveryRow = {
  id: string;
  customer: string;
  chefName: string;
  partner: string;
  window: string;
  status: "pending" | "out_for_delivery" | "delivered" | "failed";
  reason?: string;
};

type PaymentRow = {
  id: string;
  customer: string;
  amount: string;
  cycle: string;
  status: "success" | "failed" | "refund";
  method: string;
};

type AuditRow = {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
  risk: "normal" | "warning" | "critical";
};

const sectionMeta: Array<{
  id: DashboardSection;
  label: string;
  caption: string;
  icon: ElementType;
}> = [
  { id: "overview", label: "Overview", caption: "Metrics and alerts", icon: LayoutDashboard },
  { id: "customers", label: "Customers", caption: "Accounts and plans", icon: Users },
  { id: "chefs", label: "Chefs", caption: "Approvals and menus", icon: ChefHat },
  { id: "subscriptions", label: "Subscriptions", caption: "Recurring billing", icon: CalendarDays },
  { id: "meals", label: "Meals", caption: "Skip and swap control", icon: UtensilsCrossed },
  { id: "delivery", label: "Delivery", caption: "Live meal movement", icon: Truck },
  { id: "billing", label: "Billing", caption: "Payments and refunds", icon: CreditCard },
  { id: "notifications", label: "Notifications", caption: "Broadcasts and alerts", icon: Bell },
  { id: "security", label: "Security", caption: "Roles and audit trail", icon: ShieldCheck },
];

const planNames: Record<PlanType, string> = {
  basic: "Veg Basic",
  standard: "Balanced Standard",
  premium: "Premium Plus",
};

const planPriceMap: Record<PlanType, number> = {
  basic: 2999,
  standard: 4499,
  premium: 5999,
};

const statusStyles = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  pending_delivery: "bg-slate-100 text-slate-700 border-slate-200",
  out_for_delivery: "bg-sky-50 text-sky-700 border-sky-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  refund: "bg-slate-100 text-slate-700 border-slate-200",
} as const;

const fallbackPincodes = [
  ["560095", "560034"],
  ["560102", "560103"],
  ["560066", "560037"],
  ["560078", "560070"],
  ["560001", "560025"],
  ["560048", "560076"],
];

const customerNames = [
  "Ananya Rao",
  "Rahul Menon",
  "Divya Shah",
  "Rithik Kumar",
  "Asha Kapoor",
  "Nitin Das",
  "Preethi Nair",
  "Farhan Ali",
];

const deliveryPartners = ["Arjun V", "Maya S", "Kiran P", "Sowmya R", "Naveen T"];

const revenueChartConfig = {
  revenue: { label: "Revenue", color: "#16a34a" },
  subscriptions: { label: "Subscriptions", color: "#0f766e" },
};

const ordersChartConfig = {
  meals: { label: "Meals scheduled", color: "#15803d" },
  skipped: { label: "Skipped", color: "#f59e0b" },
};

const parseAreas = (serviceArea?: string) =>
  serviceArea?.split(",").map((item) => item.trim()).filter(Boolean) || [];

const formatInr = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const resolveNotificationTone = (notification: AppNotification) => {
  if (notification.priority === "critical") return "border-rose-200 bg-rose-50 text-rose-700";
  if (notification.type === "payment_failed" || notification.type === "system_alert" || notification.type === "delivery_update") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }
  return "border-slate-200 bg-white text-slate-700";
};

const toAdminChefRecord = (chef: Chef): BackendAdminChef => ({
  id: chef.id,
  name: chef.name,
  email: chef.email,
  role: "chef",
  status: chef.status === "approved" ? "approved" : "pending",
  specialty: chef.specialty,
  bio: chef.bio,
  serviceArea: chef.serviceArea,
  phone: chef.phone || null,
  isDisabled: chef.isDisabled,
  createdAt: chef.createdAt,
});

const demoNotifications = (): AppNotification[] => [
  {
    id: "demo-chef-approval",
    type: "chef_pending_approval",
    priority: "normal",
    title: "Chef approvals running in demo mode",
    message: "Backend is offline, so approvals and menu visibility are syncing through the local sample workspace.",
    metadata: { source: "demo" },
    status: "delivered",
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-payment-watch",
    type: "payment_failed",
    priority: "critical",
    title: "2 renewals need payment follow-up",
    message: "Ops should review the failed billing queue before the next breakfast cycle.",
    metadata: { source: "demo" },
    status: "delivered",
    createdAt: new Date().toISOString(),
  },
];

const buildChefRecords = (chefs: BackendAdminChef[], dishes: Dish[]) =>
  chefs.map((chef, index) => {
    const chefDishes = dishes.filter((dish) => dish.chefId === chef.id).slice(0, 6);
    const capacity = 48 + index * 9 + chefDishes.length * 6;
    const load = chef.status === "approved" ? Math.min(capacity, 22 + chefDishes.length * 7 + index * 4) : chefDishes.length * 2 + 6;
    const utilization = capacity > 0 ? Math.min(100, Math.round((load / capacity) * 100)) : 0;

    return {
      ...chef,
      dishes: chefDishes,
      capacity,
      load,
      utilization,
      servedPincodes: fallbackPincodes[index % fallbackPincodes.length],
      onTimeRate: Math.max(84, 97 - index * 2),
      menuHealth: Math.max(72, 96 - Math.max(0, 4 - chefDishes.length) * 4),
    } satisfies AdminChefRecord;
  });

const buildCustomerRows = (approvedChefs: AdminChefRecord[]): CustomerRow[] => {
  const plans: PlanType[] = ["standard", "premium", "basic", "standard", "premium", "basic", "standard", "premium"];
  const statuses: CustomerRow["status"][] = ["active", "active", "paused", "active", "cancelled", "active", "active", "paused"];

  return customerNames.map((name, index) => {
    const chef = approvedChefs[index % Math.max(approvedChefs.length, 1)];
    const plan = plans[index % plans.length];
    const area = parseAreas(chef?.serviceArea)[0] || "Central Bengaluru";

    return {
      id: `cust-${index + 1}`,
      name,
      phone: `+91 98${(index + 13).toString().padStart(2, "0")} ${((index + 1) * 1375).toString().padStart(4, "0")} ${((index + 4) * 219).toString().padStart(4, "0")}`,
      location: area,
      plan: planNames[plan],
      status: statuses[index % statuses.length],
      chefName: chef?.name || "Chef queue",
      nextMeal: index % 2 === 0 ? "Lunch" : "Dinner",
      mealsThisMonth: 18 + index * 3,
    };
  });
};

const buildSubscriptionRows = (customers: CustomerRow[], approvedChefs: AdminChefRecord[]): SubscriptionRow[] =>
  customers.map((customer, index) => ({
    id: `sub-${index + 1}`,
    user: customer.name,
    planType: customer.plan,
    startDate: `2026-03-${String((index % 9) + 1).padStart(2, "0")}`,
    endDate: `2026-04-${String((index % 9) + 1).padStart(2, "0")}`,
    status: customer.status,
    chefName: approvedChefs[index % Math.max(approvedChefs.length, 1)]?.name || "Chef queue",
  }));

const buildDeliveryRows = (customers: CustomerRow[]): DeliveryRow[] =>
  customers.slice(0, 6).map((customer, index) => {
    const statuses: DeliveryRow["status"][] = ["pending", "out_for_delivery", "delivered", "failed", "delivered", "out_for_delivery"];
    const status = statuses[index % statuses.length];

    return {
      id: `del-${index + 1}`,
      customer: customer.name,
      chefName: customer.chefName,
      partner: deliveryPartners[index % deliveryPartners.length],
      window: index % 2 === 0 ? "12:30 PM - 1:15 PM" : "7:00 PM - 7:45 PM",
      status,
      reason: status === "failed" ? "Address not reachable after cutoff override" : undefined,
    };
  });

const buildPaymentRows = (subscriptions: SubscriptionRow[]): PaymentRow[] =>
  subscriptions.slice(0, 6).map((subscription, index) => {
    const statuses: PaymentRow["status"][] = ["success", "success", "failed", "success", "refund", "success"];
    const plan = (["basic", "standard", "premium"] as PlanType[])[index % 3];

    return {
      id: `pay-${index + 1}`,
      customer: subscription.user,
      amount: formatInr(planPriceMap[plan]),
      cycle: index % 2 === 0 ? "Mar 2026" : "Apr 2026",
      status: statuses[index % statuses.length],
      method: index % 2 === 0 ? "Razorpay UPI" : "Razorpay Card",
    };
  });

const buildAuditRows = (): AuditRow[] => [
  {
    id: "audit-1",
    actor: "Super Admin",
    action: "Approved Chef Priya Foods and opened customer visibility",
    timestamp: "Today, 10:24 AM",
    risk: "normal",
  },
  {
    id: "audit-2",
    actor: "Ops Admin",
    action: "Applied manual override for a meal swap after cutoff",
    timestamp: "Today, 9:05 AM",
    risk: "warning",
  },
  {
    id: "audit-3",
    actor: "Finance Admin",
    action: "Issued refund for failed renewal",
    timestamp: "Yesterday, 7:40 PM",
    risk: "critical",
  },
  {
    id: "audit-4",
    actor: "Ops Admin",
    action: "Disabled one kitchen due to temporary capacity breach",
    timestamp: "Yesterday, 3:12 PM",
    risk: "warning",
  },
];

const SectionHero = ({
  title,
  description,
  badge,
}: {
  title: string;
  description: string;
  badge: string;
}) => (
  <div className="rounded-[32px] border border-emerald-100 bg-[linear-gradient(135deg,#052e16_0%,#166534_58%,#115e59_120%)] p-6 text-white shadow-[0_18px_60px_rgba(15,23,42,0.12)]">
    <Badge className="bg-white/10 text-white hover:bg-white/10">{badge}</Badge>
    <h2 className="mt-4 text-3xl font-semibold tracking-tight">{title}</h2>
    <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">{description}</p>
  </div>
);

const MetricCard = ({
  title,
  value,
  caption,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  caption: string;
  icon: ElementType;
  tone: "success" | "warning" | "neutral";
}) => (
  <Card className="rounded-[28px] border-emerald-100 shadow-soft">
    <CardContent className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">{caption}</p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-2xl",
            tone === "success"
              ? "bg-emerald-50 text-emerald-700"
              : tone === "warning"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-600"
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const MiniMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3">
    <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
  </div>
);

const StatusBadge = ({
  status,
  label,
}: {
  status:
    | "active"
    | "paused"
    | "cancelled"
    | "pending"
    | "approved"
    | "pending_delivery"
    | "out_for_delivery"
    | "delivered"
    | "failed"
    | "success"
    | "refund";
  label?: string;
}) => (
  <Badge variant="outline" className={cn("rounded-full capitalize", statusStyles[status])}>
    {label || status.replaceAll("_", " ")}
  </Badge>
);

const DishCard = ({ dish, compact = false }: { dish: Dish; compact?: boolean }) => (
  <div className={cn("rounded-2xl border border-slate-200 bg-white shadow-sm", compact ? "p-3" : "p-4")}>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-semibold text-slate-900">{dish.name}</p>
        <p className={cn("mt-2 text-slate-500", compact ? "line-clamp-2 text-xs leading-5" : "text-sm leading-6")}>
          {dish.description || "Chef-curated menu item for recurring subscribers."}
        </p>
      </div>
      <Badge
        variant="outline"
        className={cn(
          "rounded-full text-[10px] uppercase",
          dish.category === "veg" ? "border-emerald-200 text-emerald-700" : "border-orange-200 text-orange-700"
        )}
      >
        {dish.category}
      </Badge>
    </div>
    <div className="mt-3 flex flex-wrap gap-2">
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">{dish.nutritionalInfo.calories} kcal</span>
      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600">
        {dish.allowsCustomization ? "Customizable" : "Fixed recipe"}
      </span>
    </div>
  </div>
);

const RoleCard = ({
  title,
  description,
  badges,
}: {
  title: string;
  description: string;
  badges: string[];
}) => (
  <div className="rounded-[24px] border border-slate-200 bg-white p-4">
    <p className="text-lg font-semibold text-slate-900">{title}</p>
    <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    <div className="mt-3 flex flex-wrap gap-2">
      {badges.map((badge) => (
        <Badge key={badge} variant="outline" className="rounded-full">
          {badge}
        </Badge>
      ))}
    </div>
  </div>
);

const ChefApprovalCard = ({
  chef,
  submitting,
  onApprove,
}: {
  chef: AdminChefRecord;
  submitting: boolean;
  onApprove: () => void;
}) => (
  <div className="rounded-[28px] border border-slate-200 bg-white p-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xl font-semibold text-slate-900">{chef.name}</p>
          <StatusBadge status="pending" label="Awaiting approval" />
        </div>
        <p className="mt-1 text-sm text-slate-500">{chef.email}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {chef.specialty && (
            <Badge className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">{chef.specialty}</Badge>
          )}
          {parseAreas(chef.serviceArea).slice(0, 2).map((area) => (
            <Badge key={`${chef.id}-${area}`} variant="outline" className="rounded-full">
              <MapPin className="mr-1 h-3 w-3" />
              {area}
            </Badge>
          ))}
          {chef.servedPincodes.map((code) => (
            <Badge key={`${chef.id}-${code}`} variant="outline" className="rounded-full">
              {code}
            </Badge>
          ))}
        </div>
        {chef.bio && <p className="mt-3 text-sm leading-6 text-slate-500">{chef.bio}</p>}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <MiniMetric label="Capacity" value={`${chef.capacity}`} />
        <MiniMetric label="Menu cards" value={`${chef.dishes.length}`} />
        <MiniMetric label="Preview score" value={`${chef.menuHealth}%`} />
      </div>
    </div>

    <div className="mt-5 grid gap-3 md:grid-cols-3">
      {chef.dishes.length > 0 ? (
        chef.dishes.slice(0, 3).map((dish) => <DishCard key={dish.id} dish={dish} compact />)
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 md:col-span-3">
          No menu cards uploaded yet. The chef can still be approved, but the customer page will look much stronger once dishes are added.
        </div>
      )}
    </div>

    <div className="mt-5 flex flex-wrap gap-3">
      <Button className="rounded-full px-6" disabled={submitting} onClick={onApprove}>
        {submitting ? "Approving..." : "Approve chef"}
      </Button>
      <Button variant="outline" className="rounded-full px-6">
        Review details
        <ChevronRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  </div>
);

const Admin = () => {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const token = getApiToken();

  const [allChefs, setAllChefs] = useState<BackendAdminChef[]>([]);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [restoringSession, setRestoringSession] = useState(Boolean(token && !user));
  const [resolvedRole, setResolvedRole] = useState<string | null>(user?.role || null);
  const [submittingChefId, setSubmittingChefId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [dataSource, setDataSource] = useState<"live" | "demo">("live");
  const [searchQuery, setSearchQuery] = useState("");
  const [customerStatusFilter, setCustomerStatusFilter] = useState<"all" | CustomerRow["status"]>("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState<"all" | string>("all");
  const [broadcastMessage, setBroadcastMessage] = useState("");

  const effectiveRole = user?.role || resolvedRole;
  const canAccessAdmin = effectiveRole === "admin";

  useEffect(() => {
    let isActive = true;

    if (user?.role) {
      setResolvedRole(user.role);
      setRestoringSession(false);
      return () => {
        isActive = false;
      };
    }

    if (!token) {
      setResolvedRole(null);
      setRestoringSession(false);
      return () => {
        isActive = false;
      };
    }

    setRestoringSession(true);

    void (async () => {
      const response = await getCurrentUserProfile(token);
      if (!isActive) return;

      if (response.success && response.user) {
        setResolvedRole(response.user.role);
        login({
          id: String(response.user.id),
          email: response.user.email,
          password: "",
          name: response.user.fullName,
          role: response.user.role,
          phone: response.user.phone || undefined,
          createdAt: response.user.createdAt || new Date().toISOString(),
        });
      } else {
        setResolvedRole(null);
      }

      setRestoringSession(false);
    })();

    return () => {
      isActive = false;
    };
  }, [token, user, login]);

  const loadData = useCallback(async () => {
    if (effectiveRole !== "admin") {
      setLoading(false);
      return;
    }

    setLoading(true);

    if (token) {
      const [, allResponse, dishesResponse, notificationsResponse] = await Promise.all([
        getPendingChefApprovals(token),
        getAllChefApprovals(token),
        getAllDishes(),
        getMyNotifications(token, 8),
      ]);

      if (Array.isArray(allResponse) && Array.isArray(dishesResponse)) {
        setAllChefs(allResponse);
        setDishes(dishesResponse);
        setNotifications(notificationsResponse.notifications || []);
        setNotificationCount(notificationsResponse.unreadCount || 0);
        setDataSource("live");
        setLoading(false);
        return;
      }
    }

    const demoChefsResponse = api.getAllChefs();
    const demoDishesResponse = api.getAllDishes();
    const nextDemoChefs = demoChefsResponse.success && demoChefsResponse.data ? demoChefsResponse.data.map(toAdminChefRecord) : [];
    const nextDemoDishes = demoDishesResponse.success && demoDishesResponse.data ? demoDishesResponse.data : [];
    const nextDemoNotifications = demoNotifications();

    setAllChefs(nextDemoChefs);
    setDishes(nextDemoDishes);
    setNotifications(nextDemoNotifications);
    setNotificationCount(nextDemoNotifications.length);
    setDataSource("demo");
    setLoading(false);
  }, [token, effectiveRole]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const chefRecords = useMemo(() => buildChefRecords(allChefs, dishes), [allChefs, dishes]);

  const filteredChefRecords = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return chefRecords;

    return chefRecords.filter((chef) => {
      const searchable = [
        chef.name,
        chef.email,
        chef.specialty,
        chef.serviceArea,
        ...chef.dishes.map((dish) => `${dish.name} ${dish.description}`),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [chefRecords, searchQuery]);

  const pendingChefRecords = filteredChefRecords.filter((chef) => chef.status === "pending");
  const approvedChefRecords = filteredChefRecords.filter((chef) => chef.status === "approved");

  const customerRows = useMemo(() => buildCustomerRows(approvedChefRecords), [approvedChefRecords]);

  const filteredCustomers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return customerRows.filter((customer) => {
      const matchesStatus = customerStatusFilter === "all" || customer.status === customerStatusFilter;
      const searchable = `${customer.name} ${customer.phone} ${customer.location} ${customer.plan} ${customer.chefName}`.toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      return matchesStatus && matchesSearch;
    });
  }, [customerRows, customerStatusFilter, searchQuery]);

  const subscriptionRows = useMemo(() => buildSubscriptionRows(customerRows, approvedChefRecords), [customerRows, approvedChefRecords]);

  const filteredSubscriptions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return subscriptionRows.filter((subscription) => {
      const matchesPlan = subscriptionFilter === "all" || subscription.planType === subscriptionFilter;
      const searchable = `${subscription.user} ${subscription.chefName} ${subscription.planType}`.toLowerCase();
      const matchesSearch = !query || searchable.includes(query);
      return matchesPlan && matchesSearch;
    });
  }, [subscriptionRows, subscriptionFilter, searchQuery]);

  const deliveryRows = useMemo(() => buildDeliveryRows(customerRows), [customerRows]);
  const paymentRows = useMemo(() => buildPaymentRows(subscriptionRows), [subscriptionRows]);
  const auditRows = useMemo(() => buildAuditRows(), []);

  const activeSubscriptions = filteredSubscriptions.filter((subscription) => subscription.status === "active").length || approvedChefRecords.length * 26;
  const mealsScheduledToday = Math.max(24, approvedChefRecords.reduce((sum, chef) => sum + chef.load, 0));
  const skippedMealsCount = Math.max(3, Math.round(mealsScheduledToday * 0.08));
  const dailyRevenue = activeSubscriptions * 149;
  const monthlyRevenue = activeSubscriptions * 4499;
  const chefUtilizationRate = approvedChefRecords.length
    ? Math.round(approvedChefRecords.reduce((sum, chef) => sum + chef.utilization, 0) / approvedChefRecords.length)
    : 0;
  const deliverySuccessRate = deliveryRows.length
    ? Math.round((deliveryRows.filter((row) => row.status === "delivered").length / deliveryRows.length) * 100)
    : 0;

  const revenueTrendData = useMemo(
    () =>
      ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"].map((month, index) => ({
        month,
        revenue: Math.round(monthlyRevenue * (0.62 + index * 0.08)),
        subscriptions: Math.round(activeSubscriptions * (0.7 + index * 0.05)),
      })),
    [monthlyRevenue, activeSubscriptions]
  );

  const orderTrendData = useMemo(
    () =>
      ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => ({
        day,
        meals: Math.max(12, Math.round(mealsScheduledToday / 7 + (index % 3) * 5)),
        skipped: Math.max(1, Math.round(skippedMealsCount / 7 + (index % 2))),
      })),
    [mealsScheduledToday, skippedMealsCount]
  );

  const mealPlannerRows = useMemo(
    () =>
      ["Tue 25", "Wed 26", "Thu 27", "Fri 28", "Sat 29", "Sun 30", "Mon 31"].map((label, index) => ({
        label,
        scheduled: Math.max(10, Math.round(mealsScheduledToday / 7 + index * 1.2)),
        skipped: Math.max(1, Math.round(skippedMealsCount / 7 + (index % 2))),
        swapped: Math.max(1, 2 + (index % 3)),
        cutoff: "8 PM previous day",
        override: index === 1 || index === 4,
      })),
    [mealsScheduledToday, skippedMealsCount]
  );

  const alerts = useMemo(() => {
    const liveAlerts = notifications.slice(0, 3).map((notification) => ({
      id: notification.id,
      title: notification.title,
      message: notification.message,
      tone:
        notification.priority === "critical"
          ? "critical"
          : notification.type === "payment_failed" || notification.type === "delivery_update"
            ? "warning"
            : "normal",
    }));

    const fallbackAlerts = [
      {
        id: "pending-chef-alert",
        title: "Pending chef applications",
        message: `${pendingChefRecords.length} chefs are waiting for review before becoming visible to customers.`,
        tone: pendingChefRecords.length > 0 ? "warning" : "normal",
      },
      {
        id: "billing-alert",
        title: "Subscription billing health",
        message: "2 renewal attempts need attention after Razorpay retry failure.",
        tone: "critical",
      },
      {
        id: "delivery-alert",
        title: "Delivery performance",
        message: `${deliveryRows.filter((row) => row.status === "failed").length} deliveries need manual follow-up.`,
        tone: "warning",
      },
    ];

    return [...liveAlerts, ...fallbackAlerts].slice(0, 5);
  }, [notifications, pendingChefRecords.length, deliveryRows]);

  const handleApprove = async (chefId: string) => {
    setSubmittingChefId(chefId);

    const response = dataSource === "live" && token
      ? await approveChefApproval(token, chefId)
      : (() => {
          const demoResponse = api.approveChef(chefId);
          return {
            success: demoResponse.success,
            message: demoResponse.error || demoResponse.message,
          };
        })();

    if (response.success) {
      toast({
        title: "Chef approved",
        description: "The chef is now visible on the customer chef-selection page.",
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

  const handleSecureAction = (title: string, description: string) => {
    toast({ title, description });
  };

  const handleBroadcast = () => {
    if (!broadcastMessage.trim()) {
      toast({
        title: "Broadcast message required",
        description: "Add a message before sending a broadcast.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Broadcast queued",
      description: "The admin notification draft has been prepared for members and chef partners.",
    });
    setBroadcastMessage("");
  };

  if (restoringSession) {
    return (
      <Layout>
        <section className="container px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-emerald-100 bg-white p-8 shadow-soft">
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Admin approval</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">Checking admin session</h1>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Restoring your admin access so we can load chefs, menu cards, and the operations workspace.
            </p>
          </div>
        </section>
      </Layout>
    );
  }

  if (!canAccessAdmin) {
    return (
      <Layout>
        <section className="container px-4 py-12">
          <div className="mx-auto max-w-3xl rounded-[32px] border border-emerald-100 bg-white p-8 shadow-soft">
            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Admin approval</Badge>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">Admin sign-in required</h1>
            <p className="mt-4 text-sm leading-6 text-slate-500">
              Chef approval and operations monitoring happen here before chefs become visible to customers. Sign in with an admin account to review chefs and menus.
            </p>
            <div className="mt-6 rounded-2xl bg-slate-50 px-5 py-4 text-sm text-slate-600">
              <p className="font-medium text-slate-900">Local admin credentials</p>
              <p className="mt-1">
                Email: <span className="font-mono">admin@zynk.com</span>
              </p>
              <p>
                Password: <span className="font-mono">admin123</span>
              </p>
            </div>
            <div className="mt-6 flex gap-3">
              <Button asChild className="rounded-full px-6">
                <Link to="/login" state={{ email: "admin@zynk.com", redirectTo: "/admin" }}>
                  Sign in as admin
                </Link>
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
      <section className="min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.10),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.08),_transparent_20%),linear-gradient(180deg,#f8fffb_0%,#f8fafc_100%)]">
        <div className="px-4 py-6 lg:px-6">
          <div className="mx-auto flex max-w-[1480px] gap-5">
            <aside className={cn("hidden rounded-[32px] border border-emerald-100 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur lg:flex lg:flex-col", sidebarCollapsed ? "w-[92px]" : "w-[280px]")}>
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
                <div className={cn("overflow-hidden transition-all", sidebarCollapsed ? "w-0 opacity-0" : "w-auto opacity-100")}>
                  <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">ZYNK Ops</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">Admin Command Center</p>
                </div>
                <Button type="button" variant="ghost" size="icon" className="rounded-full text-slate-500" onClick={() => setSidebarCollapsed((prev) => !prev)}>
                  {sidebarCollapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
                </Button>
              </div>

              <div className="flex-1 space-y-1 p-3">
                {sectionMeta.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      type="button"
                      className={cn("flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-all", isActive ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900")}
                      onClick={() => setActiveSection(section.id)}
                    >
                      <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", isActive ? "bg-white text-emerald-700" : "bg-slate-100 text-slate-500")}>
                        <Icon className="h-5 w-5" />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="min-w-0">
                          <p className="font-medium">{section.label}</p>
                          <p className="text-xs text-slate-400">{section.caption}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {!sidebarCollapsed && (
                <div className="border-t border-slate-100 p-4">
                  <div className="rounded-[24px] bg-[linear-gradient(135deg,#052e16_0%,#166534_55%,#0f766e_110%)] p-4 text-white">
                    <p className="text-xs uppercase tracking-[0.24em] text-emerald-100">Live approval</p>
                    <p className="mt-2 text-2xl font-semibold">{pendingChefRecords.length}</p>
                    <p className="mt-1 text-sm text-white/75">Chefs waiting to go live for customer discovery.</p>
                  </div>
                </div>
              )}
            </aside>

            <div className="min-w-0 flex-1 space-y-5">
              <div className="rounded-[32px] border border-emerald-100 bg-white/90 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex items-center gap-3">
                    <Button type="button" variant="outline" size="icon" className="rounded-full lg:hidden" onClick={() => setSidebarCollapsed((prev) => !prev)}>
                      <Menu className="h-4 w-4" />
                    </Button>
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">Admin dashboard</p>
                      <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">ZYNK operations workspace</h1>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge className={cn("rounded-full px-3 py-1", dataSource === "live" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : "bg-amber-50 text-amber-700 hover:bg-amber-50")}>
                          {dataSource === "live" ? "Live backend" : "Demo mode"}
                        </Badge>
                        <Badge className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 hover:bg-slate-100">
                          Chef approvals control customer visibility
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="relative min-w-[280px]">
                      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search chefs, customers, plans, menu items" className="h-12 rounded-full border-slate-200 bg-slate-50 pl-11" />
                    </div>

                    <Button type="button" variant="outline" className="h-12 rounded-full border-slate-200 px-4" onClick={() => void loadData()}>
                      <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
                      Refresh
                    </Button>

                    <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-2">
                      <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                        <Bell className="h-4 w-4 text-slate-600" />
                        {notificationCount > 0 && (
                          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-semibold text-white">
                            {notificationCount}
                          </span>
                        )}
                      </div>
                      <div className="hidden min-w-0 sm:block">
                        <p className="text-sm font-semibold text-slate-900">{user?.name || "ZYNK Admin"}</p>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{effectiveRole}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-5">
                {activeSection === "overview" && (
                  <div className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
                      <MetricCard title="Active subscriptions" value={activeSubscriptions.toLocaleString()} caption="Monthly recurring customers" icon={Users} tone="success" />
                      <MetricCard title="Meals scheduled today" value={mealsScheduledToday.toLocaleString()} caption="Lunch and dinner commitments" icon={PackageCheck} tone="neutral" />
                      <MetricCard title="Skipped meals" value={skippedMealsCount.toLocaleString()} caption="Before cutoff modifications" icon={Clock3} tone="warning" />
                      <MetricCard title="Daily revenue" value={formatInr(dailyRevenue)} caption="Collected today" icon={Wallet} tone="success" />
                      <MetricCard title="Monthly revenue" value={formatInr(monthlyRevenue)} caption="Recurring billing run rate" icon={CreditCard} tone="success" />
                      <MetricCard title="Chef utilization" value={`${chefUtilizationRate}%`} caption={`Delivery success ${deliverySuccessRate}%`} icon={ChefHat} tone="neutral" />
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                      <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                        <CardHeader className="pb-0">
                          <CardTitle className="text-xl text-slate-900">Revenue trends</CardTitle>
                          <CardDescription>Daily and monthly subscription revenue movement</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                            <LineChart data={revenueTrendData} margin={{ left: 12, right: 12 }}>
                              <CartesianGrid vertical={false} />
                              <XAxis dataKey="month" tickLine={false} axisLine={false} />
                              <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} tickLine={false} axisLine={false} width={45} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Line type="monotone" dataKey="revenue" stroke="var(--color-revenue)" strokeWidth={3} dot={false} />
                              <Line type="monotone" dataKey="subscriptions" stroke="var(--color-subscriptions)" strokeWidth={2} dot={false} />
                            </LineChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                        <CardHeader className="pb-0">
                          <CardTitle className="text-xl text-slate-900">Daily meal load</CardTitle>
                          <CardDescription>Scheduled versus skipped meals this week</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <ChartContainer config={ordersChartConfig} className="h-[280px] w-full">
                            <BarChart data={orderTrendData} margin={{ left: 12, right: 12 }}>
                              <CartesianGrid vertical={false} />
                              <XAxis dataKey="day" tickLine={false} axisLine={false} />
                              <YAxis tickLine={false} axisLine={false} width={36} />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Bar dataKey="meals" fill="var(--color-meals)" radius={[10, 10, 0, 0]} />
                              <Bar dataKey="skipped" fill="var(--color-skipped)" radius={[10, 10, 0, 0]} />
                            </BarChart>
                          </ChartContainer>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                      <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                        <CardHeader>
                          <CardTitle className="text-xl text-slate-900">Operational alerts</CardTitle>
                          <CardDescription>Failed deliveries, payment issues, and approvals that need action</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {alerts.map((alert) => (
                            <div
                              key={alert.id}
                              className={cn(
                                "rounded-2xl border p-4",
                                alert.tone === "critical"
                                  ? "border-rose-200 bg-rose-50"
                                  : alert.tone === "warning"
                                    ? "border-amber-200 bg-amber-50"
                                    : "border-slate-200 bg-white"
                              )}
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    "mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl",
                                    alert.tone === "critical"
                                      ? "bg-rose-100 text-rose-700"
                                      : alert.tone === "warning"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-slate-100 text-slate-600"
                                  )}
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className="font-semibold text-slate-900">{alert.title}</p>
                                  <p className="mt-1 text-sm text-slate-600">{alert.message}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>

                      <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                        <CardHeader>
                          <CardTitle className="text-xl text-slate-900">Chef spotlight</CardTitle>
                          <CardDescription>Top kitchens, menu health, and current operational load</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-4 md:grid-cols-2">
                          {approvedChefRecords.slice(0, 4).map((chef) => (
                            <div key={chef.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-lg font-semibold text-slate-900">{chef.name}</p>
                                  <p className="text-sm text-slate-500">{chef.specialty || "Home Chef"}</p>
                                </div>
                                <Badge className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                  {chef.utilization}% utilized
                                </Badge>
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-3">
                                <MiniMetric label="Daily capacity" value={`${chef.capacity}`} />
                                <MiniMetric label="Live load" value={`${chef.load}`} />
                                <MiniMetric label="On-time rate" value={`${chef.onTimeRate}%`} />
                                <MiniMetric label="Menu health" value={`${chef.menuHealth}%`} />
                              </div>
                              <div className="mt-4 flex flex-wrap gap-2">
                                {chef.dishes.slice(0, 3).map((dish) => (
                                  <span key={dish.id} className="rounded-full bg-white px-3 py-1 text-xs text-slate-600 shadow-sm">
                                    {dish.name}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                {activeSection === "customers" && (
                  <div className="space-y-5">
                    <SectionHero
                      title="Customer management"
                      description="Track subscribers, plan state, meal history direction, and support actions from a single place."
                      badge="Customer ops"
                    />

                    <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <CardTitle className="text-xl text-slate-900">Subscribers</CardTitle>
                          <CardDescription>Pause plans, block users, or investigate address changes quickly.</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(["all", "active", "paused", "cancelled"] as const).map((status) => (
                            <Button
                              key={status}
                              type="button"
                              variant={customerStatusFilter === status ? "default" : "outline"}
                              className="rounded-full"
                              onClick={() => setCustomerStatusFilter(status)}
                            >
                              {status === "all" ? "All" : status}
                            </Button>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Phone</TableHead>
                              <TableHead>Location</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Chef</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredCustomers.map((customer) => (
                              <TableRow key={customer.id}>
                                <TableCell>
                                  <div>
                                    <p className="font-medium text-slate-900">{customer.name}</p>
                                    <p className="text-xs text-slate-500">{customer.mealsThisMonth} meals this month</p>
                                  </div>
                                </TableCell>
                                <TableCell>{customer.phone}</TableCell>
                                <TableCell>{customer.location}</TableCell>
                                <TableCell>{customer.plan}</TableCell>
                                <TableCell>
                                  <StatusBadge status={customer.status} />
                                </TableCell>
                                <TableCell>{customer.chefName}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleSecureAction("Subscription paused", `Pause flow prepared for ${customer.name}.`)}>
                                      Pause
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleSecureAction("User blocked", `Block review prepared for ${customer.name}.`)}>
                                      Block
                                    </Button>
                                    <Button size="sm" onClick={() => handleSecureAction("Refund review opened", `Refund confirmation staged for ${customer.name}.`)}>
                                      Refund
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {activeSection === "chefs" && (
                  <div className="space-y-5">
                    <SectionHero
                      title="Chef and kitchen management"
                      description="Approve chefs, inspect their menu cards, and watch capacity before they go live to customers."
                      badge="Chef ops"
                    />

                    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
                      <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                        <CardHeader>
                          <CardTitle className="text-xl text-slate-900">Pending approval queue</CardTitle>
                          <CardDescription>These chefs stay hidden from the customer page until approved here.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {loading ? (
                            <p className="text-sm text-slate-500">Loading pending chefs...</p>
                          ) : pendingChefRecords.length === 0 ? (
                            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                              No pending chefs right now.
                            </div>
                          ) : (
                            pendingChefRecords.map((chef) => (
                              <ChefApprovalCard
                                key={chef.id}
                                chef={chef}
                                submitting={submittingChefId === chef.id}
                                onApprove={() => void handleApprove(chef.id)}
                              />
                            ))
                          )}
                        </CardContent>
                      </Card>

                      <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                        <CardHeader>
                          <CardTitle className="text-xl text-slate-900">Approved kitchens</CardTitle>
                          <CardDescription>Live chefs and their menu cards visible to customers.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {approvedChefRecords.length === 0 ? (
                            <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center text-sm text-slate-500">
                              No approved chefs yet.
                            </div>
                          ) : (
                            approvedChefRecords.map((chef) => (
                              <div key={chef.id} className="rounded-[28px] border border-slate-200 bg-white p-5">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                  <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <p className="text-xl font-semibold text-slate-900">{chef.name}</p>
                                      <StatusBadge status="approved" label="Live" />
                                    </div>
                                    <p className="mt-1 text-sm text-slate-500">{chef.specialty || "Home Chef"}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                      {chef.servedPincodes.map((code) => (
                                        <span key={`${chef.id}-${code}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                          {code}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="grid gap-3 sm:grid-cols-3">
                                    <MiniMetric label="Capacity" value={`${chef.capacity}`} />
                                    <MiniMetric label="Load" value={`${chef.load}`} />
                                    <MiniMetric label="Utilization" value={`${chef.utilization}%`} />
                                  </div>
                                </div>

                                <div className="mt-5 grid gap-3 md:grid-cols-3">
                                  {chef.dishes.length > 0 ? (
                                    chef.dishes.slice(0, 3).map((dish) => <DishCard key={dish.id} dish={dish} compact />)
                                  ) : (
                                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500 md:col-span-3">
                                      No menu cards yet. Ask the chef to upload dishes before going live.
                                    </div>
                                  )}
                                </div>

                                <div className="mt-5 flex flex-wrap gap-2">
                                  <Button variant="outline" size="sm" onClick={() => handleSecureAction("Kitchen enabled", `${chef.name} is already active and visible to customers.`)}>
                                    Enable kitchen
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => handleSecureAction("Kitchen disable review", `Disable confirmation opened for ${chef.name}.`)}>
                                    Disable kitchen
                                  </Button>
                                  <Button size="sm" onClick={() => handleSecureAction("Chef performance opened", `Review opened for ${chef.name}.`)}>
                                    View detail
                                  </Button>
                                </div>
                              </div>
                            ))
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                {activeSection === "subscriptions" && (
                  <div className="space-y-5">
                    <SectionHero
                      title="Subscription management"
                      description="Control recurring plans, renewal windows, and customer plan state without leaving the dashboard."
                      badge="Subscriptions"
                    />

                    <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                      <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <CardTitle className="text-xl text-slate-900">Recurring plans</CardTitle>
                          <CardDescription>Filters include plan type and current billing state.</CardDescription>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {["all", "Veg Basic", "Balanced Standard", "Premium Plus"].map((plan) => (
                            <Button
                              key={plan}
                              type="button"
                              variant={subscriptionFilter === plan ? "default" : "outline"}
                              className="rounded-full"
                              onClick={() => setSubscriptionFilter(plan === "all" ? "all" : plan)}
                            >
                              {plan}
                            </Button>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>User</TableHead>
                              <TableHead>Plan</TableHead>
                              <TableHead>Chef</TableHead>
                              <TableHead>Start date</TableHead>
                              <TableHead>End date</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredSubscriptions.map((subscription) => (
                              <TableRow key={subscription.id}>
                                <TableCell>{subscription.user}</TableCell>
                                <TableCell>{subscription.planType}</TableCell>
                                <TableCell>{subscription.chefName}</TableCell>
                                <TableCell>{subscription.startDate}</TableCell>
                                <TableCell>{subscription.endDate}</TableCell>
                                <TableCell>
                                  <StatusBadge status={subscription.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleSecureAction("Pause or resume ready", `Subscription control opened for ${subscription.user}.`)}>
                                      Pause / Resume
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleSecureAction("Extension staged", `Extend subscription dialog prepared for ${subscription.user}.`)}>
                                      Extend
                                    </Button>
                                    <Button size="sm" onClick={() => handleSecureAction("Cancellation confirmation", `Cancellation confirmation opened for ${subscription.user}.`)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {activeSection === "meals" && (
                  <div className="space-y-5">
                    <SectionHero
                      title="Meal, skip and swap system"
                      description="View scheduled meals by day, monitor skipped and swapped counts, and manage the 8 PM cutoff rule."
                      badge="Meal control"
                    />

                    <div className="rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
                      Changes are allowed only before <span className="font-semibold">8 PM on the previous day</span>. Admin overrides are tracked in the audit log and should be used sparingly.
                    </div>

                    <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                      <CardHeader>
                        <CardTitle className="text-xl text-slate-900">Scheduled meal calendar</CardTitle>
                        <CardDescription>Daily meal volume, skips, swaps, and manual override visibility.</CardDescription>
                      </CardHeader>
                      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        {mealPlannerRows.map((day) => (
                          <div key={day.label} className="rounded-[24px] border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Delivery day</p>
                                <p className="mt-1 text-lg font-semibold text-slate-900">{day.label}</p>
                              </div>
                              {day.override ? (
                                <Badge className="rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50">Override used</Badge>
                              ) : (
                                <Badge variant="outline" className="rounded-full">Cutoff protected</Badge>
                              )}
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                              <MiniMetric label="Scheduled" value={`${day.scheduled}`} />
                              <MiniMetric label="Skipped" value={`${day.skipped}`} />
                              <MiniMetric label="Swapped" value={`${day.swapped}`} />
                            </div>

                            <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                              <p className="font-semibold text-slate-800">Cutoff rule</p>
                              <p className="mt-1">{day.cutoff}</p>
                            </div>

                            <Button className="mt-4 w-full rounded-full" variant={day.override ? "outline" : "default"} onClick={() => handleSecureAction("Admin override review", `Override flow opened for ${day.label}.`)}>
                              {day.override ? "Review override" : "Apply override"}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )}
                {activeSection === "delivery" && (
                  <div className="space-y-5">
                    <SectionHero
                      title="Delivery management"
                      description="Track meal progress from pending to delivered, assign partners, and investigate failures."
                      badge="Delivery ops"
                    />

                    <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                      <CardHeader>
                        <CardTitle className="text-xl text-slate-900">Live delivery board</CardTitle>
                        <CardDescription>Pending, in-transit, delivered, and failed handoffs.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Customer</TableHead>
                              <TableHead>Chef</TableHead>
                              <TableHead>Partner</TableHead>
                              <TableHead>Window</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Reason</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {deliveryRows.map((delivery) => (
                              <TableRow key={delivery.id}>
                                <TableCell>{delivery.customer}</TableCell>
                                <TableCell>{delivery.chefName}</TableCell>
                                <TableCell>{delivery.partner}</TableCell>
                                <TableCell>{delivery.window}</TableCell>
                                <TableCell>
                                  <StatusBadge status={delivery.status} label={delivery.status.replaceAll("_", " ")} />
                                </TableCell>
                                <TableCell>{delivery.reason || "On track"}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleSecureAction("Partner reassignment opened", `Reassignment flow opened for ${delivery.customer}.`)}>
                                      Assign partner
                                    </Button>
                                    <Button size="sm" onClick={() => handleSecureAction("Failure review opened", `Delivery follow-up opened for ${delivery.customer}.`)}>
                                      Investigate
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {activeSection === "billing" && (
                  <div className="space-y-5">
                    <SectionHero
                      title="Payments and billing"
                      description="Watch subscription billing cycles, Razorpay outcomes, and refund handling from one place."
                      badge="Billing"
                    />

                    <div className="grid gap-4 md:grid-cols-3">
                      <MetricCard title="Successful charges" value="128" caption="This billing cycle" icon={CreditCard} tone="success" />
                      <MetricCard title="Failed transactions" value="2" caption="Retry queue active" icon={ShieldAlert} tone="warning" />
                      <MetricCard title="Refund requests" value="1" caption="Needs confirmation" icon={Wallet} tone="neutral" />
                    </div>

                    <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                      <CardHeader>
                        <CardTitle className="text-xl text-slate-900">Payment log</CardTitle>
                        <CardDescription>Integration-ready payment history with billing cycle context.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Customer</TableHead>
                              <TableHead>Amount</TableHead>
                              <TableHead>Cycle</TableHead>
                              <TableHead>Method</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {paymentRows.map((payment) => (
                              <TableRow key={payment.id}>
                                <TableCell>{payment.customer}</TableCell>
                                <TableCell>{payment.amount}</TableCell>
                                <TableCell>{payment.cycle}</TableCell>
                                <TableCell>{payment.method}</TableCell>
                                <TableCell>
                                  <StatusBadge status={payment.status} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleSecureAction("Billing cycle opened", `Billing detail opened for ${payment.customer}.`)}>
                                      View cycle
                                    </Button>
                                    <Button size="sm" onClick={() => handleSecureAction("Refund confirmation", `Refund confirmation staged for ${payment.customer}.`)}>
                                      Refund
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </div>
                )}
                {activeSection === "notifications" && (
                  <div className="space-y-5">
                    <SectionHero
                      title="Notifications"
                      description="Broadcast updates, watch delivery alerts, and coordinate operational communication."
                      badge="Comms"
                    />

                    <div className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
                      <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                        <CardHeader>
                          <CardTitle className="text-xl text-slate-900">Broadcast composer</CardTitle>
                          <CardDescription>Draft member and chef communication before major service updates.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex flex-wrap gap-2">
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Members</Badge>
                            <Badge variant="outline">Chef partners</Badge>
                            <Badge variant="outline">Delivery ops</Badge>
                          </div>
                          <Textarea
                            value={broadcastMessage}
                            onChange={(event) => setBroadcastMessage(event.target.value)}
                            placeholder="Share delivery delays, menu changes, billing reminders, or operational updates..."
                            className="min-h-[180px] rounded-[24px]"
                          />
                          <div className="flex gap-3">
                            <Button className="rounded-full px-6" onClick={handleBroadcast}>
                              Send broadcast
                            </Button>
                            <Button variant="outline" className="rounded-full px-6" onClick={() => setBroadcastMessage("")}>
                              Clear draft
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                        <CardHeader>
                          <CardTitle className="text-xl text-slate-900">Recent alerts</CardTitle>
                          <CardDescription>Delivery delays, menu changes, payment failures, and system events.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          {(notifications.length > 0 ? notifications : [
                            {
                              id: "fallback-1",
                              title: "Payment retry required",
                              message: "One premium subscription renewal failed on the first attempt.",
                              type: "payment_failed",
                              priority: "critical",
                              metadata: {},
                              status: "delivered",
                              createdAt: new Date().toISOString(),
                            },
                            {
                              id: "fallback-2",
                              title: "Chef menu updated",
                              message: "Two approved chefs refreshed their dinner rotation for tomorrow.",
                              type: "chef_menu_update",
                              priority: "normal",
                              metadata: {},
                              status: "delivered",
                              createdAt: new Date().toISOString(),
                            },
                          ] as AppNotification[]).map((notification) => (
                            <div key={notification.id} className={cn("rounded-[24px] border p-4", resolveNotificationTone(notification))}>
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <p className="font-semibold">{notification.title}</p>
                                  <p className="mt-1 text-sm leading-6">{notification.message}</p>
                                </div>
                                <Badge variant="outline" className="rounded-full border-current/20 capitalize">
                                  {notification.priority}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
                {activeSection === "security" && (
                  <div className="space-y-5">
                    <SectionHero
                      title="Admin controls and security"
                      description="Protect high-risk actions with clear ownership, role boundaries, and a visible audit trail."
                      badge="Security"
                    />

                    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
                      <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                        <CardHeader>
                          <CardTitle className="text-xl text-slate-900">Role-based access</CardTitle>
                          <CardDescription>Separate responsibilities between platform owners and operators.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <RoleCard
                            title="Super Admin"
                            description="Full access to approvals, billing, overrides, and security controls."
                            badges={["Chef approval", "Refund approval", "Role management"]}
                          />
                          <RoleCard
                            title="Ops Admin"
                            description="Operational control over customers, subscriptions, meals, and delivery follow-up."
                            badges={["Pause plans", "Meal override", "Delivery action"]}
                          />
                          <div className="rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                            High-risk actions such as refunds, subscription cancellation, and after-cutoff overrides should always require an explicit confirmation step.
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                        <CardHeader>
                          <CardTitle className="text-xl text-slate-900">Audit trail</CardTitle>
                          <CardDescription>Activity log for secure actions and platform governance.</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Actor</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Risk</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {auditRows.map((item) => (
                                <TableRow key={item.id}>
                                  <TableCell>{item.actor}</TableCell>
                                  <TableCell>{item.action}</TableCell>
                                  <TableCell>{item.timestamp}</TableCell>
                                  <TableCell>
                                    <Badge
                                      className={cn(
                                        "rounded-full capitalize",
                                        item.risk === "critical"
                                          ? "bg-rose-50 text-rose-700 hover:bg-rose-50"
                                          : item.risk === "warning"
                                            ? "bg-amber-50 text-amber-700 hover:bg-amber-50"
                                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-50"
                                      )}
                                    >
                                      {item.risk}
                                    </Badge>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Admin;
