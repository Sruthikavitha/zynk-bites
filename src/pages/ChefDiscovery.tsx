import { type ReactNode, useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChefCard } from "@/components/zynk/ChefCard";
import { MapPin, Search, SlidersHorizontal, Star } from "lucide-react";
import { getChefsWithRatings } from "@/services/backend";
import type { Chef, Dish } from "@/types";

const fallbackImages = [
  "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1528701800489-20be3c329d80?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=900&q=80",
];

type ChefWithData = Chef & {
  dishes: Dish[];
  avgRating?: number;
  reviewCount?: number;
};

const ChefDiscovery = () => {
  const [chefs, setChefs] = useState<ChefWithData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [selectedRating, setSelectedRating] = useState("All");
  const [selectedArea, setSelectedArea] = useState("All");

  useEffect(() => {
    const loadChefs = async () => {
      const backendChefs = await getChefsWithRatings();
      setChefs((backendChefs || []) as ChefWithData[]);
    };
    void loadChefs();
  }, []);

  const cuisineOptions = useMemo(() => {
    const values = new Set<string>();
    chefs.forEach((chef) => {
      chef.specialty?.split(",").map((item) => item.trim()).filter(Boolean).forEach((item) => values.add(item));
    });
    return ["All", ...Array.from(values).slice(0, 8)];
  }, [chefs]);

  const areaOptions = useMemo(() => {
    const values = new Set<string>();
    chefs.forEach((chef) => {
      if (chef.serviceArea) values.add(chef.serviceArea);
    });
    return ["All", ...Array.from(values).slice(0, 6)];
  }, [chefs]);

  const filteredChefs = useMemo(() => {
    return chefs.filter((chef) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        [chef.name, chef.specialty, chef.serviceArea].some((field) =>
          field?.toLowerCase().includes(query)
        );

      const chefTags = chef.specialty?.split(",").map((item) => item.trim()) || [];
      const matchesCuisine = selectedCuisine === "All" || chefTags.includes(selectedCuisine);
      const matchesArea = selectedArea === "All" || chef.serviceArea === selectedArea;
      const matchesRating =
        selectedRating === "All" ||
        (selectedRating === "4.7+" && (chef.avgRating || chef.rating || 0) >= 4.7) ||
        (selectedRating === "4.5+" && (chef.avgRating || chef.rating || 0) >= 4.5);

      return matchesQuery && matchesCuisine && matchesArea && matchesRating;
    });
  }, [chefs, searchQuery, selectedCuisine, selectedRating, selectedArea]);

  return (
    <Layout>
      <section className="bg-[linear-gradient(180deg,#f7fff8_0%,#ffffff_100%)]">
        <div className="container px-4 py-10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-emerald-600">Chef Listing</p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Find a chef for your monthly routine</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                Filter by cuisine, service area, and rating, then compare weekly menus and subscription plans.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard value={`${chefs.length}+`} label="Approved chefs" />
              <StatCard value="30 min" label="Average checkout time" />
              <StatCard value="4.7/5" label="Average member rating" />
            </div>
          </div>

          <div className="mt-8 rounded-[32px] border border-emerald-100 bg-white p-5 shadow-soft">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_repeat(3,minmax(0,0.8fr))]">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                <Input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search by chef, cuisine, or locality"
                  className="h-12 rounded-full pl-12"
                />
              </div>
              <FilterRow
                icon={<SlidersHorizontal className="h-4 w-4" />}
                options={cuisineOptions}
                value={selectedCuisine}
                onChange={setSelectedCuisine}
              />
              <FilterRow
                icon={<Star className="h-4 w-4" />}
                options={["All", "4.7+", "4.5+"]}
                value={selectedRating}
                onChange={setSelectedRating}
              />
              <FilterRow
                icon={<MapPin className="h-4 w-4" />}
                options={areaOptions}
                value={selectedArea}
                onChange={setSelectedArea}
              />
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {[selectedCuisine, selectedRating, selectedArea]
                .filter((item) => item !== "All")
                .map((item) => (
                  <Badge key={item} className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                    {item}
                  </Badge>
                ))}
              {(selectedCuisine !== "All" || selectedRating !== "All" || selectedArea !== "All") && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-slate-500"
                  onClick={() => {
                    setSelectedCuisine("All");
                    setSelectedRating("All");
                    setSelectedArea("All");
                  }}
                >
                  Clear filters
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 pb-14">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredChefs.map((chef, index) => {
            const tags = chef.specialty
              ? chef.specialty.split(",").map((tag) => tag.trim()).filter(Boolean)
              : ["Home Chef"];

            return (
              <ChefCard
                key={chef.id}
                id={chef.id}
                name={chef.name}
                rating={chef.avgRating || chef.rating || 4.6}
                cuisineTags={[...(chef.serviceArea ? [chef.serviceArea] : []), ...tags].slice(0, 3)}
                monthlyPrice={`From INR ${chef.avgRating && chef.avgRating >= 4.7 ? "4,499" : "3,999"}`}
                image={fallbackImages[index % fallbackImages.length]}
                badge={chef.avgRating && chef.avgRating >= 4.8 ? "Highly Rated" : undefined}
              />
            );
          })}
        </div>

        {filteredChefs.length === 0 && (
          <div className="mt-12 rounded-[28px] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
            <p className="text-lg font-semibold text-slate-900">No approved chefs match these filters yet</p>
            <p className="mt-2 text-sm text-slate-500">Only admin-approved chefs appear here. Try widening the filters or approve a chef from the admin panel.</p>
          </div>
        )}
      </section>
    </Layout>
  );
};

const FilterRow = ({
  icon,
  options,
  value,
  onChange,
}: {
  icon: ReactNode;
  options: string[];
  value: string;
  onChange: (next: string) => void;
}) => (
  <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4">
    <span className="text-slate-400">{icon}</span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-12 w-full bg-transparent text-sm text-slate-700 outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </div>
);

const StatCard = ({ value, label }: { value: string; label: string }) => (
  <div className="rounded-2xl border border-emerald-100 bg-white px-4 py-4 shadow-soft">
    <p className="text-2xl font-semibold text-slate-900">{value}</p>
    <p className="mt-1 text-sm text-slate-500">{label}</p>
  </div>
);

export default ChefDiscovery;
