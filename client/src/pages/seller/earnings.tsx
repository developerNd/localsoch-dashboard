import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import SalesChart from '@/components/charts/sales-chart';
import { useState } from 'react';

export default function SellerEarnings() {
  const [period, setPeriod] = useState('30days');

  const { data: earnings, isLoading: earningsLoading } = useQuery({
    queryKey: ['/api/earnings'],
  });

  const { data: analytics } = useQuery({
    queryKey: ['/api/analytics'],
  });

  // Generate chart data for earnings
  const chartData = [
    { date: 'Week 1', sales: 15000 },
    { date: 'Week 2', sales: 22000 },
    { date: 'Week 3', sales: 18000 },
    { date: 'Week 4', sales: 25000 },
  ];

  const totalEarnings = earnings?.reduce((sum: number, earning: any) => 
    sum + parseFloat(earning.netAmount), 0) || 0;
  
  const totalCommissions = earnings?.reduce((sum: number, earning: any) => 
    sum + parseFloat(earning.commissionAmount), 0) || 0;

  const pendingEarnings = earnings?.filter((e: any) => e.status === 'pending')
    .reduce((sum: number, earning: any) => sum + parseFloat(earning.netAmount), 0) || 0;

  if (earningsLoading) {
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
            <h2 className="text-2xl font-bold text-gray-900">Earnings</h2>
            <p className="text-gray-600">Track your sales revenue and commission details</p>
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

        {/* Earnings Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-wallet text-success text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{totalEarnings.toLocaleString()}
                  </p>
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
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{pendingEarnings.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-error/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-percentage text-error text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Commission Paid</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{totalCommissions.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-4">
                  <i className="fas fa-chart-line text-primary text-xl"></i>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Order Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ₹{analytics?.totalOrders ? (analytics.totalRevenue / analytics.totalOrders).toLocaleString() : '0'}
                  </p>
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
                <CardTitle>Earnings Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <SalesChart data={chartData} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Commission Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Commission Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Platform Fee</p>
                    <p className="text-sm text-gray-500">5% per transaction</p>
                  </div>
                  <Badge variant="outline">5%</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Payment Gateway</p>
                    <p className="text-sm text-gray-500">2.5% per transaction</p>
                  </div>
                  <Badge variant="outline">2.5%</Badge>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-success/10 rounded-lg border border-success/20">
                  <div>
                    <p className="font-medium">You Keep</p>
                    <p className="text-sm text-gray-500">After deductions</p>
                  </div>
                  <Badge variant="default">92.5%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earnings History */}
        <Card>
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
          </CardHeader>
          <CardContent>
            {earnings?.length === 0 ? (
              <div className="text-center py-8">
                <i className="fas fa-coins text-4xl text-gray-300 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No earnings yet</h3>
                <p className="text-gray-600">Your earnings will appear here once you start making sales.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Order #</TableHead>
                      <TableHead>Gross Amount</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Net Earnings</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {earnings?.map((earning: any) => (
                      <TableRow key={earning.id}>
                        <TableCell>
                          {new Date(earning.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="font-mono">
                          #{earning.orderId}
                        </TableCell>
                        <TableCell>
                          ₹{parseFloat(earning.grossAmount).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-error">
                          -₹{parseFloat(earning.commissionAmount).toLocaleString()}
                        </TableCell>
                        <TableCell className="font-medium text-success">
                          ₹{parseFloat(earning.netAmount).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={earning.status === 'paid' ? 'default' : 'destructive'}>
                            {earning.status}
                          </Badge>
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
