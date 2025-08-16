import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, CheckCircle, AlertCircle, LogOut } from 'lucide-react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { getApiUrl, API_ENDPOINTS } from '@/lib/config';
import { getAuthToken } from '@/lib/auth';
import { useEffect } from 'react';

export default function PendingApproval() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch vendor data to check approval status
  const { data: vendorResponse, isLoading } = useQuery({
    queryKey: ['/api/vendors/me'],
    enabled: !!user?.vendorId,
    queryFn: async () => {
      const token = getAuthToken();
      if (!token || !user?.vendorId) throw new Error('No token or vendor ID');
      
      const res = await fetch(getApiUrl(`${API_ENDPOINTS.VENDORS}/${user.vendorId}?populate=*`), {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to fetch vendor data');
      const response = await res.json();
      
      // Handle different response structures
      const vendorData = response.data || response;
      return vendorData;
    },
  });

  // Auto-redirect if approved
  useEffect(() => {
    if (!isLoading && vendorResponse) {
      const status = vendorResponse.status;
      const isApproved = vendorResponse.isApproved;
      
      // Check if vendor is approved (either status or isApproved field)
      if (status === 'approved' || isApproved === true) {
        setLocation('/seller');
      }
    }
  }, [vendorResponse, isLoading, setLocation]);

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const getStatusInfo = () => {
    if (!vendorResponse) return { status: 'pending', message: 'Your application is under review' };
    
    const status = vendorResponse.status || 'pending';
    const reason = vendorResponse.statusReason || '';
    
    switch (status) {
      case 'approved':
        return { 
          status: 'approved', 
          message: 'Your application has been approved! You can now access your dashboard.',
          icon: CheckCircle,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'rejected':
        return { 
          status: 'rejected', 
          message: `Your application has been rejected. ${reason ? `Reason: ${reason}` : ''}`,
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200'
        };
      case 'pending':
      default:
        return { 
          status: 'pending', 
          message: 'Your application is currently under review by our admin team.',
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon || Clock;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Checking approval status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">LocalSoch Dashboard</h1>
          <p className="text-gray-600">Seller Portal</p>
        </div>

        {/* Status Card */}
        <Card className={`${statusInfo.bgColor} ${statusInfo.borderColor} border-2`}>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-16 h-16 ${statusInfo.bgColor} rounded-full flex items-center justify-center`}>
                <StatusIcon className={`w-8 h-8 ${statusInfo.color}`} />
              </div>
            </div>
            <CardTitle className={`${statusInfo.color}`}>
              {statusInfo.status === 'approved' && 'Application Approved!'}
              {statusInfo.status === 'rejected' && 'Application Rejected'}
              {statusInfo.status === 'pending' && 'Application Under Review'}
            </CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {statusInfo.message}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* User Info */}
            <div className="bg-white rounded-lg p-4 border">
              <h3 className="font-medium text-gray-900 mb-2">Your Information</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Name:</span> {user?.firstName} {user?.lastName}</p>
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">Username:</span> {user?.username}</p>
                {vendorResponse && (
                  <p><span className="font-medium">Shop:</span> {vendorResponse.name}</p>
                )}
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex justify-center">
              <Badge 
                variant={
                  statusInfo.status === 'approved' ? 'default' : 
                  statusInfo.status === 'rejected' ? 'destructive' : 'secondary'
                }
                className="text-sm px-4 py-2"
              >
                {statusInfo.status === 'approved' && 'Approved'}
                {statusInfo.status === 'rejected' && 'Rejected'}
                {statusInfo.status === 'pending' && 'Pending Approval'}
              </Badge>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              {statusInfo.status === 'approved' && (
                <Button 
                  className="w-full" 
                  onClick={() => setLocation('/seller')}
                >
                  Access Dashboard
                </Button>
              )}
              
              {statusInfo.status === 'rejected' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    If you believe this was an error, please contact our support team.
                  </AlertDescription>
                </Alert>
              )}
              
              {statusInfo.status === 'pending' && (
                <div className="text-center text-sm text-gray-600">
                  <p>We typically review applications within 24-48 hours.</p>
                  <p className="mt-1">You'll receive an email notification once your application is reviewed.</p>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>Need help? Contact support at support@localsoch.com</p>
        </div>
      </div>
    </div>
  );
} 