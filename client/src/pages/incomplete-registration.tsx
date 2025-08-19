import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useVendorByUser } from '@/hooks/use-api';
import { CheckCircle, AlertCircle, Package, User, Clock, ArrowRight } from 'lucide-react';

export default function IncompleteRegistration() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [pendingData, setPendingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Get vendor record for the current user
  const { data: vendorRecord, isLoading: vendorLoading } = useVendorByUser(user?.id);

  useEffect(() => {
    // Check for pending registration data
    const data = localStorage.getItem('pendingSellerData');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        setPendingData(parsedData);
      } catch (err) {
        console.error('Error parsing pending data:', err);
      }
    }
    setIsLoading(false);
  }, []);

  // Redirect admin users away from this page
  useEffect(() => {
    if (user) {
      const userRole = user.role;
      const roleName = typeof userRole === 'object' ? userRole.name : userRole;
      
      if (roleName === 'admin') {
        setLocation('/admin');
        return;
      }
    }
  }, [user, setLocation]);

  const handleCompleteRegistration = () => {
    setLocation('/subscription-selection');
  };

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const handleStartOver = () => {
    // Clear pending data and redirect to signup
    localStorage.removeItem('pendingSellerData');
    logout();
    setLocation('/signup');
  };

  if (isLoading || vendorLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-orange-100 mb-4">
            <AlertCircle className="h-8 w-8 text-orange-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Registration Incomplete
          </h1>
          <p className="text-lg text-gray-600">
            Your account has been created, but you need to complete your subscription to access the seller dashboard.
          </p>
        </div>

        {/* Status Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="h-5 w-5 mr-2" />
              Account Status
            </CardTitle>
            <CardDescription>
              Your registration progress and next steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* User Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Account Created Successfully
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Username: {user?.username} | Email: {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Pending Status */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center">
                  <Clock className="h-5 w-5 text-orange-600 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Subscription Required
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      Choose a subscription plan to activate your seller account
                    </p>
                  </div>
                </div>
              </div>

              {/* Registration Data */}
              {pendingData && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <Package className="h-5 w-5 text-blue-600 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-blue-800">
                        Registration Data Ready
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        Shop: {pendingData.formData.shopName} | Business: {pendingData.formData.businessType}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-4">
          <Button
            onClick={handleCompleteRegistration}
            size="lg"
            className="w-full"
          >
            <Package className="h-4 w-4 mr-2" />
            Complete Registration & Choose Plan
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <div className="flex space-x-4">
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex-1"
            >
              Logout
            </Button>
            <Button
              onClick={handleStartOver}
              variant="outline"
              className="flex-1"
            >
              Start Over
            </Button>
          </div>
        </div>

        {/* Information */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Need help? Contact support for assistance with your registration.</p>
        </div>
      </div>
    </div>
  );
} 