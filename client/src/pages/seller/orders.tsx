import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Truck, MapPin, User, Mail, Phone, Clock, Package, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { DataTable } from '@/components/ui/data-table';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  totalAmount: number;
}

interface Order {
  id: number;
  documentId?: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
  deliveryType: 'delivery' | 'pickup';
  pickupAddress?: {
    name: string;
    address: string;
    contact: string;
  };
  pickupTime?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'ready' | 'pickedUp' | 'cancelled';
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid' | 'failed';
  notes?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  deliveryCharge?: number; // Added for invoice total
}

const statusConfig = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  shipped: { label: 'Shipped', color: 'bg-purple-100 text-purple-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: Package },
  ready: { label: 'Ready for Pickup', color: 'bg-orange-100 text-orange-800', icon: MapPin },
  pickedUp: { label: 'Picked Up', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
} as const;

const statusFlow = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'ready', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['confirmed', 'shipped', 'cancelled'],
  ready: ['pickedUp', 'cancelled'],
  pickedUp: ['ready', 'confirmed', 'cancelled'],
  cancelled: ['confirmed', 'pending'],
} as const;

export default function SellerOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: orders, isLoading, error } = useQuery({
    queryKey: ['/api/orders', user?.vendorId],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/orders?populate=*');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return (data.data || []).map((order: any) => {
          const orderData = order.attributes || order;
          return {
            id: order.id,
            documentId: order.documentId || order.id,
            orderNumber: orderData.orderNumber || `ORD-${order.id}`,
            customerName: orderData.customerName || 'Unknown Customer',
            customerEmail: orderData.customerEmail || '',
            customerPhone: orderData.customerPhone || '',
            shippingAddress: orderData.shippingAddress || {
              street: 'Address not available',
              city: '',
              state: '',
              pincode: ''
            },
            deliveryType: orderData.deliveryType || 'delivery',
            pickupAddress: orderData.pickupAddress || undefined,
            pickupTime: orderData.pickupTime || undefined,
            status: orderData.status || 'pending',
            totalAmount: parseFloat(orderData.totalAmount || 0),
            createdAt: orderData.createdAt || new Date().toISOString(),
            items: orderData.orderItems || orderData.items || [],
            paymentMethod: orderData.paymentMethod || 'COD',
            paymentStatus: orderData.paymentStatus || 'pending',
            notes: orderData.notes || '',
            estimatedDelivery: orderData.estimatedDelivery || '',
            trackingNumber: orderData.trackingNumber || '',
            deliveryCharge: parseFloat(orderData.deliveryCharge || 0)
          } as Order;
        });
      } catch (error) {
        console.error('Error fetching orders:', error);
        throw new Error('Failed to fetch orders');
      }
    },
    enabled: !!user,
    retry: 3,
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const order = orders?.find((o: any) => o.id === id);
      if (!order) {
        throw new Error(`Order not found in local data: ${id}`);
      }
      const orderIdentifier = order.documentId || order.id;
      const response = await apiRequest('PUT', `/api/orders/${orderIdentifier}/status`, { status });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update order: ${response.status} ${errorText}`);
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      toast({ title: 'Order Updated', description: 'Order status has been updated successfully.' });
    },
    onError: (error: any) => {
      console.error('Order update error:', error);
      toast({ title: 'Error', description: error.message || 'Failed to update order status', variant: 'destructive' });
    },
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ orderIds, status }: { orderIds: number[]; status: string }) => {
      const promises = orderIds.map(id => {
        const order = orders?.find((o: any) => o.id === id);
        if (!order) throw new Error(`Order not found in local data: ${id}`);
        const orderIdentifier = order.documentId || order.id;
        return apiRequest('PUT', `/api/orders/${orderIdentifier}/status`, { status });
      });
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      setSelectedOrders([]);
      toast({ title: 'Orders Updated', description: `${selectedOrders.length} orders have been updated successfully.` });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update orders', variant: 'destructive' });
    },
  });

  // Filter orders by status only; search handled by DataTable
  const filteredOrders = useMemo(() => {
    if (!orders) return [] as Order[];
    return orders.filter((order: Order) => statusFilter === 'all' || order.status === statusFilter);
  }, [orders, statusFilter]);

  // Columns for DataTable
  const columns = [
    {
      key: 'select',
      header: '',
      width: '50px',
      render: (_: any, order: Order) => (
        <input
          type="checkbox"
          checked={selectedOrders.includes(order.id)}
          onChange={() => toggleOrderSelection(order.id)}
          className="rounded"
        />
      ),
    },
    {
      key: 'orderNumber',
      header: 'Order #',
      sortable: true,
      render: (value: any) => <span className="font-mono font-medium">{value}</span>,
    },
    {
      key: 'customer',
      header: 'Customer',
      render: (_: any, order: Order) => (
        <div>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-gray-500">{order.customerEmail}</p>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      render: (_: any, order: Order) => <span>{order.items?.length || 0} item(s)</span>,
    },
    {
      key: 'totalAmount',
      header: 'Total',
      sortable: true,
      render: (value: any) => <span className="font-medium">₹{(value || 0).toLocaleString()}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (_: any, order: Order) => (
        <Badge className={statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
          {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Date',
      sortable: true,
      render: (value: any) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, order: Order) => (
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
            View
          </Button>
          {statusFlow[order.status as keyof typeof statusFlow]?.length > 0 && (
            <Select value={order.status} onValueChange={(value) => handleStatusUpdate(order.id, value)}>
              <SelectTrigger className="w-32">
                <SelectValue>
                  {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusFlow[order.status as keyof typeof statusFlow].map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusConfig[status as keyof typeof statusConfig].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      ),
    },
  ];

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    await updateOrderMutation.mutateAsync({ id: orderId, status: newStatus });
  };

  const handleBulkUpdate = async (status: string) => {
    if (selectedOrders.length === 0) return;
    await bulkUpdateMutation.mutateAsync({ orderIds: selectedOrders, status });
  };

  const toggleOrderSelection = (orderId: number) => {
    setSelectedOrders(prev => prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]);
  };

  const selectAllOrders = () => {
    setSelectedOrders(filteredOrders.map((order: Order) => order.id));
  };

  const clearSelection = () => {
    setSelectedOrders([]);
  };

  const getOrderProgress = (status: string, deliveryType: 'delivery' | 'pickup') => {
    const steps = ['pending', 'confirmed'];
    if (deliveryType === 'pickup') {
      steps.push('ready', 'pickedUp');
    } else {
      steps.push('shipped', 'delivered');
    }
    const currentIndex = steps.indexOf(status);
    return Math.max(0, currentIndex + 1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 pb-20 lg:pb-8" style={{ paddingTop: '70px' }}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    console.error('Orders query error:', error);
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Sidebar />
        <MobileNav />
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 pb-20 lg:pb-8" style={{ paddingTop: '70px' }}>
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Orders</h3>
              <p className="text-gray-600 mb-4">There was an error loading your orders. Please try again.</p>
              <Button onClick={() => window.location.reload()}>Retry</Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      
      <main className="flex-1 lg:ml-64 p-4 lg:p-8 pb-20 lg:pb-8" style={{ paddingTop: '70px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {user?.role === 'admin' ? 'All Orders' : 'My Orders'}
            </h2>
            <p className="text-gray-600">
              {user?.role === 'admin' 
                ? 'Manage and track all customer orders' 
                : 'Manage and track your customer orders'
              }
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              Table
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('cards')}
            >
              Cards
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card><CardContent className="p-6"><div className="flex items-center"><div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mr-4"></div><div><p className="text-sm font-medium text-gray-600">Pending</p><p className="text-2xl font-bold text-gray-900">{orders?.filter((o: Order)=>o.status==='pending').length || 0}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center"><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4"></div><div><p className="text-sm font-medium text-gray-600">Confirmed</p><p className="text-2xl font-bold text-gray-900">{orders?.filter((o: Order)=>o.status==='confirmed').length || 0}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center"><div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4"></div><div><p className="text-sm font-medium text-gray-600">Shipped</p><p className="text-2xl font-bold text-gray-900">{orders?.filter((o: Order)=>o.status==='shipped').length || 0}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center"><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4"></div><div><p className="text-sm font-medium text-gray-600">Delivered</p><p className="text-2xl font-bold text-gray-900">{orders?.filter((o: Order)=>o.status==='delivered').length || 0}</p></div></div></CardContent></Card>
          <Card><CardContent className="p-6"><div className="flex items-center"><div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mr-4"></div><div><p className="text-sm font-medium text-gray-600">Total Revenue</p><p className="text-2xl font-bold text-gray-900">₹{(orders?.reduce((sum:number,o:Order)=>sum+(o.totalAmount||0),0) || 0).toLocaleString()}</p></div></div></CardContent></Card>
                </div>

        {/* Filters (removed duplicate search; keep status filter and bulk actions) */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex gap-4 items-center">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Filter by status" />
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
              {selectedOrders.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{selectedOrders.length} selected</span>
                  <Select onValueChange={handleBulkUpdate}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Bulk update" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Mark as Pending</SelectItem>
                      <SelectItem value="confirmed">Mark as Confirmed</SelectItem>
                      <SelectItem value="shipped">Mark as Shipped</SelectItem>
                      <SelectItem value="delivered">Mark as Delivered</SelectItem>
                      <SelectItem value="cancelled">Mark as Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={clearSelection}>Clear</Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
        <Card>
          <CardContent>
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">{statusFilter !== 'all' ? 'Try changing the status filter' : "You haven't received any orders yet."}</p>
              </div>
            </CardContent>
          </Card>
            ) : viewMode === 'table' ? (
          <>
            <div className="flex items-center justify-between mb-3">
              {filteredOrders.length > 0 && (
                <Button variant="outline" size="sm" onClick={selectAllOrders}>Select All</Button>
              )}
              <span className="text-sm text-gray-600">{filteredOrders.length} orders</span>
                          </div>
            <DataTable
              data={filteredOrders}
              columns={columns}
              title={`Orders (${filteredOrders.length})`}
              searchable={true}
              searchPlaceholder="Search by order #, customer name or email..."
              searchKeys={['orderNumber', 'customerName', 'customerEmail']}
              pageSize={10}
              emptyMessage="No orders found"
            />
          </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOrders.map((order: Order) => (
                  <OrderCard 
                    key={order.id}
                    order={order}
                    isSelected={selectedOrders.includes(order.id)}
                    onSelect={() => toggleOrderSelection(order.id)}
                    onView={() => setSelectedOrder(order)}
                    onStatusUpdate={handleStatusUpdate}
                  />
                ))}
              </div>
            )}
            
            {/* Order Details Modal */}
            <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Order Details</DialogTitle>
                  <DialogDescription>
                    View and manage order information
                  </DialogDescription>
                </DialogHeader>
                {selectedOrder && (
                  <OrderDetailsModal 
                    order={selectedOrder} 
                    onStatusUpdate={handleStatusUpdate} 
                    getOrderProgress={getOrderProgress} 
                  />
                )}
              </DialogContent>
            </Dialog>
      </main>
    </div>
  );
}

// Order Card Component for Card View
function OrderCard({ 
  order, 
  isSelected, 
  onSelect, 
  onView, 
  onStatusUpdate 
}: {
  order: Order;
  isSelected: boolean;
  onSelect: () => void;
  onView: () => void;
  onStatusUpdate: (id: number, status: string) => void;
}) {
  const StatusIcon = statusConfig[order.status as keyof typeof statusConfig].icon;
  
  return (
    <Card className={`cursor-pointer transition-all ${isSelected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onSelect}
              className="rounded"
            />
            <div>
              <h3 className="font-medium">{order.orderNumber}</h3>
              <p className="text-sm text-gray-500">{order.customerName}</p>
            </div>
          </div>
          <Badge className={statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Items:</span>
            <span>{order.items?.length || 0}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Total:</span>
            <span className="font-medium">₹{(order.totalAmount || 0).toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Date:</span>
            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 mt-4">
          <Button variant="outline" size="sm" onClick={onView} className="flex-1">
            View Details
          </Button>
          {statusFlow[order.status as keyof typeof statusFlow]?.length > 0 && (
            <Select
              value={order.status}
              onValueChange={(value) => onStatusUpdate(order.id, value)}
            >
              <SelectTrigger className="w-24">
                <SelectValue>
                  {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {statusFlow[order.status as keyof typeof statusFlow].map((status) => (
                  <SelectItem key={status} value={status}>
                    {statusConfig[status as keyof typeof statusConfig].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Order Details Modal Component
function OrderDetailsModal({ 
  order, 
  onStatusUpdate,
  getOrderProgress
}: {
  order: Order;
  onStatusUpdate: (id: number, status: string) => void;
  getOrderProgress: (status: string, deliveryType: 'delivery' | 'pickup') => number;
}) {
  return (
    <div className="space-y-6">
      {/* Invoice Header */}
      <div className="border-b pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
            <p className="text-gray-600">Order #{order.orderNumber}</p>
            <p className="text-sm text-gray-500">Date: {new Date(order.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <Badge className={statusConfig[order.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
              {statusConfig[order.status as keyof typeof statusConfig]?.label || order.status}
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

      {/* Customer & Address Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-4 w-4 mr-2" />
            Customer Information
          </h4>
          <div className="space-y-2 text-sm">
            <p><strong>Name:</strong> {order.customerName}</p>
            <p className="flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              {order.customerEmail}
            </p>
            {order.customerPhone && (
              <p className="flex items-center">
                <Phone className="h-3 w-3 mr-1" />
                {order.customerPhone}
              </p>
            )}
          </div>
        </div>
        
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
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>{order.shippingAddress.pincode}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Items Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-3 border-b">
          <h4 className="font-semibold text-gray-900">Order Items</h4>
        </div>
        <div className="divide-y">
          {order.items && order.items.length > 0 ? (
            order.items.map((item, index) => (
              <div key={index} className="px-6 py-4 flex justify-between items-center">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.productName || 'Product'}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity || 0}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">₹{(item.price || 0).toLocaleString()} each</p>
                  <p className="font-medium text-gray-900">₹{(item.totalAmount || 0).toLocaleString()}</p>
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

      {/* Order Progress */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Order Progress</h4>
        <div className="space-y-4">
          <Progress value={(getOrderProgress(order.status, order.deliveryType) / 4) * 100} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600">
            {order.deliveryType === 'pickup' ? (
              <>
                <span>Order Placed</span>
                <span>Confirmed</span>
                <span>Ready</span>
                <span>Picked Up</span>
              </>
            ) : (
              <>
                <span>Order Placed</span>
                <span>Confirmed</span>
                <span>Shipped</span>
                <span>Delivered</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tracking Information */}
      {(order.trackingNumber || order.estimatedDelivery) && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Tracking Information</h4>
          <div className="space-y-2 text-sm">
            {order.trackingNumber && (
              <div>
                <strong>Tracking Number:</strong>
                <p className="font-mono bg-white p-2 rounded border mt-1">{order.trackingNumber}</p>
              </div>
            )}
            {order.estimatedDelivery && (
              <div>
                <strong>Estimated {order.deliveryType === 'pickup' ? 'Pickup' : 'Delivery'}:</strong>
                <p className="mt-1">{order.estimatedDelivery}</p>
              </div>
            )}
          </div>
        </div>
      )}

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
            <span>₹{((order.totalAmount || 0) - (order.deliveryCharge || 0)).toLocaleString()}</span>
          </div>
          {order.deliveryCharge && order.deliveryType === 'delivery' && (
            <div className="flex justify-between text-sm">
              <span>Delivery Charge:</span>
              <span>₹{(order.deliveryCharge || 0).toLocaleString()}</span>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between text-lg font-bold">
            <span>Total Amount:</span>
            <span>₹{(order.totalAmount || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Status Update */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-semibold text-gray-900 mb-3">Update Order Status</h4>
        <div className="flex flex-wrap gap-2">
          {statusFlow[order.status as keyof typeof statusFlow]?.map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              onClick={() => onStatusUpdate(order.id, status)}
            >
              Mark as {statusConfig[status as keyof typeof statusConfig].label}
            </Button>
          ))}
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-semibold text-gray-900 mb-2">Order Notes</h4>
          <p className="text-sm text-gray-700">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
