import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ReviewCard } from "@/components/zynk/ReviewCard";
import { SubscriptionCard } from "@/components/zynk/SubscriptionCard";
import { CalendarDays, ChefHat, MapPin, ShieldCheck, Star } from "lucide-react";
import { getChefProfile as getBackendChefProfile } from "@/services/backend";
import type { Chef, Dish, Review, PlanType } from "@/types";

const galleryImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1400&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1400&q=80",
];

const planCards: {
  id: PlanType;
  title: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
}[] = [
  {
    id: "basic",
    title: "Basic",
    price: "INR 2,999",
    description: "A lighter monthly commitment",
    features: ["Lunch plan", "20 meals / month", "Great for weekday routines"],
  },
  {
    id: "standard",
    title: "Standard",
    price: "INR 4,499",
    description: "Best for lunch + dinner subscribers",
    features: ["Lunch + dinner", "30 meals / month", "Most popular among members"],
    highlighted: true,
  },
  {
    id: "premium",
    title: "Premium",
    price: "INR 5,999",
    description: "Breakfast to dinner coverage",
    features: ["Breakfast + lunch + dinner", "Flexible weekly menus", "Priority support"],
  },
];

const ChefDetail = () => {
  const { chefId } = useParams();
  const navigate = useNavigate();
  const [chef, setChef] = useState<Chef | null>(null);
  const [dishes, setDishes] = useState<Dish[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!chefId) return;
    setLoading(true);

    const loadProfile = async () => {
      const backendProfile = await getBackendChefProfile(chefId);
      if (backendProfile) {
        setChef(backendProfile.chef);
        setDishes(backendProfile.dishes);
        setReviews(backendProfile.reviews);
        setAvgRating(backendProfile.avgRating);
      }
      setLoading(false);
    };

    void loadProfile();
  }, [chefId]);

  const weeklyMenu = useMemo(() => {
    if (chef?.menuCharts?.[0]?.days?.length) {
      return chef.menuCharts[0].days.slice(0, 7).map((day) => ({
        day: new Date(day.date).toLocaleDateString("en-IN", { weekday: "short" }),
        breakfast: resolveMealName(dishes, day.slots.breakfast?.mealId),
        lunch: resolveMealName(dishes, day.slots.lunch?.mealId),
        dinner: resolveMealName(dishes, day.slots.dinner?.mealId),
      }));
    }

    return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => ({
      day,
      breakfast: dishes[index % Math.max(dishes.length, 1)]?.name || "Chef's breakfast rotation",
      lunch: dishes[(index + 1) % Math.max(dishes.length, 1)]?.name || "Chef's lunch rotation",
      dinner: dishes[(index + 2) % Math.max(dishes.length, 1)]?.name || "Chef's dinner rotation",
    }));
  }, [chef, dishes]);

  const handlePlanSelection = (plan: PlanType) => {
    navigate("/checkout", {
      state: {
        selectedChefId: chefId,
        selectedPlan: plan,
      },
    });
  };

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-12">
          <div className="h-[320px] rounded-[32px] bg-slate-100" />
        </div>
      </Layout>
    );
  }

  if (!chef) {
    return (
      <Layout>
        <div className="container px-4 py-20 text-center">
          <p className="text-slate-500">Chef not found.</p>
          <Button className="mt-4" onClick={() => navigate("/chefs")}>
            Back to chefs
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="relative overflow-hidden bg-[linear-gradient(180deg,#f7fff8_0%,#ffffff_70%)]">
        <div className="h-72 w-full overflow-hidden bg-slate-100 md:h-80">
          <img src={galleryImages[0]} alt={chef.name} className="h-full w-full object-cover" />
        </div>
        <div className="container px-4">
          <div className="-mt-16 rounded-[32px] border border-emerald-100 bg-white p-6 shadow-card-hover md:p-8">
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
              <div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                  Weekly menu visible before subscription
                </Badge>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-900">{chef.name}</h1>
                <p className="mt-2 text-base text-slate-600">{chef.specialty || "Home Chef"}</p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                  <div className="flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-emerald-700">
                    <MapPin className="h-4 w-4" />
                    {chef.serviceArea || "Nearby areas"}
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                    <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                    {(avgRating || chef.rating || 4.6).toFixed(1)} rating
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2">
                    <ShieldCheck className="h-4 w-4 text-slate-500" />
                    Subscription verified
                  </div>
                </div>
                <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-500">
                  Review the chef&apos;s weekly rotation, compare plans, and continue into checkout where you&apos;ll set address, duration, meal preference, and Razorpay payment.
                </p>
              </div>

              <Card className="rounded-[28px] border-emerald-100 shadow-soft">
                <CardContent className="space-y-4 p-6">
                  <div className="flex items-center gap-3">
                    <ChefHat className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-slate-900">Chef snapshot</p>
                      <p className="text-sm text-slate-500">Built for recurring monthly members</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <MiniStat value={`${dishes.length}`} label="Dishes" />
                    <MiniStat value={`${reviews.length}`} label="Reviews" />
                    <MiniStat value="7 day" label="Menu window" />
                  </div>
                  <Button className="h-12 w-full rounded-full" onClick={() => handlePlanSelection("standard")}>
                    Choose plan & checkout
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-12">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="rounded-[32px] border-emerald-100 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-emerald-600" />
                <div>
                  <h2 className="text-2xl font-semibold text-slate-900">Weekly menu</h2>
                  <p className="text-sm text-slate-500">A preview of the chef&apos;s Mon-Sun rotation</p>
                </div>
              </div>
              <div className="mt-6 overflow-hidden rounded-[24px] border border-slate-200">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-500">
                    <tr>
                      <th className="px-4 py-3">Day</th>
                      <th className="px-4 py-3">Breakfast</th>
                      <th className="px-4 py-3">Lunch</th>
                      <th className="px-4 py-3">Dinner</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weeklyMenu.map((row) => (
                      <tr key={row.day} className="border-t border-slate-200">
                        <td className="px-4 py-4 font-semibold text-slate-900">{row.day}</td>
                        <td className="px-4 py-4 text-slate-600">{row.breakfast}</td>
                        <td className="px-4 py-4 text-slate-600">{row.lunch}</td>
                        <td className="px-4 py-4 text-slate-600">{row.dinner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-emerald-100 shadow-soft">
            <CardContent className="p-6">
              <h2 className="text-2xl font-semibold text-slate-900">Popular dishes</h2>
              <div className="mt-5 grid gap-3">
                {dishes.slice(0, 5).map((dish) => (
                  <div key={dish.id} className="rounded-2xl border border-slate-200 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{dish.name}</p>
                        <p className="mt-1 text-sm text-slate-500">{dish.description}</p>
                      </div>
                      <Badge className={dish.category === "veg" ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"}>
                        {dish.category === "veg" ? "Veg" : "Non-veg"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container px-4 pb-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-emerald-600">Subscription plans</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Choose a plan, then customize it in checkout</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {planCards.map((plan) => (
            <SubscriptionCard
              key={plan.id}
              title={plan.title}
              price={plan.price}
              description={plan.description}
              features={plan.features}
              highlighted={plan.highlighted}
              onSelect={() => handlePlanSelection(plan.id)}
            />
          ))}
        </div>
      </section>

      <section className="container px-4 pb-16">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <Card className="rounded-[32px] border-emerald-100 shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-2xl font-semibold text-slate-900">Gallery</h3>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {galleryImages.map((image) => (
                  <img key={image} src={image} alt="Chef gallery" className="h-40 w-full rounded-2xl object-cover" />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[32px] border-emerald-100 shadow-soft">
            <CardContent className="p-6">
              <h3 className="text-2xl font-semibold text-slate-900">Member reviews</h3>
              <div className="mt-5 grid gap-4 md:grid-cols-2">
                {reviews.length === 0 && <p className="text-sm text-slate-500">No reviews yet.</p>}
                {reviews.slice(0, 4).map((review) => (
                  <ReviewCard
                    key={review.id}
                    name="Member"
                    rating={review.rating}
                    comment={review.comment || "Great weekly subscription experience."}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

const resolveMealName = (dishes: Dish[], mealId?: string) => {
  if (!mealId) return "Chef's choice";
  return dishes.find((dish) => dish.id === mealId)?.name || "Chef's choice";
};

const MiniStat = ({ value, label }: { value: string; label: string }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-4">
    <p className="text-2xl font-semibold text-slate-900">{value}</p>
    <p className="mt-1 text-sm text-slate-500">{label}</p>
  </div>
);

export default ChefDetail;
