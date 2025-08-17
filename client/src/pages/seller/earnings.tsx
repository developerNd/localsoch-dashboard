import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import SalesChart from '@/components/charts/sales-chart';
import { useAuth } from '@/hooks/use-auth';
import { useSellerEarnings, useProducts } from '@/hooks/use-api';

export default function SellerEarnings() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('7days');

  // Get seller-specific earnings data
  const { data: earnings, isLoading } = useSellerEarnings(user?.vendorId);
  
  // Get seller's products for active products count
  const { data: products } = useProducts();
  
  // Filter products for current seller
  const sellerProducts = Array.isArray(products) ? products.filter((product: any) => 
    product.vendorId === user?.vendorId || product.sellerId === user?.vendorId
  ) : [];
  
  const activeProducts = sellerProducts.filter((p: any) => p.isActive).length;
  const totalProducts = sellerProducts.length;

  // Get chart data based on selected time range
  const getChartData = () => {
    if (!earnings) return [];
    
    switch (timeRange) {
      case '7days':
        return earnings.weeklyEarnings;
      case '30days':
        return earnings.monthlyEarnings;
      default:
        return earnings.weeklyEarnings;
    }
  };

  // Calculate today's, this week's, and this month's earnings
  const getTodayEarnings = () => {
    if (!earnings?.weeklyEarnings) return 0;
    return earnings.weeklyEarnings[earnings.weeklyEarnings.length - 1]?.sales || 0;
  };

  const getThisWeekEarnings = () => {
    if (!earnings?.weeklyEarnings) return 0;
    return earnings.weeklyEarnings.reduce((sum: number, day: any) => sum + day.sales, 0);
  };

  const getThisMonthEarnings = () => {
    if (!earnings?.monthlyEarnings) return 0;
    return earnings.monthlyEarnings.reduce((sum: number, day: any) => sum + day.sales, 0);
  };



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
      
              <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Earnings & Analytics 📊
          </h2>
          <p className="text-gray-600">Track your business performance and revenue insights.</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{earnings?.totalRevenue?.toLocaleString() || '0'}
                  </p>
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    +{earnings?.performanceMetrics?.revenueGrowth || 0}% from last month
                  </p>
                </div>
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-rupee-sign text-success text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {earnings?.totalOrders || 0}
                  </p>
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    {earnings?.totalOrders > 0 ? 'Active orders' : 'No orders yet'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-shopping-cart text-primary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{earnings?.averageOrderValue?.toFixed(0) || '0'}
                  </p>
                  <p className="text-xs text-success mt-1">
                    <i className="fas fa-arrow-up mr-1"></i>
                    {earnings?.averageOrderValue > 0 ? 'Good average' : 'No orders yet'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-chart-line text-warning text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Products</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {activeProducts}/{totalProducts}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0}% active
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-box text-secondary text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Earnings Chart */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Earnings Chart</CardTitle>
                  <select 
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value)}
                  >
                    <option value="7days">Last 7 days</option>
                    <option value="30days">Last 30 days</option>
                  </select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <SalesChart data={getChartData()} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Order Completion Rate</span>
                    <span className="text-sm text-gray-600">
                      {earnings?.totalOrders > 0 ? `${earnings?.performanceMetrics?.orderCompletionRate || 0}%` : 'No orders'}
                    </span>
                  </div>
                  <Progress 
                    value={earnings?.totalOrders > 0 ? (earnings?.performanceMetrics?.orderCompletionRate || 0) : 0} 
                    className="h-2" 
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Customer Satisfaction</span>
                    <span className="text-sm text-gray-600">
                      {earnings?.totalOrders > 0 ? `${earnings?.performanceMetrics?.customerSatisfaction || 0}/5` : 'No data yet'}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i 
                        key={star}
                        className={`fas fa-star text-sm ${
                          star <= (earnings?.performanceMetrics?.customerSatisfaction || 0)
                            ? 'text-warning' 
                            : 'text-gray-300'
                        }`}
                      ></i>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Product Performance</span>
                    <span className="text-sm text-gray-600">
                      {earnings?.topProducts?.length > 0 ? `${earnings?.performanceMetrics?.productPerformance || 0}%` : 'No products'}
                    </span>
                  </div>
                  <Progress 
                    value={earnings?.topProducts?.length > 0 ? (earnings?.performanceMetrics?.productPerformance || 0) : 0} 
                    className="h-2" 
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Revenue Growth</span>
                    <span className="text-sm text-success">
                      {earnings?.totalOrders > 0 ? `+${earnings?.performanceMetrics?.revenueGrowth || 0}%` : 'No data yet'}
                    </span>
                  </div>
                  <Progress 
                    value={earnings?.totalOrders > 0 ? Math.abs(earnings?.performanceMetrics?.revenueGrowth || 0) : 0} 
                    className="h-2" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Earnings Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Performing Products */}
          <Card>
            <CardHeader>
              <CardTitle>Top Earning Products</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earnings?.topProducts?.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No products found</p>
                ) : (
                  earnings?.topProducts?.slice(0, 5).map((product: any, index: number) => (
                    <div key={product.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-medium text-primary">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">
                            {product.salesCount || 0} units sold
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">
                          ₹{(product.revenue || 0).toLocaleString()}
                        </p>
                        <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-primary h-1.5 rounded-full" 
                            style={{ width: `${Math.min((product.revenue || 0) / 1000, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )) || []
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders Earnings */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Order Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {earnings?.recentOrders?.length === 0 ? (
                  <p className="text-center text-gray-500 py-4">No recent orders</p>
                ) : (
                  earnings?.recentOrders?.map((order: any) => (
                    <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
                          <i className="fas fa-shopping-cart text-success"></i>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          ₹{parseFloat(order.totalAmount).toLocaleString()}
                        </p>
                        <Badge 
                          variant={
                            order.status === 'delivered' ? 'default' :
                            order.status === 'shipped' ? 'secondary' :
                            order.status === 'pending' ? 'destructive' : 'outline'
                          }
                          className="text-xs"
                        >
                          {order.status}
                        </Badge>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 bg-success/5 rounded-lg">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-calendar-day text-success text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Today's Earnings</h3>
                <p className="text-2xl font-bold text-success">₹{getTodayEarnings().toLocaleString()}</p>
                <p className="text-sm text-gray-600">Today's earnings</p>
              </div>

              <div className="text-center p-4 bg-primary/5 rounded-lg">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-calendar-week text-primary text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">This Week</h3>
                <p className="text-2xl font-bold text-primary">₹{getThisWeekEarnings().toLocaleString()}</p>
                <p className="text-sm text-gray-600">This week's earnings</p>
              </div>

              <div className="text-center p-4 bg-warning/5 rounded-lg">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <i className="fas fa-calendar-alt text-warning text-xl"></i>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">This Month</h3>
                <p className="text-2xl font-bold text-warning">₹{getThisMonthEarnings().toLocaleString()}</p>
                <p className="text-sm text-gray-600">This month's earnings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
