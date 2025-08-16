import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationBell } from '@/components/ui/notification-bell';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { isAdmin, isSeller } from '@/lib/auth-utils';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { getImageUrl } from '@/lib/config';

export default function Header() {
  const { user, logout } = useAuth();
  

  
  // Use utility functions for consistent role checking
  const userIsAdmin = isAdmin(user);
  const userIsSeller = isSeller(user);
  


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

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Button variant="ghost" className="lg:hidden p-2 text-gray-600 hover:text-gray-900">
              <i className="fas fa-bars text-lg"></i>
            </Button>
            <div className="flex items-center ml-4 lg:ml-0">
              <i className="fas fa-store text-primary text-2xl mr-3"></i>
              <h1 className="text-xl font-bold text-gray-900">
                {userIsAdmin ? 'LocalSoch Admin' : 'LocalSoch Seller'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Notification Bell */}
            <NotificationBell />
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={getProfileImageUrl() || ""} alt="Profile" />
                    <AvatarFallback>
                      {user?.username?.[0] || user?.firstName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-xs text-gray-500 font-normal">
                    {userIsAdmin ? 'Admin' : userIsSeller ? 'Seller' : ''}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={logout}>
                  <i className="fas fa-sign-out-alt mr-2"></i>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
