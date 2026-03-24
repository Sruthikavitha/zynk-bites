import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { getBackendApiBaseUrl, getApiToken, getChefProfile } from "@/services/backend";
import type { Address, Customer, PlanType, Subscription } from "@/types";
import {
  CalendarDays,
  ChefHat,
  CreditCard,
  IndianRupee,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
  method?: Record<string, boolean>;
  config?: Record<string, unknown>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;
type RazorpayWindow = Window & typeof globalThis & { Razorpay?: RazorpayConstructor };

type CheckoutState = {
  selectedChefId?: string;
  selectedPlan?: PlanType;
};

const emptyAddress: Address = {
  street: "",
  city: "",
  state: "",
  zipCode: "",
};

const planMeta: Record<PlanType, { name: string; price: number; mealsLabel: string }> = {
  basic: { name: "Basic", price: 299900, mealsLabel: "1 meal/day" },
  standard: { name: "Standard", price: 449900, mealsLabel: "2 meals/day" },
  premium: { name: "Premium", price: 599900, mealsLabel: "3 meals/day" },
};

const mealOptions = [
  { id: "1", label: "1 meal / day", multiplier: 1 },
  { id: "2", label: "2 meals / day", multiplier: 1.35 },
  { id: "3", label: "3 meals / day", multiplier: 1.7 },
];

const durationOptions = [
  { id: 1, label: "1 month" },
  { id: 3, label: "3 months" },
  { id: 6, label: "6 months" },
];

const isAddressComplete = (address: Address) =>
  [address.street, address.city, address.state, address.zipCode].every((item) => item.trim().length > 0);

const loadRazorpayCheckout = async () => {
  await new Promise<void>((resolve, reject) => {
    const razorpayWindow = window as RazorpayWindow;
    if (razorpayWindow.Razorpay) {
      resolve();
      return;
    }

    const existingScript = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    const timeout = window.setTimeout(() => reject(new Error("Razorpay checkout timed out while loading.")), 10000);

    const cleanup = () => window.clearTimeout(timeout);
    const handleLoad = () => {
      cleanup();
      if ((window as RazorpayWindow).Razorpay) {
        resolve();
        return;
      }

      reject(new Error("Razorpay checkout loaded incorrectly."));
    };
    const handleError = () => {
      cleanup();
      reject(new Error("Failed to load Razorpay checkout"));
    };

    if (existingScript) {
      existingScript.addEventListener("load", handleLoad, { once: true });
      existingScript.addEventListener("error", handleError, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = handleLoad;
    script.onerror = handleError;
    document.head.appendChild(script);
  });
};

const getPaymentStartErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message === "Failed to fetch") {
    return "Backend payment API is not reachable. Start the backend on http://localhost:3002 and try again.";
  }

  return error instanceof Error ? error.message : "Unable to start payment.";
};

const getRazorpayMethodConfig = (paymentMethod: "upi" | "debit" | "credit" | "netbanking") => {
  if (paymentMethod === "upi") {
    return {
      method: { upi: true, card: false, netbanking: false, wallet: false },
      config: {
        display: {
          blocks: {
            preferred: {
              name: "Pay using UPI",
              instruments: [{ method: "upi" }],
            },
          },
          sequence: ["block.preferred"],
          preferences: { show_default_blocks: false },
        },
      },
    };
  }

  if (paymentMethod === "netbanking") {
    return { method: { upi: false, card: false, netbanking: true, wallet: false } };
  }

  return { method: { upi: false, card: true, netbanking: false, wallet: false } };
};

const buildActivatedSubscription = ({
  customerId,
  plan,
  address,
  chefId,
}: {
  customerId: string;
  plan: PlanType;
  address: Address;
  chefId?: string;
}): Subscription => ({
  id: `subscription-${Date.now()}`,
  customerId,
  plan,
  mealTime: plan === "basic" ? "lunch" : "both",
  mealSlots: plan === "premium" ? ["breakfast", "lunch", "dinner"] : plan === "standard" ? ["lunch", "dinner"] : ["lunch"],
  startDate: new Date().toISOString(),
  status: "active",
  address,
  activeAddressType: "home",
  selectedChefId: chefId,
});

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const routeState = (location.state || {}) as CheckoutState;
  const customer = user as Customer | null;

  const [chefName, setChefName] = useState("Selected chef");
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(routeState.selectedPlan || "standard");
  const [selectedDuration, setSelectedDuration] = useState(1);
  const [selectedMeals, setSelectedMeals] = useState("2");
  const [addressMode, setAddressMode] = useState<"home" | "work" | "manual">("manual");
  const [manualAddress, setManualAddress] = useState<Address>({ ...emptyAddress });
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });
  const [coupon, setCoupon] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "debit" | "credit" | "netbanking">("upi");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadChef = async () => {
      if (!routeState.selectedChefId) return;
      const profile = await getChefProfile(routeState.selectedChefId);
      if (profile?.chef?.name) {
        setChefName(profile.chef.name);
      }
    };
    void loadChef();
  }, [routeState.selectedChefId]);

  useEffect(() => {
    if (customer?.homeAddress && isAddressComplete(customer.homeAddress)) {
      setAddressMode("home");
      setManualAddress(customer.homeAddress);
      return;
    }
    if (customer?.workAddress && isAddressComplete(customer.workAddress)) {
      setAddressMode("work");
      setManualAddress(customer.workAddress);
    }
  }, [customer]);

  const selectedAddress = useMemo(() => {
    if (addressMode === "home" && customer?.homeAddress && isAddressComplete(customer.homeAddress)) {
      return customer.homeAddress;
    }
    if (addressMode === "work" && customer?.workAddress && isAddressComplete(customer.workAddress)) {
      return customer.workAddress;
    }
    return manualAddress;
  }, [addressMode, customer, manualAddress]);

  const priceSummary = useMemo(() => {
    const monthlyBase = planMeta[selectedPlan].price;
    const mealMultiplier = mealOptions.find((option) => option.id === selectedMeals)?.multiplier || 1;
    const subtotal = Math.round(monthlyBase * selectedDuration * mealMultiplier);
    const discount = coupon.trim().toUpperCase() === "WELCOME10" ? Math.round(subtotal * 0.1) : 0;
    const finalAmount = subtotal - discount;

    return {
      subtotal,
      discount,
      finalAmount,
      finalAmountLabel: `INR ${(finalAmount / 100).toLocaleString("en-IN")}`,
    };
  }, [selectedPlan, selectedDuration, selectedMeals, coupon]);

  const handlePayment = async () => {
    const token = getApiToken();
    if (!user || !token) {
      toast({
        title: "Login required",
        description: "Sign in before completing subscription payment.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }

    if (!routeState.selectedChefId) {
      toast({
        title: "Select a chef",
        description: "Choose a chef before opening checkout.",
        variant: "destructive",
      });
      navigate("/chefs");
      return;
    }

    if (!isAddressComplete(selectedAddress)) {
      toast({
        title: "Delivery address required",
        description: "Complete the address before proceeding to Razorpay payment.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      await loadRazorpayCheckout();

      let apiBase = getBackendApiBaseUrl();
      if (apiBase.endsWith("/api")) apiBase = apiBase.replace(/\/api\/?$/, "");
      if (!apiBase) apiBase = `${window.location.protocol}//${window.location.hostname}:3002`;

      const orderRes = await fetch(`${apiBase}/api/payment/create-order`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: priceSummary.finalAmount,
          currency: "INR",
          plan: selectedPlan,
        }),
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success || !orderData.order) {
        toast({
          title: "Payment setup failed",
          description: orderData.message || "Unable to create your Razorpay order.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const razorpayKey = orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast({
          title: "Configuration error",
          description: "Razorpay key is not configured.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      setLoading(false);

      const options: RazorpayOptions = {
        key: razorpayKey,
        amount: orderData.order.amount,
        currency: "INR",
        name: "ZYNK Bites",
        description: `${planMeta[selectedPlan].name} subscription`,
        order_id: orderData.order.id,
        ...getRazorpayMethodConfig(paymentMethod),
        handler: async (response) => {
          try {
            const verifyRes = await fetch(`${apiBase}/api/payment/verify`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan,
                chefId: routeState.selectedChefId,
                homeAddress: selectedAddress,
                paymentMethod,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              toast({
                title: "Payment verification failed",
                description: verifyData.message || "Could not activate your subscription.",
                variant: "destructive",
              });
              return;
            }

            toast({
              title: "Payment successful",
              description: "Your subscription is active. You can manage skips and swaps from the dashboard.",
            });

            navigate("/dashboard", {
              state: {
                activatedSubscription: buildActivatedSubscription({
                  customerId: customer?.id || "customer",
                  plan: selectedPlan,
                  address: selectedAddress,
                  chefId: routeState.selectedChefId,
                }),
              },
            });
          } catch {
            toast({
              title: "Verification failed",
              description: "We could not confirm the payment. Please contact support if charged.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: customer?.name || "",
          email: customer?.email || "",
          contact: customer?.phone || "",
        },
        theme: { color: "#16a34a" },
        modal: {
          ondismiss: () => {
            toast({
              title: "Payment cancelled",
              description: "You closed the payment window before completion.",
            });
          },
        },
      };

      const RazorpayCheckout = (window as RazorpayWindow).Razorpay;
      if (!RazorpayCheckout) {
        throw new Error("Razorpay checkout is unavailable.");
      }

      const razorpay = new RazorpayCheckout(options);
      razorpay.open();
    } catch (error) {
      setLoading(false);
      toast({
        title: "Payment failed",
        description: getPaymentStartErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.14),_transparent_32%),linear-gradient(180deg,#f7fff8_0%,#ffffff_54%,#f8fafc_100%)]">
        <div className="container px-4 py-10 md:py-14">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8">
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                Checkout & payment
              </Badge>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-900">Complete your monthly subscription</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">
                Customize plan duration, meals per day, address, and start date, then activate the subscription through Razorpay.
              </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3">
                      <ChefHat className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-lg font-semibold text-slate-900">{chefName}</p>
                        <p className="text-sm text-slate-500">Selected chef for your subscription</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                  <CardContent className="space-y-5 p-6">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Plan customization</p>
                      <p className="text-sm text-slate-500">Pick the plan, duration, and meal frequency that fits your routine.</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      {Object.entries(planMeta).map(([planKey, plan]) => (
                        <button
                          key={planKey}
                          type="button"
                          onClick={() => setSelectedPlan(planKey as PlanType)}
                          className={`rounded-2xl border p-4 text-left transition ${
                            selectedPlan === planKey ? "border-emerald-500 bg-emerald-50" : "border-slate-200"
                          }`}
                        >
                          <p className="font-semibold text-slate-900">{plan.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{plan.mealsLabel}</p>
                          <p className="mt-3 text-xl font-semibold text-emerald-700">INR {(plan.price / 100).toLocaleString("en-IN")}</p>
                        </button>
                      ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-3 text-sm font-medium text-slate-700">Duration</p>
                        <div className="flex flex-wrap gap-2">
                          {durationOptions.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setSelectedDuration(option.id)}
                              className={`rounded-full px-4 py-2 text-sm transition ${
                                selectedDuration === option.id
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="mb-3 text-sm font-medium text-slate-700">Meals per day</p>
                        <div className="flex flex-wrap gap-2">
                          {mealOptions.map((option) => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => setSelectedMeals(option.id)}
                              className={`rounded-full px-4 py-2 text-sm transition ${
                                selectedMeals === option.id
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-lg font-semibold text-slate-900">Delivery address</p>
                        <p className="text-sm text-slate-500">Address selection is mandatory before subscription payment.</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "home", label: "Home", enabled: Boolean(customer?.homeAddress && isAddressComplete(customer.homeAddress)) },
                        { id: "work", label: "Work", enabled: Boolean(customer?.workAddress && isAddressComplete(customer.workAddress)) },
                        { id: "manual", label: "Manual entry", enabled: true },
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          disabled={!option.enabled}
                          onClick={() => setAddressMode(option.id as "home" | "work" | "manual")}
                          className={`rounded-full px-4 py-2 text-sm transition ${
                            addressMode === option.id
                              ? "bg-emerald-600 text-white"
                              : option.enabled
                                ? "bg-slate-100 text-slate-600"
                                : "bg-slate-100 text-slate-300"
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>

                    {(addressMode === "manual" || !isAddressComplete(selectedAddress)) && (
                      <div className="grid gap-3 md:grid-cols-2">
                        <Input
                          value={manualAddress.street}
                          onChange={(event) => setManualAddress((prev) => ({ ...prev, street: event.target.value }))}
                          placeholder="Street address"
                        />
                        <Input
                          value={manualAddress.city}
                          onChange={(event) => setManualAddress((prev) => ({ ...prev, city: event.target.value }))}
                          placeholder="City"
                        />
                        <Input
                          value={manualAddress.state}
                          onChange={(event) => setManualAddress((prev) => ({ ...prev, state: event.target.value }))}
                          placeholder="State"
                        />
                        <Input
                          value={manualAddress.zipCode}
                          onChange={(event) => setManualAddress((prev) => ({ ...prev, zipCode: event.target.value }))}
                          placeholder="ZIP Code"
                        />
                      </div>
                    )}

                    <div className="rounded-2xl bg-slate-50 px-4 py-4 text-sm text-slate-600">
                      {isAddressComplete(selectedAddress)
                        ? formatAddress(selectedAddress)
                        : "Enter the full address to continue."}
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                  <CardContent className="grid gap-4 p-6 md:grid-cols-[1fr_auto] md:items-end">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">Start date</p>
                        <Input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-medium text-slate-700">Coupon</p>
                        <Input value={coupon} onChange={(event) => setCoupon(event.target.value)} placeholder="WELCOME10" />
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { id: "upi", label: "UPI" },
                        { id: "debit", label: "DEBIT" },
                        { id: "credit", label: "CREDIT" },
                        { id: "netbanking", label: "NETBANKING" },
                      ].map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                          className={`rounded-full px-4 py-2 text-sm transition ${
                            paymentMethod === method.id ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {method.label}
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card className="rounded-[32px] border-emerald-100 shadow-soft">
                  <CardContent className="space-y-5 p-6">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-lg font-semibold text-slate-900">Order summary</p>
                        <p className="text-sm text-slate-500">Your final amount updates instantly.</p>
                      </div>
                    </div>

                    <SummaryRow label="Plan" value={planMeta[selectedPlan].name} />
                    <SummaryRow label="Duration" value={`${selectedDuration} month${selectedDuration > 1 ? "s" : ""}`} />
                    <SummaryRow label="Meals" value={mealOptions.find((option) => option.id === selectedMeals)?.label || ""} />
                    <SummaryRow label="Chef" value={chefName} />
                    <SummaryRow label="Start date" value={new Date(startDate).toLocaleDateString("en-IN")} />
                    <SummaryRow label="Address" value={isAddressComplete(selectedAddress) ? formatAddress(selectedAddress) : "Pending"} />
                    <SummaryRow label="Subtotal" value={`INR ${(priceSummary.subtotal / 100).toLocaleString("en-IN")}`} />
                    <SummaryRow
                      label="Discount"
                      value={priceSummary.discount ? `- INR ${(priceSummary.discount / 100).toLocaleString("en-IN")}` : "No discount"}
                    />

                    <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <IndianRupee className="h-5 w-5 text-emerald-600" />
                          <span className="text-sm font-medium text-slate-700">Total payable</span>
                        </div>
                        <span className="text-2xl font-semibold text-slate-900">{priceSummary.finalAmountLabel}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2 text-emerald-700">
                        <ShieldCheck className="h-4 w-4" />
                        Secure payment powered by Razorpay
                      </div>
                      <div className="mt-2 flex items-center gap-2 text-slate-500">
                        <Sparkles className="h-4 w-4" />
                        Success redirects to your subscription confirmation page.
                      </div>
                    </div>

                    <Button className="h-12 w-full rounded-full" onClick={handlePayment} disabled={loading}>
                      {loading ? "Preparing Razorpay..." : "Pay & activate subscription"}
                    </Button>

                    {!user && (
                      <Button asChild variant="outline" className="h-12 w-full rounded-full">
                        <Link to="/login">Sign in to continue</Link>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

const SummaryRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-start justify-between gap-4 text-sm">
    <span className="text-slate-500">{label}</span>
    <span className="max-w-[65%] text-right font-medium text-slate-900">{value}</span>
  </div>
);

const formatAddress = (address: Address) =>
  `${address.street}, ${address.city}, ${address.state} - ${address.zipCode}`;

export default Checkout;
