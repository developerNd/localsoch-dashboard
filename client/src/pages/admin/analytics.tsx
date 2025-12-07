import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import SalesChart from '@/components/charts/sales-chart';
import { useAdminOrders, useAdminVendors, useAdminProducts } from '@/hooks/use-api';
import { apiRequest } from '@/lib/queryClient';

// Simple Chart Components
const RevenueChart = ({ data }: { data: any[] }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="h-full flex items-end justify-between space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">{item.label}</div>
          <div 
            className="w-full bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
            style={{ 
              height: `${(item.value / maxValue) * 200}px`,
              minHeight: '20px'
            }}
          ></div>
          <div className="text-xs font-medium text-gray-700 mt-1">
            ₹{item.value.toLocaleString()}
          </div>
        </div>
      ))}
    </div>
  );
};

const OrderChart = ({ data }: { data: any[] }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="h-full flex items-end justify-between space-x-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div className="text-xs text-gray-500 mb-1">{item.label}</div>
          <div 
            className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
            style={{ 
              height: `${(item.value / maxValue) * 200}px`,
              minHeight: '20px'
            }}
          ></div>
          <div className="text-xs font-medium text-gray-700 mt-1">
            {item.value}
          </div>
        </div>
      ))}
    </div>
  );
};

const StatusChart = ({ data }: { data: any[] }) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  return (
    <div className="h-full flex flex-col justify-center space-y-3">
      {data.map((item, index) => {
        const percentage = total > 0 ? (item.value / total) * 100 : 0;
        return (
          <div key={index} className="flex items-center space-x-3">
            <div 
              className="w-4 h-4 rounded-full border border-gray-300"
              style={{ backgroundColor: item.color }}
            ></div>
            <div className="flex-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-900">{item.label}</span>
                <span className="text-gray-600 font-medium">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: item.color
                  }}
                ></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function AdminAnalytics() {
  // Remove period state
  // const [period, setPeriod] = useState('30days');

  // Data generation functions
  const generateRevenueData = () => {
    if (!orders || orders.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        label: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        value: 0
      }));
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === date;
      });

      const revenue = dayOrders.reduce((sum: number, order: any) => 
        sum + parseFloat(order.totalAmount || 0), 0);

      return {
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        value: Math.round(revenue)
      };
    });
  };

  const generateOrderData = () => {
    if (!orders || orders.length === 0) {
      return Array.from({ length: 7 }, (_, i) => ({
        label: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        value: 0
      }));
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayOrders = orders.filter((order: any) => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        return orderDate === date;
      });

      return {
        label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
        value: dayOrders.length
      };
    });
  };

  const generateStatusData = () => {
    if (!orders || orders.length === 0) {
      return [
        { label: 'Pending', value: 0, color: '#991b1b' },
        { label: 'Confirmed', value: 0, color: '#1e40af' },
        { label: 'Shipped', value: 0, color: '#5b21b6' },
        { label: 'Delivered', value: 0, color: '#065f46' },
        { label: 'Cancelled', value: 0, color: '#7f1d1d' }
      ];
    }

    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      shipped: 0,
      delivered: 0,
      ready: 0,
      pickedUp: 0,
      cancelled: 0
    };

    orders.forEach((order: any) => {
      const status = order.status || 'pending';
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });

    return [
      { label: 'Pending', value: statusCounts.pending, color: '#991b1b' },
      { label: 'Confirmed', value: statusCounts.confirmed, color: '#1e40af' },
      { label: 'Shipped', value: statusCounts.shipped, color: '#5b21b6' },
      { label: 'Delivered', value: statusCounts.delivered, color: '#065f46' },
      { label: 'Ready', value: statusCounts.ready, color: '#9a3412' },
      { label: 'Picked Up', value: statusCounts.pickedUp, color: '#14532d' },
      { label: 'Cancelled', value: statusCounts.cancelled, color: '#7f1d1d' }
    ].filter(item => item.value > 0);
  };

  // Fetch real data from backend
  const { data: orders, isLoading: ordersLoading } = useAdminOrders();
  const { data: vendors, isLoading: vendorsLoading } = useAdminVendors();
  const { data: products, isLoading: productsLoading } = useAdminProducts();

  // Fetch analytics data from backend
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics/dashboard-stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/analytics/dashboard-stats');
      return await response.json();
    },
  });

  // Calculate real metrics from backend data
  const totalRevenue = analytics?.totalRevenue || 0;
  const totalOrders = analytics?.totalOrders || 0;
  const totalSellers = analytics?.totalSellers || 0;
  const totalProducts = analytics?.totalProducts || 0;

  // Filter vendors by status
  const activeSellers = vendors?.filter((v: any) => v.status === 'approved') || [];
  const pendingSellers = vendors?.filter((v: any) => v.status === 'pending') || [];
  const activeProducts = products?.filter((p: any) => p.isApproved) || [];

  // Calculate conversion metrics
  const completedOrders = orders?.filter((o: any) => o.status === 'delivered').length || 0;
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  // Calculate average order value
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Commission calculation (assuming 0% platform fee)
  const platformCommission = totalRevenue * 0.0;

  if (analyticsLoading || ordersLoading || vendorsLoading || productsLoading) {
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
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600">Platform analytics and performance insights</p>
          </div>
          {/* Remove period state */}
          {/* <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select> */}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{totalRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total platform revenue
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-rupee-sign text-primary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total orders placed
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shopping-cart text-success text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sellers</p>
                  <p className="text-2xl font-bold text-gray-900">{activeSellers.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {pendingSellers.length} pending approval
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-users text-warning text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">{activeProducts.length}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Approved & live products
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-box text-gray-600 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{avgOrderValue.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Average per order
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calculator text-primary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {completionRate.toFixed(1)}%
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Orders completed successfully
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-check-circle text-success text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Platform Commission</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{platformCommission.toLocaleString()}
                  </p>
                  <p className="text-xs text-primary mt-1">
                    <i className="fas fa-percentage mr-1"></i>
                    0% of total revenue
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-coins text-warning text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <RevenueChart data={generateRevenueData()} />
              </div>
            </CardContent>
          </Card>

          {/* Order Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Orders (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <OrderChart data={generateOrderData()} />
              </div>
            </CardContent>
          </Card>

          {/* Order Status Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <StatusChart data={generateStatusData()} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Performing Sellers */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Sellers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topSellers?.length > 0 ? (
                  analytics.topSellers.slice(0, 5).map((seller: any, index: number) => (
                    <div key={seller.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-primary font-medium text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {seller.name || `Vendor ${seller.id}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {seller.orders || 0} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ₹{(seller.revenue || 0).toLocaleString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {totalRevenue > 0 ? ((seller.revenue || 0) / totalRevenue * 100).toFixed(1) : 0}%
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-4">No seller data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analytics?.recentOrders?.length > 0 ? (
                    analytics.recentOrders.map((order: any) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="font-medium">#{order.orderNumber}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{order.customer}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">₹{order.amount.toLocaleString()}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            order.status === 'delivered' ? 'default' :
                            order.status === 'shipped' ? 'outline' :
                            order.status === 'confirmed' ? 'secondary' :
                            order.status === 'pending' ? 'secondary' :
                            'destructive'
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        No recent orders available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
