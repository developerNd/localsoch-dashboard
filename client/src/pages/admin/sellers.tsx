import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAdminVendors, useUpdateVendorStatus, useDeleteVendor, useVendorStats } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';

export default function AdminSellers() {
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({ status: '', reason: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch vendors using admin-specific hook
  const { data: vendors, isLoading: vendorsLoading } = useAdminVendors();
  const { data: vendorStats, isLoading: statsLoading } = useVendorStats();

  const updateVendorStatusMutation = useMutation({
    mutationFn: useUpdateVendorStatus().mutateAsync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/admin/stats'] });
      setStatusUpdateDialog(false);
      setStatusUpdateData({ status: '', reason: '' });
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

  const deleteVendorMutation = useMutation({
    mutationFn: useDeleteVendor().mutateAsync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors/admin/stats'] });
      toast({
        title: "Vendor Deleted",
        description: "Vendor has been deleted successfully.",
        variant: "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete vendor",
        variant: "destructive",
      });
    },
  });

  // Calculate product counts per vendor
  const getProductCount = (vendorId: number) => {
    if (!vendors || !Array.isArray(vendors)) return 0;
    const vendor = vendors.find((v: any) => v.id === vendorId);
    return vendor?.products?.length || 0;
  };

  // Filter vendors based on search and status
  const filteredVendors = Array.isArray(vendors) ? vendors.filter((vendor: any) => {
    const matchesSearch = vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.contact?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vendor.user?.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    if (statusFilter === 'active') return matchesSearch && getProductCount(vendor.id) > 0;
    if (statusFilter === 'inactive') return matchesSearch && getProductCount(vendor.id) === 0;
    if (statusFilter === 'pending') return matchesSearch && vendor.status === 'pending';
    if (statusFilter === 'approved') return matchesSearch && vendor.status === 'approved';
    if (statusFilter === 'rejected') return matchesSearch && vendor.status === 'rejected';
    if (statusFilter === 'suspended') return matchesSearch && vendor.status === 'suspended';
    
    return matchesSearch;
  }) : [];

  const activeVendors = Array.isArray(vendors) ? vendors.filter((vendor: any) => getProductCount(vendor.id) > 0) : [];
  const inactiveVendors = Array.isArray(vendors) ? vendors.filter((vendor: any) => getProductCount(vendor.id) === 0) : [];
  const pendingVendors = Array.isArray(vendors) ? vendors.filter((vendor: any) => vendor.status === 'pending') : [];
  const approvedVendors = Array.isArray(vendors) ? vendors.filter((vendor: any) => vendor.status === 'approved') : [];
  const rejectedVendors = Array.isArray(vendors) ? vendors.filter((vendor: any) => vendor.status === 'rejected') : [];
  const suspendedVendors = Array.isArray(vendors) ? vendors.filter((vendor: any) => vendor.status === 'suspended') : [];

  const handleStatusUpdate = (vendor: any) => {
    setSelectedVendor(vendor);
    setStatusUpdateDialog(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedVendor || !statusUpdateData.status) return;
    
    await updateVendorStatusMutation.mutateAsync({
      id: selectedVendor.id,
      status: statusUpdateData.status,
      reason: statusUpdateData.reason
    });
  };

  const handleDeleteVendor = async (vendorId: number) => {
    if (confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      await deleteVendorMutation.mutateAsync(vendorId);
    }
  };

  const getStatusBadge = (vendor: any) => {
    const productCount = getProductCount(vendor.id);
    
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
      if (productCount > 0) {
        return <Badge variant="default">Active ({productCount} products)</Badge>;
      }
      return <Badge variant="outline">Approved</Badge>;
    }
    return <Badge variant="outline">Inactive</Badge>;
  };

  const getUserRole = (user: any) => {
    if (!user) return 'No User';
    return user.role?.name || 'Unknown';
  };

  if (vendorsLoading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      
      <main className="flex-1 lg:ml-64 pt-16 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vendor Management</h2>
            <p className="text-gray-600">Manage all vendors and their products</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-users text-primary text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorStats?.totalVendors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-check-circle text-success text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorStats?.activeVendors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-clock text-warning text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Approval</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorStats?.pendingVendors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-info/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-thumbs-up text-info text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorStats?.approvedVendors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-thumbs-down text-destructive text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Rejected</p>
                  <p className="text-2xl font-bold text-gray-900">{vendorStats?.rejectedVendors || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search vendors by name, address, contact, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending Approval</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vendors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vendors ({filteredVendors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendor</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVendors.map((vendor: any) => (
                    <TableRow key={vendor.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={vendor.profileImage?.url} />
                            <AvatarFallback>{vendor.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{vendor.name}</div>
                            <div className="text-sm text-gray-500">{vendor.address}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{vendor.user?.username || 'No User'}</div>
                          <div className="text-sm text-gray-500">{vendor.user?.email}</div>
                          <div className="text-xs text-gray-400">{getUserRole(vendor.user)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm">{vendor.contact}</div>
                          <div className="text-sm text-gray-500">{vendor.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <div className="font-medium">{getProductCount(vendor.id)}</div>
                          <div className="text-sm text-gray-500">products</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(vendor)}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusUpdate(vendor)}
                          >
                            Update Status
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteVendor(vendor.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

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
              <div>
                <label className="text-sm font-medium">Reason (Optional)</label>
                <Textarea
                  placeholder="Enter reason for status change..."
                  value={statusUpdateData.reason}
                  onChange={(e) => setStatusUpdateData(prev => ({ ...prev, reason: e.target.value }))}
                />
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
      </main>
    </div>
  );
}

