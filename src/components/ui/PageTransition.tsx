import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { UtensilsCrossed, ChefHat } from 'lucide-react';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    // Start transition
    setIsTransitioning(true);
    
    // After transition animation, update content
    const timer = setTimeout(() => {
      setDisplayChildren(children);
      setIsTransitioning(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <>
      {/* Transition overlay */}
      <div 
        className={`fixed inset-0 z-[100] pointer-events-none transition-opacity duration-300 ${
          isTransitioning ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-white to-emerald-50" />
        
        {/* Animated utensils */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Spinning utensils */}
            <div 
              className={`transition-all duration-500 ${
                isTransitioning ? 'scale-100 opacity-100' : 'scale-50 opacity-0'
              }`}
            >
              <div className="relative w-24 h-24">
                <div className="absolute inset-0 flex items-center justify-center animate-spin" style={{ animationDuration: '1s' }}>
                  <UtensilsCrossed className="w-16 h-16 text-green-500" />
                </div>
                <div className="absolute inset-0 rounded-full border-4 border-green-200 border-t-green-500 animate-spin" />
              </div>
            </div>
            
            {/* Text */}
            <p 
              className={`text-center mt-4 text-green-700 font-medium transition-all duration-300 ${
                isTransitioning ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
              }`}
            >
              Serving up...
            </p>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className={`absolute top-10 left-10 transition-all duration-500 ${
          isTransitioning ? 'opacity-30 scale-100' : 'opacity-0 scale-50'
        }`}>
          <ChefHat className="w-12 h-12 text-green-400 animate-bounce" />
        </div>
        <div className={`absolute bottom-10 right-10 transition-all duration-500 delay-100 ${
          isTransitioning ? 'opacity-30 scale-100' : 'opacity-0 scale-50'
        }`}>
          <svg className="w-12 h-12 text-green-400 animate-bounce" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3C10.3 3 8.8 4.1 8.2 5.7C7.6 7.3 7.8 9.1 8.8 10.5L4 21H6L10.2 12.2C10.8 12.4 11.4 12.5 12 12.5C12.6 12.5 13.2 12.4 13.8 12.2L18 21H20L15.2 10.5C16.2 9.1 16.4 7.3 15.8 5.7C15.2 4.1 13.7 3 12 3ZM12 5C13.1 5 14 6.1 14 7.5C14 8.9 13.1 10 12 10C10.9 10 10 8.9 10 7.5C10 6.1 10.9 5 12 5Z"/>
          </svg>
        </div>
      </div>

      {/* Page content with fade */}
      <div 
        className={`transition-all duration-300 ${
          isTransitioning ? 'opacity-0 scale-[0.98]' : 'opacity-100 scale-100'
        }`}
      >
        {displayChildren}
      </div>
    </>
  );
};
