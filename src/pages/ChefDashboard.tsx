import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  ChefHat,
  CircleCheckBig,
  Clock3,
  FileText,
  IndianRupee,
  MapPinned,
  Phone,
  ShieldCheck,
  Store,
  Users,
} from "lucide-react";

type OnboardingStep =
  | "otp"
  | "kitchen"
  | "menu"
  | "pricing"
  | "documents"
  | "payout"
  | "approval"
  | "dashboard";

type WeeklyMenuState = Record<string, { lunch: string; dinner: string }>;
type PricingState = Record<"basic" | "standard" | "premium", string>;

const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const initialMenu = dayLabels.reduce<WeeklyMenuState>((acc, day) => {
  acc[day] = { lunch: "", dinner: "" };
  return acc;
}, {} as WeeklyMenuState);

const metrics = [
  { label: "Active subscribers", value: "186", icon: Users, note: "+14 this week" },
  { label: "Meals tomorrow", value: "248", icon: CalendarDays, note: "Lunch + dinner" },
  { label: "Monthly earnings", value: "INR 1.82L", icon: IndianRupee, note: "After platform fee" },
  { label: "Payout status", value: "On track", icon: Banknote, note: "Next payout Friday" },
];

const sampleSubscribers = [
  { name: "Koramangala cluster", plan: "Standard", count: 78 },
  { name: "HSR Layout cluster", plan: "Premium", count: 54 },
  { name: "Bellandur offices", plan: "Basic", count: 32 },
];

type ChefDashboardRouteState = {
  startStep?: OnboardingStep;
  chefName?: string;
  kitchenName?: string;
  locality?: string;
  radius?: string;
  onboardingMode?: "draft" | "submitted";
};

