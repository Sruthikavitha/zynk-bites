import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { User, ChefHat, Eye, EyeOff, Home, Briefcase, MapPin, ChevronRight, ChevronLeft } from 'lucide-react';
import type { Address } from '@/types';

type RegistrationType = 'customer' | 'chef';
type RegistrationStep = 'basic' | 'addresses' | 'kitchen';

const emptyAddress: Address = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
};

const AddressForm = ({ 
  address, 
  setAddress, 
  title, 
  icon: Icon 
}: { 
  address: Address; 
  setAddress: (a: Address) => void; 
  title: string; 
  icon: typeof Home;
}) => {
  return (
    <div className="space-y-3 p-5 rounded-sm bg-secondary border border-gray-200">
      <div className="flex items-center gap-2 font-chef text-xs tracking-wider text-charcoal">
        <Icon className="w-4 h-4 text-green-500" />
        {title}
      </div>
      <Input
        placeholder="Street address"
        value={address.street}
        onChange={(e) => setAddress({ ...address, street: e.target.value })}
        type="text"
        className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
      />
      <div className="grid grid-cols-2 gap-2">
        <Input
          placeholder="City"
          value={address.city}
          onChange={(e) => setAddress({ ...address, city: e.target.value })}
          type="text"
          className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
        />
        <Input
          placeholder="State"
          value={address.state}
          onChange={(e) => setAddress({ ...address, state: e.target.value })}
          type="text"
          className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
        />
      </div>
      <Input
        placeholder="ZIP Code"
        value={address.zipCode}
        onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
        type="text"
        className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
      />
    </div>
  );
};

