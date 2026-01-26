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
  CheckCircle2,
  Heart
} from 'lucide-react';

const Index = () => {
  const features = [
    {
      icon: Heart,
      title: 'Nourishing Meals',
      description: 'Thoughtfully prepared with your wellness in mind',
    },
    {
      icon: Clock,
      title: 'Flexible Choices',
      description: 'Swap or skip meals before the evening cutoff',
    },
    {
      icon: Leaf,
      title: 'Fresh Ingredients',
      description: 'Wholesome, seasonal produce in every dish',
    },
    {
      icon: Calendar,
      title: 'Weekly Variety',
      description: 'A changing menu to keep things interesting',
    },
  ];

  const plans = [
    { name: 'Lite', price: '₹2,999', meals: '20 meals/month', popular: false },
    { name: 'Balanced', price: '₹4,499', meals: '30 meals/month', popular: true },
    { name: 'Complete', price: '₹5,999', meals: '60 meals/month', popular: false },
  ];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container px-4 py-20 md:py-32 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border/50 text-sm font-medium mb-6">
              <Leaf className="w-4 h-4 text-primary" />
              Your Personal Health Kitchen
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-bold tracking-tight mb-6 text-foreground">
              Home-Cooked Care,
              <span className="block text-primary">Delivered Daily</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Fresh, nourishing meals made by local home chefs who care about your health. 
              Simple, honest food—just like home.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="gradient-herbal text-lg px-8">
                <Link to="/register">
                  Begin Your Journey
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-lg px-8">
                <Link to="/login">Welcome Back</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-secondary/40">
        <div className="container px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="shadow-soft hover:shadow-card transition-shadow animate-slide-up bg-card/80"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
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
            <h2 className="font-display text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to nourishing, stress-free meals
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: '1', title: 'Pick Your Plan', desc: 'Choose a rhythm that suits your lifestyle' },
              { step: '2', title: 'Meet Your Chef', desc: 'Browse and select from local home cooks' },
              { step: '3', title: 'Enjoy Daily', desc: 'Fresh meals arrive at your door, ready to savor' },
            ].map((item, index) => (
              <div key={index} className="text-center animate-slide-up" style={{ animationDelay: `${index * 150}ms` }}>
                <div className="w-16 h-16 mx-auto rounded-full bg-secondary border-2 border-primary/20 flex items-center justify-center text-2xl font-bold text-primary mb-4">
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
      <section className="py-16 bg-secondary/40">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-bold mb-4">Simple, Honest Pricing</h2>
            <p className="text-muted-foreground">No hidden fees, just good food</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`shadow-soft hover:shadow-elevated transition-all relative ${
                  plan.popular ? 'border-2 border-primary scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 gradient-herbal rounded-full text-xs font-bold text-primary-foreground">
                    Most Loved
                  </div>
                )}
                <CardContent className="pt-8 text-center">
                  <h3 className="font-display font-bold text-xl mb-2">{plan.name}</h3>
                  <p className="text-4xl font-bold text-primary mb-2">{plan.price}</p>
                  <p className="text-muted-foreground text-sm mb-6">{plan.meals}</p>
                  <ul className="space-y-2 text-sm text-left mb-6">
                    {['Fresh daily meals', 'Swap before 7 PM', 'Free delivery', 'Choose your chef'].map((item, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className={`w-full ${plan.popular ? 'gradient-herbal' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
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
            <h2 className="font-display text-3xl font-bold mb-4">Join Our Kitchen Family</h2>
            <p className="text-muted-foreground">Share your passion for food with our community</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Card className="shadow-soft hover:shadow-card transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-2xl bg-chef/10 flex items-center justify-center mb-4">
                  <ChefHat className="w-6 h-6 text-chef" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Cook from Home</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  Turn your kitchen into a small business. Share your recipes and earn on your schedule.
                </p>
                <Button asChild variant="outline">
                  <Link to="/register">Apply as Home Chef</Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="shadow-soft hover:shadow-card transition-shadow">
              <CardContent className="pt-6">
                <div className="w-12 h-12 rounded-2xl bg-delivery/10 flex items-center justify-center mb-4">
                  <Truck className="w-6 h-6 text-delivery" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">Deliver Happiness</h3>
                <p className="text-muted-foreground text-sm mb-4 leading-relaxed">
                  Be the bridge between kitchens and homes. Flexible hours, fair pay.
                </p>
                <Button asChild variant="outline">
                  <Link to="/login">Join Delivery Team</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container px-4">
          <Card className="gradient-herbal overflow-hidden rounded-3xl">
            <CardContent className="py-12 text-center">
              <h2 className="font-display text-3xl font-bold text-primary-foreground mb-4">
                Ready for Home-Cooked Goodness?
              </h2>
              <p className="text-primary-foreground/80 mb-8 max-w-xl mx-auto leading-relaxed">
                Join our community and rediscover the comfort of real, nourishing meals.
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
