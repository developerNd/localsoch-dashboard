import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrders() {
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['/api/orders'],
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest('PUT', `/api/orders/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({
        title: "Order Updated",
        description: "Order status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  const filteredOrders = orders?.filter((order: any) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const pendingOrders = orders?.filter((o: any) => o.status === 'pending') || [];
  const confirmedOrders = orders?.filter((o: any) => o.status === 'confirmed') || [];
  const shippedOrders = orders?.filter((o: any) => o.status === 'shipped') || [];
  const deliveredOrders = orders?.filter((o: any) => o.status === 'delivered') || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'destructive';
      case 'confirmed': return 'secondary';
      case 'shipped': return 'default';
      case 'delivered': return 'default';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    await updateOrderMutation.mutateAsync({ id: orderId, status: newStatus });
  };

  const totalRevenue = orders?.reduce((sum: number, order: any) => 
    sum + parseFloat(order.totalAmount), 0) || 0;

  if (isLoading) {
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
            <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
            <p className="text-gray-600">Monitor and manage all platform orders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-shopping-cart text-primary text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{orders?.length || 0}</p>
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
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-gray-900">{pendingOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-check text-gray-600 text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Confirmed</p>
                  <p className="text-2xl font-bold text-gray-900">{confirmedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-truck text-success text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Shipped</p>
                  <p className="text-2xl font-bold text-gray-900">{shippedOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-box text-success text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-gray-900">{deliveredOrders.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Revenue Summary */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Total Platform Revenue</h3>
                <p className="text-3xl font-bold text-primary">₹{totalRevenue.toLocaleString()}</p>
                <p className="text-sm text-gray-500 mt-1">From all completed orders</p>
              </div>
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                <i className="fas fa-chart-line text-primary text-2xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Orders</CardTitle>
              <div className="flex items-center space-x-4">
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Orders</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredOrders.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-search text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search criteria or filters.' 
                    : 'No orders have been placed yet.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-mono font-medium">
                          {order.orderNumber}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{order.customerName}</p>
                            <p className="text-sm text-gray-500">{order.customerEmail}</p>
                            {order.customerPhone && (
                              <p className="text-sm text-gray-500">{order.customerPhone}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{order.items?.length || 0} item(s)</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedOrder(order)}
                            >
                              <i className="fas fa-eye text-xs"></i>
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          ₹{parseFloat(order.totalAmount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <i className="fas fa-eye mr-2"></i>
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-3xl">
                                <DialogHeader>
                                  <DialogTitle>Order Details</DialogTitle>
                                  <DialogDescription>
                                    Order #{selectedOrder?.orderNumber}
                                  </DialogDescription>
                                </DialogHeader>
                                
                                {selectedOrder && (
                                  <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                      <div>
                                        <h4 className="font-medium mb-3">Customer Information</h4>
                                        <div className="space-y-2 text-sm">
                                          <p><strong>Name:</strong> {selectedOrder.customerName}</p>
                                          <p><strong>Email:</strong> {selectedOrder.customerEmail}</p>
                                          {selectedOrder.customerPhone && (
                                            <p><strong>Phone:</strong> {selectedOrder.customerPhone}</p>
                                          )}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="font-medium mb-3">Shipping Address</h4>
                                        <div className="text-sm">
                                          <p>{selectedOrder.shippingAddress?.street}</p>
                                          <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state}</p>
                                          <p>{selectedOrder.shippingAddress?.pincode}</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div>
                                      <h4 className="font-medium mb-3">Order Items</h4>
                                      <div className="space-y-3">
                                        {selectedOrder.items?.map((item: any, index: number) => (
                                          <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                            <div>
                                              <p className="font-medium">Product ID: {item.productId}</p>
                                              <p className="text-sm text-gray-500">Seller ID: {item.sellerId}</p>
                                              <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-medium">₹{parseFloat(item.totalAmount).toLocaleString()}</p>
                                              <p className="text-sm text-gray-500">₹{parseFloat(item.price).toLocaleString()} each</p>
                                            </div>
                                          </div>
                                        )) || []}
                                      </div>
                                    </div>
                                    
                                    <div className="flex justify-between items-center border-t pt-4">
                                      <div>
                                        <p className="text-sm text-gray-500">Order Status</p>
                                        <Badge variant={getStatusColor(selectedOrder.status)} className="mt-1">
                                          {selectedOrder.status}
                                        </Badge>
                                      </div>
                                      <div className="text-right">
                                        <p className="text-sm text-gray-500">Total Amount</p>
                                        <p className="text-2xl font-bold">
                                          ₹{parseFloat(selectedOrder.totalAmount).toLocaleString()}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    {selectedOrder.status !== 'delivered' && selectedOrder.status !== 'cancelled' && (
                                      <div className="flex justify-end space-x-2">
                                        <Select
                                          value={selectedOrder.status}
                                          onValueChange={(value) => handleStatusUpdate(selectedOrder.id, value)}
                                        >
                                          <SelectTrigger className="w-40">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="pending">Pending</SelectItem>
                                            <SelectItem value="confirmed">Confirmed</SelectItem>
                                            <SelectItem value="shipped">Shipped</SelectItem>
                                            <SelectItem value="delivered">Delivered</SelectItem>
                                            <SelectItem value="cancelled">Cancelled</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </DialogContent>
                            </Dialog>
                            
                            {order.status !== 'delivered' && order.status !== 'cancelled' && (
                              <Select
                                value={order.status}
                                onValueChange={(value) => handleStatusUpdate(order.id, value)}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="pending">Pending</SelectItem>
                                  <SelectItem value="confirmed">Confirmed</SelectItem>
                                  <SelectItem value="shipped">Shipped</SelectItem>
                                  <SelectItem value="delivered">Delivered</SelectItem>
                                  <SelectItem value="cancelled">Cancelled</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
