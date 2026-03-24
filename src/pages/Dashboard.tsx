import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Layout } from '@/components/layout/Layout';
import { CustomerDashboard } from '@/components/dashboard/CustomerDashboard';
import { ChefDashboard } from '@/components/dashboard/ChefDashboard';
import { DeliveryDashboard } from '@/components/dashboard/DeliveryDashboard';
import { Navigate } from 'react-router-dom';
import { PageLoader } from '@/components/ui/KitchenLoader';

export const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Show loading animation briefly when dashboard loads
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (isLoading) {
    return <PageLoader text="Setting up your kitchen..." />;
  }

  if (user.role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'customer':
        return <CustomerDashboard />;
      case 'chef':
        return <ChefDashboard />;
      case 'delivery':
        return <DeliveryDashboard />;
      default:
        return <Navigate to="/" replace />;
    }
  };

  return (
    <Layout>
      {renderDashboard()}
    </Layout>
  );
};
