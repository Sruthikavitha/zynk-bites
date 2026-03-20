import { Button } from "@/components/ui/button";

interface SubscriptionCardProps {
  title: string;
  price: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  onSelect?: () => void;
}

export const SubscriptionCard = ({
  title,
  price,
  description,
  features,
  highlighted,
  onSelect,
}: SubscriptionCardProps) => {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl border bg-white p-6 shadow-soft transition-all ${
        highlighted
          ? "border-emerald-500 shadow-card-hover"
          : "border-emerald-100 hover:border-emerald-300"
      }`}
    >
      {highlighted && (
        <span className="absolute right-4 top-4 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
      <div className="mt-4 text-4xl font-bold text-emerald-700">{price}</div>
      <ul className="mt-4 space-y-2 text-sm text-slate-600">
        {features.map((feature) => (
          <li key={feature} className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {feature}
          </li>
        ))}
      </ul>
      <Button className="mt-6 w-full" onClick={onSelect}>
        Subscribe
      </Button>
    </div>
  );
};
