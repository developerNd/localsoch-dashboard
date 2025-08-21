import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/ui/data-table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAdminVendors, useUpdateVendorStatus, useDeleteVendor, useVendorStats, useVendorSubscriptions, useProductsWithVendors } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl, getApiUrl, API_ENDPOINTS } from '@/lib/config';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  CreditCard, 
  FileText, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Edit,
  Eye,
  Trash2,
  Store,
  Package,
  DollarSign
} from 'lucide-react';

export default function AdminSellers() {
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({ 
    status: '', 
    statusReason: '',
    businessCategoryId: ''
  });
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<any>(null);
  const [viewDetailsDialog, setViewDetailsDialog] = useState(false);
  const [vendorToView, setVendorToView] = useState<any>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch vendors using admin-specific hook
  const { data: vendors, isLoading: vendorsLoading } = useAdminVendors();
  const { data: vendorStats, isLoading: statsLoading } = useVendorStats();
  const { data: subscriptions, isLoading: subscriptionsLoading } = useVendorSubscriptions();
  const { data: products, isLoading: productsLoading } = useProductsWithVendors();

  // Fetch business categories
  const { data: businessCategories, isLoading: businessCategoriesLoading } = useQuery({
    queryKey: ['/api/business-categories'],
    queryFn: async () => {
      try {
        console.log('🔍 Fetching business categories...');
        const response = await fetch(getApiUrl(API_ENDPOINTS.BUSINESS_CATEGORIES));
        const data = await response.json();
        console.log('✅ Business categories response:', data);
        const categories = data.data || [];
        console.log(`📊 Loaded ${categories.length} business categories:`, categories.map((cat: any) => cat.attributes?.name || cat.name));
        return categories;
      } catch (error) {
        console.error('❌ Error fetching business categories:', error);
        return [];
      }
    },
  });

  useEffect(() => {
    if (businessCategoriesLoading) {
      console.log('Business categories are loading...');
    } else {
      console.log(`Business categories loaded: ${businessCategories?.length || 0}`);
    }
  }, [businessCategoriesLoading, businessCategories]);

  const updateVendorStatusMutation = useMutation({
    mutationFn: useUpdateVendorStatus().mutateAsync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/admin/stats'] });
      setStatusUpdateDialog(false);
      setStatusUpdateData({ status: '', statusReason: '', businessCategoryId: '' });
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
    console.log('🔍 handleStatusUpdate called for vendor:', vendor.name);
    console.log('🔍 Vendor business category:', vendor.businessCategory);
    console.log('🔍 Vendor business category ID:', vendor.businessCategory?.id);
    
    setSelectedVendor(vendor);
    setStatusUpdateData({ 
      status: vendor.status || 'pending',
      statusReason: vendor.statusReason || '',
      businessCategoryId: vendor.businessCategory?.id?.toString() || ''
    });
    console.log('🔍 Set statusUpdateData businessCategoryId to:', vendor.businessCategory?.id?.toString() || '');
    setStatusUpdateDialog(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedVendor || !statusUpdateData.status) return;
    
    const updateData: any = {
      id: selectedVendor.id,
      status: statusUpdateData.status,
      statusReason: statusUpdateData.statusReason,
      statusUpdatedAt: new Date().toISOString()
    };

    // Add business category if selected
    if (statusUpdateData.businessCategoryId) {
      updateData.businessCategory = parseInt(statusUpdateData.businessCategoryId);
      console.log('🔍 Sending business category ID:', updateData.businessCategory);
    }
    
    console.log('🔍 Final update data being sent:', updateData);
    await updateVendorStatusMutation.mutateAsync(updateData);
  };

  const handleDeleteVendor = (vendor: any) => {
    setVendorToDelete(vendor);
    setDeleteDialog(true);
  };

  const handleViewDetails = (vendor: any) => {
    setVendorToView(vendor);
    setViewDetailsDialog(true);
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
      return <Badge variant="secondary" className="flex items-center gap-1"><Clock className="w-3 h-3" />Pending</Badge>;
    }
    if (vendor.status === 'rejected') {
      return <Badge variant="destructive" className="flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</Badge>;
    }
    if (vendor.status === 'suspended') {
      return <Badge variant="destructive" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />Suspended</Badge>;
    }
    if (vendor.status === 'approved') {
      return <Badge variant="default" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Active</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  const getUserRole = (user: any) => {
    if (!user) return 'No User';
    return user.role?.name || 'Unknown';
  };

  const getBusinessCategoryName = (vendor: any) => {
    console.log('🔍 getBusinessCategoryName for vendor:', vendor.name, 'businessCategory:', vendor.businessCategory);
    const categoryName = vendor.businessCategory?.name || vendor.businessCategory?.data?.attributes?.name || 'Not Assigned';
    console.log('🔍 Category name resolved to:', categoryName);
    return categoryName;
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

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{products?.length || 0}</p>
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
                    <div className="text-xs text-gray-400">{getBusinessCategoryName(vendor)}</div>
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
                  <div className="text-xs text-gray-400">{vendor.whatsapp}</div>
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
              width: '250px',
              render: (_, vendor) => (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(vendor);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(vendor);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Update
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteVendor(vendor);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
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

        {/* Enhanced Status Update Dialog */}
        <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Update Vendor Status & Details</DialogTitle>
              <DialogDescription>
                Update the status and business category for {selectedVendor?.name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Vendor Details */}
              {selectedVendor && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
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
                      <div className="text-sm text-gray-500">{selectedVendor.contact} • {selectedVendor.email}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        Current Status: <span className="font-medium">{selectedVendor.status || 'pending'}</span>
                      </div>
                      <div className="text-xs text-gray-400">
                        Business Category: <span className="font-medium">{getBusinessCategoryName(selectedVendor)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subscription Info */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="text-sm font-medium text-gray-700 mb-2">Subscription Status</div>
                    {getSubscriptionBadge(selectedVendor.id)}
                  </div>
                </div>
              )}

              <Tabs defaultValue="status" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="status">Status Update</TabsTrigger>
                  <TabsTrigger value="category">Business Category</TabsTrigger>
                </TabsList>
                
                <TabsContent value="status" className="space-y-4">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={statusUpdateData.status} 
                      onValueChange={(value) => setStatusUpdateData(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending Approval</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="statusReason">Status Reason (Optional)</Label>
                    <Textarea
                      id="statusReason"
                      placeholder="Enter reason for status change..."
                      value={statusUpdateData.statusReason}
                      onChange={(e) => setStatusUpdateData(prev => ({ ...prev, statusReason: e.target.value }))}
                      rows={3}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="category" className="space-y-4">
                  <div>
                    <Label htmlFor="businessCategory">Business Category</Label>
                    <Select 
                      value={statusUpdateData.businessCategoryId} 
                      onValueChange={(value) => setStatusUpdateData(prev => ({ ...prev, businessCategoryId: value }))}
                      disabled={businessCategoriesLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={businessCategoriesLoading ? "Loading categories..." : "Select business category"} />
                      </SelectTrigger>
                      <SelectContent>
                        {businessCategoriesLoading ? (
                          <SelectItem value="" disabled>Loading categories...</SelectItem>
                        ) : businessCategories && businessCategories.length > 0 ? (
                          businessCategories.map((category: any) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.attributes?.name || category.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="" disabled>No categories available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    {businessCategoriesLoading && (
                      <p className="text-sm text-gray-500 mt-1">Loading business categories...</p>
                    )}
                    {!businessCategoriesLoading && (!businessCategories || businessCategories.length === 0) && (
                      <p className="text-sm text-red-500 mt-1">No business categories found</p>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      Debug: {businessCategoriesLoading ? 'Loading...' : `${businessCategories?.length || 0} categories loaded`}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setStatusUpdateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleStatusSubmit}
                  disabled={updateVendorStatusMutation.isPending}
                >
                  {updateVendorStatusMutation.isPending ? 'Updating...' : 'Update Vendor'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Enhanced View Details Dialog */}
        <Dialog open={viewDetailsDialog} onOpenChange={setViewDetailsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vendor Details</DialogTitle>
              <DialogDescription>
                Complete information for {vendorToView?.name}
              </DialogDescription>
            </DialogHeader>
            
            {vendorToView && (
              <div className="space-y-6">
                {/* Header with Avatar and Basic Info */}
                <div className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg">
                  <Avatar className="h-20 w-20">
                    <AvatarImage 
                      src={vendorToView.profileImage ? getImageUrl(vendorToView.profileImage.url || vendorToView.profileImage.data?.attributes?.url) : undefined} 
                      alt={vendorToView.name}
                    />
                    <AvatarFallback className="bg-primary text-white text-xl">
                      {vendorToView.name?.charAt(0)?.toUpperCase() || 'V'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="font-bold text-xl">{vendorToView.name}</div>
                    <div className="text-gray-600">{vendorToView.description}</div>
                    <div className="flex items-center gap-4 mt-2">
                      {getStatusBadge(vendorToView)}
                      <Badge variant="outline">{getBusinessCategoryName(vendorToView)}</Badge>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                    <TabsTrigger value="business">Business</TabsTrigger>
                    <TabsTrigger value="products">Products</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                        <div className="text-sm">{vendorToView.name}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Description</Label>
                        <div className="text-sm">{vendorToView.description || 'No description'}</div>
                      </div>
                      <div className="col-span-2">
                        <Label className="text-sm font-medium text-gray-700">Address</Label>
                        <div className="text-sm">{vendorToView.address}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">City</Label>
                        <div className="text-sm">{vendorToView.city}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">State</Label>
                        <div className="text-sm">{vendorToView.state}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Pincode</Label>
                        <div className="text-sm">{vendorToView.pincode}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Status</Label>
                        <div className="text-sm">{getStatusBadge(vendorToView)}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="contact" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Contact Number</Label>
                        <div className="text-sm">{vendorToView.contact}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">WhatsApp</Label>
                        <div className="text-sm">{vendorToView.whatsapp}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <div className="text-sm">{vendorToView.email}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">User Account</Label>
                        <div className="text-sm">{vendorToView.user?.username || 'No user account'}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="business" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Business Category</Label>
                        <div className="text-sm">{getBusinessCategoryName(vendorToView)}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Business Type</Label>
                        <div className="text-sm">{vendorToView.businessType || 'Not specified'}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">GST Number</Label>
                        <div className="text-sm">{vendorToView.gstNumber || 'Not provided'}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Bank Account</Label>
                        <div className="text-sm">{vendorToView.bankAccountNumber || 'Not provided'}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">IFSC Code</Label>
                        <div className="text-sm">{vendorToView.ifscCode || 'Not provided'}</div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-gray-700">Subscription</Label>
                        <div className="text-sm">{getSubscriptionBadge(vendorToView.id)}</div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="products" className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Total Products</Label>
                      <div className="text-2xl font-bold">{getProductCount(vendorToView.id)}</div>
                    </div>
                    {/* Add product list here if needed */}
                  </TabsContent>
                </Tabs>
              </div>
            )}
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

