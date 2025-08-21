import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ChevronsUpDown, Check } from 'lucide-react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/config';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'order' | 'review' | 'product' | 'system';
  isRead: boolean;
  isImportant: boolean;
  actionUrl?: string;
  actionText?: string;
  user?: any;
  vendor?: any;
  createdAt: string;
  updatedAt: string;
}

interface BroadcastFormData {
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'system';
  isImportant: boolean;
  targetAudience: 'all' | 'users' | 'sellers' | 'specific_users' | 'specific_sellers';
  selectedUsers: number[];
  selectedSellers: number[];
  sendPushNotification: boolean;
  pushNotificationType: 'in_app_only' | 'push_only' | 'both';
}

export default function AdminNotifications() {
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [userSearchOpen, setUserSearchOpen] = useState(false);
  const [sellerSearchOpen, setSellerSearchOpen] = useState(false);
  const [formData, setFormData] = useState<BroadcastFormData>({
    title: '',
    message: '',
    type: 'info',
    isImportant: false,
    targetAudience: 'all',
    selectedUsers: [],
    selectedSellers: [],
    sendPushNotification: false,
    pushNotificationType: 'in_app_only',
  });
  const [previewData, setPreviewData] = useState<BroadcastFormData | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch admin-created notifications only
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/notifications/admin'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/notifications?populate=*&sort=createdAt:desc&filters%5BisAdminCreated%5D%5B%24eq%5D=true'));
      if (!response.ok) throw new Error('Failed to fetch notifications');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch users for specific targeting
  const { data: users } = useQuery({
    queryKey: ['/api/users'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/users?populate[role]=*');
      const data = await response.json();
      console.log('🔍 All users fetched:', data?.length || 0);
      return data || [];
    },
  });

  // Fetch sellers (users with seller role)
  const { data: sellers } = useQuery({
    queryKey: ['/api/users/sellers'],
    queryFn: async () => {
      // Try role name first (works for sellers)
      const response = await apiRequest('GET', '/api/users?populate[role]=*&filters[role][name][$eq]=seller');
      const data = await response.json();
      console.log('🔍 Sellers fetched by name:', data?.length || 0);
      return data || [];
    },
  });

  // Fetch authenticated users (users with authenticated role)
  const { data: authenticatedUsers } = useQuery({
    queryKey: ['/api/users/authenticated'],
    queryFn: async () => {
      // Try role ID 1 (this works)
      const response = await apiRequest('GET', '/api/users?populate=*&filters%5Brole%5D%5Bid%5D%5B%24eq%5D=1');
      const data = await response.json();
      console.log('🔍 Authenticated users fetched by ID:', data?.length || 0);
      return data || [];
    },
  });

  // Fetch push notification statistics
  const { data: pushNotificationStats } = useQuery({
    queryKey: ['/api/notifications/push/stats'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/notifications/push/stats'));
      if (!response.ok) throw new Error('Failed to fetch push notification stats');
      const data = await response.json();
      return data.data || { totalUsers: 0, totalVendors: 0, totalDevices: 0 };
    },
  });

  // Create notification mutation
  const createNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      const response = await apiRequest('POST', '/api/notifications', {
        data: notificationData,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/admin'] });
      toast({
        title: 'Notification Sent',
        description: 'Your notification has been sent successfully!',
      });
      setIsCreateDialogOpen(false);
      setFormData({
        title: '',
        message: '',
        type: 'info',
        isImportant: false,
        targetAudience: 'all',
        selectedUsers: [],
        selectedSellers: [],
        sendPushNotification: false,
        pushNotificationType: 'in_app_only',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notification',
        variant: 'destructive',
      });
    },
  });

  // Delete notification mutation
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/admin'] });
      toast({
        title: 'Notification Deleted',
        description: 'Notification has been deleted successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete notification',
        variant: 'destructive',
      });
    },
  });

  const handleInputChange = (field: keyof BroadcastFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePreview = () => {
    setPreviewData(formData);
    setIsPreviewDialogOpen(true);
  };

  const handleSendNotification = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: 'Validation Error',
        description: 'Title and message are required',
        variant: 'destructive',
      });
      return;
    }

    try {
      let targetUsers: any[] = [];
      let targetVendors: any[] = [];

      // Determine target audience
              switch (formData.targetAudience) {
          case 'all':
            targetUsers = authenticatedUsers || [];
            targetVendors = sellers || [];
            break;
        case 'users':
          targetUsers = authenticatedUsers || [];
          break;
        case 'sellers':
          targetVendors = sellers || [];
          break;
        case 'specific_users':
          targetUsers = authenticatedUsers?.filter((user: any) => formData.selectedUsers.includes(user.id)) || [];
          break;
        case 'specific_sellers':
          targetVendors = sellers?.filter((seller: any) => formData.selectedSellers.includes(seller.id)) || [];
          break;
      }

      // Prepare bulk notification data
      const notifications = [];

      // Add user notifications
      targetUsers.forEach((user: any) => {
        notifications.push({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          isImportant: formData.isImportant,
          user: user.id,
          isAdminCreated: true,
        });
      });

      // Add vendor notifications
      targetVendors.forEach((seller: any) => {
        notifications.push({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          isImportant: formData.isImportant,
          vendor: seller.id,
          isAdminCreated: true,
        });
      });

      if (notifications.length === 0) {
        toast({
          title: 'No Recipients',
          description: 'No users or sellers found to send notifications to',
          variant: 'destructive',
        });
        return;
      }

      // Handle push notifications if enabled
      if (formData.sendPushNotification) {
        try {
          const pushNotificationData = {
            notification: {
              title: formData.title,
              message: formData.message,
              type: formData.type
            },
            data: {
              type: formData.type,
              isImportant: formData.isImportant.toString(),
              isAdminCreated: 'true'
            }
          };

          // Send push notifications based on target audience
          if (formData.pushNotificationType === 'push_only' || formData.pushNotificationType === 'both') {
            if (targetUsers.length > 0) {
              const userIds = targetUsers.map((user: any) => user.id);
              await apiRequest('POST', '/api/notifications/push/users', {
                userIds,
                ...pushNotificationData
              });
            }

            if (targetVendors.length > 0) {
              const vendorIds = targetVendors.map((vendor: any) => vendor.id);
              await apiRequest('POST', '/api/notifications/push/vendors', {
                vendorIds,
                ...pushNotificationData
              });
            }
          }

          // Send in-app notifications if not push-only
          if (formData.pushNotificationType === 'in_app_only' || formData.pushNotificationType === 'both') {
            const response = await apiRequest('POST', '/api/notifications/bulk', {
              notifications,
              targetAudience: formData.targetAudience,
            });
            const result = await response.json();
          }

          toast({
            title: 'Broadcast Complete',
            description: `Notification sent to ${notifications.length} recipients${
              formData.pushNotificationType !== 'in_app_only' ? ' (including push notifications)' : ''
            }`,
          });
        } catch (pushError: any) {
          console.error('Push notification error:', pushError);
          toast({
            title: 'Push Notification Error',
            description: 'In-app notifications sent, but push notifications failed',
            variant: 'destructive',
          });
        }
      } else {
        // Send only in-app notifications
        const response = await apiRequest('POST', '/api/notifications/bulk', {
          notifications,
          targetAudience: formData.targetAudience,
        });

        const result = await response.json();

        toast({
          title: 'Broadcast Complete',
          description: result.message || `Notification sent to ${notifications.length} recipients`,
        });
      }

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        isImportant: false,
        targetAudience: 'all',
        selectedUsers: [],
        selectedSellers: [],
        sendPushNotification: false,
        pushNotificationType: 'in_app_only',
      });

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send notifications',
        variant: 'destructive',
      });
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTargetAudienceCount = (targetAudience: string) => {
    switch (targetAudience) {
              case 'all':
          return (authenticatedUsers?.length || 0) + (sellers?.length || 0);
      case 'users':
        return authenticatedUsers?.length || 0;
      case 'sellers':
        return sellers?.length || 0;
      case 'specific_users':
        return formData.selectedUsers.length;
      case 'specific_sellers':
        return formData.selectedSellers.length;
      default:
        return 0;
    }
  };

  if (notificationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      
      <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Notification Management 🔔
              </h2>
              <p className="text-gray-600">Broadcast messages to users and sellers</p>
            </div>
          </div>
        </div>

        {/* Action Button - Fixed positioning */}
        <div className="mb-8 flex justify-end">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <i className="fas fa-plus mr-2"></i>
                Send Notification
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Send Broadcast Notification</DialogTitle>
                  <DialogDescription>
                    Create and send notifications to your platform users and sellers.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title">Notification Title *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Enter notification title"
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder="Enter notification message"
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="type">Notification Type</Label>
                      <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="success">Success</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="error">Error</SelectItem>
                          <SelectItem value="system">System</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="targetAudience">Target Audience</Label>
                      <Select value={formData.targetAudience} onValueChange={(value) => handleInputChange('targetAudience', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users & Sellers</SelectItem>
                          <SelectItem value="users">Users Only</SelectItem>
                          <SelectItem value="sellers">Sellers Only</SelectItem>
                          <SelectItem value="specific_users">Specific Users</SelectItem>
                          <SelectItem value="specific_sellers">Specific Sellers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {formData.targetAudience === 'specific_users' && (
                    <div>
                      <Label htmlFor="selectedUsers">Select Users</Label>
                      <Popover open={userSearchOpen} onOpenChange={setUserSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={userSearchOpen}
                            className="w-full justify-between"
                          >
                            {formData.selectedUsers.length > 0
                              ? `${formData.selectedUsers.length} user(s) selected`
                              : "Select users..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search users..." />
                            <CommandList>
                              <CommandEmpty>No users found.</CommandEmpty>
                                                  <CommandGroup>
                      {authenticatedUsers?.map((user: any) => (
                                  <CommandItem
                                    key={user.id}
                                    onSelect={() => {
                                      const isSelected = formData.selectedUsers.includes(user.id);
                                      if (isSelected) {
                                        handleInputChange('selectedUsers', formData.selectedUsers.filter(id => id !== user.id));
                                      } else {
                                        handleInputChange('selectedUsers', [...formData.selectedUsers, user.id]);
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.selectedUsers.includes(user.id) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {user.username || user.email}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {formData.selectedUsers.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            Selected: {formData.selectedUsers.length} user(s)
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {authenticatedUsers?.filter((user: any) => formData.selectedUsers.includes(user.id)).map((user: any) => (
                              <Badge key={user.id} variant="secondary" className="text-xs">
                                {user.username || user.email}
                                <button
                                  onClick={() => handleInputChange('selectedUsers', formData.selectedUsers.filter(id => id !== user.id))}
                                  className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {formData.targetAudience === 'specific_sellers' && (
                    <div>
                      <Label htmlFor="selectedSellers">Select Sellers</Label>
                      <Popover open={sellerSearchOpen} onOpenChange={setSellerSearchOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={sellerSearchOpen}
                            className="w-full justify-between"
                          >
                            {formData.selectedSellers.length > 0
                              ? `${formData.selectedSellers.length} seller(s) selected`
                              : "Select sellers..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                          <Command>
                            <CommandInput placeholder="Search sellers..." />
                            <CommandList>
                              <CommandEmpty>No sellers found.</CommandEmpty>
                              <CommandGroup>
                                {sellers?.map((seller: any) => (
                                  <CommandItem
                                    key={seller.id}
                                    onSelect={() => {
                                      const isSelected = formData.selectedSellers.includes(seller.id);
                                      if (isSelected) {
                                        handleInputChange('selectedSellers', formData.selectedSellers.filter(id => id !== seller.id));
                                      } else {
                                        handleInputChange('selectedSellers', [...formData.selectedSellers, seller.id]);
                                      }
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.selectedSellers.includes(seller.id) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                                                         {seller.username || seller.email}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {formData.selectedSellers.length > 0 && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600">
                            Selected: {formData.selectedSellers.length} seller(s)
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {sellers?.filter((seller: any) => formData.selectedSellers.includes(seller.id)).map((seller: any) => (
                              <Badge key={seller.id} variant="secondary" className="text-xs">
                                {seller.username || seller.email}
                                <button
                                  onClick={() => handleInputChange('selectedSellers', formData.selectedSellers.filter(id => id !== seller.id))}
                                  className="ml-1 text-gray-500 hover:text-gray-700"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}



                  {/* Push Notification Options */}
                  <div className="space-y-4 border-t pt-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="sendPushNotification"
                        checked={formData.sendPushNotification}
                        onCheckedChange={(checked) => handleInputChange('sendPushNotification', checked)}
                      />
                      <Label htmlFor="sendPushNotification" className="font-medium">Send Push Notification</Label>
                    </div>

                    {formData.sendPushNotification && (
                      <div className="ml-6 space-y-3">
                        <div>
                          <Label htmlFor="pushNotificationType">Notification Type</Label>
                          <Select 
                            value={formData.pushNotificationType} 
                            onValueChange={(value) => handleInputChange('pushNotificationType', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_app_only">In-App Only</SelectItem>
                              <SelectItem value="push_only">Push Only</SelectItem>
                              <SelectItem value="both">Both (In-App + Push)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="bg-yellow-50 p-3 rounded-lg">
                          <p className="text-sm text-yellow-800">
                            <i className="fas fa-bell mr-2"></i>
                            <strong>Push notifications</strong> will be sent to mobile devices with the app installed.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isImportant"
                      checked={formData.isImportant}
                      onCheckedChange={(checked) => handleInputChange('isImportant', checked)}
                    />
                    <Label htmlFor="isImportant">Mark as Important</Label>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <i className="fas fa-info-circle mr-2"></i>
                      This notification will be sent to <strong>{getTargetAudienceCount(formData.targetAudience)} recipients</strong>
                    </p>
                  </div>
                </div>

                <DialogFooter className="sticky bottom-0 bg-white border-t pt-4 mt-4">
                  <Button variant="outline" onClick={handlePreview}>
                    Preview
                  </Button>
                  <Button 
                    onClick={handleSendNotification}
                    disabled={createNotificationMutation.isPending}
                  >
                    {createNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications?.length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-bell text-blue-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Unread</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications?.filter((n: Notification) => !n.isRead).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-envelope text-yellow-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Important</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications?.filter((n: Notification) => n.isImportant).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-exclamation-triangle text-red-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Today</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {notifications?.filter((n: Notification) => {
                      const today = new Date().toDateString();
                      const notificationDate = new Date(n.createdAt).toDateString();
                      return today === notificationDate;
                    }).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-day text-green-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Push Devices</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {pushNotificationStats?.totalDevices || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    {pushNotificationStats?.totalUsers || 0} users, {pushNotificationStats?.totalVendors || 0} vendors
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-mobile-alt text-purple-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Count Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {users?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    All registered users
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-green-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Authenticated Users</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {authenticatedUsers?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    Users with authenticated role
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-user text-purple-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sellers?.length || 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    Users with seller role
                  </p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-store text-orange-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Admin Broadcast Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications?.map((notification: Notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <Badge className={getTypeColor(notification.type)}>
                        {notification.type}
                      </Badge>
                    </TableCell>
                                         <TableCell className="font-medium">
                       <div className="flex items-center">
                         <span>{notification.title}</span>
                         {notification.isImportant && (
                           <i className="fas fa-star text-yellow-500 ml-2"></i>
                         )}
                         <Badge variant="outline" className="ml-2 text-xs">
                           Admin Broadcast
                         </Badge>
                       </div>
                     </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {notification.message}
                    </TableCell>
                    <TableCell>
                      {notification.user ? (
                        <span className="text-blue-600">User</span>
                      ) : notification.vendor ? (
                        <span className="text-green-600">Seller</span>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={notification.isRead ? "outline" : "default"}>
                        {notification.isRead ? "Read" : "Unread"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <i className="fas fa-trash text-red-500"></i>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Notification Preview</DialogTitle>
              <DialogDescription>
                This is how your notification will appear to recipients.
              </DialogDescription>
            </DialogHeader>
            
            {previewData && (
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{previewData.title}</h3>
                    <Badge className={getTypeColor(previewData.type)}>
                      {previewData.type}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-3">{previewData.message}</p>
                  {previewData.isImportant && (
                    <div className="mt-2 text-yellow-600 text-sm">
                      <i className="fas fa-star mr-1"></i>
                      Important notification
                    </div>
                  )}
                </div>
                
                <div className="text-sm text-gray-500">
                  <p>Target Audience: <strong>{previewData.targetAudience}</strong></p>
                  <p>Recipients: <strong>{getTargetAudienceCount(previewData.targetAudience)}</strong></p>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
} 