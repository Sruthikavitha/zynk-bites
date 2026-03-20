import { useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { ChefCard } from "@/components/zynk/ChefCard";
import { Search } from "lucide-react";
import * as api from "@/services/api";
import { getChefsWithRatings } from "@/services/backend";

const fallbackImages = [
  "https://images.unsplash.com/photo-1528712306091-ed0763094c98?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1528701800489-20be3c329d80?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=800&q=80",
];

type ChefWithData = ReturnType<typeof api.getApprovedChefsWithRatings>["data"] extends (infer T)[] | undefined
  ? T
  : never;

const ChefDiscovery = () => {
  const [chefs, setChefs] = useState<ChefWithData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const loadChefs = async () => {
      const backendChefs = await getChefsWithRatings();
      if (backendChefs) {
        setChefs(backendChefs as ChefWithData[]);
        return;
      }
      const response = api.getApprovedChefsWithRatings();
      if (response.success && response.data) {
        setChefs(response.data);
      }
    };
    void loadChefs();
  }, []);

  const filteredChefs = useMemo(() => {
    if (!searchQuery) return chefs;
    const query = searchQuery.toLowerCase();
    return chefs.filter((chef) =>
      [chef.name, chef.specialty, chef.serviceArea].some((field) =>
        field?.toLowerCase().includes(query)
      )
    );
  }, [chefs, searchQuery]);

  return (
    <Layout>
      <section className="bg-emerald-50">
        <div className="container px-4 py-12">
          <h1 className="section-title">Chef Discovery</h1>
          <p className="mt-2 text-sm text-slate-500">
            Browse chefs, compare plans, and subscribe in minutes.
          </p>
          <div className="mt-6 max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by chef, cuisine, or location"
                className="h-12 rounded-full pl-12"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container px-4 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredChefs.map((chef, index) => {
            const tags = chef.specialty
              ? chef.specialty.split(",").map((tag) => tag.trim()).filter(Boolean)
              : ["Home Chef"];
            return (
              <ChefCard
                key={chef.id}
                id={chef.id}
                name={chef.name}
                rating={chef.avgRating || 4.6}
                cuisineTags={tags.slice(0, 3)}
                monthlyPrice="?3,999"
                image={fallbackImages[index % fallbackImages.length]}
                badge={chef.avgRating && chef.avgRating >= 4.7 ? "Top Rated" : undefined}
              />
            );
          })}
        </div>
        {filteredChefs.length === 0 && (
          <p className="mt-10 text-center text-sm text-slate-500">No chefs match your search.</p>
        )}
      </section>
    </Layout>
  );
};

export default ChefDiscovery;
