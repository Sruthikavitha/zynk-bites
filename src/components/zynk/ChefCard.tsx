import { Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/zynk/LazyImage";

interface ChefCardProps {
  id: string;
  name: string;
  rating: number;
  cuisineTags: string[];
  monthlyPrice: string;
  image: string;
  badge?: string;
}

export const ChefCard = ({
  id,
  name,
  rating,
  cuisineTags,
  monthlyPrice,
  image,
  badge,
}: ChefCardProps) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
      <div className="relative h-44 w-full">
        <LazyImage src={image} alt={name} className="h-44 w-full" />
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
            {badge}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{name}</h3>
            <div className="mt-1 flex items-center gap-1 text-sm text-slate-600">
              <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
              <span>{rating.toFixed(1)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500">From</p>
            <p className="text-base font-semibold text-emerald-700">{monthlyPrice}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {cuisineTags.map((tag) => (
            <Badge key={tag} variant="secondary" className="bg-emerald-50 text-emerald-700">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-xs text-slate-500">Subscription meals</p>
          <Button asChild size="sm" className="hidden group-hover:inline-flex">
            <Link to={`/chef/${id}`}>View Menu</Link>
          </Button>
        </div>
      </div>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-emerald-500 to-green-400" />
      </div>
    </div>
  );
};
