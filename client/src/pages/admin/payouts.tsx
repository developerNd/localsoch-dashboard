import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAdminVendors, useMarkOrderPayoutPaid } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { DollarSign, Building, CheckCircle, Clock, AlertCircle, Search, Filter } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getImageUrl } from '@/lib/config';

interface VendorPayoutSummary {
  vendorId: number;
  vendorName: string;
  vendorEmail?: string;
  vendorPhone?: string;
  vendorImage?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  ifscCode?: string;
  bankAccountType?: string;
  totalOrders: number;
  pendingOrders: number;
  paidOrders: number;
  totalRevenue: number;
  totalCommission: number;
  pendingPayoutAmount: number;
  paidPayoutAmount: number;
  orders: any[];
}

export default function AdminPayouts() {
  const [location] = useLocation();
  const [selectedVendor, setSelectedVendor] = useState<VendorPayoutSummary | null>(null);
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [vendorDetailsDialog, setVendorDetailsDialog] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [payoutData, setPayoutData] = useState({
    orderIds: [] as number[],
    payoutAmount: 0,
    commissionAmount: 0,
    commissionRate: 0.0, // Default 0%
    totalOrderAmount: 0,
    payoutNotes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'paid'>('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch vendors
  const { data: vendors, isLoading: vendorsLoading, refetch: refetchVendors } = useAdminVendors();
  
  // Fetch orders for payout calculation
  const { data: orders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery({
    queryKey: ['/api/orders/payouts'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/orders?admin=all&filters[status][$in][0]=delivered&filters[status][$in][1]=pickedUp&populate=*');
      const data = await response.json();
      return data.data || data || [];
    },
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    staleTime: 0, // Always consider data stale to ensure fresh data on navigation
  });

  const markPayoutPaidMutation = useMarkOrderPayoutPaid();

  // Refetch data when component mounts or when navigating to this page
  useEffect(() => {
    if (location === '/admin/payouts') {
      const refreshData = async () => {
        await Promise.all([refetchOrders(), refetchVendors()]);
      };
      refreshData();
    }
  }, [location, refetchOrders, refetchVendors]);

  // Calculate vendor payout summaries
  const vendorPayouts = useMemo(() => {
    if (!orders || orders.length === 0) return [];
    if (!vendors) return [];

    const vendorMap = new Map<number, VendorPayoutSummary>();

    orders.forEach((order: any) => {
      // Handle both Strapi v4 format (with attributes) and normalized format
      const orderData = order.attributes || order;
      let vendor = orderData.vendor || order.vendor;
      
      // Handle different vendor data structures
      if (!vendor) return;
      
      // If vendor is just an ID, try to find it in vendors list
      if (typeof vendor === 'number' || (typeof vendor === 'object' && vendor.id && Object.keys(vendor).length <= 2)) {
        const vendorIdNum = typeof vendor === 'number' ? vendor : vendor.id;
        if (vendors && Array.isArray(vendors)) {
          const foundVendor = vendors.find((v: any) => {
            const vId = v.id || v.attributes?.id || v.data?.id;
            return vId === vendorIdNum;
          });
          if (foundVendor) {
            vendor = foundVendor;
          } else {
            return; // Can't find vendor, skip this order
          }
        } else {
          return; // No vendors list available
        }
      }
      
      // Extract vendor ID from different possible structures
      const vendorId = vendor.id || vendor.data?.id || vendor.data?.attributes?.id || vendor.attributes?.id || null;
      if (!vendorId) return;

      const orderAmount = parseFloat(orderData.totalAmount || 0);
      const commissionAmount = parseFloat(orderData.commissionAmount || 0) || (orderAmount * 0.0); // Default 0%
      const payoutAmount = orderAmount - commissionAmount;
      const payoutStatus = orderData.payoutStatus || 'pending';

      if (!vendorMap.has(vendorId)) {
        // Try multiple ways to extract vendor data
        const vendorData = vendor.data?.attributes || vendor.attributes || vendor.data || vendor;
        
        // Also try to get vendor from vendors list if available (for complete data)
        let fullVendorData = vendorData;
        if (vendors && Array.isArray(vendors)) {
          const vendorFromList = vendors.find((v: any) => {
            const vId = v.id || v.attributes?.id || v.data?.id;
            return vId === vendorId;
          });
          if (vendorFromList) {
            const vData = vendorFromList.attributes || vendorFromList.data?.attributes || vendorFromList;
            fullVendorData = { ...vendorData, ...vData };
          }
        }
        
        vendorMap.set(vendorId, {
          vendorId,
          vendorName: fullVendorData.name || vendorData.name || vendor.name || 'Unknown Vendor',
          vendorEmail: fullVendorData.email || vendorData.email || vendor.email,
          vendorPhone: fullVendorData.contact || fullVendorData.phone || vendorData.contact || vendorData.phone || vendor.contact || vendor.phone,
          vendorImage: fullVendorData.profileImage?.url || fullVendorData.profileImage?.data?.attributes?.url || vendorData.profileImage?.url || vendorData.profileImage?.data?.attributes?.url || vendor.profileImage?.url || vendor.profileImage?.data?.attributes?.url,
          bankAccountName: fullVendorData.bankAccountName || vendorData.bankAccountName || vendor.bankAccountName,
          bankAccountNumber: fullVendorData.bankAccountNumber || vendorData.bankAccountNumber || vendor.bankAccountNumber,
          ifscCode: fullVendorData.ifscCode || vendorData.ifscCode || vendor.ifscCode,
          bankAccountType: fullVendorData.bankAccountType || vendorData.bankAccountType || vendor.bankAccountType,
          totalOrders: 0,
          pendingOrders: 0,
          paidOrders: 0,
          totalRevenue: 0,
          totalCommission: 0,
          pendingPayoutAmount: 0,
          paidPayoutAmount: 0,
          orders: [],
        });
      }

      const summary = vendorMap.get(vendorId)!;
      summary.totalOrders++;
      summary.totalRevenue += orderAmount;
      summary.totalCommission += commissionAmount;
      summary.orders.push({
        id: order.id,
        orderNumber: orderData.orderNumber,
        totalAmount: orderAmount,
        commissionAmount,
        payoutAmount,
        payoutStatus,
        payoutDate: orderData.payoutDate,
        payoutNotes: orderData.payoutNotes,
        createdAt: orderData.createdAt,
        status: orderData.status,
      });

      if (payoutStatus === 'paid') {
        summary.paidOrders++;
        summary.paidPayoutAmount += payoutAmount;
      } else {
        summary.pendingOrders++;
        summary.pendingPayoutAmount += payoutAmount;
      }
    });

    return Array.from(vendorMap.values()).sort((a, b) => b.pendingPayoutAmount - a.pendingPayoutAmount);
  }, [orders, vendors]);

  // Filter vendors based on search and status
  const filteredVendors = useMemo(() => {
    return vendorPayouts.filter((vendor) => {
      const matchesSearch = 
        vendor.vendorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.vendorEmail?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vendor.vendorPhone?.includes(searchQuery);
      
      const matchesStatus = 
        statusFilter === 'all' ||
        (statusFilter === 'pending' && vendor.pendingOrders > 0) ||
        (statusFilter === 'paid' && vendor.paidOrders > 0 && vendor.pendingOrders === 0);
      
      return matchesSearch && matchesStatus;
    });
  }, [vendorPayouts, searchQuery, statusFilter]);

  // Calculate totals
  const totals = useMemo(() => {
    return vendorPayouts.reduce((acc, vendor) => ({
      totalVendors: acc.totalVendors + 1,
      totalPendingAmount: acc.totalPendingAmount + vendor.pendingPayoutAmount,
      totalPaidAmount: acc.totalPaidAmount + vendor.paidPayoutAmount,
      totalCommission: acc.totalCommission + vendor.totalCommission,
      totalRevenue: acc.totalRevenue + vendor.totalRevenue,
    }), {
      totalVendors: 0,
      totalPendingAmount: 0,
      totalPaidAmount: 0,
      totalCommission: 0,
      totalRevenue: 0,
    });
  }, [vendorPayouts]);

  const handleMarkPayoutPaid = async (vendor: VendorPayoutSummary, orderIds?: number[]) => {
    const ordersToPay = orderIds || vendor.orders
      .filter((o: any) => o.payoutStatus === 'pending')
      .map((o: any) => o.id);
    
    if (ordersToPay.length === 0) {
      toast({
        title: "No Pending Orders",
        description: "This vendor has no pending payouts.",
        variant: "destructive",
      });
      return;
    }

    const selectedOrdersData = vendor.orders.filter((o: any) => ordersToPay.includes(o.id));
    const totalOrderAmount = selectedOrdersData.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
    const totalCommissionAmount = selectedOrdersData.reduce((sum: number, o: any) => sum + o.commissionAmount, 0);
    const totalPayoutAmount = selectedOrdersData.reduce((sum: number, o: any) => sum + o.payoutAmount, 0);
    
    // Calculate average commission rate from existing orders, or use default 0%
    const avgCommissionRate = totalOrderAmount > 0 
      ? (totalCommissionAmount / totalOrderAmount) * 100 
      : 0.0;

    // If bank details are missing, try to fetch from vendors list
    let vendorWithBankDetails = vendor;
    if (!vendor.bankAccountName && !vendor.ifscCode && vendors) {
      const fullVendorData = vendors.find((v: any) => {
        const vData = v.attributes || v;
        return vData.id === vendor.vendorId || v.id === vendor.vendorId;
      });
      
      if (fullVendorData) {
        const vData = fullVendorData.attributes || fullVendorData;
        vendorWithBankDetails = {
          ...vendor,
          bankAccountName: vData.bankAccountName || vendor.bankAccountName,
          bankAccountNumber: vData.bankAccountNumber || vendor.bankAccountNumber,
          ifscCode: vData.ifscCode || vendor.ifscCode,
          bankAccountType: vData.bankAccountType || vendor.bankAccountType,
        };
      }
    }

    setSelectedVendor(vendorWithBankDetails);
    setSelectedOrders(ordersToPay);
    setPayoutData({
      orderIds: ordersToPay,
      totalOrderAmount: totalOrderAmount,
      commissionRate: avgCommissionRate || 0.0,
      commissionAmount: totalCommissionAmount || (totalOrderAmount * 0.0),
      payoutAmount: totalPayoutAmount || (totalOrderAmount - (totalOrderAmount * 0.0)),
      payoutNotes: '',
    });
    setPayoutDialog(true);
  };

  const handlePayoutSubmit = async () => {
    if (!payoutData.orderIds.length || !payoutData.payoutAmount) return;

    try {
      // Get the selected vendor's orders to calculate per-order amounts
      const selectedOrdersData = selectedVendor?.orders.filter((o: any) => 
        payoutData.orderIds.includes(o.id)
      ) || [];

      // Calculate per-order amounts based on commission rate
      const totalOrderAmount = selectedOrdersData.reduce((sum: number, o: any) => sum + o.totalAmount, 0);
      const commissionRate = payoutData.commissionRate / 100; // Convert percentage to decimal
      
      // Mark each order payout as paid with calculated amounts
      await Promise.all(
        selectedOrdersData.map((order: any) => {
          // Calculate commission and payout for this specific order
          const orderCommission = order.totalAmount * commissionRate;
          const orderPayout = order.totalAmount - orderCommission;
          
          return markPayoutPaidMutation.mutateAsync({
            orderId: order.id,
            payoutAmount: orderPayout,
            commissionAmount: orderCommission,
            payoutNotes: payoutData.payoutNotes,
          });
        })
      );

      setPayoutDialog(false);
      setPayoutData({
        orderIds: [],
        totalOrderAmount: 0,
        payoutAmount: 0,
        commissionAmount: 0,
        commissionRate: 0.0,
        payoutNotes: '',
      });
      setSelectedVendor(null);
      setSelectedOrders([]);
      
      // Close vendor details dialog if open
      setVendorDetailsDialog(false);
      
      // Invalidate and refetch queries to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/orders/payouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/orders/admin/all'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      
      // Refetch data immediately
      await Promise.all([refetchOrders(), refetchVendors()]);
      
      toast({
        title: "Payouts Marked as Paid",
        description: `Successfully marked ${payoutData.orderIds.length} order(s) as paid.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to mark payouts as paid",
        variant: "destructive",
      });
    }
  };

  const getPriceDisplay = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  if (vendorsLoading || ordersLoading) {
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
      
      <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Payout Management</h2>
          <p className="text-gray-600">Manage seller payouts and settlements</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Vendors</p>
                  <p className="text-2xl font-bold text-gray-900">{totals.totalVendors}</p>
                </div>
                <Building className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Pending Payouts</p>
                  <p className="text-2xl font-bold text-yellow-600">{getPriceDisplay(totals.totalPendingAmount)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Paid Payouts</p>
                  <p className="text-2xl font-bold text-green-600">{getPriceDisplay(totals.totalPaidAmount)}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          {/* Commission Card - Commented out for now */}
          {/* <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Commission</p>
                  <p className="text-2xl font-bold text-red-600">{getPriceDisplay(totals.totalCommission)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card> */}

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-blue-600">{getPriceDisplay(totals.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search vendors by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'pending' | 'paid')}
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending Only</option>
                  <option value="paid">Paid Only</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vendors Payout Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vendor Payouts</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable
              data={filteredVendors}
              columns={[
                {
                  key: 'vendor',
                  header: 'Vendor',
                  width: '250px',
                  render: (_, vendor) => (
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={getImageUrl(vendor.vendorImage)} alt={vendor.vendorName} />
                        <AvatarFallback>
                          {vendor.vendorName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{vendor.vendorName}</div>
                        {vendor.vendorEmail && (
                          <div className="text-xs text-gray-500">{vendor.vendorEmail}</div>
                        )}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'orders',
                  header: 'Orders',
                  width: '120px',
                  sortable: true,
                  render: (_, vendor) => (
                    <div>
                      <div className="font-medium">{vendor.totalOrders}</div>
                      <div className="text-xs text-gray-500">
                        {vendor.pendingOrders} pending, {vendor.paidOrders} paid
                      </div>
                    </div>
                  )
                },
                {
                  key: 'pendingPayoutAmount',
                  header: 'Pending Payout',
                  width: '150px',
                  sortable: true,
                  render: (_, vendor) => (
                    <div className="text-yellow-600 font-semibold">
                      {getPriceDisplay(vendor.pendingPayoutAmount)}
                    </div>
                  )
                },
                {
                  key: 'paidPayoutAmount',
                  header: 'Paid Payout',
                  width: '150px',
                  sortable: true,
                  render: (_, vendor) => (
                    <div className="text-green-600 font-semibold">
                      {getPriceDisplay(vendor.paidPayoutAmount)}
                    </div>
                  )
                },
                // Commission Column - Commented out for now
                // {
                //   key: 'totalCommission',
                //   header: 'Commission',
                //   width: '150px',
                //   sortable: true,
                //   render: (_, vendor) => (
                //     <div>
                //       <div className="text-red-600 font-semibold">
                //         {getPriceDisplay(vendor.totalCommission)}
                //       </div>
                //       <div className="text-xs text-gray-500">
                //         {vendor.totalRevenue > 0 
                //           ? `${((vendor.totalCommission / vendor.totalRevenue) * 100).toFixed(1)}%`
                //           : '0%'}
                //       </div>
                //     </div>
                //   )
                // },
                {
                  key: 'actions',
                  header: 'Actions',
                  width: '200px',
                  render: (_, vendor) => (
                    <div className="flex space-x-2">
                      {vendor.pendingOrders > 0 && (
                        <>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleMarkPayoutPaid(vendor)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <DollarSign className="h-3 w-3 mr-1" />
                            Pay All ({vendor.pendingOrders})
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedVendor(vendor);
                          setVendorDetailsDialog(true);
                        }}
                      >
                        View Details
                      </Button>
                    </div>
                  )
                }
              ]}
              title="Vendor Payouts"
              searchable={false}
              pageSize={10}
              emptyMessage="No vendors with payouts found"
            />
          </CardContent>
        </Card>

        {/* Vendor Details Dialog */}
        <Dialog open={vendorDetailsDialog} onOpenChange={setVendorDetailsDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl md:max-w-4xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Vendor Payout Details - {selectedVendor?.vendorName}</DialogTitle>
              <DialogDescription>
                View and manage individual order payouts
              </DialogDescription>
            </DialogHeader>
            {selectedVendor && (
              <Tabs defaultValue="pending" className="w-full">
                <TabsList>
                  <TabsTrigger value="pending">
                    Pending ({selectedVendor.orders.filter((o: any) => o.payoutStatus === 'pending').length})
                  </TabsTrigger>
                  <TabsTrigger value="paid">
                    Paid ({selectedVendor.orders.filter((o: any) => o.payoutStatus === 'paid').length})
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="pending" className="space-y-4">
                  <div className="space-y-2">
                    {selectedVendor.orders
                      .filter((o: any) => o.payoutStatus === 'pending')
                      .map((order: any) => (
                        <Card key={order.id}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm sm:text-base truncate">{order.orderNumber}</div>
                                <div className="text-xs sm:text-sm text-gray-500">
                                  {new Date(order.createdAt).toLocaleDateString()}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Order: {getPriceDisplay(order.totalAmount)}
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4">
                                <div className="text-right sm:mr-4">
                                  <div className="font-semibold text-green-600 text-sm sm:text-base">{getPriceDisplay(order.payoutAmount)}</div>
                                  {/* Commission display - Commented out for now */}
                                  {/* <div className="text-xs text-red-600">
                                    -{getPriceDisplay(order.commissionAmount)} 
                                    ({order.totalAmount > 0 ? ((order.commissionAmount / order.totalAmount) * 100).toFixed(1) : 0}%)
                                  </div> */}
                                </div>
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    setVendorDetailsDialog(false);
                                    handleMarkPayoutPaid(selectedVendor, [order.id]);
                                  }}
                                  className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                                >
                                  Pay
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
                <TabsContent value="paid" className="space-y-4">
                  <div className="space-y-2">
                    {selectedVendor.orders
                      .filter((o: any) => o.payoutStatus === 'paid')
                      .map((order: any) => (
                        <Card key={order.id}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm sm:text-base truncate">{order.orderNumber}</div>
                                <div className="text-xs sm:text-sm text-gray-500">
                                  Paid on {order.payoutDate ? new Date(order.payoutDate).toLocaleDateString() : 'N/A'}
                                </div>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end gap-3">
                                <div className="text-right">
                                  <div className="font-semibold text-green-600 text-sm sm:text-base">{getPriceDisplay(order.payoutAmount)}</div>
                                  <Badge variant="default" className="bg-green-100 text-green-800 text-xs mt-1">
                                    Paid
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>

        {/* Payout Dialog */}
        <Dialog open={payoutDialog} onOpenChange={setPayoutDialog}>
          <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[95vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle className="text-lg sm:text-xl">Mark Payout as Paid</DialogTitle>
              <DialogDescription className="text-sm">
                Record payout settlement for {selectedVendor?.vendorName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-2">Vendor Details</div>
                  <div className="font-semibold text-sm sm:text-base">{selectedVendor?.vendorName}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-1">
                    {selectedOrders.length} order(s) selected
                  </div>
                </div>
                
                {/* Bank Account Details */}
                {(selectedVendor?.bankAccountName || selectedVendor?.ifscCode || selectedVendor?.bankAccountNumber) && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Bank Account Details</div>
                    <div className="space-y-1.5 text-xs sm:text-sm">
                      {selectedVendor.bankAccountName && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600">Account Name:</span>
                          <span className="font-medium text-gray-900 text-right ml-2">{selectedVendor.bankAccountName}</span>
                        </div>
                      )}
                      {selectedVendor.bankAccountNumber && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600">Account Number:</span>
                          <span className="font-medium text-gray-900 text-right ml-2 font-mono">{selectedVendor.bankAccountNumber}</span>
                        </div>
                      )}
                      {selectedVendor.ifscCode && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600">IFSC Code:</span>
                          <span className="font-medium text-gray-900 text-right ml-2 font-mono uppercase">{selectedVendor.ifscCode}</span>
                        </div>
                      )}
                      {selectedVendor.bankAccountType && (
                        <div className="flex justify-between items-start">
                          <span className="text-gray-600">Account Type:</span>
                          <span className="font-medium text-gray-900 text-right ml-2 capitalize">{selectedVendor.bankAccountType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {!(selectedVendor?.bankAccountName || selectedVendor?.ifscCode || selectedVendor?.bankAccountNumber) && (
                  <div className="pt-3 border-t border-gray-200">
                    <div className="text-xs sm:text-sm text-amber-600 bg-amber-50 p-2 rounded border border-amber-200">
                      ⚠️ Bank account details not available for this vendor
                    </div>
                  </div>
                )}
              </div>

              {/* Order Amount Summary */}
              <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Total Order Amount:</span>
                  <span className="text-base sm:text-lg font-bold text-blue-600">{getPriceDisplay(payoutData.totalOrderAmount)}</span>
                </div>
              </div>
              
              {/* Commission Rate Management - Commented out for now */}
              {/* <div className="space-y-4">
                <div>
                  <Label htmlFor="commissionRate">Commission Rate (%)</Label>
                  <div className="flex items-center space-x-2 mb-2">
                    <Input
                      id="commissionRate"
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={payoutData.commissionRate}
                      onChange={(e) => {
                        const rate = parseFloat(e.target.value) || 0;
                        const orderAmount = payoutData.totalOrderAmount;
                        const commission = (orderAmount * rate) / 100;
                        const payout = orderAmount - commission;
                        setPayoutData(prev => ({ 
                          ...prev, 
                          commissionRate: rate,
                          commissionAmount: commission,
                          payoutAmount: payout
                        }));
                      }}
                      className="flex-1 text-sm sm:text-base"
                    />
                    <span className="text-xs sm:text-sm text-gray-500 w-6 sm:w-8">%</span>
                  </div>
                  {/* Quick Preset Buttons */}
                  {/* <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                    <span className="text-xs text-gray-500 mr-1 sm:mr-2 whitespace-nowrap">Quick Set:</span>
                    {[3, 5, 7, 10, 15].map((rate) => (
                      <Button
                        key={rate}
                        type="button"
                        variant={payoutData.commissionRate === rate ? "default" : "outline"}
                        size="sm"
                        className="h-6 sm:h-7 text-xs px-2 sm:px-3"
                        onClick={() => {
                          const orderAmount = payoutData.totalOrderAmount;
                          const commission = (orderAmount * rate) / 100;
                          const payout = orderAmount - commission;
                          setPayoutData(prev => ({ 
                            ...prev, 
                            commissionRate: rate,
                            commissionAmount: commission,
                            payoutAmount: payout
                          }));
                        }}
                      >
                        {rate}%
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Platform commission percentage (0-100%)
                  </p>
                </div>

                {/* Commission Amount (Auto-calculated) */}
                {/* <div>
                  <Label htmlFor="commissionAmount">Commission Amount (₹)</Label>
                  <Input
                    id="commissionAmount"
                    type="number"
                    step="0.01"
                    value={payoutData.commissionAmount.toFixed(2)}
                    onChange={(e) => {
                      const commission = parseFloat(e.target.value) || 0;
                      const orderAmount = payoutData.totalOrderAmount;
                      const rate = orderAmount > 0 ? (commission / orderAmount) * 100 : 0;
                      const payout = orderAmount - commission;
                      setPayoutData(prev => ({ 
                        ...prev, 
                        commissionAmount: commission,
                        commissionRate: rate,
                        payoutAmount: payout
                      }));
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Auto-calculated from rate, or enter manually to override
                  </p>
                </div>
                
                {/* Payout Amount (Auto-calculated) */}
                {/* <div>
                  <Label htmlFor="payoutAmount">Payout Amount (₹)</Label>
                  <Input
                    id="payoutAmount"
                    type="number"
                    step="0.01"
                    value={payoutData.payoutAmount.toFixed(2)}
                    onChange={(e) => {
                      const payout = parseFloat(e.target.value) || 0;
                      const orderAmount = payoutData.totalOrderAmount;
                      const commission = orderAmount - payout;
                      const rate = orderAmount > 0 ? (commission / orderAmount) * 100 : 0;
                      setPayoutData(prev => ({ 
                        ...prev, 
                        payoutAmount: payout,
                        commissionAmount: commission,
                        commissionRate: rate
                      }));
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Net amount to be paid to seller (Order Amount - Commission)
                  </p>
                </div>
              </div> */}

              {/* Payout Amount Input - Simplified (without commission) */}
              <div>
                <Label htmlFor="payoutAmount">Payout Amount (₹)</Label>
                <Input
                  id="payoutAmount"
                  type="number"
                  step="0.01"
                  value={payoutData.payoutAmount.toFixed(2)}
                  onChange={(e) => {
                    const payout = parseFloat(e.target.value) || 0;
                    setPayoutData(prev => ({ 
                      ...prev, 
                      payoutAmount: payout
                    }));
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Amount to be paid to seller
                </p>
              </div>

              {/* Calculation Breakdown - Commented out commission for now */}
              <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-xs sm:text-sm font-semibold text-gray-700 mb-2">Calculation Breakdown</div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Order Amount:</span>
                    <span className="font-medium break-words text-right ml-2">{getPriceDisplay(payoutData.totalOrderAmount)}</span>
                  </div>
                  {/* Commission row - Commented out for now */}
                  {/* <div className="flex justify-between items-center">
                    <span className="text-gray-600">Commission ({payoutData.commissionRate.toFixed(2)}%):</span>
                    <span className="font-medium text-red-600 break-words text-right ml-2">-{getPriceDisplay(payoutData.commissionAmount)}</span>
                  </div> */}
                  <div className="border-t pt-1 mt-1 flex justify-between items-center">
                    <span className="font-semibold text-gray-900">Payout Amount:</span>
                    <span className="font-bold text-green-600 text-base sm:text-lg break-words text-right ml-2">{getPriceDisplay(payoutData.payoutAmount)}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <Label htmlFor="payoutNotes" className="text-sm">Notes (Optional)</Label>
                <Textarea
                  id="payoutNotes"
                  placeholder="Add any notes about this payout..."
                  value={payoutData.payoutNotes}
                  onChange={(e) => setPayoutData(prev => ({ 
                    ...prev, 
                    payoutNotes: e.target.value 
                  }))}
                  rows={3}
                  className="text-sm"
                />
              </div>
              
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  onClick={() => setPayoutDialog(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handlePayoutSubmit}
                  disabled={markPayoutPaidMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                >
                  {markPayoutPaidMutation.isPending ? 'Processing...' : `Mark ${selectedOrders.length} Order(s) as Paid`}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}

