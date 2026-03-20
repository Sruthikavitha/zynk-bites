import { Star } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface ReviewCardProps {
  name: string;
  rating: number;
  comment: string;
}

export const ReviewCard = ({ name, rating, comment }: ReviewCardProps) => {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback className="bg-emerald-100 text-emerald-700">
            {name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-slate-900">{name}</p>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Star className="h-4 w-4 fill-emerald-500 text-emerald-500" />
            {rating.toFixed(1)}
          </div>
        </div>
      </div>
      <p className="mt-3 text-sm text-slate-600">{comment}</p>
    </div>
  );
};
