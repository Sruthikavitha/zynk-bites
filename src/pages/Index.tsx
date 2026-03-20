import { Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { ChefCard } from "@/components/zynk/ChefCard";
import { Search, Sparkles } from "lucide-react";

const cuisines = [
  { name: "South Indian", image: "https://images.unsplash.com/photo-1604908554302-7d8f33b41c6c?auto=format&fit=crop&w=600&q=80" },
  { name: "North Indian", image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=600&q=80" },
  { name: "Keto", image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80" },
  { name: "High Protein", image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=80" },
  { name: "Continental", image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80" },
  { name: "Vegan", image: "https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=600&q=80" },
];

const trendingChefs = [
  {
    id: "c1",
    name: "Chef Neha",
    rating: 4.9,
    cuisineTags: ["South Indian", "Healthy"],
    monthlyPrice: "?3,499",
    image: "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=800&q=80",
    badge: "Top Rated",
  },
  {
    id: "c2",
    name: "Chef Arjun",
    rating: 4.7,
    cuisineTags: ["North Indian", "Keto"],
    monthlyPrice: "?4,299",
    image: "https://images.unsplash.com/photo-1528701800489-20be3c329d80?auto=format&fit=crop&w=800&q=80",
    badge: "Trending",
  },
  {
    id: "c3",
    name: "Chef Mira",
    rating: 4.8,
    cuisineTags: ["Vegan", "Continental"],
    monthlyPrice: "?3,999",
    image: "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=800&q=80",
    badge: "New Chef",
  },
  {
    id: "c4",
    name: "Chef Rishi",
    rating: 4.6,
    cuisineTags: ["High Protein", "Fusion"],
    monthlyPrice: "?4,799",
    image: "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80",
  },
];

const Index = () => {
  return (
    <Layout>
      <section className="relative overflow-hidden bg-gradient-to-br from-white via-emerald-50 to-white">
        <div className="container px-4 py-20">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase text-emerald-700">
                <Sparkles className="h-4 w-4" />
                Subscription meals, tailored for you
              </p>
              <h1 className="mt-6 text-4xl font-semibold text-slate-900 md:text-5xl">
                Discover chefs who cook the way you crave.
              </h1>
              <p className="mt-4 text-lg text-slate-600">
                ZYNK connects you with home chefs for fresh, healthy meals on a simple subscription.
              </p>
              <div className="mt-6 flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Find your chef"
                    className="h-12 rounded-full pl-12"
                  />
                </div>
                <Button className="h-12 rounded-full px-8">Search</Button>
              </div>
              <div className="mt-6 flex gap-4">
                <Link to="/chefs" className="btn-outline">
                  Explore chefs
                </Link>
                <Link to="/subscribe" className="btn-primary">
                  Subscribe now
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -right-8 -top-8 h-56 w-56 rounded-full bg-emerald-100" />
              <div className="relative rounded-3xl border border-emerald-100 bg-white p-4 shadow-card-hover">
                <img
                  src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80"
                  alt="Chef curated meal"
                  className="h-72 w-full rounded-2xl object-cover"
                />
                <div className="mt-4 rounded-2xl bg-emerald-50 p-4">
                  <p className="text-sm font-semibold text-emerald-700">This week highlights</p>
                  <p className="text-sm text-slate-600">3 chefs near you are accepting new subscribers.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-14">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="section-title">Explore cuisines</h2>
            <p className="text-sm text-slate-500">Pick a flavor, find your chef.</p>
          </div>
        </div>
        <Carousel className="mt-8">
          <CarouselContent>
            {cuisines.map((cuisine) => (
              <CarouselItem key={cuisine.name} className="basis-3/4 sm:basis-1/2 lg:basis-1/3">
                <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-soft">
                  <img src={cuisine.image} alt={cuisine.name} className="h-48 w-full object-cover" />
                  <div className="p-4">
                    <p className="text-sm font-semibold text-slate-900">{cuisine.name}</p>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </section>

      <section className="bg-emerald-50">
        <div className="container px-4 py-16">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="section-title">Trending chefs</h2>
              <p className="text-sm text-slate-500">Hand-picked chefs with top subscriber ratings.</p>
            </div>
            <Link to="/chefs" className="btn-outline">
              View all
            </Link>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {trendingChefs.map((chef) => (
              <ChefCard key={chef.id} {...chef} />
            ))}
          </div>
        </div>
      </section>

      <section className="container px-4 py-16">
        <div className="card-base flex flex-col items-center gap-6 bg-gradient-to-r from-emerald-600 to-green-500 px-8 py-12 text-center text-white">
          <h3 className="text-3xl font-semibold">Ready to start your subscription?</h3>
          <p className="max-w-2xl text-sm text-white/90">
            Pick a chef, choose your plan, and schedule deliveries in minutes.
          </p>
          <Link to="/subscribe" className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-emerald-700">
            Subscribe now
          </Link>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