const ChefDashboard = () => {
  const location = useLocation();
  const routeState = (location.state || {}) as ChefDashboardRouteState;

  const [activeStep, setActiveStep] = useState<OnboardingStep>(routeState.startStep || "otp");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [kitchenName, setKitchenName] = useState(routeState.kitchenName || "ZYNK Test Kitchen");
  const [chefName, setChefName] = useState(routeState.chefName || "Chef Kavya");
  const [locality, setLocality] = useState(routeState.locality || "Koramangala, Bengaluru");
  const [radius, setRadius] = useState(routeState.radius || "6");
  const [menu, setMenu] = useState<WeeklyMenuState>(initialMenu);
  const [pricing, setPricing] = useState<PricingState>({
    basic: "2999",
    standard: "4499",
    premium: "5999",
  });

  const steps: { id: OnboardingStep; title: string; caption: string }[] = [
    { id: "otp", title: "OTP Login", caption: "Verify phone and start" },
    { id: "kitchen", title: "Kitchen Details", caption: "Location and service radius" },
    { id: "menu", title: "Weekly Menu", caption: "Mon-Sun setup" },
    { id: "pricing", title: "Pricing", caption: "Monthly subscription plans" },
    { id: "documents", title: "Documents", caption: "ID and kitchen verification" },
    { id: "payout", title: "Payout Setup", caption: "Razorpay settlements" },
    { id: "approval", title: "Admin Review", caption: "Status and go-live" },
    { id: "dashboard", title: "Chef Dashboard", caption: "Subscribers and earnings" },
  ];

  const goToStep = (nextStep: OnboardingStep) => setActiveStep(nextStep);

  const updateMenu = (day: string, slot: "lunch" | "dinner", value: string) => {
    setMenu((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [slot]: value,
      },
    }));
  };

  const renderStep = () => {
    switch (activeStep) {
      case "otp":
        return (
          <Card className="rounded-[28px] border-emerald-100 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
                <Phone className="h-6 w-6 text-emerald-600" />
                OTP login for chef partners
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="Phone number" />
                <Input value={otp} onChange={(event) => setOtp(event.target.value)} placeholder="Enter OTP" />
              </div>
              <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                Swiggy/Zomato-style partner onboarding starts with a quick phone verification. Use this as the first trust-building step before KYC and payout setup.
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="h-11 rounded-full px-6" onClick={() => goToStep("kitchen")}>
                  Verify & continue
                </Button>
                <Button asChild variant="outline" className="h-11 rounded-full px-6">
                  <Link to="/register">Open live chef registration</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "kitchen":
        return (
          <Card className="rounded-[28px] border-emerald-100 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
                <Store className="h-6 w-6 text-emerald-600" />
                Kitchen details and service area
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Input value={chefName} onChange={(event) => setChefName(event.target.value)} placeholder="Chef name" />
              <Input value={kitchenName} onChange={(event) => setKitchenName(event.target.value)} placeholder="Kitchen name" />
              <Input value={locality} onChange={(event) => setLocality(event.target.value)} placeholder="Kitchen location" />
              <Input value={radius} onChange={(event) => setRadius(event.target.value)} placeholder="Service radius (km)" />
              <div className="md:col-span-2 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/70 px-4 py-4 text-sm text-slate-600">
                Include geo-location, pickup landmarks, and preferred meal slots so customers can filter by area and delivery timing.
              </div>
              <div className="md:col-span-2 flex justify-between gap-3">
                <Button variant="outline" className="h-11 rounded-full px-6" onClick={() => goToStep("otp")}>
                  Back
                </Button>
                <Button className="h-11 rounded-full px-6" onClick={() => goToStep("menu")}>
                  Save kitchen profile
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "menu":
        return (
          <Card className="rounded-[28px] border-emerald-100 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
                <CalendarDays className="h-6 w-6 text-emerald-600" />
                Weekly menu setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-[24px] border border-emerald-100 bg-emerald-50/60 px-5 py-4">
                <p className="text-sm font-semibold text-slate-900">Design your weekly menu cards</p>
                <p className="mt-1 text-sm text-slate-600">
                  This is the chef-facing workspace after registration. Fill lunch and dinner for each day to shape the menu customers will preview before subscribing.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {dayLabels.map((day) => (
                  <div key={day} className="rounded-[24px] border border-emerald-100 bg-white p-5 shadow-soft">
                    <div className="flex items-center justify-between">
                      <p className="text-base font-semibold text-slate-900">{day}</p>
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                        Menu card
                      </Badge>
                    </div>
                    <div className="mt-4 space-y-4">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Lunch</p>
                        <Input
                          className="mt-3 border-0 bg-white"
                          value={menu[day].lunch}
                          onChange={(event) => updateMenu(day, "lunch", event.target.value)}
                          placeholder="Add lunch special"
                        />
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Dinner</p>
                        <Input
                          className="mt-3 border-0 bg-white"
                          value={menu[day].dinner}
                          onChange={(event) => updateMenu(day, "dinner", event.target.value)}
                          placeholder="Add dinner special"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between gap-3">
                <Button variant="outline" className="h-11 rounded-full px-6" onClick={() => goToStep("kitchen")}>
                  Back
                </Button>
                <Button className="h-11 rounded-full px-6" onClick={() => goToStep("pricing")}>
                  Save weekly menu
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "pricing":
        return (
          <Card className="rounded-[28px] border-emerald-100 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
                <IndianRupee className="h-6 w-6 text-emerald-600" />
                Monthly plan pricing
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                { key: "basic" as const, title: "Basic", meals: "Lunch only" },
                { key: "standard" as const, title: "Standard", meals: "Lunch + dinner" },
                { key: "premium" as const, title: "Premium", meals: "All day meals" },
              ].map((plan) => (
                <div key={plan.key} className="rounded-2xl border border-emerald-100 bg-white p-5">
                  <p className="text-lg font-semibold text-slate-900">{plan.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{plan.meals}</p>
                  <Input
                    className="mt-4"
                    value={pricing[plan.key]}
                    onChange={(event) => setPricing((prev) => ({ ...prev, [plan.key]: event.target.value }))}
                    placeholder="Monthly price"
                  />
                  <p className="mt-3 text-xs text-slate-400">Include meal counts, skip flexibility, and delivery timing in the plan card copy.</p>
                </div>
              ))}
              <div className="md:col-span-3 flex justify-between gap-3">
                <Button variant="outline" className="h-11 rounded-full px-6" onClick={() => goToStep("menu")}>
                  Back
                </Button>
                <Button className="h-11 rounded-full px-6" onClick={() => goToStep("documents")}>
                  Save pricing
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "documents":
        return (
          <Card className="rounded-[28px] border-emerald-100 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
                <FileText className="h-6 w-6 text-emerald-600" />
                Documents and verification
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              {["Government ID", "Kitchen photos", "FSSAI / food license", "Cancelled cheque / proof"].map((label) => (
                <label key={label} className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/40 px-4 py-4 text-sm text-slate-600">
                  <span className="mb-3 block font-medium text-slate-900">{label}</span>
                  <input type="file" className="w-full text-xs" />
                </label>
              ))}
              <div className="md:col-span-2 flex justify-between gap-3">
                <Button variant="outline" className="h-11 rounded-full px-6" onClick={() => goToStep("pricing")}>
                  Back
                </Button>
                <Button className="h-11 rounded-full px-6" onClick={() => goToStep("payout")}>
                  Continue to payout setup
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "payout":
        return (
          <Card className="rounded-[28px] border-emerald-100 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
                <Banknote className="h-6 w-6 text-emerald-600" />
                Razorpay bank and payout setup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Input placeholder="Account holder name" />
                <Input placeholder="Bank account number" />
                <Input placeholder="IFSC code" />
                <Input placeholder="UPI ID for backup" />
              </div>
              <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                Use Razorpay Route / payout onboarding for settlements, payout status, and failed transfer recovery. Show progress as Pending KYC, Account Linked, or Payouts Live.
              </div>
              <div className="flex justify-between gap-3">
                <Button variant="outline" className="h-11 rounded-full px-6" onClick={() => goToStep("documents")}>
                  Back
                </Button>
                <Button className="h-11 rounded-full px-6" onClick={() => goToStep("approval")}>
                  Submit for approval
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "approval":
        return (
          <Card className="rounded-[28px] border-emerald-100 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl font-semibold text-slate-900">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
                Admin approval stage
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {[
                { title: "Pending review", note: "Documents and payout details under verification", active: true },
                { title: "Needs attention", note: "Show missing document or menu errors here" },
                { title: "Approved", note: "Chef goes live in discovery and checkout" },
              ].map((item) => (
                <div
                  key={item.title}
                  className={`rounded-2xl border p-5 ${item.active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white"}`}
                >
                  <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.note}</p>
                </div>
              ))}
              <div className="md:col-span-3 flex justify-between gap-3">
                <Button variant="outline" className="h-11 rounded-full px-6" onClick={() => goToStep("payout")}>
                  Back
                </Button>
                <Button className="h-11 rounded-full px-6" onClick={() => goToStep("dashboard")}>
                  Preview live dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case "dashboard":
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {metrics.map((metric) => (
                <Card key={metric.label} className="rounded-[28px] border-emerald-100 shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <metric.icon className="h-5 w-5 text-emerald-600" />
                      <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Live</Badge>
                    </div>
                    <p className="mt-5 text-sm text-slate-500">{metric.label}</p>
                    <p className="mt-1 text-3xl font-semibold text-slate-900">{metric.value}</p>
                    <p className="mt-2 text-xs text-slate-400">{metric.note}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="rounded-[28px] border-emerald-100 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-slate-900">Subscriber overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sampleSubscribers.map((entry) => (
                    <div key={entry.name} className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{entry.name}</p>
                        <p className="text-sm text-slate-500">{entry.plan}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-semibold text-slate-900">{entry.count}</p>
                        <p className="text-xs text-slate-400">subscribers</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="rounded-[28px] border-emerald-100 shadow-soft">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-slate-900">Daily operating checklist</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-slate-600">
                  {[
                    "Confirm tomorrow's meal count before 8 PM",
                    "Review skipped or swapped subscriber requests",
                    "Upload any menu adjustments for the next cycle",
                    "Track payout and earnings summary",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl bg-emerald-50/60 px-4 py-3">
                      <CircleCheckBig className="mt-0.5 h-4 w-4 text-emerald-600" />
                      <span>{item}</span>
                    </div>
                  ))}
                  <div className="flex justify-between gap-3 pt-2">
                    <Button variant="outline" className="h-11 rounded-full px-6" onClick={() => goToStep("approval")}>
                      Back
                    </Button>
                    <Button asChild className="h-11 rounded-full px-6">
                      <Link to="/dashboard">Open live chef dashboard</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_30%),linear-gradient(180deg,#f7fff8_0%,#ffffff_52%,#f8fafc_100%)]">
        <div className="container px-4 py-10 md:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
              <div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">Chef Partner Program</Badge>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                  Grow a subscription kitchen, not just daily orders.
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  ZYNK helps home chefs and cloud kitchens build predictable monthly income with recurring subscribers, weekly menus, Razorpay payouts, and a simple operations dashboard.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Button className="h-12 rounded-full px-8 text-sm font-semibold" onClick={() => goToStep("otp")}>
                    Start onboarding
                  </Button>
                  <Button asChild variant="outline" className="h-12 rounded-full px-8 text-sm font-semibold">
                    <Link to="/register">Register as chef</Link>
                  </Button>
                </div>
                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <Card className="rounded-[24px] border-emerald-100 bg-white/80 shadow-soft">
                    <CardContent className="p-5">
                      <Users className="h-5 w-5 text-emerald-600" />
                      <p className="mt-4 text-2xl font-semibold text-slate-900">180+</p>
                      <p className="text-sm text-slate-500">Recurring subscribers per top kitchen</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-[24px] border-emerald-100 bg-white/80 shadow-soft">
                    <CardContent className="p-5">
                      <Clock3 className="h-5 w-5 text-emerald-600" />
                      <p className="mt-4 text-2xl font-semibold text-slate-900">7 days</p>
                      <p className="text-sm text-slate-500">Weekly menu cadence</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-[24px] border-emerald-100 bg-white/80 shadow-soft">
                    <CardContent className="p-5">
                      <MapPinned className="h-5 w-5 text-emerald-600" />
                      <p className="mt-4 text-2xl font-semibold text-slate-900">{radius} km</p>
                      <p className="text-sm text-slate-500">Current delivery radius target</p>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Card className="rounded-[32px] border-emerald-100 bg-white/90 shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100">
                      <ChefHat className="h-6 w-6 text-emerald-700" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">{kitchenName}</p>
                      <p className="text-sm text-slate-500">{locality}</p>
                    </div>
                  </div>
                  <div className="mt-6 grid gap-3">
                    {[
                      "OTP login and partner verification",
                      "Kitchen profile and service radius",
                      "Mon-Sun menu builder",
                      "Monthly plan pricing",
                      "Documents and Razorpay payouts",
                    ].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        <CircleCheckBig className="h-4 w-4 text-emerald-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {routeState.onboardingMode && (
              <div className="mt-8 rounded-[28px] border border-emerald-100 bg-white/90 px-6 py-5 shadow-soft">
                <p className="text-sm font-semibold text-slate-900">
                  {routeState.onboardingMode === "submitted"
                    ? "Chef profile submitted. Continue with your menu setup."
                    : "Chef workspace opened in draft mode."}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  {routeState.onboardingMode === "submitted"
                    ? "Your registration is saved and now you can design the menu cards and onboarding flow before admin approval."
                    : "The backend was not reachable, so this is only a local draft view. Start the backend and resubmit to send your profile for admin approval."}
                </p>
              </div>
            )}

            <div className="mt-10 rounded-[32px] border border-emerald-100 bg-white/90 p-5 shadow-soft">
              <div className="grid gap-3 md:grid-cols-4 xl:grid-cols-8">
                {steps.map((step) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => goToStep(step.id)}
                    className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                      activeStep === step.id
                        ? "border-emerald-500 bg-emerald-50 shadow-soft"
                        : "border-slate-200 hover:border-emerald-200"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                    <p className="mt-1 text-xs text-slate-500">{step.caption}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">{renderStep()}</div>

            <div className="mt-8 flex items-center justify-between rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Want the live logged-in chef workspace?</p>
                <p className="text-sm text-slate-500">The authenticated dashboard continues to live at the main `/dashboard` route.</p>
              </div>
              <Button asChild variant="ghost" className="gap-2 text-emerald-700">
                <Link to="/dashboard">
                  Go to dashboard
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ChefDashboard;
