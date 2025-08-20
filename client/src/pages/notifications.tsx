import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAuth } from '@/hooks/use-auth';
import { 
  useNotifications, 
  useUnreadCount, 
  useMarkNotificationAsRead, 
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useClearAllNotifications
} from '@/hooks/use-api';
import { Bell, BellOff, Check, Trash2, X, Filter } from 'lucide-react';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [filterType, setFilterType] = useState('all');
  
  const { data: notifications = [], isLoading } = useNotifications(user?.id);
  const { data: unreadData } = useUnreadCount(user?.id);
  const unreadCount = unreadData?.count || 0;
  
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
        return 'text-blue-600 bg-blue-50';
      case 'review':
        return 'text-yellow-600 bg-yellow-50';
      case 'product':
        return 'text-green-600 bg-green-50';
      case 'success':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'error':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'order':
        return 'Order';
      case 'review':
        return 'Review';
      case 'product':
        return 'Product';
      case 'success':
        return 'Success';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Info';
    }
  };

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) {
      markAsRead.mutate(notification.id);
    }
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

  const handleDeleteNotification = (notificationId: number) => {
    deleteNotification.mutate(notificationId);
  };

  // Filter notifications based on active tab and type filter
  const filteredNotifications = notifications.filter((notification: any) => {
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'unread' && !notification.isRead) ||
      (activeTab === 'read' && notification.isRead);
    
    const matchesType = filterType === 'all' || notification.type === filterType;
    
    return matchesTab && matchesType;
  });

  const unreadNotifications = notifications.filter((n: any) => !n.isRead);
  const readNotifications = notifications.filter((n: any) => n.isRead);

  const notificationTypes = ['all', 'order', 'review', 'product', 'success', 'warning', 'error'];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      
              <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-gray-600 mt-1">
                {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  onClick={handleMarkAllAsRead}
                  disabled={markAllAsRead.isPending}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Mark all read
                </Button>
              )}
              {notifications.length > 0 && (
                <Button
                  variant="outline"
                  onClick={handleClearAll}
                  disabled={clearAll.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </Button>
              )}
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Bell className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="text-2xl font-bold">{notifications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <div className="h-3 w-3 bg-blue-600 rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unread</p>
                    <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center">
                  <Check className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="text-sm text-gray-600">Read</p>
                    <p className="text-2xl font-bold text-green-600">{readNotifications.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs and Filters */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Notifications</CardTitle>
                
                {/* Type Filter */}
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="text-sm border border-gray-300 rounded-md px-2 py-1"
                  >
                    {notificationTypes.map(type => (
                      <option key={type} value={type}>
                        {type === 'all' ? 'All Types' : getTypeLabel(type)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                  <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
                  <TabsTrigger value="read">Read ({readNotifications.length})</TabsTrigger>
                </TabsList>
                
                <TabsContent value="all" className="mt-4">
                  <NotificationList 
                    notifications={filteredNotifications}
                    onNotificationClick={handleNotificationClick}
                    onDelete={handleDeleteNotification}
                    isLoading={isLoading}
                  />
                </TabsContent>
                
                <TabsContent value="unread" className="mt-4">
                  <NotificationList 
                    notifications={filteredNotifications}
                    onNotificationClick={handleNotificationClick}
                    onDelete={handleDeleteNotification}
                    isLoading={isLoading}
                  />
                </TabsContent>
                
                <TabsContent value="read" className="mt-4">
                  <NotificationList 
                    notifications={filteredNotifications}
                    onNotificationClick={handleNotificationClick}
                    onDelete={handleDeleteNotification}
                    isLoading={isLoading}
                  />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

function NotificationList({ 
  notifications, 
  onNotificationClick, 
  onDelete, 
  isLoading 
}: {
  notifications: any[];
  onNotificationClick: (notification: any) => void;
  onDelete: (id: number) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="text-center py-8">
        <BellOff className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
        <p className="text-gray-600">You're all caught up!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
            notification.isRead 
              ? 'bg-white border-gray-200' 
              : 'bg-blue-50 border-blue-200'
          } ${notification.isImportant ? 'border-l-4 border-l-red-500' : ''}`}
          onClick={() => onNotificationClick(notification)}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <span className="text-2xl">
                {getNotificationIcon(notification.type)}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-medium text-gray-900">
                    {notification.title}
                  </h4>
                  <Badge variant="outline" className={getNotificationColor(notification.type)}>
                    {getTypeLabel(notification.type)}
                  </Badge>
                  {!notification.isRead && (
                    <Badge variant="default" className="bg-blue-600">
                      New
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600 mb-2">
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {new Date(notification.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      ))}
    </div>
  );
}

function getNotificationIcon(type: string) {
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
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'order':
      return 'text-blue-600 bg-blue-50';
    case 'review':
      return 'text-yellow-600 bg-yellow-50';
    case 'product':
      return 'text-green-600 bg-green-50';
    case 'success':
      return 'text-green-600 bg-green-50';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50';
    case 'error':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'order':
      return 'Order';
    case 'review':
      return 'Review';
    case 'product':
      return 'Product';
    case 'success':
      return 'Success';
    case 'warning':
      return 'Warning';
    case 'error':
      return 'Error';
    default:
      return 'Info';
  }
} 