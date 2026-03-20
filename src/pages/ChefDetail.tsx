import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefCard } from "@/components/zynk/ChefCard";
import { ReviewCard } from "@/components/zynk/ReviewCard";
import { SubscriptionCard } from "@/components/zynk/SubscriptionCard";
import { Coffee, Moon, Star, Sun } from "lucide-react";
import * as api from "@/services/api";
import { getChefProfile as getBackendChefProfile } from "@/services/backend";
import type { Chef, Dish, Review } from "@/types";

const galleryImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80",
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
        setLoading(false);
        return;
      }

      const response = api.getChefProfile(chefId);
      if (response.success && response.data) {
        setChef(response.data.chef);
        setDishes(response.data.dishes);
        setReviews(response.data.reviews);
        setAvgRating(response.data.avgRating);
      }
      setLoading(false);
    };
    void loadProfile();
  }, [chefId]);

  const weeklyMenu = useMemo(() => {
    const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];
    const pick = (offset: number) => dishes[offset]?.name || "Chef's choice";
    return dayLabels.map((day, index) => ({
      day,
      breakfast: pick(index),
      lunch: pick(index + 1),
      dinner: pick(index + 2),
    }));
  }, [dishes]);

  if (loading) {
    return (
      <Layout>
        <div className="container px-4 py-12">
          <div className="h-64 rounded-3xl bg-slate-100" />
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
      <section className="relative">
        <div className="h-72 w-full overflow-hidden bg-slate-100">
          <img
            src={galleryImages[0]}
            alt={chef.name}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="container px-4">
          <div className="-mt-16 rounded-3xl border border-emerald-100 bg-white p-6 shadow-card-hover">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-slate-900">{chef.name}</h1>
                <p className="text-sm text-slate-500">{chef.specialty}</p>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">
                  <Badge className="bg-emerald-50 text-emerald-700">{chef.serviceArea}</Badge>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
                    <span>{avgRating.toFixed(1)}</span>
                    <span className="text-slate-400">({reviews.length} reviews)</span>
                  </div>
                </div>
              </div>
              <Button className="h-12 rounded-full px-8" onClick={() => navigate("/checkout")}>
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-12">
        <Tabs defaultValue="menu">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="menu">Menu</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="gallery">Gallery</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>

          <TabsContent value="menu" className="mt-8">
            <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-soft">
              <table className="w-full text-left text-sm">
                <thead className="bg-emerald-50 text-slate-600">
                  <tr>
                    <th className="px-4 py-3">Day</th>
                    <th className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Coffee className="h-4 w-4 text-emerald-600" />
                        Breakfast
                      </div>
                    </th>
                    <th className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-emerald-600" />
                        Lunch
                      </div>
                    </th>
                    <th className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-emerald-600" />
                        Dinner
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyMenu.map((row) => (
                    <tr key={row.day} className="border-t">
                      <td className="px-4 py-3 font-semibold text-slate-900">{row.day}</td>
                      <td className="px-4 py-3 text-slate-600">{row.breakfast}</td>
                      <td className="px-4 py-3 text-slate-600">{row.lunch}</td>
                      <td className="px-4 py-3 text-slate-600">{row.dinner}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-8">
            <div className="grid gap-4 md:grid-cols-2">
              {reviews.length === 0 && (
                <p className="text-sm text-slate-500">No reviews yet.</p>
              )}
              {reviews.slice(0, 4).map((review) => (
                <ReviewCard
                  key={review.id}
                  name="Customer"
                  rating={review.rating}
                  comment={review.comment || "Great chef experience."}
                />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {galleryImages.map((image) => (
                <img key={image} src={image} alt="Gallery" className="h-40 w-full rounded-2xl object-cover" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="plans" className="mt-8">
            <div className="grid gap-6 md:grid-cols-3">
              <SubscriptionCard
                title="Lite"
                price="?2,999/mo"
                description="Lunches for busy weeks"
                features={["5 meals/week", "Swap meals", "Chef support"]}
              />
              <SubscriptionCard
                title="Signature"
                price="?4,499/mo"
                description="Most popular choice"
                features={["10 meals/week", "Skip meals", "Premium dishes"]}
                highlighted
              />
              <SubscriptionCard
                title="Complete"
                price="?5,999/mo"
                description="Full day coverage"
                features={["15 meals/week", "Flexible address", "Priority delivery"]}
              />
            </div>
          </TabsContent>
        </Tabs>
      </section>

      <section className="container px-4 pb-16">
        <h3 className="section-title">Similar chefs</h3>
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {dishes.slice(0, 3).map((dish, index) => (
            <ChefCard
              key={dish.id}
              id={`alt-${index}`}
              name={`${chef.name} +`}
              rating={avgRating || 4.6}
              cuisineTags={[chef.specialty || "Chef"]}
              monthlyPrice="?3,999"
              image={galleryImages[index % galleryImages.length]}
            />
          ))}
        </div>
      </section>
    </Layout>
  );
};

export default ChefDetail;