export const Register = () => {
  const [type, setType] = useState<RegistrationType>('customer');
  const [step, setStep] = useState<RegistrationStep>('basic');
  
  // Basic info
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Customer addresses
  const [homeAddress, setHomeAddress] = useState<Address>({ ...emptyAddress });
  const [workAddress, setWorkAddress] = useState<Address>({ ...emptyAddress });
  
  // Chef info
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [kitchenLocation, setKitchenLocation] = useState<Address>({ ...emptyAddress });
  const [serviceArea, setServiceArea] = useState('');
  const [deliverySlots, setDeliverySlots] = useState<string[]>(['lunch', 'dinner']);
  
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'customer') {
      setStep('addresses');
    } else {
      setStep('kitchen');
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === 'customer') {
        const response = api.registerCustomer(
          email, 
          password, 
          name, 
          phone, 
          homeAddress.street ? homeAddress : undefined,
          workAddress.street ? workAddress : undefined
        );
        if (response.success && response.data) {
          login(response.data);
          toast({ title: 'Welcome to ZYNK!', description: 'Your account has been created.' });
          navigate('/dashboard');
        } else {
          toast({ title: 'Error', description: response.error, variant: 'destructive' });
        }
      } else {
        const response = api.registerChef(
          email, 
          password, 
          name, 
          specialty,
          bio,
          kitchenLocation.street ? kitchenLocation : undefined,
          serviceArea,
          deliverySlots
        );
        if (response.success && response.data) {
          login(response.data);
          toast({ 
            title: 'Registration Complete!', 
            description: 'You can now add your dishes. Orders will appear once you\'re approved.' 
          });
          navigate('/dashboard');
        } else {
          toast({ title: 'Error', description: response.error, variant: 'destructive' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDeliverySlot = (slot: string) => {
    if (deliverySlots.includes(slot)) {
      if (deliverySlots.length > 1) {
        setDeliverySlots(deliverySlots.filter(s => s !== slot));
      }
    } else {
      setDeliverySlots([...deliverySlots, slot]);
    }
  };

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-secondary to-background py-12 px-4">
        <div className="w-full max-w-lg">
          <div className="text-center mb-8">
            <p className="font-chef text-xs tracking-widest text-green-500 mb-4">
              {step === 'basic' && 'JOIN THE KITCHEN'}
              {step === 'addresses' && 'DELIVERY SETUP'}
              {step === 'kitchen' && 'CHEF PROFILE'}
            </p>
            <h1 className="font-display text-3xl font-bold text-charcoal">
              {step === 'basic' && 'Create Account'}
              {step === 'addresses' && 'Delivery Addresses'}
              {step === 'kitchen' && 'Kitchen Setup'}
            </h1>
            <div className="w-12 h-0.5 bg-charcoal mx-auto mt-4" />
            <p className="mt-4 text-muted-foreground">
              {step === 'basic' && 'Join ZYNK and experience culinary excellence'}
              {step === 'addresses' && 'Add your locations for seamless delivery'}
              {step === 'kitchen' && 'Tell us about your culinary expertise'}
            </p>
          </div>

          <Card className="chef-card border border-gray-200 shadow-kitchen">
            <CardContent className="pt-8 pb-6">
              {step === 'basic' && (
                <>
                  {/* Role Toggle - Professional Style */}
                  <div className="flex gap-0 mb-8 border border-gray-200 rounded-sm overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setType('customer')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 font-chef text-xs tracking-wider transition-all ${
                        type === 'customer' 
                          ? 'bg-charcoal text-white' 
                          : 'bg-white text-charcoal hover:bg-gray-50'
                      }`}
                    >
                      <User className="w-4 h-4" />
                      CUSTOMER
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('chef')}
                      className={`flex-1 flex items-center justify-center gap-2 py-3 font-chef text-xs tracking-wider transition-all ${
                        type === 'chef' 
                          ? 'bg-charcoal text-white' 
                          : 'bg-white text-charcoal hover:bg-gray-50'
                      }`}
                    >
                      <ChefHat className="w-4 h-4" />
                      CHEF PARTNER
                    </button>
                  </div>

                  <form onSubmit={handleBasicSubmit} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="font-chef text-xs tracking-wider text-charcoal">FULL NAME</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Doe"
                        required
                        className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="font-chef text-xs tracking-wider text-charcoal">EMAIL</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        required
                        className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password" className="font-chef text-xs tracking-wider text-charcoal">PASSWORD</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-charcoal"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="font-chef text-xs tracking-wider text-charcoal">PHONE</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91-9876543210"
                        className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>

                    {type === 'chef' && (
                      <div className="space-y-2">
                        <Label htmlFor="specialty" className="font-chef text-xs tracking-wider text-charcoal">SPECIALTY CUISINE</Label>
                        <Input
                          id="specialty"
                          value={specialty}
                          onChange={(e) => setSpecialty(e.target.value)}
                          placeholder="North Indian, Continental..."
                          className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full btn-chef mt-6">
                      CONTINUE
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </form>
                </>
              )}

            {step === 'addresses' && (
              <form onSubmit={handleFinalSubmit} className="space-y-5">
                <AddressForm 
                  address={homeAddress} 
                  setAddress={setHomeAddress} 
                  title="HOME ADDRESS" 
                  icon={Home} 
                />
                
                <AddressForm 
                  address={workAddress} 
                  setAddress={setWorkAddress} 
                  title="WORK ADDRESS" 
                  icon={Briefcase} 
                />

                <p className="text-xs text-muted-foreground text-center font-chef tracking-wider">
                  SWITCH BETWEEN ADDRESSES DAILY UNTIL 8 PM
                </p>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep('basic')} className="flex-1 font-chef tracking-wider text-xs">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    BACK
                  </Button>
                  <Button type="submit" className="flex-1 btn-green" disabled={isLoading}>
                    {isLoading ? 'CREATING...' : 'CREATE ACCOUNT'}
                  </Button>
                </div>
              </form>
            )}

            {step === 'kitchen' && (
              <form onSubmit={handleFinalSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="bio" className="font-chef text-xs tracking-wider text-charcoal">BIO (OPTIONAL)</Label>
                  <Input
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell customers about yourself..."
                    className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-3 p-5 rounded-sm bg-secondary border border-gray-200">
                  <div className="flex items-center gap-2 font-chef text-xs tracking-wider text-charcoal">
                    <MapPin className="w-4 h-4 text-green-500" />
                    KITCHEN LOCATION
                  </div>
                  <Input
                    placeholder="Street address"
                    value={kitchenLocation.street}
                    onChange={(e) => setKitchenLocation({ ...kitchenLocation, street: e.target.value })}
                    type="text"
                    className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="City"
                      value={kitchenLocation.city}
                      onChange={(e) => setKitchenLocation({ ...kitchenLocation, city: e.target.value })}
                      type="text"
                      className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                    <Input
                      placeholder="State"
                      value={kitchenLocation.state}
                      onChange={(e) => setKitchenLocation({ ...kitchenLocation, state: e.target.value })}
                      type="text"
                      className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <Input
                    placeholder="ZIP Code"
                    value={kitchenLocation.zipCode}
                    onChange={(e) => setKitchenLocation({ ...kitchenLocation, zipCode: e.target.value })}
                    type="text"
                    className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="serviceArea" className="font-chef text-xs tracking-wider text-charcoal">SERVICE AREA</Label>
                  <Input
                    id="serviceArea"
                    value={serviceArea}
                    onChange={(e) => setServiceArea(e.target.value)}
                    placeholder="e.g., Koramangala, HSR Layout, Indiranagar"
                    className="rounded-sm border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-chef text-xs tracking-wider text-charcoal">DELIVERY SLOTS</Label>
                  <div className="flex gap-0 border border-gray-200 rounded-sm overflow-hidden">
                    {['lunch', 'dinner'].map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => toggleDeliverySlot(slot)}
                        className={`flex-1 py-3 font-chef text-xs tracking-wider uppercase transition-all ${
                          deliverySlots.includes(slot)
                            ? 'bg-charcoal text-white'
                            : 'bg-white text-charcoal hover:bg-gray-50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep('basic')} className="flex-1 font-chef tracking-wider text-xs">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    BACK
                  </Button>
                  <Button type="submit" className="flex-1 btn-green" disabled={isLoading}>
                    {isLoading ? 'SUBMITTING...' : 'COMPLETE REGISTRATION'}
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-green-500 hover:text-green-500-dark font-medium">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </Layout>
);
};
