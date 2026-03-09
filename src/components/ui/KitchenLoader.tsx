import { UtensilsCrossed, ChefHat } from 'lucide-react';

interface KitchenLoaderProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'spoon' | 'utensils' | 'chef';
}

export const KitchenLoader = ({ 
  text = 'Preparing...', 
  size = 'md',
  variant = 'utensils' 
}: KitchenLoaderProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const containerSizes = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={`relative ${containerSizes[size]}`}>
        {/* Rotating outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-green-200 border-t-green-500 animate-spin" />
        
        {/* Inner pulsing circle */}
        <div className="absolute inset-2 rounded-full bg-gradient-to-br from-green-50 to-green-100 animate-pulse" />
        
        {/* Center icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          {variant === 'spoon' ? (
            <svg 
              className={`${sizeClasses[size]} text-green-600`} 
              viewBox="0 0 24 24" 
              fill="currentColor"
              style={{ animation: 'spoonStir 1.5s ease-in-out infinite' }}
            >
              <path d="M12 3C10.3 3 8.8 4.1 8.2 5.7C7.6 7.3 7.8 9.1 8.8 10.5L4 21H6L10.2 12.2C10.8 12.4 11.4 12.5 12 12.5C12.6 12.5 13.2 12.4 13.8 12.2L18 21H20L15.2 10.5C16.2 9.1 16.4 7.3 15.8 5.7C15.2 4.1 13.7 3 12 3ZM12 5C13.1 5 14 6.1 14 7.5C14 8.9 13.1 10 12 10C10.9 10 10 8.9 10 7.5C10 6.1 10.9 5 12 5Z"/>
            </svg>
          ) : variant === 'chef' ? (
            <ChefHat 
              className={`${sizeClasses[size]} text-green-600`}
              style={{ animation: 'chefBounce 1s ease-in-out infinite' }}
            />
          ) : (
            <UtensilsCrossed 
              className={`${sizeClasses[size]} text-green-600`}
              style={{ animation: 'utensilsRotate 2s ease-in-out infinite' }}
            />
          )}
        </div>
        
        {/* Floating particles */}
        <div className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-green-400 opacity-60" style={{ animation: 'floatParticle 2s ease-in-out infinite' }} />
        <div className="absolute top-1/2 -right-1 w-1.5 h-1.5 rounded-full bg-green-300 opacity-50" style={{ animation: 'floatParticle 2s ease-in-out infinite 0.5s' }} />
        <div className="absolute -bottom-1 left-1/4 w-1.5 h-1.5 rounded-full bg-green-500 opacity-40" style={{ animation: 'floatParticle 2s ease-in-out infinite 1s' }} />
      </div>
      
      {text && (
        <p className="text-green-700 font-medium animate-pulse">{text}</p>
      )}
    </div>
  );
};

// Full page loader
export const PageLoader = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-emerald-50">
    {/* Background decoration */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-20 left-20 w-32 h-32 rounded-full bg-green-200/20 animate-float" />
      <div className="absolute bottom-20 right-20 w-40 h-40 rounded-full bg-emerald-200/20 animate-float-slow" />
      <div className="absolute top-1/2 left-10 w-24 h-24 rounded-full bg-green-300/10 animate-float-delayed" />
    </div>
    
    <div className="relative z-10">
      <KitchenLoader text={text} size="lg" variant="utensils" />
    </div>
  </div>
);

// Inline loader for cards/sections  
export const InlineLoader = ({ text }: { text?: string }) => (
  <div className="flex items-center justify-center py-8">
    <KitchenLoader text={text} size="sm" />
  </div>
);

// Overlay loader
export const OverlayLoader = ({ text = 'Please wait...' }: { text?: string }) => (
  <div className="absolute inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-lg">
    <KitchenLoader text={text} size="md" />
  </div>
);
