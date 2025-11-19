import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Wallet, LogOut, Settings } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export const Navbar = () => {
  const { user, signOut } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/income', label: 'Income' },
    { path: '/expenses', label: 'Expenses' },
    { path: '/budgets', label: 'Budgets' },
    { path: '/goals', label: 'Goals' },
  ];

  return (
    <nav className="border-b bg-card sticky top-0 z-50">
      <div className="container mx-auto px-3">
        <div className="flex h-16 items-center justify-between gap-4">
          <Link to="/dashboard" className="flex items-center gap-4 font-bold text-lg sm:text-xl text-primary shrink-0">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="hidden xs:inline">FedhaSmart</span>
            <span className="xs:hidden">FedhaSmart</span>
          </Link>

          <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={location.pathname === item.path ? 'default' : 'ghost'}
                asChild
                size="sm"
              >
                <Link to={item.path}>{item.label}</Link>
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <ThemeToggle />
            <Button variant="ghost" asChild size="icon">
              <Link to="/settings">
                <Settings className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="ghost" onClick={signOut} size="icon">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        <div className="md:hidden flex gap-1 pb-2 overflow-x-auto scrollbar-hide">
          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={location.pathname === item.path ? 'default' : 'ghost'}
              size="sm"
              asChild
              className="whitespace-nowrap flex-shrink-0"
            >
              <Link to={item.path}>{item.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </nav>
  );
};
