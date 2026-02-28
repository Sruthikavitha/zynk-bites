import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Leaf, Heart, ChevronRight } from 'lucide-react';

type FoodPreference = 'vegetarian' | 'non-vegetarian' | 'vegan' | 'keto' | 'gluten-free';

const preferences: { id: FoodPreference; label: string; icon: string }[] = [
  { id: 'vegetarian', label: 'Vegetarian', icon: '🥬' },
  { id: 'non-vegetarian', label: 'Non-Vegetarian', icon: '🍗' },
  { id: 'vegan', label: 'Vegan', icon: '🌱' },
  { id: 'keto', label: 'Keto', icon: '🥑' },
  { id: 'gluten-free', label: 'Gluten-Free', icon: '🌾' },
];

export const CustomerOnboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [preference, setPreference] = useState<FoodPreference>('vegetarian');
  const [isLoading, setIsLoading] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Not supported', description: 'Geolocation is not supported by your browser', variant: 'destructive' });
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setDetectingLocation(false);
        toast({ title: 'Location detected', description: 'Your coordinates have been saved' });
      },
      (error) => {
        setDetectingLocation(false);
        toast({ title: 'Location error', description: error.message, variant: 'destructive' });
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // TODO: Replace with actual API call when backend is connected
      // POST /api/auth/profile (authenticated)
      // { address, pincode, lat, lng, preference }
      
      // For now, store in localStorage as part of the mock
      if (user) {
        const profileData = {
          userId: user.id,
          address,
          pincode,
          lat: lat ? parseFloat(lat) : null,
          lng: lng ? parseFloat(lng) : null,
          preference,
        };
        localStorage.setItem(`zynk_customer_profile_${user.id}`, JSON.stringify(profileData));
      }

      toast({ title: 'Profile complete!', description: 'Welcome to your personal kitchen.' });
      navigate('/customer/home');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-lg py-12 px-4">
        <Card className="animate-fade-in shadow-elevated">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="font-display text-2xl">Complete Your Profile</CardTitle>
            <CardDescription>Help us personalize your health kitchen experience</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Address */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  Primary Delivery Address
                </Label>
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full street address"
                  required
                />
                <Input
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="Pincode"
                  required
                  maxLength={10}
                />
              </div>

              {/* Location */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Coordinates (optional)</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={detectLocation}
                    disabled={detectingLocation}
                  >
                    {detectingLocation ? 'Detecting...' : '📍 Auto-detect'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="Latitude"
                    type="number"
                    step="any"
                  />
                  <Input
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="Longitude"
                    type="number"
                    step="any"
                  />
                </div>
              </div>

              {/* Food Preference */}
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-primary" />
                  Food Preference
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {preferences.map((pref) => (
                    <button
                      key={pref.id}
                      type="button"
                      onClick={() => setPreference(pref.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        preference === pref.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <span className="text-lg mr-2">{pref.icon}</span>
                      <span className="text-sm font-medium">{pref.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Start My Journey'}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default CustomerOnboarding;
