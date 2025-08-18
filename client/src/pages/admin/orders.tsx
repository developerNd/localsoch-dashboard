import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { DataTable } from '@/components/ui/data-table';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAdminOrders, useUpdateOrderStatusByAdmin, useOrderStats } from '@/hooks/use-api';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Truck, Clock } from 'lucide-react';

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [statusUpdateData, setStatusUpdateData] = useState({ status: '' });
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch orders using admin-specific hook
  const { data: orders, isLoading: ordersLoading } = useAdminOrders();
  const { data: orderStats, isLoading: statsLoading } = useOrderStats();

  const updateOrderStatusMutation = useUpdateOrderStatusByAdmin();



  const handleStatusUpdate = (order: any) => {
    setSelectedOrder(order);
    setStatusUpdateData({ status: order.status || 'pending' });
    setStatusUpdateDialog(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedOrder || !statusUpdateData.status) return;
    
    try {
      await updateOrderStatusMutation.mutateAsync({
        id: selectedOrder.id,
        status: statusUpdateData.status
      });
      
      setStatusUpdateDialog(false);
      setStatusUpdateData({ status: '' });
      toast({
        title: "Status Updated",
        description: "Order status has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'confirmed':
        return <Badge variant="default">Confirmed</Badge>;
      case 'shipped':
        return <Badge variant="outline">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="default">Delivered</Badge>;
      case 'ready':
        return <Badge variant="outline" className="bg-orange-100 text-orange-800">Ready for Pickup</Badge>;
      case 'pickedUp':
        return <Badge variant="default" className="bg-green-100 text-green-800">Picked Up</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriceDisplay = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const getDateDisplay = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (ordersLoading || statsLoading) {
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
            <p className="text-gray-600">Monitor and manage all platform orders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-8 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Total Orders</p>
                <p className="text-xl font-bold text-gray-900">{orderStats?.totalOrders || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Pending</p>
                <p className="text-xl font-bold text-gray-900">{orderStats?.ordersByStatus?.pending || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Confirmed</p>
                <p className="text-xl font-bold text-gray-900">{orderStats?.ordersByStatus?.confirmed || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Shipped</p>
                <p className="text-xl font-bold text-gray-900">{orderStats?.ordersByStatus?.shipped || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Delivered</p>
                <p className="text-xl font-bold text-gray-900">{orderStats?.ordersByStatus?.delivered || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Ready</p>
                <p className="text-xl font-bold text-gray-900">{orderStats?.ordersByStatus?.ready || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Picked Up</p>
                <p className="text-xl font-bold text-gray-900">{orderStats?.ordersByStatus?.pickedUp || 0}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-xs font-medium text-gray-600">Cancelled</p>
                <p className="text-xl font-bold text-gray-900">{orderStats?.ordersByStatus?.cancelled || 0}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Card */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{getPriceDisplay(orderStats?.totalRevenue || 0)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Average Order Value</p>
                <p className="text-xl font-semibold text-gray-900">
                  {orderStats?.totalOrders > 0 
                    ? getPriceDisplay((orderStats.totalRevenue || 0) / orderStats.totalOrders)
                    : getPriceDisplay(0)
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders Table */}
        <DataTable
          data={orders || []}
          columns={[
            {
              key: 'order',
              header: 'Order',
              width: '200px',
              render: (_, order) => (
                <div>
                  <div className="font-medium">{order.orderNumber}</div>
                  <div className="text-sm text-gray-500">ID: {order.id}</div>
                </div>
              )
            },
            {
              key: 'customer',
              header: 'Customer',
              width: '250px',
              sortable: true,
              render: (_, order) => (
                <div>
                  <div className="font-medium">{order.customerName}</div>
                  <div className="text-sm text-gray-500">{order.customerEmail}</div>
                  {order.customerPhone && (
                    <div className="text-sm text-gray-500">{order.customerPhone}</div>
                  )}
                </div>
              )
            },
            {
              key: 'vendor.name',
              header: 'Vendor',
              width: '200px',
              sortable: true,
              render: (_, order) => (
                <div>
                  <div className="font-medium">{order.vendor?.name || 'No Vendor'}</div>
                  <div className="text-sm text-gray-500">{order.vendor?.user?.username}</div>
                </div>
              )
            },
            {
              key: 'deliveryType',
              header: 'Type',
              width: '120px',
              sortable: true,
              render: (_, order) => (
                <Badge variant={order.deliveryType === 'pickup' ? 'secondary' : 'default'}>
                  {order.deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}
                </Badge>
              )
            },
            {
              key: 'totalAmount',
              header: 'Amount',
              width: '150px',
              sortable: true,
              render: (_, order) => (
                <div>
                  <div className="font-medium">{getPriceDisplay(order.totalAmount)}</div>
                  {order.deliveryCharge && order.deliveryType === 'delivery' && (
                    <div className="text-sm text-gray-500">
                      +{getPriceDisplay(order.deliveryCharge)} delivery
                    </div>
                  )}
                </div>
              )
            },
            {
              key: 'status',
              header: 'Status',
              width: '150px',
              sortable: true,
              render: (_, order) => getStatusBadge(order.status)
            },
            {
              key: 'createdAt',
              header: 'Date',
              width: '150px',
              sortable: true,
              render: (_, order) => (
                <div className="text-sm">{getDateDisplay(order.createdAt)}</div>
              )
            },
            {
              key: 'actions',
              header: 'Actions',
              width: '200px',
              render: (_, order) => (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusUpdate(order);
                    }}
                  >
                    Update Status
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogDescription>
                          Order #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString()}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-6">
                                {/* Order Header */}
                                <div className="border-b pb-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h2 className="text-2xl font-bold text-gray-900">Order #{order.orderNumber}</h2>
                                      <p className="text-sm text-gray-500">Placed on {new Date(order.createdAt).toLocaleDateString()}</p>
                                    </div>
                                    <div className="text-right">
                                      <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                                        {order.status}
                                      </Badge>
                                      <div className="mt-2">
                                        {order.deliveryType === 'pickup' ? (
                                          <div className="flex items-center justify-end space-x-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                                            <MapPin className="h-4 w-4 text-green-600" />
                                            <span className="text-sm font-medium text-green-800">Pick from Shop</span>
                                          </div>
                                        ) : (
                                          <div className="flex items-center justify-end space-x-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                                            <Truck className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-800">Home Delivery</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Customer & Vendor Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3">Customer Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>Name:</strong> {order.customerName}</p>
                                      <p><strong>Email:</strong> {order.customerEmail}</p>
                                      {order.customerPhone && (
                                        <p><strong>Phone:</strong> {order.customerPhone}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="bg-gray-50 p-4 rounded-lg">
                                    <h4 className="font-semibold text-gray-900 mb-3">Vendor Information</h4>
                                    <div className="space-y-2 text-sm">
                                      <p><strong>Vendor:</strong> {order.vendor?.name || 'No Vendor'}</p>
                                      <p><strong>User:</strong> {order.vendor?.user?.username}</p>
                                    </div>
                                  </div>
                                </div>

                                {/* Address Information */}
                                <div className={`p-4 rounded-lg border-2 ${order.deliveryType === 'pickup' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                  <h4 className={`font-semibold mb-3 flex items-center ${order.deliveryType === 'pickup' ? 'text-green-800' : 'text-gray-900'}`}>
                                    {order.deliveryType === 'pickup' ? (
                                      <>
                                        <MapPin className="h-4 w-4 mr-2 text-green-600" />
                                        Pickup Details
                                      </>
                                    ) : (
                                      <>
                                        <Truck className="h-4 w-4 mr-2" />
                                        Shipping Address
                                      </>
                                    )}
                                  </h4>
                                  <div className="text-sm space-y-2">
                                    {order.deliveryType === 'pickup' ? (
                                      <>
                                        <div className="bg-white p-3 rounded border border-green-100">
                                          <p className="font-semibold text-green-800 text-base">{order.pickupAddress?.name || 'Shop'}</p>
                                          <p className="text-gray-700">{order.pickupAddress?.address || 'Address not available'}</p>
                                          <p className="text-gray-600">Contact: {order.pickupAddress?.contact || 'Not available'}</p>
                                        </div>
                                        {order.pickupTime && (
                                          <div className="bg-green-100 p-3 rounded border border-green-200">
                                            <div className="flex items-center space-x-2">
                                              <Clock className="h-4 w-4 text-green-600" />
                                              <span className="font-medium text-green-800">Pickup in: {order.pickupTime}</span>
                                            </div>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="bg-white p-3 rounded border">
                                        <p>{order.shippingAddress?.street}</p>
                                        <p>{order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.pincode}</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Order Items Table */}
                                <div className="bg-white border rounded-lg overflow-hidden">
                                  <div className="bg-gray-50 px-6 py-3 border-b">
                                    <h4 className="font-semibold text-gray-900">Order Items</h4>
                                  </div>
                                  <div className="divide-y">
                                    {order.products && order.products.length > 0 ? (
                                      order.products.map((product: any, index: number) => (
                                        <div key={index} className="px-6 py-4 flex justify-between items-center">
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-900">{product.name}</p>
                                            <p className="text-sm text-gray-600">Quantity: {product.quantity || 1}</p>
                                          </div>
                                          <div className="text-right">
                                            <p className="text-sm text-gray-600">{getPriceDisplay(product.price || 0)} each</p>
                                            <p className="font-medium text-gray-900">{getPriceDisplay((product.price || 0) * (product.quantity || 1))}</p>
                                          </div>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="px-6 py-8 text-center text-gray-500">
                                        <p>No items found for this order</p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Payment Information */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                  <h4 className="font-semibold text-gray-900 mb-3">Payment Information</h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span>Payment Method:</span>
                                      <span className="font-medium">{order.paymentMethod || 'Not specified'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Payment Status:</span>
                                      <Badge variant={order.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                                        {order.paymentStatus || 'pending'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>

                                {/* Invoice Total */}
                                <div className="bg-white border rounded-lg p-6">
                                  <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                      <span>Subtotal:</span>
                                      <span>{getPriceDisplay((order.totalAmount || 0) - (order.deliveryCharge || 0))}</span>
                                    </div>
                                    {order.deliveryCharge && order.deliveryType === 'delivery' && (
                                      <div className="flex justify-between text-sm">
                                        <span>Delivery Charge:</span>
                                        <span>{getPriceDisplay(order.deliveryCharge)}</span>
                                      </div>
                                    )}
                                    <div className="border-t pt-2 flex justify-between text-lg font-bold">
                                      <span>Total Amount:</span>
                                      <span>{getPriceDisplay(order.totalAmount)}</span>
                                    </div>
                                  </div>
                                </div>


                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )
                    }
                  ]}
                  title={`Orders (${orders?.length || 0})`}
                  searchable={true}
                  searchPlaceholder="Search orders by order number, customer name, email, or vendor..."
                  searchKeys={['orderNumber', 'customerName', 'customerEmail', 'customerPhone', 'vendor.name', 'vendor.user.username']}
                  pageSize={10}
                  emptyMessage="No orders found"
                />

        {/* Status Update Dialog */}
        <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Order Status</DialogTitle>
              <DialogDescription>
                Update the status for Order #{selectedOrder?.orderNumber}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {/* Order Details */}
              {selectedOrder && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="font-semibold text-lg mb-2">Order #{selectedOrder.orderNumber}</div>
                  <div className="text-sm text-gray-600 mb-1">{selectedOrder.customerName}</div>
                  <div className="text-sm text-gray-500 mb-2">{selectedOrder.customerEmail}</div>
                  <div className="text-xs text-gray-400">Current Status: {selectedOrder.status || 'pending'}</div>
                  <div className="text-xs text-gray-400">Amount: {getPriceDisplay(selectedOrder.totalAmount)}</div>
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
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="ready">Ready for Pickup</SelectItem>
                    <SelectItem value="pickedUp">Picked Up</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setStatusUpdateDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleStatusSubmit}
                  disabled={updateOrderStatusMutation.isPending}
                >
                  {updateOrderStatusMutation.isPending ? 'Updating...' : 'Update Status'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
