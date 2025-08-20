import { useState } from 'react';
import { Bell, BellOff, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import { 
  useNotifications, 
  useVendorNotifications,
  useUnreadCount, 
  useVendorUnreadCount,
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useClearAllNotifications
} from '@/hooks/use-api';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  isImportant: boolean;
  actionUrl?: string;
  actionText?: string;
  createdAt: string;
  order?: any;
  product?: any;
  review?: any;
}

export function NotificationBell() {
  console.log('🔔 NotificationBell - Component rendering');
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  
  // Get vendor ID for sellers
  const vendorId = user?.vendorId;
  
  // Debug logging
  console.log('🔔 NotificationBell - User:', user);
  console.log('🔔 NotificationBell - User ID:', user?.id);
  console.log('🔔 NotificationBell - Vendor ID:', vendorId);
  
  // Fetch notifications for both user and vendor (for sellers)
  const { data: userNotifications = [], isLoading: userNotificationsLoading, error: userNotificationsError } = useNotifications(user?.id);
  const { data: vendorNotifications = [], isLoading: vendorNotificationsLoading, error: vendorNotificationsError } = useVendorNotifications(vendorId);
  
  // Debug logging for notification hooks
  console.log('🔔 NotificationBell - User notifications:', userNotifications);
  console.log('🔔 NotificationBell - User notifications loading:', userNotificationsLoading);
  console.log('🔔 NotificationBell - User notifications error:', userNotificationsError);
  console.log('🔔 NotificationBell - Vendor notifications:', vendorNotifications);
  console.log('🔔 NotificationBell - Vendor notifications loading:', vendorNotificationsLoading);
  console.log('🔔 NotificationBell - Vendor notifications error:', vendorNotificationsError);
  
  // Combine notifications and remove duplicates
  const allNotifications = [...userNotifications, ...vendorNotifications];
  const uniqueNotifications = allNotifications.filter((notification, index, self) => 
    index === self.findIndex(n => n.id === notification.id)
  );
  
  const { data: userUnreadData, error: userUnreadError } = useUnreadCount(user?.id);
  const { data: vendorUnreadData, error: vendorUnreadError } = useVendorUnreadCount(vendorId);
  
  // Debug logging for unread count hooks
  console.log('🔔 NotificationBell - User unread data:', userUnreadData);
  console.log('🔔 NotificationBell - User unread error:', userUnreadError);
  console.log('🔔 NotificationBell - Vendor unread data:', vendorUnreadData);
  console.log('🔔 NotificationBell - Vendor unread error:', vendorUnreadError);
  
  // Calculate total unread count from both user and vendor notifications
  const userUnreadCount = userUnreadData?.count || 0;
  const vendorUnreadCount = vendorUnreadData?.count || 0;
  const unreadCount = userUnreadCount + vendorUnreadCount;
  
  // Debug logging for unread counts
  console.log('🔔 NotificationBell - User unread count:', userUnreadCount);
  console.log('🔔 NotificationBell - Vendor unread count:', vendorUnreadCount);
  console.log('🔔 NotificationBell - Total unread count:', unreadCount);
  
  const isLoading = userNotificationsLoading || vendorNotificationsLoading;
  

  
  const markAsRead = useMarkNotificationAsRead();
  const markAllAsRead = useMarkAllNotificationsAsRead();
  const deleteNotification = useDeleteNotification();
  const clearAll = useClearAllNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'order':
        return '📦';
      case 'review':
        return '⭐';
      case 'product':
        return '🛍️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-blue-600';
      case 'review':
        return 'text-yellow-600';
      case 'product':
        return 'text-green-600';
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    if (user?.id) {
      markAllAsRead.mutate(user.id);
    }
  };

  const handleClearAll = () => {
    if (user?.id) {
      clearAll.mutate(user.id);
    }
  };

  const handleDeleteNotification = (e: React.MouseEvent, notificationId: number) => {
    e.stopPropagation();
    deleteNotification.mutate(notificationId);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {/* Always show bell for debugging */}
          <Bell className="h-5 w-5" />
          
          {/* Always show debug badge for testing */}
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount || 0}
          </span>
          
          {/* Original conditional badges */}
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">Notifications</h4>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                disabled={markAllAsRead.isPending}
                className="h-8 px-2 text-xs"
              >
                <Check className="h-3 w-3 mr-1" />
                Mark read
              </Button>
            )}
          </div>
                      {uniqueNotifications.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  disabled={clearAll.isPending}
                  className="h-8 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  Clear all
                </Button>
              </div>
            )}
        </div>
        
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">
              Loading notifications...
            </div>
          ) : uniqueNotifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <BellOff className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              No notifications
            </div>
          ) : (
            <div className="p-2">
              {uniqueNotifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors ${
                    notification.isRead 
                      ? 'bg-gray-50 hover:bg-gray-100' 
                      : 'bg-blue-50 hover:bg-blue-100'
                  } ${notification.isImportant ? 'border-l-4 border-red-500' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <span className="text-lg flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h5 className={`font-medium text-sm ${getNotificationColor(notification.type)} truncate`}>
                            {notification.title}
                          </h5>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-400 truncate">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDeleteNotification(e, notification.id)}
                      disabled={deleteNotification.isPending}
                      className="h-6 w-6 p-0 ml-2 flex-shrink-0 text-gray-400 hover:text-red-500"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
} 