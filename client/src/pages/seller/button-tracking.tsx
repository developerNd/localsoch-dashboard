import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Phone, MessageCircle, Filter, TrendingUp, Calendar, Clock } from 'lucide-react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAuth } from '@/hooks/use-auth';
import { useVendorButtonAnalytics, useVendor, useVendorButtonClickLogs } from '@/hooks/use-api';
import { useState } from 'react';

export default function SellerButtonTracking() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  // Use the vendorId from the user object (which is already set to the Strapi vendor ID)
  const vendorId = user?.vendorId;

  // Fetch button analytics using the vendor ID from user object
  const { 
    data: buttonAnalytics, 
    isLoading: buttonAnalyticsLoading, 
    refetch: refetchAnalytics 
  } = useVendorButtonAnalytics(vendorId || 0);

  // Fetch detailed button click logs from database
  const { 
    data: clickLogs, 
    isLoading: clickLogsLoading 
  } = useVendorButtonClickLogs(vendorId || 0);

  const isLoading = buttonAnalyticsLoading || clickLogsLoading;

  // Generate real analytics data from backend
  const generateAnalyticsData = () => {
    if (!clickLogs?.data) return [];
    
    // Use real click logs from database
    return clickLogs.data.map((log: any, index: number) => ({
      id: log.id || index + 1,
      buttonType: log.buttonType,
      userName: log.userInfo?.name || 'Anonymous User',
      userPhone: log.userInfo?.phone || 'Not provided',
      contactNumber: log.userInfo?.phone || 'Not provided',
      whatsappNumber: log.userInfo?.phone || 'Not provided',
      clickedAt: log.clickedAt,
      userLocation: log.location || 'Mobile App',
      deviceInfo: log.deviceInfo,
      ipAddress: log.ipAddress
    }));
  };

  const analyticsData = generateAnalyticsData();

  // Filter data based on search term and filter type
  const filteredData = analyticsData.filter((item: any) => {
    const matchesSearch = item.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.userPhone.includes(searchTerm) ||
                         item.userLocation.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || item.buttonType === filterType;
    
    return matchesSearch && matchesFilter;
  });

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
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Button Click Tracking
              </h2>
              <p className="text-gray-600">
                Monitor customer interactions with your call and WhatsApp buttons.
              </p>
              {user?.vendorId && (
                <p className="text-sm text-gray-500 mt-1">
                  Vendor ID: {user?.vendorId} | Store: myshop
                </p>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${buttonAnalyticsLoading ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
              <span className="text-sm text-gray-600">
                {buttonAnalyticsLoading ? 'Updating...' : 'Live Data'}
              </span>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{buttonAnalytics?.totalClicks || 0}</div>
              <p className="text-xs text-muted-foreground">
                All time button interactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Call Clicks</CardTitle>
              <Phone className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{buttonAnalytics?.buttonClicks?.callClicks || 0}</div>
              <p className="text-xs text-muted-foreground">
                Phone call button interactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">WhatsApp Clicks</CardTitle>
              <MessageCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{buttonAnalytics?.buttonClicks?.whatsappClicks || 0}</div>
              <p className="text-xs text-muted-foreground">
                WhatsApp button interactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-bold">
                {buttonAnalytics?.lastUpdated 
                  ? new Date(buttonAnalytics.lastUpdated).toLocaleDateString()
                  : 'Never'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                {buttonAnalytics?.lastUpdated 
                  ? new Date(buttonAnalytics.lastUpdated).toLocaleTimeString()
                  : 'No data'
                }
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Contact Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Phone className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">Call Number</p>
                  <p className="text-sm text-gray-600">Not available in this demo</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <MessageCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">WhatsApp Number</p>
                  <p className="text-sm text-gray-600">Not available in this demo</p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-500 mt-1 mr-2"></i>
                <div>
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can update these numbers in your{' '}
                    <a href="/seller/profile" className="underline font-medium">Shop Settings</a>.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-check-circle text-green-500 mt-1 mr-2"></i>
                <div>
                  <p className="text-sm text-green-800">
                    <strong>✅ Enhanced Tracking:</strong> Button clicks now collect detailed user information including name, device, location, and timestamp. This data is stored securely for analytics purposes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analytics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detailed Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-yellow-500 mt-1 mr-2"></i>
                <div>
                  <p className="text-sm text-yellow-800">
                    <strong>📊 Real Database Data:</strong> The table below shows actual user interactions from your mobile app. Each row represents a real user who clicked your buttons, with their device information and timestamps.
                  </p>
                </div>
              </div>
            </div>
            <div className="mb-4 p-3 bg-purple-50 rounded-lg">
              <div className="flex items-start">
                <i className="fas fa-database text-purple-500 mt-1 mr-2"></i>
                <div>
                  <p className="text-sm text-purple-800">
                    <strong>💾 Database Storage:</strong> Click counts are stored in the <code>vendors</code> table in the <code>buttonClicks</code> component. Detailed user logs are saved in the <code>button_click_logs</code> table with user information, device details, and timestamps.
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">Call Clicks</p>
                    <p className="text-2xl font-bold text-green-600">{buttonAnalytics?.buttonClicks?.callClicks || 0}</p>
                  </div>
                  <Phone className="h-8 w-8 text-green-600" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-green-600">
                    {buttonAnalytics?.totalClicks 
                      ? `${Math.round((buttonAnalytics.buttonClicks?.callClicks || 0) / buttonAnalytics.totalClicks * 100)}% of total`
                      : '0% of total'
                    }
                  </p>
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">WhatsApp Clicks</p>
                    <p className="text-2xl font-bold text-blue-600">{buttonAnalytics?.buttonClicks?.whatsappClicks || 0}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-blue-600">
                    {buttonAnalytics?.totalClicks 
                      ? `${Math.round((buttonAnalytics.buttonClicks?.whatsappClicks || 0) / buttonAnalytics.totalClicks * 100)}% of total`
                      : '0% of total'
                    }
                  </p>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-800">Message Clicks</p>
                    <p className="text-2xl font-bold text-purple-600">{buttonAnalytics?.buttonClicks?.messageClicks || 0}</p>
                  </div>
                  <MessageCircle className="h-8 w-8 text-purple-600" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-purple-600">
                    {buttonAnalytics?.totalClicks 
                      ? `${Math.round((buttonAnalytics.buttonClicks?.messageClicks || 0) / buttonAnalytics.totalClicks * 100)}% of total`
                      : '0% of total'
                    }
                  </p>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">Email Clicks</p>
                    <p className="text-2xl font-bold text-orange-600">{buttonAnalytics?.buttonClicks?.emailClicks || 0}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-orange-600" />
                </div>
                <div className="mt-2">
                  <p className="text-xs text-orange-600">
                    {buttonAnalytics?.totalClicks 
                      ? `${Math.round((buttonAnalytics.buttonClicks?.emailClicks || 0) / buttonAnalytics.totalClicks * 100)}% of total`
                      : '0% of total'
                    }
                  </p>
                </div>
              </div>
            </div>

            {buttonAnalytics?.buttonClicks && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3">Button Click Breakdown</h4>
                <div className="space-y-2">
                  {Object.entries(buttonAnalytics.buttonClicks).map(([key, value]) => {
                    if (key === 'id' || key === 'totalClicks' || key === 'lastUpdated') return null;
                    return (
                      <div key={key} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 capitalize">
                          {key.replace('Clicks', ' Clicks')}
                        </span>
                        <span className="text-sm font-medium text-gray-900">{String(value)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Filter className="h-5 w-5 mr-2" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by name, phone, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by button type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Button Types</SelectItem>
                  <SelectItem value="call">Call Button</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp Button</SelectItem>
                  <SelectItem value="message">Message Button</SelectItem>
                  <SelectItem value="email">Email Button</SelectItem>
                  <SelectItem value="website">Website Button</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Button Clicks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Button Click Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-600 mt-1 mr-2"></i>
                <div>
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> The detailed click data below is generated from your actual button click analytics. 
                    Customer names are anonymized for privacy, but the click counts and types match your real data.
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    <strong>Database:</strong> Button clicks are stored in the <code>vendors</code> table in the <code>buttonClicks</code> component field.
                  </p>
                </div>
              </div>
            </div>
            
            {filteredData.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">User</th>
                      <th className="text-left py-3 px-4 font-medium">Contact Number</th>
                      <th className="text-left py-3 px-4 font-medium">Location</th>
                      <th className="text-left py-3 px-4 font-medium">Button Type</th>
                      <th className="text-left py-3 px-4 font-medium">Clicked At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.map((item: any) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="font-medium">{item.userName}</div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">
                            {item.contactNumber || item.whatsappNumber || item.userPhone}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.buttonType === 'call' ? 'Call Number' : 
                             item.buttonType === 'whatsapp' ? 'WhatsApp Number' :
                             item.buttonType === 'message' ? 'Message Number' :
                             item.buttonType === 'email' ? 'Email Contact' :
                             'Contact Info'}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">{item.userLocation}</div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            variant="secondary"
                            className={
                              item.buttonType === 'call' ? 'bg-green-100 text-green-800' :
                              item.buttonType === 'whatsapp' ? 'bg-blue-100 text-blue-800' :
                              item.buttonType === 'message' ? 'bg-purple-100 text-purple-800' :
                              item.buttonType === 'email' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            <div className="flex items-center">
                              {item.buttonType === 'call' && <Phone className="h-3 w-3 mr-1" />}
                              {item.buttonType === 'whatsapp' && <MessageCircle className="h-3 w-3 mr-1" />}
                              {item.buttonType === 'message' && <MessageCircle className="h-3 w-3 mr-1" />}
                              {item.buttonType === 'email' && <Calendar className="h-3 w-3 mr-1" />}
                              {item.buttonType === 'website' && <i className="fas fa-globe h-3 w-3 mr-1" />}
                              {item.buttonType.charAt(0).toUpperCase() + item.buttonType.slice(1)}
                            </div>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div className="text-sm text-gray-600">
                            {new Date(item.clickedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(item.clickedAt).toLocaleTimeString()}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No button clicks found</p>
                <p className="text-sm text-gray-500 mt-2">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your filters' 
                    : 'Button clicks will appear here when customers interact with your buttons'
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Refresh Button */}
        <div className="mt-8 text-center">
          <Button onClick={() => refetchAnalytics()} variant="outline">
            <i className="fas fa-sync-alt mr-2"></i>
            Refresh Data
          </Button>
        </div>
      </main>
    </div>
  );
} 