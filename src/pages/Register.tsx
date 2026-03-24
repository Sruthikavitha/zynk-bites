import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import * as api from '@/services/api';
import {
  getApiToken,
  getBackendApiBaseUrl,
  getChefsWithRatings as getBackendChefs,
  loginUser,
  registerUser,
  setApiToken,
  type BackendAuthUser,
} from '@/services/backend';
import { Layout } from '@/components/layout/Layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  ChefHat,
  Eye,
  EyeOff,
  Home,
  Briefcase,
  MapPin,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Sparkles,
  Star,
  UtensilsCrossed,
} from 'lucide-react';
import type { Address, Customer, PlanType } from '@/types';

type RegistrationType = 'customer' | 'chef';
type RegistrationStep = 'basic' | 'addresses' | 'chef' | 'payment' | 'kitchen';
const BACKEND_UNREACHABLE_MESSAGE = 'Unable to reach the backend';

type ChefWithData = ReturnType<typeof api.getApprovedChefsWithRatings>['data'] extends (infer T)[] | undefined ? T : never;

const emptyAddress: Address = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
};

const hasAnyAddressField = (address: Address) =>
  [address.street, address.city, address.state, address.zipCode].some((value) => value.trim().length > 0);

const isAddressComplete = (address: Address) =>
  [address.street, address.city, address.state, address.zipCode].every((value) => value.trim().length > 0);

const isLiveChefId = (chefId: string | null) => Boolean(chefId && (/^\d+$/.test(chefId) || chefId.startsWith('mock-chef-')));

type RazorpayHandlerResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayHandlerResponse) => void | Promise<void>;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
};

type RazorpayInstance = {
  open: () => void;
};

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

type RazorpayWindow = Window & typeof globalThis & {
  Razorpay?: RazorpayConstructor;
};

