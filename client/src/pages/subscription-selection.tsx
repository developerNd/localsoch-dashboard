import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getApiUrl, API_ENDPOINTS } from '@/lib/config';
import { initializePayment, completeSellerRegistration, createSubscription, PaymentData } from '@/lib/razorpay';
import { useVendorByUser } from '@/hooks/use-api';
import { CheckCircle, Star, Package, Loader2, AlertCircle } from 'lucide-react';

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  durationType: string;
  isActive: boolean;
  isPopular: boolean;
  sortOrder: number;
  features: string[];
  maxProducts: number;
  maxOrders: number;
  commissionRate: number;
}

export default function SubscriptionSelection() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [pendingData, setPendingData] = useState<any>(null);
  const [error, setError] = useState('');
  const [isNewRegistration, setIsNewRegistration] = useState(false);

  // Get vendor record for existing users
  const { data: vendorRecord } = useVendorByUser(user?.id);

  // Fetch subscription plans dynamically from backend
  const { data: plans, isLoading: plansLoading, error: plansError } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const response = await fetch(getApiUrl(API_ENDPOINTS.SUBSCRIPTION.PLANS));
      if (!response.ok) {
        throw new Error(`Failed to fetch subscription plans: ${response.status}`);
      }
      const data = await response.json();
      return data.data || [];
    },
    retry: 2,
    retryDelay: 1000,
  });

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated) {
      setError('Please log in to view subscription plans.');
      return;
    }

    // Get pending seller data from localStorage (for new registrations)
    const data = localStorage.getItem('pendingSellerData');
    if (data) {
      try {
        const parsedData = JSON.parse(data);
        setPendingData(parsedData);
        setIsNewRegistration(true);
      } catch (err) {
        setError('Invalid registration data. Please start the registration process again.');
      }
    } else {
      // For existing users, no pending data is required
      setIsNewRegistration(false);
    }
  }, [isAuthenticated]);

  const handlePlanSelection = (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
  };

  const handlePayment = async () => {
    if (!selectedPlan) {
      toast({
        title: "Error",
        description: "Please select a subscription plan.",
        variant: "destructive",
      });
      return;
    }

    // For new registrations, we need pending data
    if (isNewRegistration && !pendingData) {
      toast({
        title: "Error",
        description: "Registration data not found. Please start the registration process again.",
        variant: "destructive",
      });
      return;
    }

    // For existing users, we need vendor record
    if (!isNewRegistration && !vendorRecord) {
      toast({
        title: "Error",
        description: "Vendor account not found. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paymentData: PaymentData = {
        amount: selectedPlan.price,
        currency: selectedPlan.currency,
        name: 'LocalSoch',
        description: `${selectedPlan.name} - Seller Subscription`,
        customerName: isNewRegistration 
          ? `${pendingData.formData.firstName} ${pendingData.formData.lastName}`
          : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Seller',
        customerEmail: isNewRegistration 
          ? pendingData.formData.email 
          : user?.email || '',
        customerPhone: isNewRegistration 
          ? pendingData.formData.phone 
          : user?.phone || '',
        address: isNewRegistration 
          ? pendingData.formData.address 
          : '',
      };

      await initializePayment(
        paymentData,
        // Success handler
        async (response) => {
          console.log('Payment successful:', response);
          
          if (isNewRegistration) {
            // Complete seller registration with subscription
            const success = await completeSellerRegistration(response);
            
            if (success) {
              toast({
                title: "Payment Successful!",
                description: `Your ${selectedPlan.name} subscription is now active.`,
              });
              
              // Clear pending data
              localStorage.removeItem('pendingSellerData');
              
              // Redirect to seller dashboard
              setTimeout(() => {
                setLocation('/seller');
              }, 2000);
            } else {
              setError('Payment successful but registration failed. Please contact support.');
            }
          } else {
            // For existing users, create subscription
            const success = await createSubscription(response, selectedPlan.id, vendorRecord?.id || 0);
            
            if (success) {
              toast({
                title: "Payment Successful!",
                description: `Your ${selectedPlan.name} subscription is now active.`,
              });
              
              // Redirect to seller dashboard
              setTimeout(() => {
                setLocation('/seller');
              }, 2000);
            } else {
              setError('Payment successful but subscription creation failed. Please contact support.');
            }
          }
        },
        // Failure handler
        (error) => {
          console.error('Payment failed:', error);
          setError('Payment failed. Please try again.');
          toast({
            title: "Payment Failed",
            description: "There was an error processing your payment. Please try again.",
            variant: "destructive",
          });
        },
        // Dismiss handler
        () => {
          console.log('Payment modal dismissed');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Payment error:', error);
      setError('Failed to initialize payment. Please try again.');
      toast({
        title: "Payment Error",
        description: "Failed to initialize payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state
  if (plansLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please log in to view subscription plans.
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => setLocation('/login')} 
            className="mt-4 w-full"
          >
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  // Show error if no plans available
  if (plansError || !plans || plans.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {plansError ? 
                'Failed to load subscription plans. Please try again later.' :
                'No subscription plans are currently available. Please contact support.'
              }
            </AlertDescription>
          </Alert>
          <div className="mt-4 space-y-2">
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              Retry
            </Button>
            <Button 
              onClick={() => setLocation('/seller')} 
              variant="outline"
              className="w-full"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show error for registration data (only for new registrations)
  if (isNewRegistration && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button 
            onClick={() => setLocation('/signup')} 
            className="mt-4 w-full"
          >
            Back to Registration
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isNewRegistration ? 'Choose Your Subscription Plan' : 'Subscription Plans'}
          </h1>
          <p className="text-lg text-gray-600">
            {isNewRegistration 
              ? 'Select the perfect plan for your business needs'
              : 'Choose a plan that fits your business requirements'
            }
          </p>
        </div>

        {/* Registration Summary - Only for new registrations */}
        {isNewRegistration && pendingData && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                Registration Complete
              </CardTitle>
              <CardDescription>
                Your account has been created successfully. Now choose your subscription plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {pendingData.formData.firstName} {pendingData.formData.lastName}
                </div>
                <div>
                  <span className="font-medium">Shop:</span> {pendingData.formData.shopName}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {pendingData.formData.email}
                </div>
                <div>
                  <span className="font-medium">Phone:</span> {pendingData.formData.phone}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* User Info - For existing users */}
        {!isNewRegistration && user && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                Current Account
              </CardTitle>
              <CardDescription>
                You're logged in as {user.username}. Choose a subscription plan to upgrade your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Username:</span> {user.username}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
                <div>
                  <span className="font-medium">Name:</span> {user.firstName} {user.lastName}
                </div>
                <div>
                  <span className="font-medium">Role:</span> {typeof user.role === 'object' ? user.role.name : user.role}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {plans?.map((plan: SubscriptionPlan) => (
            <Card 
              key={plan.id} 
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedPlan?.id === plan.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handlePlanSelection(plan)}
            >
              {plan.isPopular && (
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-yellow-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center">
                  <Package className="h-5 w-5 mr-2" />
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Price */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    ₹{plan.price}
                  </div>
                  <div className="text-sm text-gray-600">
                    per {plan.duration} {plan.durationType}
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  <div className="text-sm font-medium">Features:</div>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {plan.features?.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Limits */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Max Products:</span>
                    <span className="font-medium">
                      {plan.maxProducts === -1 ? 'Unlimited' : plan.maxProducts}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Orders:</span>
                    <span className="font-medium">
                      {plan.maxOrders === -1 ? 'Unlimited' : plan.maxOrders}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Commission:</span>
                    <span className="font-medium">{plan.commissionRate}%</span>
                  </div>
                </div>

                {/* Selection Indicator */}
                {selectedPlan?.id === plan.id && (
                  <div className="flex items-center justify-center text-blue-600 font-medium">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Selected
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Payment Button */}
        <div className="text-center">
          <Button
            onClick={handlePayment}
            disabled={!selectedPlan || loading}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : selectedPlan ? (
              `Pay ₹${selectedPlan.price} for ${selectedPlan.name}`
            ) : (
              'Select a Plan to Continue'
            )}
          </Button>
          
          {selectedPlan && (
            <p className="text-sm text-gray-500 mt-2">
              You'll be redirected to secure payment gateway
            </p>
          )}
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>All plans include secure payment processing and 24/7 support</p>
          <p>You can upgrade or downgrade your plan at any time</p>
          
          {/* Back to Dashboard button for existing users */}
          {!isNewRegistration && (
            <div className="mt-6">
              <Button 
                onClick={() => setLocation('/seller')} 
                variant="outline"
                className="mt-2"
              >
                <i className="fas fa-arrow-left mr-2"></i>
                Back to Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}