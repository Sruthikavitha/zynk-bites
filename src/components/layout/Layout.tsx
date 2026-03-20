import { ReactNode } from 'react';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { UtensilsCrossed } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background pb-16 md:pb-0">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {/* Professional Kitchen Footer */}
      <footer className="bg-charcoal border-t border-charcoal-light">
        <div className="container px-4 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-green-500 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-xl text-white tracking-tight">ZYNK</span>
            </div>
            <div className="flex items-center gap-8">
              <a href="#" className="font-chef text-xs tracking-widest text-steel hover:text-white transition-colors">MENU</a>
              <a href="#" className="font-chef text-xs tracking-widest text-steel hover:text-white transition-colors">CHEFS</a>
              <a href="#" className="font-chef text-xs tracking-widest text-steel hover:text-white transition-colors">ABOUT</a>
              <a href="#" className="font-chef text-xs tracking-widest text-steel hover:text-white transition-colors">CONTACT</a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-steel/20 text-center">
            <p className="font-chef text-xs tracking-widest text-steel">© 2024 ZYNK KITCHEN · CULINARY EXCELLENCE DELIVERED</p>
          </div>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
};
