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
import { User, ChefHat, Eye, EyeOff } from 'lucide-react';

type RegistrationType = 'customer' | 'chef';

export const Register = () => {
  const [type, setType] = useState<RegistrationType>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === 'customer') {
        const response = api.registerCustomer(email, password, name, phone);
        if (response.success && response.data) {
          login(response.data);
          toast({ title: 'Welcome to ZYNK!', description: 'Your account has been created.' });
          navigate('/dashboard');
        } else {
          toast({ title: 'Error', description: response.error, variant: 'destructive' });
        }
      } else {
        const response = api.registerChef(email, password, name, specialty);
        if (response.success) {
          toast({ 
            title: 'Application Submitted', 
            description: 'Your chef application is pending approval. You can login once approved.' 
          });
          navigate('/login');
        } else {
          toast({ title: 'Error', description: response.error, variant: 'destructive' });
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container max-w-lg py-12 px-4">
        <Card className="animate-fade-in shadow-elevated">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-2xl">Create Account</CardTitle>
            <CardDescription>Join ZYNK and never worry about meals again</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Role Toggle */}
            <div className="flex gap-2 p-1 bg-secondary rounded-lg mb-6">
              <button
                type="button"
                onClick={() => setType('customer')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  type === 'customer' 
                    ? 'bg-card shadow-card text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <User className="w-4 h-4" />
                Customer
              </button>
              <button
                type="button"
                onClick={() => setType('chef')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-medium transition-all ${
                  type === 'chef' 
                    ? 'bg-card shadow-card text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ChefHat className="w-4 h-4" />
                Chef Partner
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {type === 'customer' && (
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone (optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-9876543210"
                  />
                </div>
              )}

              {type === 'chef' && (
                <div className="space-y-2">
                  <Label htmlFor="specialty">Specialty Cuisine</Label>
                  <Input
                    id="specialty"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="North Indian, Continental..."
                  />
                </div>
              )}

              <Button type="submit" className="w-full gradient-primary" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : type === 'customer' ? 'Create Account' : 'Submit Application'}
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
