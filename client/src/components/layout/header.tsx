import { Bell, Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useQuery } from '@tanstack/react-query';

export default function Header() {
  const { user, logout } = useAuth();
  const isAdmin = user?.role?.name === 'admin';
  const isSeller = user?.role?.name === 'seller';

  const { data: notifications } = useQuery({
    queryKey: ['/api/notifications'],
    enabled: !!user,
  });

  const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.isRead).length : 0;

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
                {isAdmin ? 'Admin Panel' : 'SellerHub'}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block relative">
              <Input
                type="text"
                placeholder="Search products, orders..."
                className="pl-10 pr-4 py-2 w-64"
              />
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            </div>
            
            {/* Notifications */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </Button>
            
            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.avatar || ""} alt="Profile" />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:block text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="hidden md:block text-xs text-gray-500 font-normal ml-2">
                    {isAdmin ? 'Admin' : isSeller ? 'Seller' : ''}
                  </span>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem>
                  <i className="fas fa-user mr-2"></i>
                  Profile Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <i className="fas fa-cog mr-2"></i>
                  Account Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <i className="fas fa-question-circle mr-2"></i>
                  Help & Support
                </DropdownMenuItem>
                <DropdownMenuSeparator />
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
