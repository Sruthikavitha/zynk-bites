import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  UtensilsCrossed, 
  Clock, 
  Leaf, 
  ChefHat, 
  Truck, 
  Calendar,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: UtensilsCrossed,
      title: 'Fresh Daily Meals',
      description: 'Chef-prepared meals delivered to your door every day',
    },
    {
      icon: Clock,
      title: 'Skip or Swap',
      description: 'Flexibility to modify meals before 8 PM cutoff',
    },
    {
      icon: Leaf,
      title: 'Healthy Options',
      description: 'Nutritious meals for students and professionals',
    },
    {
      icon: Calendar,
      title: 'Weekly Menu',
      description: 'Diverse menu that changes weekly',
    },
  ];

  const plans = [
    { name: 'Basic', price: '₹2,999', meals: '20 meals/month', popular: false },
    { name: 'Standard', price: '₹4,499', meals: '30 meals/month', popular: true },
    { name: 'Premium', price: '₹5,999', meals: '60 meals/month', popular: false },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-primary opacity-5" />
        <div className="container px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <ChefHat className="w-4 h-4" />
              Made for college students & professionals
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Never Worry About
              <span className="block text-primary">Meals Again</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              ZYNK delivers chef-prepared, nutritious meals to your doorstep daily. 
              Skip or swap meals anytime before 8 PM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-primary text-lg px-8">
                <Link to="/register">
                  Get Started
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary/30">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="shadow-card hover:shadow-card-hover transition-shadow animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-4">How ZYNK Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to never worry about meals again
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Choose Your Plan', desc: 'Select a subscription that fits your schedule' },
              { step: '2', title: 'Set Preferences', desc: 'Tell us your meal times and delivery address' },
              { step: '3', title: 'Enjoy Daily Meals', desc: 'Fresh meals delivered to your door every day' },
            ].map((item, index) => (
              <div key={index} className="text-center animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="w-16 h-16 mx-auto rounded-full gradient-primary flex items-center justify-center text-2xl font-bold text-primary-foreground mb-4">
                  {item.step}
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{item.title}</h3>
                <p className="text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-secondary/30">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-4">Simple Pricing</h2>
            <p className="text-muted-foreground">Choose a plan that works for you</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`shadow-card hover:shadow-elevated transition-all relative ${
                  plan.popular ? 'border-2 border-primary scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-primary rounded-full text-xs font-bold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                <CardContent className="pt-8 text-center">
                  <h3 className="font-display font-bold text-xl mb-2">{plan.name}</h3>
                  <p className="text-4xl font-bold text-primary mb-2">{plan.price}</p>
                  <p className="text-muted-foreground text-sm mb-6">{plan.meals}</p>
                  <ul className="space-y-2 text-sm text-left mb-6">
                    {['Daily fresh meals', 'Skip/swap before 8 PM', 'Free delivery', 'Chef selection'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className={`w-full ${plan.popular ? 'gradient-primary' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                    <Link to="/register">Get Started</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Roles */}
      <section className="py-16">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-4">Join the ZYNK Ecosystem</h2>
            <p className="text-muted-foreground">Multiple ways to be part of our mission</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-chef flex items-center justify-center mb-4">
                  <ChefHat className="w-6 h-6 text-chef-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Become a Chef Partner</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Share your culinary skills. Cook from home and earn with flexible hours.
                </p>
                <Button asChild variant="outline">
                  <Link to="/register">Apply Now</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-card hover:shadow-card-hover transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-xl bg-delivery flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-delivery-foreground" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Join Delivery Team</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Deliver happiness to customers. Flexible schedules and competitive pay.
                </p>
                <Button asChild variant="outline">
                  <Link to="/login">Login as Delivery</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container px-4">
          <Card className="gradient-primary overflow-hidden">
            <CardContent className="py-12 text-center">
              <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
                Ready to Simplify Your Meals?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join thousands of students and professionals who've made mealtime stress-free.
              </p>
              <Button asChild size="lg" variant="secondary" className="text-lg px-8">
                <Link to="/register">
                  Start Your Subscription
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