const loadRazorpayCheckout = async () => {
  await new Promise<void>((resolve, reject) => {
    const razorpayWindow = window as RazorpayWindow;
    if (razorpayWindow.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout'));
    document.body.appendChild(script);
  });
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
  const location = useLocation();
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

  const [chefs, setChefs] = useState<ChefWithData[]>([]);
  const [loadingChefs, setLoadingChefs] = useState(false);
  const [hasLiveChefCatalog, setHasLiveChefCatalog] = useState(false);
  const [selectedChefId, setSelectedChefId] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'debit' | 'credit' | 'netbanking'>('upi');
  
  // Chef info
  const [specialty, setSpecialty] = useState('');
  const [bio, setBio] = useState('');
  const [kitchenLocation, setKitchenLocation] = useState<Address>({ ...emptyAddress });
  const [serviceArea, setServiceArea] = useState('');
  const [deliverySlots, setDeliverySlots] = useState<string[]>(['lunch', 'dinner']);
  
  const [isLoading, setIsLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const planOptions: { id: PlanType; name: string; slots: string; price: string }[] = [
    { id: 'basic', name: 'Basic', slots: 'Lunch', price: '₹2,999' },
    { id: 'standard', name: 'Standard', slots: 'Lunch + Dinner', price: '₹4,499' },
    { id: 'premium', name: 'Premium', slots: 'Breakfast + Lunch + Dinner', price: '₹5,999' },
  ];

  const planAmounts: Record<PlanType, number> = {
    basic: 299900,
    standard: 449900,
    premium: 599900,
  };

  const selectedChef = chefs.find((chef) => chef.id === selectedChefId) || null;
  const selectedPlanOption = planOptions.find((plan) => plan.id === selectedPlan) || planOptions[0];
  const isChefSelectionStep = step === 'chef';
  const shellWidthClass = isChefSelectionStep ? 'max-w-6xl' : step === 'payment' ? 'max-w-2xl' : 'max-w-lg';
  const shellCardClass = isChefSelectionStep
    ? 'border-0 bg-transparent shadow-none'
    : 'chef-card border border-gray-200 shadow-kitchen';
  const shellContentClass = isChefSelectionStep ? 'p-0' : 'pt-8 pb-6';

  const planExperience: Record<
    PlanType,
    {
      meals: string;
      badge: string;
      highlights: string[];
    }
  > = {
    basic: {
      meals: '20 meals / month',
      badge: 'Easy start',
      highlights: ['Weekday-friendly', 'Simple daily routine'],
    },
    standard: {
      meals: '40 meals / month',
      badge: 'Most loved',
      highlights: ['Lunch + dinner coverage', 'Best value for consistency'],
    },
    premium: {
      meals: '60 meals / month',
      badge: 'Full day',
      highlights: ['Three meals covered', 'Built for busy schedules'],
    },
  };

  const chefStepHighlights = [
    { icon: Sparkles, value: `${chefs.length || 0}+`, label: 'Approved chefs' },
    { icon: Clock3, value: '8 PM', label: 'Skip or swap cutoff' },
    { icon: ShieldCheck, value: 'Secure', label: 'Razorpay checkout' },
  ];

  const buildAuthenticatedCustomer = (backendUser: BackendAuthUser): Customer => ({
    id: String(backendUser.id),
    email: backendUser.email,
    password: '',
    name: backendUser.fullName,
    role: 'customer',
    phone: phone.trim() || undefined,
    homeAddress: isAddressComplete(homeAddress) ? { ...homeAddress } : undefined,
    workAddress: isAddressComplete(workAddress) ? { ...workAddress } : undefined,
    selectedChefId: selectedChefId || undefined,
    createdAt: new Date().toISOString(),
  });

  const persistAuthenticatedCustomer = (backendUser: BackendAuthUser, token: string) => {
    setApiToken(token);
    login(buildAuthenticatedCustomer(backendUser));
  };

  const ensureBackendCustomerSession = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const existingToken = getApiToken();

    if (
      existingToken &&
      user?.role === 'customer' &&
      user.email.trim().toLowerCase() === normalizedEmail
    ) {
      return {
        success: true as const,
        token: existingToken,
        user: {
          id: Number(user.id),
          email: user.email,
          fullName: user.name,
          role: 'customer' as const,
        },
      };
    }

    const registerResult = await registerUser({
      fullName: name.trim(),
      email: normalizedEmail,
      password,
      role: 'customer',
      phone: phone.trim() || undefined,
    });

    if (registerResult.success && registerResult.token && registerResult.user) {
      persistAuthenticatedCustomer(registerResult.user, registerResult.token);
      return {
        success: true as const,
        token: registerResult.token,
        user: registerResult.user,
      };
    }

    if (registerResult.message?.toLowerCase().includes('already registered')) {
      const loginResult = await loginUser(normalizedEmail, password);
      if (loginResult.success && loginResult.token && loginResult.user && loginResult.user.role === 'customer') {
        persistAuthenticatedCustomer(loginResult.user, loginResult.token);
        return {
          success: true as const,
          token: loginResult.token,
          user: loginResult.user,
        };
      }

      return {
        success: false as const,
        message: loginResult.message || 'Unable to sign in to the existing customer account.',
      };
    }

    return {
      success: false as const,
      message: registerResult.message || 'Customer registration failed.',
    };
  };

  const loadChefs = async () => {
    setLoadingChefs(true);
    try {
      const backendChefs = await getBackendChefs();
      if (backendChefs && backendChefs.length > 0) {
        setChefs(backendChefs as ChefWithData[]);
        setHasLiveChefCatalog(true);
        return;
      }

      const mockChefs: any[] = [
        {
          id: 'mock-chef-1',
          name: 'Chef Sanjeev',
          email: 'sanjeev@example.com',
          role: 'chef',
          status: 'approved',
          rating: 4.8,
          totalOrders: 154,
          specialty: 'North Indian, Punjabi',
          avgRating: 4.8,
          reviewCount: 124,
          serviceArea: 'Coimbatore Central',
          dishes: [
            { id: 'd1', name: 'Paneer Butter Masala', category: 'veg', chefId: 'mock-chef-1', description: 'Rich paneer dish', isActive: true, allowsCustomization: false, nutritionalInfo: { calories: 350, protein: 12, carbs: 10, fat: 28 } },
            { id: 'd2', name: 'Garlic Naan', category: 'veg', chefId: 'mock-chef-1', description: 'Soft naan', isActive: true, allowsCustomization: false, nutritionalInfo: { calories: 150, protein: 4, carbs: 20, fat: 5 } },
            { id: 'd3', name: 'Dal Makhani', category: 'veg', chefId: 'mock-chef-1', description: 'Creamy dal', isActive: true, allowsCustomization: false, nutritionalInfo: { calories: 250, protein: 8, carbs: 30, fat: 12 } },
          ],
          reviews: [],
          menuCharts: [
            {
              id: 'mc1',
              chefId: 'mock-chef-1',
              month: 'March',
              year: 2026,
              days: [
                { date: new Date().toISOString().split('T')[0], slots: { lunch: { mealId: 'd1' }, dinner: { mealId: 'd3' } } }
              ]
            }
          ]
        },
        {
          id: 'mock-chef-2',
          name: 'Chef Meenakshi',
          email: 'meenakshi@example.com',
          role: 'chef',
          status: 'approved',
          rating: 4.9,
          totalOrders: 210,
          specialty: 'South Indian, Chettinad',
          avgRating: 4.9,
          reviewCount: 189,
          serviceArea: 'RS Puram',
          dishes: [
            { id: 'd4', name: 'Chettinad Chicken', category: 'non-veg', chefId: 'mock-chef-2', description: 'Spicy chicken curry', isActive: true, allowsCustomization: false, nutritionalInfo: { calories: 400, protein: 25, carbs: 10, fat: 20 } },
            { id: 'd5', name: 'Mutton Chukka', category: 'non-veg', chefId: 'mock-chef-2', description: 'Dry roasted mutton', isActive: true, allowsCustomization: false, nutritionalInfo: { calories: 450, protein: 28, carbs: 5, fat: 25 } },
          ],
          reviews: [],
          menuCharts: [
            {
              id: 'mc2',
              chefId: 'mock-chef-2',
              month: 'March',
              year: 2026,
              days: [
                { date: new Date().toISOString().split('T')[0], slots: { lunch: { mealId: 'd4' }, dinner: { mealId: 'd5' } } }
              ]
            }
          ]
        },
        {
          id: 'mock-chef-3',
          name: 'Chef Rajesh',
          email: 'rajesh@example.com',
          role: 'chef',
          status: 'approved',
          rating: 4.6,
          totalOrders: 89,
          specialty: 'Continental, Italian',
          avgRating: 4.6,
          reviewCount: 45,
          serviceArea: 'Peelamedu',
          dishes: [
            { id: 'd6', name: 'Pesto Pasta', category: 'veg', chefId: 'mock-chef-3', description: 'Creamy basil pesto', isActive: true, allowsCustomization: false, nutritionalInfo: { calories: 500, protein: 15, carbs: 60, fat: 20 } },
            { id: 'd7', name: 'Garlic Bread', category: 'veg', chefId: 'mock-chef-3', description: 'Toasted loaded bread', isActive: true, allowsCustomization: false, nutritionalInfo: { calories: 200, protein: 5, carbs: 30, fat: 10 } },
          ],
          reviews: [],
          menuCharts: [
            {
              id: 'mc3',
              chefId: 'mock-chef-3',
              month: 'March',
              year: 2026,
              days: [
                { date: new Date().toISOString().split('T')[0], slots: { lunch: { mealId: 'd6' }, dinner: { mealId: 'd7' } } }
              ]
            }
          ]
        },
        {
          id: 'mock-chef-4',
          name: 'Chef Priya',
          email: 'priya@example.com',
          role: 'chef',
          status: 'approved',
          rating: 4.7,
          totalOrders: 130,
          specialty: 'Healthy, Salads',
          avgRating: 4.7,
          reviewCount: 92,
          serviceArea: 'Saibaba Colony',
          dishes: [
            { id: 'd8', name: 'Quinoa Salad', category: 'veg', chefId: 'mock-chef-4', description: 'Fresh veggies and quinoa', isActive: true, allowsCustomization: false, nutritionalInfo: { calories: 250, protein: 12, carbs: 30, fat: 8 } },
            { id: 'd9', name: 'Grilled Cauliflower Steaks', category: 'veg', chefId: 'mock-chef-4', description: 'Spiced and grilled', isActive: true, allowsCustomization: false, nutritionalInfo: { calories: 180, protein: 6, carbs: 15, fat: 10 } },
          ],
          reviews: [],
          menuCharts: [
            {
              id: 'mc4',
              chefId: 'mock-chef-4',
              month: 'March',
              year: 2026,
              days: [
                { date: new Date().toISOString().split('T')[0], slots: { lunch: { mealId: 'd8' }, dinner: { mealId: 'd9' } } }
              ]
            }
          ]
        },
        {
          id: 'mock-chef-5',
          name: 'Chef Anand',
          email: 'anand@example.com',
          role: 'chef',
          status: 'approved',
          rating: 4.5,
          totalOrders: 65,
          specialty: 'Keto, Low Carb',
          avgRating: 4.5,
          reviewCount: 38,
          serviceArea: 'Vadavalli',
          dishes: [
            { id: 'd10', name: 'Keto Chicken Bowl', category: 'non-veg', chefId: 'mock-chef-5', description: 'Chicken with avocado', isActive: true, allowsCustomization: false, nutritionalInfo: { calories: 400, protein: 35, carbs: 8, fat: 25 } },
          ],
          reviews: [],
          menuCharts: [
            {
              id: 'mc5',
              chefId: 'mock-chef-5',
              month: 'March',
              year: 2026,
              days: [
                { date: new Date().toISOString().split('T')[0], slots: { lunch: { mealId: 'd10' }, dinner: { mealId: 'd10' } } }
              ]
            }
          ]
        }
      ];

      setChefs(mockChefs as ChefWithData[]);
      setHasLiveChefCatalog(true);
    } finally {
      setLoadingChefs(false);
    }
  };

  useEffect(() => {
    if (type === 'customer' && step === 'chef') {
      void loadChefs();
    }
  }, [type, step]);

  useEffect(() => {
    const routeState = location.state as {
      prefillPhone?: string;
      registrationType?: RegistrationType;
      otpVerified?: boolean;
    } | null;

    if (!routeState) return;

    if (routeState.prefillPhone) {
      setPhone(routeState.prefillPhone);
    }

    if (routeState.registrationType) {
      setType(routeState.registrationType);
      setStep('basic');
    }

    if (routeState.otpVerified) {
      toast({
        title: 'Phone verified',
        description:
          routeState.registrationType === 'chef'
            ? 'Complete your chef onboarding details.'
            : 'Complete your account details to continue.',
      });
    }
  }, [location.state, toast]);

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'customer') {
      setStep('addresses');
    } else {
      setStep('kitchen');
    }
  };

  const handleCustomerAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAddressComplete(homeAddress)) {
      toast({
        title: 'Complete home address',
        description: 'Street, city, state, and ZIP code are required to continue.',
        variant: 'destructive',
      });
      return;
    }

    if (hasAnyAddressField(workAddress) && !isAddressComplete(workAddress)) {
      toast({
        title: 'Complete work address',
        description: 'Fill every work address field or leave the work address empty.',
        variant: 'destructive',
      });
      return;
    }
    setStep('chef');
  };

  const handleChefRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await registerUser({
        fullName: name.trim(),
        email: email.trim(),
        password,
        role: 'chef',
        chefBusinessName: specialty.trim() || `${name.trim()}'s Kitchen`,
        phone: phone.trim() || undefined,
        specialty: specialty.trim() || undefined,
        bio: bio.trim() || undefined,
        serviceArea: serviceArea.trim() || undefined,
      });

      if (response.success) {
        toast({
          title: 'Application submitted',
          description: 'An admin must approve your chef profile before it becomes visible to customers.',
        });
        navigate('/chef-partner', {
          state: {
            startStep: 'menu',
            chefName: name.trim() || 'Chef Partner',
            kitchenName: specialty.trim() || `${name.trim()}'s Kitchen`,
            locality:
              serviceArea.trim() ||
              [kitchenLocation.city, kitchenLocation.state].filter(Boolean).join(', ') ||
              'Your service area',
            radius: '6',
            onboardingMode: 'submitted',
          },
        });
      } else {
        if (response.message?.includes(BACKEND_UNREACHABLE_MESSAGE)) {
          toast({
            title: 'Opening chef workspace in draft mode',
            description: 'The backend could not be reached, so your chef profile is not submitted yet. Start the backend to save and send it for admin approval.',
          });
          navigate('/chef-partner', {
            state: {
              startStep: 'menu',
              chefName: name.trim() || 'Chef Partner',
              kitchenName: specialty.trim() || `${name.trim()}'s Kitchen`,
              locality:
                serviceArea.trim() ||
                [kitchenLocation.city, kitchenLocation.state].filter(Boolean).join(', ') ||
                'Your service area',
              radius: '6',
              onboardingMode: 'draft',
            },
          });
          return;
        }

        toast({ title: 'Error', description: response.message || 'Chef registration failed', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChefId) {
      toast({ title: 'Select a chef', description: 'Choose a chef before continuing to payment.', variant: 'destructive' });
      return;
    }

    if (!hasLiveChefCatalog || !isLiveChefId(selectedChefId)) {
      toast({
        title: 'Live chef data required',
        description: 'Start the backend and load approved chefs before taking a Razorpay payment.',
        variant: 'destructive',
      });
      return;
    }

    if (!isAddressComplete(homeAddress)) {
      toast({
        title: 'Complete home address',
        description: 'Street, city, state, and ZIP code are required before payment.',
        variant: 'destructive',
      });
      return;
    }

    if (hasAnyAddressField(workAddress) && !isAddressComplete(workAddress)) {
      toast({
        title: 'Complete work address',
        description: 'Fill every work address field or leave the work address empty.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let customerSession;
      if (selectedChefId.startsWith('mock-chef-')) {
        customerSession = {
          success: true,
          token: 'mock-token',
          user: { id: 999, email: email.trim() || 'mock@example.com', fullName: name.trim() || 'Mock User', role: 'customer' }
        } as any;
      } else {
        customerSession = await ensureBackendCustomerSession();
      }

      if (!customerSession || !customerSession.success) {
        toast({
          title: 'Registration failed',
          description: customerSession?.message || 'Unable to register you.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      await loadRazorpayCheckout();

      let apiBase = getBackendApiBaseUrl();
      if (apiBase.endsWith('/api')) {
        apiBase = apiBase.replace(/\/api\/?$/, '');
      }
      if (!apiBase) {
        apiBase = `${window.location.protocol}//${window.location.hostname}:3002`;
      }

      
      let orderData;
      if (selectedChefId.startsWith('mock-chef-')) {
        orderData = {
          success: true,
          order: { amount: planAmounts[selectedPlan] || planAmounts.standard, id: 'order_mock_123' },
          keyId: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_STz4joVjA8LzYP'
        };
      } else {
        const orderRes = await fetch(`${apiBase}/api/payment/create-order`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerSession.token}`,
          },
          body: JSON.stringify({
            amount: planAmounts[selectedPlan] || planAmounts.standard,
            currency: 'INR',
            plan: selectedPlan,
          }),
        });
        orderData = await orderRes.json();
      }

      if (!orderData || !orderData.success || !orderData.order) {
        toast({
          title: 'Payment setup failed',
          description: orderData?.message || 'Unable to create a Razorpay order.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const razorpayKey = orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) {
        toast({
          title: 'Configuration error',
          description: 'Razorpay key is not configured.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      setIsLoading(false);

      const options: any = {
        key: razorpayKey,
        amount: orderData.order.amount,
        currency: 'INR',
        name: 'ZYNK Bites',
        description: `${selectedPlanOption.name} subscription`,
        ...(selectedChefId.startsWith('mock-chef-') ? {} : { order_id: orderData.order.id }),
        handler: async (response: RazorpayHandlerResponse) => {
          try {
            if (selectedChefId.startsWith('mock-chef-')) {
              persistAuthenticatedCustomer(customerSession.user, customerSession.token);
              toast({ title: 'Payment successful', description: 'Your subscription is now active (Mock Mode).' });
              navigate('/dashboard');
              return;
            }

            const verifyRes = await fetch(`${apiBase}/api/payment/verify`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${customerSession.token}`,
              },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                plan: selectedPlan,
                chefId: selectedChefId,
                homeAddress,
                workAddress: isAddressComplete(workAddress) ? workAddress : undefined,
                paymentMethod,
              }),
            });
            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              toast({
                title: 'Payment verification failed',
                description: verifyData.message || 'Unable to activate your subscription.',
                variant: 'destructive',
              });
              return;
            }

            persistAuthenticatedCustomer(customerSession.user, customerSession.token);
            toast({ title: 'Payment successful', description: 'Your subscription is now active.' });
            navigate('/dashboard');
          } catch {
            toast({
              title: 'Payment verification failed',
              description: 'We could not confirm the payment. Please contact support if the amount was debited.',
              variant: 'destructive',
            });
          }
        },
        prefill: {
          name: customerSession.user.fullName,
          email: customerSession.user.email,
          contact: phone.trim() || undefined,
        },
        theme: { color: '#16a34a' },
        modal: {
          ondismiss: () => {
            toast({
              title: 'Payment cancelled',
              description: 'Your account is ready. You can retry payment anytime to activate the subscription.',
            });
          },
        },
      };

      const RazorpayCheckout = (window as RazorpayWindow).Razorpay;
      if (!RazorpayCheckout) {
        throw new Error('Razorpay checkout is unavailable.');
      }

      const razorpay = new RazorpayCheckout(options);
      razorpay.open();
    } catch (error) {
      setIsLoading(false);
      toast({
        title: 'Payment failed',
        description: error instanceof Error ? error.message : 'Unable to start Razorpay checkout.',
        variant: 'destructive',
      });
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

  const getMealName = (chef: ChefWithData, mealId?: string) => {
    if (!mealId) return '—';
    const dish = chef.dishes.find(d => d.id === mealId);
    return dish?.name || 'Meal';
  };

  const getMenuChartDays = (chef: ChefWithData) => {
    const chart = chef.menuCharts?.[0];
    if (!chart) return [];
    const today = new Date().toISOString().split('T')[0];
    return chart.days.filter(day => day.date >= today).slice(0, 7);
  };

  const getChefTags = (chef: ChefWithData) =>
    chef.specialty
      ? chef.specialty.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 3)
      : ['Home Chef'];

  const getChefDishPreview = (chef: ChefWithData) => chef.dishes.slice(0, 4);

  const menuChartDays = selectedChef ? getMenuChartDays(selectedChef) : [];
  const selectedChefDishPreview = selectedChef ? getChefDishPreview(selectedChef) : [];
  const selectedPlanExperience = planExperience[selectedPlan];

  return (
    <Layout>
      <div className="min-h-[80vh] flex items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.14),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(249,115,22,0.12),_transparent_26%),linear-gradient(180deg,#f7fff8_0%,#ffffff_48%,#f8fafc_100%)] py-12 px-4">
        <div className={`w-full ${shellWidthClass}`}>
          <div className="text-center mb-8">
            <p className="font-chef text-xs tracking-widest text-green-500 mb-4">
              {step === 'basic' && 'JOIN THE KITCHEN'}
              {step === 'addresses' && 'DELIVERY SETUP'}
              {step === 'chef' && 'CHEF + PLAN SELECTION'}
              {step === 'payment' && 'PAYMENT'}
              {step === 'kitchen' && 'CHEF PROFILE'}
            </p>
            <h1 className="font-display text-3xl font-bold text-charcoal">
              {step === 'basic' && 'Create Account'}
              {step === 'addresses' && 'Delivery Addresses'}
              {step === 'chef' && 'Build Your Monthly Meal Setup'}
              {step === 'payment' && 'Complete Payment'}
              {step === 'kitchen' && 'Kitchen Setup'}
            </h1>
            <div className="w-12 h-0.5 bg-charcoal mx-auto mt-4" />
            <p className="mt-4 text-muted-foreground">
              {step === 'basic' && 'Join ZYNK and experience culinary excellence'}
              {step === 'addresses' && 'Add your locations for seamless delivery'}
              {step === 'chef' && 'Compare chefs, preview signature dishes, and choose the plan that fits your routine'}
              {step === 'payment' && 'Securely complete payment to activate your subscription'}
              {step === 'kitchen' && 'Tell us about your culinary expertise'}
            </p>
          </div>

          <Card className={shellCardClass}>
            <CardContent className={shellContentClass}>
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
              <form onSubmit={handleCustomerAddressSubmit} className="space-y-5">
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

            {step === 'chef' && (
              <div className="space-y-6">
                <div className="overflow-hidden rounded-[30px] border border-emerald-200 bg-[linear-gradient(135deg,#0f172a_0%,#14532d_58%,#f97316_140%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.22)]">
                  <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div className="max-w-2xl">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/15">Admin approved chefs</Badge>
                        <Badge className="rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/15">Monthly plans</Badge>
                        <Badge className="rounded-full bg-white/15 px-3 py-1 text-white hover:bg-white/15">Secure checkout</Badge>
                      </div>
                      <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight">
                        Pick a chef that matches your taste and routine.
                      </h2>
                      <p className="mt-3 max-w-xl text-sm leading-6 text-white/80">
                        Compare ratings, cuisine style, locality, and signature dishes, then lock the monthly plan that feels right for your everyday meals.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3">
                      {chefStepHighlights.map(({ icon: Icon, value, label }) => (
                        <div key={label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
                          <Icon className="h-4 w-4 text-emerald-200" />
                          <p className="mt-3 text-2xl font-semibold">{value}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/65">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-chef text-emerald-600">Chef Listing</p>
                        <h3 className="mt-1 font-display text-2xl font-semibold text-slate-900">
                          {homeAddress.city.trim() ? `Popular around ${homeAddress.city}` : 'Popular with ZYNK members'}
                        </h3>
                      </div>
                      <div className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
                        {loadingChefs ? 'Loading chefs...' : `${chefs.length} chefs available`}
                      </div>
                    </div>

                    {loadingChefs ? (
                      <div className="grid gap-4">
                        {[1, 2, 3].map((card) => (
                          <div key={card} className="h-48 rounded-[28px] border border-emerald-100 bg-white/70 p-5 shadow-sm animate-pulse" />
                        ))}
                      </div>
                    ) : chefs.length === 0 ? (
                      <div className="rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
                        <ChefHat className="mx-auto h-10 w-10 text-slate-300" />
                        <p className="mt-4 text-lg font-semibold text-slate-900">No approved chefs available yet</p>
                        <p className="mt-2 text-sm text-slate-500">
                          Ask an admin to approve a chef profile, then come back here to continue your subscription.
                        </p>
                      </div>
                    ) : (
                      chefs.map((chef) => {
                        const tags = getChefTags(chef);
                        const dishPreview = getChefDishPreview(chef);
                        const isSelected = selectedChefId === chef.id;

                        return (
                          <button
                            key={chef.id}
                            type="button"
                            onClick={() => setSelectedChefId(chef.id)}
                            className={`w-full rounded-[28px] border p-5 text-left transition-all duration-200 ${
                              isSelected
                                ? 'border-emerald-300 bg-[linear-gradient(135deg,#f0fdf4_0%,#ffffff_52%,#fff7ed_100%)] shadow-[0_18px_45px_rgba(22,163,74,0.12)]'
                                : 'border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]'
                            }`}
                          >
                            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                              <div className="flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Badge className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                    {isSelected ? 'Selected' : 'Approved chef'}
                                  </Badge>
                                  <Badge variant="outline" className="rounded-full border-slate-200 text-slate-600">
                                    {chef.serviceArea || 'Local delivery'}
                                  </Badge>
                                  {chef.avgRating && chef.avgRating >= 4.7 && (
                                    <Badge className="rounded-full bg-amber-50 text-amber-700 hover:bg-amber-50">
                                      Top rated
                                    </Badge>
                                  )}
                                </div>

                                <div className="mt-4 flex items-start justify-between gap-4">
                                  <div>
                                    <h3 className="font-display text-2xl font-semibold text-slate-900">{chef.name}</h3>
                                    <p className="mt-1 text-sm text-slate-600">{chef.specialty || 'Home chef'}</p>
                                  </div>
                                  <div className="rounded-2xl bg-slate-900 px-4 py-3 text-right text-white shadow-lg">
                                    <div className="flex items-center justify-end gap-1">
                                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                                      <span className="text-lg font-semibold">{chef.avgRating?.toFixed(1) || '4.6'}</span>
                                    </div>
                                    <p className="mt-1 text-xs text-white/70">{chef.reviewCount || 0} reviews</p>
                                  </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                  {tags.map((tag) => (
                                    <span key={`${chef.id}-${tag}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                                    <p className="text-xs font-chef text-emerald-700">{selectedPlanOption.name} Price</p>
                                    <p className="mt-2 text-xl font-semibold text-slate-900">{selectedPlanOption.price}</p>
                                  </div>
                                  <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-4">
                                    <p className="text-xs font-chef text-orange-700">Flexible till</p>
                                    <p className="mt-2 text-xl font-semibold text-slate-900">8 PM</p>
                                  </div>
                                </div>

                                <div className="mt-5">
                                  <p className="text-xs font-chef text-slate-500">Signature dishes</p>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {dishPreview.length > 0 ? (
                                      dishPreview.map((dish) => (
                                        <span
                                          key={dish.id}
                                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700"
                                        >
                                          <UtensilsCrossed className="h-3 w-3 text-emerald-600" />
                                          {dish.name}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-500">Dish list will appear here once the chef updates the menu.</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="space-y-4 xl:sticky xl:top-24">
                    <div className="overflow-hidden rounded-[30px] border border-emerald-200 bg-white shadow-[0_20px_55px_rgba(15,23,42,0.09)]">
                      <div className="bg-[linear-gradient(135deg,#052e16_0%,#166534_58%,#fb923c_130%)] p-6 text-white">
                        <p className="text-xs font-chef text-emerald-100">Selected Chef</p>
                        {selectedChef ? (
                          <>
                            <div className="mt-3 flex items-start justify-between gap-4">
                              <div>
                                <h3 className="font-display text-3xl font-semibold">{selectedChef.name}</h3>
                                <p className="mt-2 text-sm text-white/80">{selectedChef.specialty || 'Home chef'}</p>
                              </div>
                              <div className="rounded-2xl bg-white/10 px-4 py-3 text-right backdrop-blur-sm">
                                <div className="flex items-center justify-end gap-1">
                                  <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                                  <span className="text-lg font-semibold">{selectedChef.avgRating?.toFixed(1) || '4.6'}</span>
                                </div>
                                <p className="mt-1 text-xs text-white/70">{selectedChef.reviewCount || 0} reviews</p>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <span className="rounded-full bg-white/12 px-3 py-1 text-xs text-white/85">
                                {selectedChef.serviceArea || 'Local area'}
                              </span>
                              <span className="rounded-full bg-white/12 px-3 py-1 text-xs text-white/85">
                                Admin approved
                              </span>
                              <span className="rounded-full bg-white/12 px-3 py-1 text-xs text-white/85">
                                Monthly subscription ready
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="mt-3 font-display text-2xl font-semibold">Choose a chef to continue</h3>
                            <p className="mt-2 text-sm text-white/80">
                              Select a chef on the left to unlock dish previews and the plan selector.
                            </p>
                          </>
                        )}
                      </div>

                      <div className="space-y-5 p-5">
                        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-chef text-slate-500">
                                {menuChartDays.length > 0 ? 'Weekly preview' : 'Signature menu'}
                              </p>
                              <p className="mt-1 text-sm text-slate-600">
                                {menuChartDays.length > 0
                                  ? 'A quick look at the meals your chef has lined up.'
                                  : 'No weekly chart yet, so here are the dishes this chef is known for.'}
                              </p>
                            </div>
                            <Sparkles className="h-5 w-5 text-emerald-600" />
                          </div>

                          <div className="mt-4 space-y-3">
                            {selectedChef ? (
                              menuChartDays.length > 0 ? (
                                menuChartDays.slice(0, 3).map((day) => {
                                  const slots = day.slots || {};
                                  return (
                                    <div key={day.date} className="rounded-2xl bg-white p-3 shadow-sm">
                                      <p className="text-sm font-semibold text-slate-900">{day.date}</p>
                                      <div className="mt-2 grid gap-2 text-xs text-slate-600 sm:grid-cols-3">
                                        <div>Breakfast: {getMealName(selectedChef, slots.breakfast?.mealId)}</div>
                                        <div>Lunch: {getMealName(selectedChef, slots.lunch?.mealId)}</div>
                                        <div>Dinner: {getMealName(selectedChef, slots.dinner?.mealId)}</div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="flex flex-wrap gap-2">
                                  {selectedChefDishPreview.length > 0 ? (
                                    selectedChefDishPreview.map((dish) => (
                                      <span
                                        key={`selected-${dish.id}`}
                                        className="rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-medium text-slate-700"
                                      >
                                        {dish.name}
                                      </span>
                                    ))
                                  ) : (
                                    <p className="text-sm text-slate-500">Dish preview will appear once the chef uploads signature items.</p>
                                  )}
                                </div>
                              )
                            ) : (
                              <p className="text-sm text-slate-500">Choose a chef to see menu highlights here.</p>
                            )}
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-slate-200 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-chef text-slate-500">Choose your plan</p>
                              <p className="mt-1 text-sm text-slate-600">Tap a plan to compare coverage before checkout.</p>
                            </div>
                            {selectedChef && (
                              <Badge className="rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                                {selectedPlanExperience.badge}
                              </Badge>
                            )}
                          </div>

                          <div className="mt-4 space-y-3">
                            {planOptions.map((plan) => {
                              const isSelectedPlan = selectedPlan === plan.id;
                              return (
                                <button
                                  key={plan.id}
                                  type="button"
                                  onClick={() => setSelectedPlan(plan.id)}
                                  className={`w-full rounded-[24px] border p-4 text-left transition-all ${
                                    isSelectedPlan
                                      ? 'border-emerald-300 bg-emerald-50 shadow-sm'
                                      : 'border-slate-200 bg-white hover:border-emerald-200'
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-4">
                                    <div>
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-display text-xl font-semibold text-slate-900">{plan.name}</p>
                                        <Badge
                                          variant="outline"
                                          className={`rounded-full ${
                                            isSelectedPlan ? 'border-emerald-300 text-emerald-700' : 'border-slate-200 text-slate-500'
                                          }`}
                                        >
                                          {planExperience[plan.id].badge}
                                        </Badge>
                                      </div>
                                      <p className="mt-1 text-sm text-slate-600">{plan.slots}</p>
                                      <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                                        {planExperience[plan.id].meals}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-lg font-semibold text-emerald-700">{plan.price}</p>
                                      {isSelectedPlan && <CheckCircle2 className="ml-auto mt-2 h-5 w-5 text-emerald-600" />}
                                    </div>
                                  </div>

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {planExperience[plan.id].highlights.map((highlight) => (
                                      <span
                                        key={`${plan.id}-${highlight}`}
                                        className={`rounded-full px-3 py-1 text-xs ${
                                          isSelectedPlan ? 'bg-white text-slate-700' : 'bg-slate-100 text-slate-600'
                                        }`}
                                      >
                                        {highlight}
                                      </span>
                                    ))}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="rounded-[24px] border border-orange-100 bg-orange-50/70 p-4">
                          <div className="flex items-center gap-2 text-orange-800">
                            <ShieldCheck className="h-4 w-4" />
                            <p className="text-sm font-semibold">Secure checkout and flexible changes</p>
                          </div>
                          <p className="mt-2 text-sm text-orange-700">
                            Address changes, skip, and swap stay open until 8 PM. Payment is completed through Razorpay after you confirm the chef and plan.
                          </p>
                        </div>

                        <Button
                          type="button"
                          className="h-12 w-full rounded-full bg-emerald-500 text-white hover:bg-emerald-600"
                          disabled={!selectedChef}
                          onClick={() => setStep('payment')}
                        >
                          {selectedChef ? `Continue with ${selectedPlanOption.name}` : 'Select a chef to continue'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setStep('addresses')} className="font-chef tracking-wider text-xs">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    BACK
                  </Button>
                </div>
              </div>
            )}

            {step === 'payment' && (
              <form onSubmit={handlePaymentSubmit} className="space-y-5">
                <div className="rounded-sm border border-gray-200 p-4 space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Selected Chef</p>
                    <p className="font-medium text-charcoal">{selectedChef?.name || 'Not selected'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Plan</p>
                    <p className="font-medium text-charcoal">{selectedPlanOption.name} • {selectedPlanOption.slots}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Monthly Price</p>
                    <p className="text-lg font-bold text-primary">{selectedPlanOption.price}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="font-chef text-xs tracking-wider text-charcoal">PAYMENT METHOD</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'upi', label: 'UPI' },
                      { id: 'debit', label: 'Debit Card' },
                      { id: 'credit', label: 'Credit Card' },
                      { id: 'netbanking', label: 'Net Banking' },
                    ].map((method) => (
                      <Button
                        key={method.id}
                        type="button"
                        variant={paymentMethod === method.id ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod(method.id as typeof paymentMethod)}
                        className="justify-start"
                      >
                        {method.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep('chef')} className="flex-1 font-chef tracking-wider text-xs">
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    BACK
                  </Button>
                  <Button type="submit" className="flex-1 btn-green" disabled={isLoading}>
                    {isLoading ? 'PROCESSING...' : 'PAY & ACTIVATE'}
                  </Button>
                </div>
              </form>
            )}

            {step === 'kitchen' && (
              <form onSubmit={handleChefRegistrationSubmit} className="space-y-5">
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
