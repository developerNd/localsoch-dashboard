import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
    enabled: !!user,
  });

  const isActive = (path: string) => location.startsWith(path);

  const sellerNavItems = [
    { href: '/seller', icon: 'fas fa-tachometer-alt', label: 'Dashboard', exact: true },
    { 
      href: '/seller/products', 
      icon: 'fas fa-box', 
      label: 'Products',
      badge: analytics?.totalProducts 
    },
    { 
      href: '/seller/orders', 
      icon: 'fas fa-shopping-cart', 
      label: 'Orders',
      badge: analytics?.recentOrders?.length 
    },
    { href: '/seller/inventory', icon: 'fas fa-warehouse', label: 'Inventory' },
    { href: '/seller/earnings', icon: 'fas fa-chart-line', label: 'Earnings' },
    { href: '/seller/reviews', icon: 'fas fa-star', label: 'Reviews' },
    { href: '/seller/profile', icon: 'fas fa-user-cog', label: 'Shop Settings' },
  ];

  const adminNavItems = [
    { href: '/admin', icon: 'fas fa-tachometer-alt', label: 'Dashboard', exact: true },
    { 
      href: '/admin/sellers', 
      icon: 'fas fa-users', 
      label: 'Sellers',
      badge: analytics?.totalSellers 
    },
    { 
      href: '/admin/products', 
      icon: 'fas fa-box', 
      label: 'Products',
      badge: analytics?.totalProducts 
    },
    { 
      href: '/admin/orders', 
      icon: 'fas fa-shopping-cart', 
      label: 'Orders',
      badge: analytics?.totalOrders 
    },
    { href: '/admin/analytics', icon: 'fas fa-chart-bar', label: 'Analytics' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : sellerNavItems;

  return (
    <aside className={cn(
      "hidden lg:flex lg:flex-col lg:w-64 bg-white shadow-sm border-r border-gray-200 fixed left-0 top-16 bottom-0 overflow-y-auto",
      className
    )}>
      {/* Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user?.avatar || ""} alt="Profile" />
              <AvatarFallback className="bg-primary text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {user?.sellerProfile?.shopName || `${user?.firstName} ${user?.lastName}`}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role === 'admin' ? 'Administrator' : 'Seller Account'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => {
            const isItemActive = item.exact 
              ? location === item.href 
              : isActive(item.href);

            return (
              <li key={item.href}>
                <Link href={item.href}>
                  <Button
                    variant={isItemActive ? "default" : "ghost"}
                    className={cn(
                      "w-full justify-start space-x-3 p-3",
                      isItemActive 
                        ? "bg-primary text-white" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <i className={item.icon}></i>
                    <span>{item.label}</span>
                    {item.badge && (
                      <Badge 
                        variant={isItemActive ? "secondary" : "outline"}
                        className="ml-auto"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 pt-4 border-t border-gray-200">
          <ul className="space-y-2">
            <li>
              <Button variant="ghost" className="w-full justify-start space-x-3 p-3 text-gray-700 hover:bg-gray-100">
                <i className="fas fa-question-circle"></i>
                <span>Help & Support</span>
              </Button>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
