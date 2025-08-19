import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/ui/data-table';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAdminVendors, useUpdateVendorStatus, useDeleteVendor, useVendorStats, useVendorSubscriptions, useProductsWithVendors } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/config';

export default function AdminSellers() {
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({ status: '' });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch vendors using admin-specific hook
  const { data: vendors, isLoading: vendorsLoading } = useAdminVendors();
  const { data: vendorStats, isLoading: statsLoading } = useVendorStats();
  const { data: subscriptions, isLoading: subscriptionsLoading } = useVendorSubscriptions();
  const { data: products, isLoading: productsLoading } = useProductsWithVendors();

  const updateVendorStatusMutation = useMutation({
    mutationFn: useUpdateVendorStatus().mutateAsync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/admin/stats'] });
      setStatusUpdateDialog(false);
      setStatusUpdateData({ status: '' });
      toast({
        title: "Status Updated",
        description: "Vendor status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor status",
        variant: "destructive",
      });
    },
  });

  const deleteVendorMutation = useDeleteVendor();

  // Calculate product counts per vendor
  const getProductCount = (vendorId: number) => {
    if (!products || !Array.isArray(products)) return 0;
    return products.filter((product: any) => {
      // Handle different vendor ID formats
      const productVendorId = product.vendor?.id || product.vendorId;
      return productVendorId === vendorId;
    }).length;
  };

  // Get subscription for a vendor
  const getVendorSubscription = (vendorId: number) => {
    if (!subscriptions || !Array.isArray(subscriptions)) return null;
    return subscriptions.find((sub: any) => sub.vendor?.id === vendorId && sub.status === 'active');
  };

  // Get subscription badge
  const getSubscriptionBadge = (vendorId: number) => {
    const subscription = getVendorSubscription(vendorId);
    
    if (!subscription) {
      return <Badge variant="outline">No Subscription</Badge>;
    }
    
    // Handle different data structures
    const planName = subscription.plan?.name || subscription.plan?.data?.attributes?.name || 'Active Plan';
    const planPrice = subscription.plan?.price || subscription.plan?.data?.attributes?.price || subscription.amount || 0;
    const durationType = subscription.plan?.durationType || subscription.plan?.data?.attributes?.durationType || 'month';
    
    return (
      <div className="flex flex-col space-y-1">
        <Badge variant="default" className="text-xs">
          {planName}
        </Badge>
        <div className="text-xs text-gray-500">
          ₹{planPrice}/{durationType}
        </div>
      </div>
    );
  };


  const handleStatusUpdate = (vendor: any) => {
    setSelectedVendor(vendor);
    setStatusUpdateData({ status: vendor.status || 'pending' });
    setStatusUpdateDialog(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedVendor || !statusUpdateData.status) return;
    
    await updateVendorStatusMutation.mutateAsync({
      id: selectedVendor.id,
      status: statusUpdateData.status
    });
  };

  const handleDeleteVendor = (vendor: any) => {
    setVendorToDelete(vendor);
    setDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!vendorToDelete) return;
    
    try {
      await deleteVendorMutation.mutateAsync(vendorToDelete.id);
      toast({
        title: "Vendor Deleted",
        description: "Vendor has been deleted successfully.",
      });
      setDeleteDialog(false);
      setVendorToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vendor",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (vendor: any) => {
    if (vendor.status === 'pending') {
      return <Badge variant="secondary">Pending Approval</Badge>;
    }
    if (vendor.status === 'rejected') {
      return <Badge variant="destructive">Rejected</Badge>;
    }
    if (vendor.status === 'suspended') {
      return <Badge variant="destructive">Suspended</Badge>;
    }
    if (vendor.status === 'approved') {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  const getUserRole = (user: any) => {
    if (!user) return 'No User';
    return user.role?.name || 'Unknown';
  };

  if (vendorsLoading || statsLoading || subscriptionsLoading || productsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate subscription stats
  const totalSubscriptions = subscriptions?.length || 0;
  const activeSubscriptions = subscriptions?.filter((sub: any) => sub.status === 'active').length || 0;
  const expiredSubscriptions = subscriptions?.filter((sub: any) => sub.status === 'expired').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      
              <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
            <p className="text-gray-600">Manage all vendors and their products</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-3xl font-bold text-gray-900">{vendorStats?.totalVendors || 0}</p>
              </div>
            </CardContent>
          </Card>

          {/* <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                <p className="text-3xl font-bold text-gray-900">{vendorStats?.activeVendors || 0}</p>
              </div>
            </CardContent>
          </Card> */}

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                <p className="text-3xl font-bold text-gray-900">{vendorStats?.pendingVendors || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-3xl font-bold text-gray-900">{vendorStats?.approvedVendors || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">{activeSubscriptions}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-3xl font-bold text-gray-900">{vendorStats?.rejectedVendors || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>



        {/* Vendors Table */}
        <DataTable
          data={vendors || []}
          columns={[
            {
              key: 'vendor',
              header: 'Vendor',
              width: '300px',
              render: (_, vendor) => (
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage 
                      src={vendor.profileImage ? getImageUrl(vendor.profileImage.url || vendor.profileImage.data?.attributes?.url) : undefined} 
                      alt={vendor.name}
                    />
                    <AvatarFallback className="bg-primary text-white">
                      {vendor.name?.charAt(0)?.toUpperCase() || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{vendor.name}</div>
                    <div className="text-sm text-gray-500">{vendor.address}</div>
                  </div>
                </div>
              )
            },
            {
              key: 'user.username',
              header: 'User',
              width: '200px',
              sortable: true,
              render: (_, vendor) => (
                <div>
                  <div className="font-medium">{vendor.user?.username || 'No User'}</div>
                  <div className="text-sm text-gray-500">{vendor.user?.email}</div>
                  <div className="text-xs text-gray-400">{getUserRole(vendor.user)}</div>
                </div>
              )
            },
            {
              key: 'contact',
              header: 'Contact',
              width: '200px',
              sortable: true,
              render: (_, vendor) => (
                <div>
                  <div className="text-sm">{vendor.contact}</div>
                  <div className="text-sm text-gray-500">{vendor.email}</div>
                </div>
              )
            },
            {
              key: 'products',
              header: 'Products',
              width: '120px',
              sortable: true,
              render: (_, vendor) => (
                <div className="text-center">
                  <div className="font-medium">{getProductCount(vendor.id)}</div>
                  <div className="text-sm text-gray-500">products</div>
                </div>
              )
            },
            {
              key: 'subscription',
              header: 'Subscription',
              width: '150px',
              sortable: true,
              render: (_, vendor) => getSubscriptionBadge(vendor.id)
            },
            {
              key: 'status',
              header: 'Status',
              width: '150px',
              sortable: true,
              render: (_, vendor) => getStatusBadge(vendor)
            },
            {
              key: 'actions',
              header: 'Actions',
              width: '200px',
              render: (_, vendor) => (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(vendor);
                    }}
                  >
                    Update Status
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVendor(vendor);
                    }}
                  >
                    Delete
                  </Button>
                </div>
              )
            }
          ]}
          title={`Vendors (${vendors?.length || 0})`}
          searchable={true}
          searchPlaceholder="Search vendors by name, address, contact, or user..."
          searchKeys={['name', 'address', 'contact', 'email', 'user.username', 'user.email']}
          pageSize={10}
          emptyMessage="No vendors found"
        />

        {/* Status Update Dialog */}
        <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Vendor Status</DialogTitle>
              <DialogDescription>
                Update the status for {selectedVendor?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Vendor Details */}
              {selectedVendor && (
                <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage 
                      src={selectedVendor.profileImage ? getImageUrl(selectedVendor.profileImage.url || selectedVendor.profileImage.data?.attributes?.url) : undefined} 
                      alt={selectedVendor.name}
                    />
                    <AvatarFallback className="bg-primary text-white text-lg">
                      {selectedVendor.name?.charAt(0)?.toUpperCase() || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-semibold text-lg">{selectedVendor.name}</div>
                    <div className="text-sm text-gray-600">{selectedVendor.address}</div>
                    <div className="text-sm text-gray-500">{selectedVendor.contact}</div>
                    <div className="text-xs text-gray-400">Current Status: {selectedVendor.status || 'pending'}</div>
                    {/* Subscription Info */}
                    <div className="mt-2">
                      {getSubscriptionBadge(selectedVendor.id)}
                    </div>
                  </div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium">Status</label>
                <Select 
                  value={statusUpdateData.status} 
                  onValueChange={(value) => setStatusUpdateData(prev => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="suspended">Suspended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setStatusUpdateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleStatusSubmit}
                  disabled={updateVendorStatusMutation.isPending}
                >
                  {updateVendorStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Vendor</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{vendorToDelete?.name}</strong>? 
                This action cannot be undone.
                {vendorToDelete?.products?.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-yellow-800 text-sm">
                      ⚠️ This vendor has {vendorToDelete.products.length} product(s). 
                      You may want to delete the products first.
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            {/* Vendor Details in Delete Dialog */}
            {vendorToDelete && (
              <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg my-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage 
                    src={vendorToDelete.profileImage ? getImageUrl(vendorToDelete.profileImage.url || vendorToDelete.profileImage.data?.attributes?.url) : undefined} 
                    alt={vendorToDelete.name}
                  />
                  <AvatarFallback className="bg-primary text-white text-lg">
                    {vendorToDelete.name?.charAt(0)?.toUpperCase() || 'V'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="font-semibold text-lg">{vendorToDelete.name}</div>
                  <div className="text-sm text-gray-600">{vendorToDelete.address}</div>
                  <div className="text-sm text-gray-500">{vendorToDelete.contact}</div>
                  <div className="text-xs text-gray-400">Status: {vendorToDelete.status || 'pending'}</div>
                  {/* Subscription Info */}
                  <div className="mt-2">
                    {getSubscriptionBadge(vendorToDelete.id)}
                  </div>
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={confirmDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteVendorMutation.isPending}
              >
                {deleteVendorMutation.isPending ? 'Deleting...' : 'Delete Vendor'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </main>
    </div>
  );
}

