import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';
import { useSellerAnalytics, useAdminAnalytics } from '@/hooks/use-api';
import { isAdmin, isSeller, getRoleDisplayName } from '@/lib/auth-utils';
import { apiRequest } from '@/lib/queryClient';
import { getImageUrl } from '@/lib/config';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  
  console.log('🔍 Sidebar - Received user:', user);
  console.log('🔍 Sidebar - User role object:', user?.role);
  console.log('🔍 Sidebar - User role type:', typeof user?.role);

  // Use seller-specific analytics for sellers, general analytics for admins
  const { data: sellerAnalytics } = useSellerAnalytics(user?.vendorId || undefined);
  const { data: adminAnalytics } = useAdminAnalytics();
  
  // Use utility functions for consistent role checking
  const userIsAdmin = isAdmin(user);
  const userIsSeller = isSeller(user);
  
  console.log('🔍 Sidebar - User role object:', user?.role);
  console.log('🔍 Sidebar - isAdmin:', userIsAdmin, 'isSeller:', userIsSeller);
  const analytics = userIsSeller ? sellerAnalytics : adminAnalytics;

  // Fetch vendor data for sellers to get profile image
  const { data: vendorData } = useQuery({
    queryKey: ['vendor', user?.vendorId],
    queryFn: async () => {
      if (!user?.vendorId) return null;
      const response = await apiRequest('GET', `/api/vendors/${user.vendorId}?populate=*`);
      const data = await response.json();
      return data.data;
    },
    enabled: !!user?.vendorId && userIsSeller,
  });

  // Get profile image URL
  const getProfileImageUrl = () => {
    if (vendorData?.profileImage) {
      return getImageUrl(vendorData.profileImage.url || vendorData.profileImage.data?.attributes?.url);
    }
    return null;
  };

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
      badge: analytics?.totalOrders 
    },
    { href: '/seller/inventory', icon: 'fas fa-warehouse', label: 'Inventory' },
    { href: '/seller/earnings', icon: 'fas fa-chart-line', label: 'Earnings' },
    { href: '/seller/button-tracking', icon: 'fas fa-mouse-pointer', label: 'Button Tracking' },
    { href: '/seller/reviews', icon: 'fas fa-star', label: 'Reviews' },
    { href: '/seller/profile', icon: 'fas fa-user-cog', label: 'Shop Settings' },
  ];

  const adminNavItems = [
    { href: '/admin', icon: 'fas fa-chart-bar', label: 'Analytics Dashboard', exact: true },
    { 
      href: '/admin/sellers', 
      icon: 'fas fa-users', 
      label: 'Sellers',
      badge: userIsAdmin ? (analytics as any)?.totalSellers : undefined
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
    { href: '/admin/banners', icon: 'fas fa-image', label: 'Banners' },
    { href: '/admin/notifications', icon: 'fas fa-bell', label: 'Notifications' },
    { href: '/admin/business-categories', icon: 'fas fa-building', label: 'Business Categories' },
    { href: '/admin/product-categories', icon: 'fas fa-tags', label: 'Product Categories' },
    { href: '/admin/subscription-plans', icon: 'fas fa-credit-card', label: 'Subscription Plans' },
  ];

  const navItems = userIsAdmin ? adminNavItems : sellerNavItems;

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
              <AvatarImage src={getProfileImageUrl() || ""} alt="Profile" />
              <AvatarFallback className="bg-primary text-white">
                {user?.username?.[0] || user?.firstName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-sm">
                {user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {getRoleDisplayName(user)}
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
              <a 
                href="https://localsoch.com/help" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center space-x-3 p-3 text-gray-500 text-sm hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors cursor-pointer"
              >
                <i className="fas fa-question-circle"></i>
                <span>Help & Support</span>
                <i className="fas fa-external-link-alt ml-auto text-xs"></i>
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </aside>
  );
}
