import { ReactNode } from 'react';
import { Header } from './Header';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <footer className="border-t border-border bg-card py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 ZYNK. Made for college students and working professionals.</p>
        </div>
      </footer>
    </div>
  );
};
