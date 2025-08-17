import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, MessageCircle, TrendingUp, Calendar, Clock } from 'lucide-react';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { useAuth } from '@/hooks/use-auth';
import { useVendorButtonAnalytics, useVendorButtonClickLogs } from '@/hooks/use-api';

export default function SellerButtonTracking() {
  const { user } = useAuth();

  // Use the vendorId from the user object (which is already set to the Strapi vendor ID)
  const vendorId = user?.vendorId;

  // Fetch button analytics using the vendor ID from user object
  const { 
    data: buttonAnalytics, 
    isLoading: buttonAnalyticsLoading, 
    refetch: refetchAnalytics 
  } = useVendorButtonAnalytics(vendorId || undefined);

  // Fetch detailed button click logs from database
  const { 
    data: clickLogs, 
    isLoading: clickLogsLoading 
  } = useVendorButtonClickLogs(vendorId || undefined);

  const isLoading = buttonAnalyticsLoading || clickLogsLoading;

  // Generate real analytics data from backend
  const generateAnalyticsData = () => {
    // Handle different response structures - Strapi returns data.results
    const logsData = clickLogs?.data?.results || clickLogs?.data || clickLogs || [];
    
    // Ensure we have an array to map over
    if (!Array.isArray(logsData)) {
      console.warn('Button click logs data is not an array:', logsData);
      return [];
    }
    
    // If no real logs exist, generate sample data based on analytics
    if (logsData.length === 0 && buttonAnalytics?.totalClicks > 0) {
      const sampleData = [];
      const buttonTypes = ['call', 'whatsapp'];
      
      for (let i = 0; i < Math.min(buttonAnalytics.totalClicks, 10); i++) {
        const buttonType = buttonTypes[i % buttonTypes.length];
        sampleData.push({
          id: i + 1,
          buttonType,
          userName: `Customer ${i + 1}`,
          userPhone: `+91 98765${String(i + 1).padStart(4, '0')}`,
          contactNumber: `+91 98765${String(i + 1).padStart(4, '0')}`,
          whatsappNumber: `+91 98765${String(i + 1).padStart(4, '0')}`,
          clickedAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)).toISOString(),
          userLocation: 'Mobile App',
          deviceInfo: { platform: 'Android', appVersion: '1.0.0' },
          ipAddress: `192.168.1.${100 + i}`
        });
      }
      return sampleData;
    }
    
    // Use real click logs from database
    return logsData.map((log: any, index: number) => ({
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>



        {/* Detailed Analytics */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Button Click Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>



        {/* Button Clicks Table */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Button Clicks</CardTitle>
          </CardHeader>
          <CardContent>
            
            {analyticsData.length > 0 ? (
              <div className="overflow-x-auto">
                {/* Show note if using sample data */}
                {(clickLogs?.data?.results?.length === 0 || !clickLogs?.data?.results) && buttonAnalytics?.totalClicks > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-yellow-600 mt-1 mr-2"></i>
                      <div>
                        <p className="text-sm text-yellow-800">
                          <strong>📊 Sample Data:</strong> Detailed click logs are not yet available in the database. 
                          The table below shows sample data based on your total click count. 
                          Real user details will appear here once detailed logging is implemented.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
                    {analyticsData.map((item: any) => (
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
                              'bg-gray-100 text-gray-800'
                            }
                          >
                            <div className="flex items-center">
                              {item.buttonType === 'call' && <Phone className="h-3 w-3 mr-1" />}
                              {item.buttonType === 'whatsapp' && <MessageCircle className="h-3 w-3 mr-1" />}
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
                  Button clicks will appear here when customers interact with your buttons
                </p>
              </div>
            )}
          </CardContent>
        </Card>


      </main>
    </div>
  );
} 