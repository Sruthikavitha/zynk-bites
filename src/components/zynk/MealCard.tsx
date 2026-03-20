import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/zynk/LazyImage";

interface MealCardProps {
  image: string;
  name: string;
  calories: string;
  tag?: string;
  onSkip?: () => void;
  onSwap?: () => void;
}

export const MealCard = ({
  image,
  name,
  calories,
  tag,
  onSkip,
  onSwap,
}: MealCardProps) => {
  return (
    <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-soft">
      <div className="h-40 w-full">
        <LazyImage src={image} alt={name} className="h-40 w-full" />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="text-base font-semibold text-slate-900">{name}</h4>
            <p className="text-xs text-slate-500">{calories}</p>
          </div>
          {tag && <Badge className="bg-emerald-50 text-emerald-700">{tag}</Badge>}
        </div>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm" onClick={onSkip}>
            Skip
          </Button>
          <Button size="sm" onClick={onSwap}>
            Swap
          </Button>
        </div>
      </div>
    </div>
  );
};
