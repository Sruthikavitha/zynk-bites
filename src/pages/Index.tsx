import { type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ChefCard } from "@/components/zynk/ChefCard";
import { SubscriptionCard } from "@/components/zynk/SubscriptionCard";
import {
  ArrowRight,
  CalendarDays,
  ChefHat,
  CircleCheckBig,
  MapPin,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const cuisines = [
  { name: "South Indian", note: "Comfort lunches and homestyle thalis" },
  { name: "North Indian", note: "Rotis, curries, and weekly rotation menus" },
  { name: "High Protein", note: "Fitness-friendly meal plans" },
  { name: "Vegan", note: "Plant-forward daily subscriptions" },
];

const mealPlans = [
  {
    title: "Basic",
    price: "INR 2,999",
    description: "Perfect for busy weekdays",
    features: ["Lunch plan", "20 meals / month", "Skip or swap before cutoff"],
  },
  {
    title: "Standard",
    price: "INR 4,499",
    description: "Most loved subscription",
    features: ["Lunch + dinner", "30 meals / month", "Address flexibility"],
    highlighted: true,
  },
  {
    title: "Premium",
    price: "INR 5,999",
    description: "Full-day meal coverage",
    features: ["Breakfast + lunch + dinner", "Chef-curated rotations", "Priority support"],
  },
];

const trendingChefs = [
  {
    id: "1",
    name: "Chef Neha Sharma",
    rating: 4.9,
    cuisineTags: ["South Indian", "Healthy", "Millet Meals"],
    monthlyPrice: "From INR 3,499",
    image: "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=900&q=80",
    badge: "Top Rated",
  },
  {
    id: "2",
    name: "Chef Arjun Rao",
    rating: 4.8,
    cuisineTags: ["North Indian", "High Protein"],
    monthlyPrice: "From INR 4,299",
    image: "https://images.unsplash.com/photo-1528701800489-20be3c329d80?auto=format&fit=crop&w=900&q=80",
    badge: "Popular Nearby",
  },
  {
    id: "3",
    name: "Chef Mira Joseph",
    rating: 4.7,
    cuisineTags: ["Vegan", "Continental"],
    monthlyPrice: "From INR 3,999",
    image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
    badge: "New Chef",
  },
];

const howItWorks = [
  { title: "Choose a chef", text: "Compare cuisine, weekly menu, reviews, and service area." },
  { title: "Customize your plan", text: "Pick duration, meals per day, address, and start date." },
  { title: "Pay securely", text: "Activate your subscription with Razorpay checkout." },
  { title: "Manage daily meals", text: "Skip, swap, pause, and change addresses from your dashboard." },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.16),_transparent_32%),linear-gradient(180deg,#f7fff8_0%,#ffffff_48%,#f8fafc_100%)]">
        <div className="container px-4 py-10 md:py-16">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                <Sparkles className="mr-2 h-4 w-4" />
                Monthly meals from trusted local chefs
              </Badge>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 md:text-6xl">
                Subscription meals that feel as easy as Swiggy, but built for every day.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                Discover home chefs, compare weekly menus, pick a monthly plan, and control every delivery from one clean dashboard.
              </p>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input className="h-12 rounded-full pl-12" placeholder="Search by chef, cuisine, or locality" />
                </div>
                <Button asChild className="h-12 rounded-full px-8">
                  <Link to="/chefs">Explore chefs</Link>
                </Button>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Button asChild variant="outline" className="h-12 rounded-full px-8">
                  <Link to="/login">OTP-style sign in</Link>
                </Button>
                <Button asChild className="h-12 rounded-full px-8">
                  <Link to="/chef-partner">Become a chef partner</Link>
                </Button>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: ShieldCheck, title: "Secure checkout", note: "Razorpay payments" },
                  { icon: MapPin, title: "Flexible addresses", note: "Home or work delivery" },
                  { icon: CalendarDays, title: "Weekly menu visibility", note: "Know what is coming" },
                ].map((item) => (
                  <div key={item.title} className="rounded-[24px] border border-emerald-100 bg-white/80 px-5 py-4 shadow-soft">
                    <item.icon className="h-5 w-5 text-emerald-600" />
                    <p className="mt-3 text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="rounded-[32px] border border-emerald-100 bg-white/90 p-4 shadow-card-hover">
                <img
                  src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1400&q=80"
                  alt="Subscription meals"
                  className="h-[360px] w-full rounded-[26px] object-cover"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-emerald-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">This week</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">3 chefs are onboarding new members nearby</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Dashboard perks</p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">Skip, swap, pause, and address changes in one tap</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-14">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-600">Meal Plans</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Choose a monthly plan, then tailor it in checkout</h2>
          </div>
          <p className="max-w-xl text-sm text-slate-500">
            Duration, meals per day, start date, address, and payment all come together in one mobile-friendly checkout flow.
          </p>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {mealPlans.map((plan) => (
            <SubscriptionCard
              key={plan.title}
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              highlighted={plan.highlighted}
              onSelect={() => navigate("/chefs")}
            />
          ))}
        </div>
      </section>

      <section className="bg-emerald-50/70">
        <div className="container px-4 py-14">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-600">Chef Discovery</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Top subscription chefs this week</h2>
            </div>
            <Button asChild variant="outline" className="rounded-full px-6">
              <Link to="/chefs">See all chefs</Link>
            </Button>
          </div>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {trendingChefs.map((chef) => (
              <ChefCard key={chef.id} {...chef} />
            ))}
          </div>
        </div>
      </section>

      <section className="container px-4 py-14">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <CardShell
            title="Browse by cuisine"
            description="A few popular starting points for your chef search."
          >
            <div className="grid gap-3">
              {cuisines.map((cuisine) => (
                <div key={cuisine.name} className="rounded-2xl border border-emerald-100 px-4 py-4">
                  <p className="font-semibold text-slate-900">{cuisine.name}</p>
                  <p className="mt-1 text-sm text-slate-500">{cuisine.note}</p>
                </div>
              ))}
            </div>
          </CardShell>

          <CardShell
            title="How the subscription flow works"
            description="Built for repeat use, not one-off ordering."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              {howItWorks.map((item, index) => (
                <div key={item.title} className="rounded-2xl border border-slate-200 bg-white px-5 py-5">
                  <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Step {index + 1}</p>
                  <p className="mt-3 text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.text}</p>
                </div>
              ))}
            </div>
          </CardShell>
        </div>
      </section>

      <section className="container px-4 pb-16">
        <div className="overflow-hidden rounded-[32px] bg-gradient-to-r from-emerald-600 to-green-500 px-6 py-10 text-white shadow-card-hover md:px-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-100">Chef Flow</p>
              <h3 className="mt-2 text-3xl font-semibold">Running a home kitchen? Build a real subscription business.</h3>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                The partner flow now covers OTP onboarding, kitchen details, weekly menus, monthly pricing, documents, Razorpay payout setup, admin approval, and dashboard metrics.
              </p>
            </div>
            <Button asChild variant="secondary" className="h-12 rounded-full px-8 text-sm font-semibold text-emerald-700">
              <Link to="/chef-partner">
                Explore chef onboarding
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

const CardShell = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <div className="rounded-[32px] border border-emerald-100 bg-white p-6 shadow-soft">
    <div className="mb-5">
      <p className="text-2xl font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm text-slate-500">{description}</p>
    </div>
    {children}
  </div>
);

export default Index;
