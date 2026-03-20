import { Link, useLocation } from "react-router-dom";
import { Home, ChefHat, LayoutDashboard, User } from "lucide-react";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/chefs", label: "Chefs", icon: ChefHat },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/profile", label: "Profile", icon: User },
];

export const BottomNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-emerald-100 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md items-center justify-between px-6 py-3">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex flex-col items-center gap-1 text-xs ${
                isActive ? "text-emerald-700" : "text-slate-500"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
