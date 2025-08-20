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
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useToast } from '@/hooks/use-toast';
import { getApiUrl } from '@/lib/config';
import { apiRequest } from '@/lib/queryClient';

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
  targetAudience: 'all' | 'users' | 'sellers' | 'specific';
  actionUrl?: string;
  actionText?: string;
}

export default function AdminNotifications() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [formData, setFormData] = useState<BroadcastFormData>({
    title: '',
    message: '',
    type: 'info',
    isImportant: false,
    targetAudience: 'all',
    actionUrl: '',
    actionText: '',
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
      const response = await fetch(getApiUrl('/api/users?populate=*'));
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      return data.data || [];
    },
  });

  // Fetch vendors for specific targeting
  const { data: vendors } = useQuery({
    queryKey: ['/api/vendors'],
    queryFn: async () => {
      const response = await fetch(getApiUrl('/api/vendors?populate=*'));
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      return data.data || [];
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
        actionUrl: '',
        actionText: '',
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
          targetUsers = users || [];
          targetVendors = vendors || [];
          break;
        case 'users':
          targetUsers = users || [];
          break;
        case 'sellers':
          targetVendors = vendors || [];
          break;
        case 'specific':
          // For specific targeting, you might want to add a selection UI
          break;
      }

      // Prepare bulk notification data
      const notifications = [];

      // Add user notifications
      targetUsers.forEach(user => {
        notifications.push({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          isImportant: formData.isImportant,
          actionUrl: formData.actionUrl,
          actionText: formData.actionText,
          user: user.id,
          isAdminCreated: true,
        });
      });

      // Add vendor notifications
      targetVendors.forEach(vendor => {
        notifications.push({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          isImportant: formData.isImportant,
          actionUrl: formData.actionUrl,
          actionText: formData.actionText,
          vendor: vendor.id,
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

      // Send bulk notifications
      const response = await apiRequest('POST', '/api/notifications/bulk', {
        notifications,
      });

      const result = await response.json();

      toast({
        title: 'Broadcast Complete',
        description: result.message || `Notification sent to ${notifications.length} recipients`,
      });

      // Reset form
      setFormData({
        title: '',
        message: '',
        type: 'info',
        isImportant: false,
        targetAudience: 'all',
        actionUrl: '',
        actionText: '',
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
        return (users?.length || 0) + (vendors?.length || 0);
      case 'users':
        return users?.length || 0;
      case 'sellers':
        return vendors?.length || 0;
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
            <DialogContent className="max-w-2xl">
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
                          <SelectItem value="specific">Specific Users</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="actionUrl">Action URL (Optional)</Label>
                      <Input
                        id="actionUrl"
                        value={formData.actionUrl}
                        onChange={(e) => handleInputChange('actionUrl', e.target.value)}
                        placeholder="https://example.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="actionText">Action Button Text (Optional)</Label>
                      <Input
                        id="actionText"
                        value={formData.actionText}
                        onChange={(e) => handleInputChange('actionText', e.target.value)}
                        placeholder="View Details"
                      />
                    </div>
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

                <DialogFooter>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  {previewData.actionText && (
                    <Button variant="outline" size="sm">
                      {previewData.actionText}
                    </Button>
                  )}
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