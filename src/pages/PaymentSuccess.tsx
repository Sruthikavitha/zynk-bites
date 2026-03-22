import { Link, useLocation } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, ChefHat, CalendarDays, IndianRupee, MapPin, ShieldCheck } from "lucide-react";

type PaymentSuccessState = {
  chefName?: string;
  planName?: string;
  durationLabel?: string;
  mealsLabel?: string;
  startDate?: string;
  deliveryAddress?: string;
  paymentId?: string;
  amountLabel?: string;
};

const formatStartDate = (value?: string) => {
  if (!value) return "Tomorrow";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
};

const PaymentSuccess = () => {
  const location = useLocation();
  const state = (location.state || {}) as PaymentSuccessState;

  const summary = [
    { label: "Chef", value: state.chefName || "Assigned chef" },
    { label: "Plan", value: state.planName || "Signature Plan" },
    { label: "Duration", value: state.durationLabel || "1 month" },
    { label: "Meals", value: state.mealsLabel || "Lunch + Dinner" },
    { label: "Starts", value: formatStartDate(state.startDate) },
    { label: "Address", value: state.deliveryAddress || "Saved delivery address" },
  ];

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(34,197,94,0.18),_transparent_40%),linear-gradient(180deg,#f7fff8_0%,#ffffff_45%,#f8fafc_100%)]">
        <div className="container px-4 py-10 md:py-16">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-500 shadow-lg shadow-emerald-500/20">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <Badge className="mt-6 bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                Subscription Activated
              </Badge>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
                Payment successful
              </h1>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 md:text-base">
                Your monthly meal journey is live. We&apos;ve locked in your chef, start date, and delivery preferences.
              </p>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="overflow-hidden rounded-[28px] border-emerald-100 shadow-soft">
                <CardContent className="p-0">
                  <div className="border-b border-emerald-100 bg-emerald-50/80 px-6 py-5">
                    <div className="flex items-center gap-3">
                      <ChefHat className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {state.chefName || "Chef confirmed"}
                        </p>
                        <p className="text-xs text-slate-500">
                          Razorpay secured your first subscription payment
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4 px-6 py-6">
                    {summary.map((item) => (
                      <div key={item.label} className="flex items-start justify-between gap-4 border-b border-dashed border-slate-200 pb-4 last:border-b-0 last:pb-0">
                        <p className="text-sm text-slate-500">{item.label}</p>
                        <p className="max-w-[65%] text-right text-sm font-medium text-slate-900">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <Card className="rounded-[28px] border-emerald-100 shadow-soft">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-3">
                      <IndianRupee className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm text-slate-500">Charged today</p>
                        <p className="text-2xl font-semibold text-slate-900">
                          {state.amountLabel || "INR 4,499"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3">
                      <ShieldCheck className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em] text-slate-400">Payment ID</p>
                        <p className="text-sm font-medium text-slate-700">{state.paymentId || "Generated securely"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="rounded-[28px] border-emerald-100 shadow-soft">
                  <CardContent className="space-y-4 p-6">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="h-5 w-5 text-emerald-600" />
                      <div>
                        <p className="text-sm font-semibold text-slate-900">What happens next</p>
                        <p className="text-sm text-slate-500">Your dashboard is ready for daily control.</p>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm text-slate-600">
                      <p>Skip or swap meals before the cutoff time.</p>
                      <p>Pause your plan anytime from the dashboard.</p>
                      <p>Switch between home and work delivery addresses as needed.</p>
                    </div>
                    <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                      <div className="flex items-start gap-3">
                        <MapPin className="mt-0.5 h-4 w-4" />
                        <span>{state.deliveryAddress || "Your saved address will be used for the first delivery."}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild className="h-12 rounded-full px-8 text-sm font-semibold">
                <Link to="/dashboard">Open dashboard</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full px-8 text-sm font-semibold">
                <Link to="/chefs">Explore more chefs</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default PaymentSuccess;
