import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { isAdmin } from '@/lib/auth-utils';

export default function MobileNav() {
  const { user } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location.startsWith(path);

  const sellerNavItems = [
    { href: '/seller', icon: 'fas fa-tachometer-alt', label: 'Dashboard', exact: true },
    { href: '/seller/products', icon: 'fas fa-box', label: 'Products' },
    { href: '/seller/orders', icon: 'fas fa-shopping-cart', label: 'Orders' },
    { href: '/seller/earnings', icon: 'fas fa-chart-line', label: 'Earnings' },
    { href: '/seller/button-tracking', icon: 'fas fa-mouse-pointer', label: 'Tracking' },
    { href: '/seller/profile', icon: 'fas fa-user', label: 'Profile' },
  ];

  const adminNavItems = [
    { href: '/admin', icon: 'fas fa-tachometer-alt', label: 'Dashboard', exact: true },
    { href: '/admin/sellers', icon: 'fas fa-users', label: 'Sellers' },
    { href: '/admin/products', icon: 'fas fa-box', label: 'Products' },
    { href: '/admin/orders', icon: 'fas fa-shopping-cart', label: 'Orders' },
    { href: '/admin/analytics', icon: 'fas fa-chart-bar', label: 'Analytics' },
  ];

  // Use utility functions for consistent role checking
  const userIsAdmin = isAdmin(user);
  
  console.log('🔍 MobileNav - User role object:', user?.role);
  console.log('🔍 MobileNav - isAdmin:', userIsAdmin);
  
  const navItems = userIsAdmin ? adminNavItems : sellerNavItems;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="grid grid-cols-5 py-2">
        {navItems.map((item) => {
          const isItemActive = item.exact 
            ? location === item.href 
            : isActive(item.href);

          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "flex flex-col items-center py-2 h-auto",
                  isItemActive ? "text-primary" : "text-gray-600"
                )}
              >
                <i className={`${item.icon} text-lg`}></i>
                <span className="text-xs mt-1">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
