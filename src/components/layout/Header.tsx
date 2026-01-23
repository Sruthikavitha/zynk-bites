import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  UtensilsCrossed, 
  LogOut, 
  User, 
  ChefHat, 
  Truck, 
  ShieldCheck 
} from 'lucide-react';

const roleIcons = {
  customer: User,
  chef: ChefHat,
  delivery: Truck,
  admin: ShieldCheck,
};

const roleColors = {
  customer: 'bg-primary',
  chef: 'bg-chef',
  delivery: 'bg-delivery',
  admin: 'bg-admin',
};

export const Header = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const RoleIcon = user ? roleIcons[user.role] : User;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-card group-hover:shadow-card-hover transition-shadow">
            <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-xl text-foreground">ZYNK</span>
        </Link>

        <nav className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-full bg-secondary">
                <div className={`w-7 h-7 rounded-full ${roleColors[user.role]} flex items-center justify-center`}>
                  <RoleIcon className="w-4 h-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="text-muted-foreground hover:text-destructive"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </>
          ) : (
            <div className="flex gap-2">
              {location.pathname !== '/login' && (
                <Button asChild variant="ghost" size="sm">
                  <Link to="/login">Sign In</Link>
                </Button>
              )}
              {location.pathname !== '/register' && (
                <Button asChild size="sm">
                  <Link to="/register">Get Started</Link>
                </Button>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
