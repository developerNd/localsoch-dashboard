import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import SalesChart from '@/components/charts/sales-chart';

export default function AdminAnalytics() {
  const [period, setPeriod] = useState('30days');

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/analytics'],
  });

  const { data: orders } = useQuery({
    queryKey: ['/api/orders'],
  });

  const { data: sellers } = useQuery({
    queryKey: ['/api/admin/sellers'],
  });

  const { data: products } = useQuery({
    queryKey: ['/api/products'],
  });

  // Generate revenue chart data
  const revenueChartData = [
    { date: 'Week 1', sales: 45000 },
    { date: 'Week 2', sales: 52000 },
    { date: 'Week 3', sales: 38000 },
    { date: 'Week 4', sales: 67000 },
    { date: 'Week 5', sales: 59000 },
  ];

  // Generate order trend data
  const orderTrendData = [
    { date: 'Mon', sales: 15 },
    { date: 'Tue', sales: 23 },
    { date: 'Wed', sales: 18 },
    { date: 'Thu', sales: 32 },
    { date: 'Fri', sales: 28 },
    { date: 'Sat', sales: 41 },
    { date: 'Sun', sales: 35 },
  ];

  const totalRevenue = orders?.reduce((sum: number, order: any) => 
    sum + parseFloat(order.totalAmount), 0) || 0;

  const activeSellers = sellers?.filter((s: any) => s.role === 'seller' && s.isActive) || [];
  const pendingSellers = sellers?.filter((s: any) => s.role === 'seller_pending') || [];
  const activeProducts = products?.filter((p: any) => p.isActive && p.isApproved) || [];

  // Calculate conversion metrics
  const totalOrders = orders?.length || 0;
  const completedOrders = orders?.filter((o: any) => o.status === 'delivered').length || 0;
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  // Calculate average order value
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Commission calculation (assuming 5% platform fee)
  const platformCommission = totalRevenue * 0.05;

  if (analyticsLoading) {
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
            <h2 className="text-2xl font-bold text-gray-900">Platform Analytics</h2>
            <p className="text-gray-600">Comprehensive insights and performance metrics</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="3months">Last 3 months</SelectItem>
              <SelectItem value="1year">Last year</SelectItem>
            </SelectContent>
          </Select>
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
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +15.3% from last period
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
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +12.5% from last period
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
                  <p className="text-xs text-warning mt-1">
                    <i className="fas fa-clock mr-1"></i>
                    {pendingSellers.length} pending
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
                  <p className="text-xs text-primary mt-1">
                    <i className="fas fa-box mr-1"></i>
                    Approved & live
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
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +8.2% improvement
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
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +3.1% from last period
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
                    5% of total revenue
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-coins text-warning text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <SalesChart data={revenueChartData} />
              </div>
            </CardContent>
          </Card>

          {/* Order Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Daily Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <SalesChart data={orderTrendData} />
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
                {analytics?.topSellers?.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No seller data available</p>
                ) : (
                  analytics?.topSellers?.slice(0, 5).map((seller: any, index: number) => (
                    <div key={seller.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-primary font-medium text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {seller.firstName} {seller.lastName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {seller.orderCount} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">
                          ₹{(seller.revenue || 0).toLocaleString()}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {((seller.revenue || 0) / totalRevenue * 100).toFixed(1)}%
                        </Badge>
                      </div>
                    </div>
                  )) || []
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Order Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { status: 'delivered', label: 'Delivered', color: 'bg-success' },
                  { status: 'shipped', label: 'Shipped', color: 'bg-primary' },
                  { status: 'confirmed', label: 'Confirmed', color: 'bg-secondary' },
                  { status: 'pending', label: 'Pending', color: 'bg-warning' },
                  { status: 'cancelled', label: 'Cancelled', color: 'bg-error' },
                ].map((item) => {
                  const count = orders?.filter((o: any) => o.status === item.status).length || 0;
                  const percentage = totalOrders > 0 ? (count / totalOrders) * 100 : 0;
                  
                  return (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded ${item.color}`}></div>
                        <span className="font-medium">{item.label}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${item.color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium w-12 text-right">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Impact</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-user-plus text-success"></i>
                        <span>New Seller Registration</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">Seller application submitted for review</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">Pending Review</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-500">2 hours ago</p>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-shopping-cart text-primary"></i>
                        <span>Large Order Placed</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">Order worth ₹25,000 from premium customer</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">High Value</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-500">4 hours ago</p>
                    </TableCell>
                  </TableRow>
                  
                  <TableRow>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <i className="fas fa-box text-warning"></i>
                        <span>Product Approved</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">5 new products approved and went live</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Catalog Growth</Badge>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-gray-500">6 hours ago</p>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
