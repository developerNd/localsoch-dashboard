import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { getApiUrl, API_ENDPOINTS, GST_RATE, calculateGst, calculateTotalWithGst } from '@/lib/config';
import { initializePayment, completeSellerRegistration, createSubscription, PaymentData } from '@/lib/razorpay';
import { useVendorByUser } from '@/hooks/use-api';
import { CheckCircle, Star, Package, Loader2, AlertCircle, LogIn } from 'lucide-react';

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
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [purchaseCompleted, setPurchaseCompleted] = useState(false);
  const [referralDiscount, setReferralDiscount] = useState<{ applied: boolean; percentage: number; originalPrice: number; finalPrice: number } | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [showReferralInput, setShowReferralInput] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState<{ applied: boolean; percentage: number; originalPrice: number; finalPrice: number; code: string } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(false);

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
  }, []);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a coupon code",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPlan) {
      toast({
        title: "Error",
        description: "Please select a plan first",
        variant: "destructive",
      });
      return;
    }

    setCouponLoading(true);
    try {
      const token = isNewRegistration ? pendingData?.jwt : localStorage.getItem('authToken');
      const userId = isNewRegistration ? pendingData?.user?.id : user?.id;

      const response = await fetch(getApiUrl('/api/coupons/validate'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          orderAmount: selectedPlan.price,
          userId: userId
        })
      });

      const data = await response.json();

      if (data.success) {
        const discountPercentage = data.coupon.discountPercentage || 20;
        const finalPrice = Math.round(selectedPlan.price * (1 - discountPercentage / 100));
        
        setCouponDiscount({
          applied: true,
          percentage: discountPercentage,
          originalPrice: selectedPlan.price,
          finalPrice: finalPrice,
          code: couponCode.trim()
        });

        toast({
          title: "Coupon Applied!",
          description: `You saved ${discountPercentage}% on your subscription!`,
          variant: "default",
        });
      } else {
        setCouponDiscount(null);
        toast({
          title: "Invalid Coupon",
          description: data.message || "Please check your coupon code and try again",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponDiscount(null);
      toast({
        title: "Error",
        description: "Failed to apply coupon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponDiscount(null);
    setCouponCode('');
    setShowCouponInput(false);
    toast({
      title: "Coupon Removed",
      description: "Coupon has been removed from your order",
      variant: "default",
    });
  };

  const handlePlanSelection = async (plan: SubscriptionPlan) => {
    setSelectedPlan(plan);
    
    // Reset coupon discount when plan changes
    setCouponDiscount(null);
    setCouponCode('');
    setShowCouponInput(false);
    
    // Check for referral discount when plan is selected
    if (isNewRegistration && referralCode.trim()) {
      try {
        // For now, use a simple validation - any non-empty referral code gets 20% discount
        // This can be enhanced later with actual referral code validation
        const discountPercentage = 20;
        const finalPrice = Math.round(plan.price * (1 - discountPercentage / 100));
        
        setReferralDiscount({
          applied: true,
          percentage: discountPercentage,
          originalPrice: plan.price,
          finalPrice: finalPrice
        });

        console.log('🎁 Referral discount applied:', {
          code: referralCode.trim(),
          discount: discountPercentage,
          originalPrice: plan.price,
          finalPrice: finalPrice
        });
      } catch (error) {
        console.warn('Failed to apply referral discount:', error);
        setReferralDiscount(null);
      }
    } else {
      setReferralDiscount(null);
    }
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
      // Check for referral code and apply discount
      let finalAmount = Math.round(selectedPlan.price);
      let discountApplied = false;
      let discountPercentage = 0;
      let discountType = '';
      
      // Apply coupon discount first (if any)
      if (couponDiscount?.applied) {
        finalAmount = Math.round(couponDiscount.finalPrice);
        discountApplied = true;
        discountPercentage = couponDiscount.percentage;
        discountType = 'coupon';
      }
      // Then apply referral discount (if no coupon applied)
      else if (isNewRegistration && referralCode.trim()) {
        // Simple referral discount - any non-empty code gets 20% discount
        discountPercentage = 20;
        finalAmount = Math.round(selectedPlan.price * (1 - discountPercentage / 100));
        discountApplied = true;
        discountType = 'referral';
        
        console.log('🎁 Referral discount applied:', {
          originalPrice: selectedPlan.price,
          discountPercentage: discountPercentage,
          finalAmount: finalAmount
        });
        
        // Set referral discount state for UI display
        setReferralDiscount({
          applied: true,
          percentage: discountPercentage,
          originalPrice: selectedPlan.price,
          finalPrice: finalAmount
        });
      }
      
      // Ensure finalAmount is properly rounded to avoid floating point issues
      finalAmount = Math.round(finalAmount);
      
      // Calculate GST using rate from config
      const gstRate = GST_RATE;
      const subtotal = finalAmount;
      const gstAmount = calculateGst(subtotal, gstRate);
      const totalWithGst = calculateTotalWithGst(subtotal, gstRate);
      
      console.log('💰 Payment calculation:', {
        originalPrice: selectedPlan.price,
        subtotal: subtotal,
        gstRate: gstRate,
        gstAmount: gstAmount,
        totalWithGst: totalWithGst,
        finalAmountRounded: Math.round(totalWithGst),
        discountApplied: discountApplied,
        discountPercentage: discountPercentage,
        discountType: discountType,
        couponDiscount: couponDiscount?.finalPrice,
        referralDiscount: referralDiscount?.finalPrice
      });
      
      // Final check to ensure amount is a clean integer (including GST)
      const amountInRupees = Math.round(totalWithGst);
      
      console.log('💳 Final payment amount (with GST):', {
        subtotal: subtotal,
        gstAmount: gstAmount,
        totalWithGst: totalWithGst,
        amountInRupees: amountInRupees
      });
      
      const paymentData: PaymentData = {
        amount: amountInRupees, // Send amount in rupees (not paise) to Razorpay, including GST
        currency: selectedPlan.currency,
        name: 'LocalSoch',
        description: discountApplied 
          ? `${selectedPlan.name} - Seller Subscription (${discountPercentage}% ${discountType} discount applied${discountType === 'coupon' ? ` - Coupon: ${couponDiscount?.code}` : referralCode.trim() ? ` - Referral: ${referralCode.trim()}` : ''})`
          : `${selectedPlan.name} - Seller Subscription${referralCode.trim() ? ` (Referral: ${referralCode.trim()})` : ''}`,
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
            const success = await completeSellerRegistration(response, referralCode.trim(), selectedPlan?.id);
            
            if (success) {
              // Clear pending data
              localStorage.removeItem('pendingSellerData');
              
              // Show success message and login modal
              toast({
                title: "Registration & Payment Successful!",
                description: "Your account has been created and subscription activated. Please log in to access your dashboard.",
                variant: "default",
              });
              
              setPurchaseCompleted(true);
              setShowLoginModal(true);
            } else {
              toast({
                title: "Payment Successful, Registration Failed",
                description: "Your payment was processed but there was an issue creating your account. Please contact support.",
                variant: "destructive",
              });
            }
          } else {
            // For existing users, create subscription
            if (vendorRecord?.id) {
              const success = await createSubscription(response, selectedPlan.id, vendorRecord.id);
              
              if (success) {
                toast({
                  title: "Subscription Activated!",
                  description: "Your subscription has been successfully activated.",
                  variant: "default",
                });
                
                // Redirect to seller dashboard
                setLocation('/seller');
              } else {
                toast({
                  title: "Payment Successful, Subscription Failed",
                  description: "Your payment was processed but there was an issue activating your subscription. Please contact support.",
                  variant: "destructive",
                });
              }
            } else {
              toast({
                title: "Vendor Account Not Found",
                description: "Please contact support to link your account.",
                variant: "destructive",
              });
            }
          }
          
          setLoading(false);
        },
        // Error handler
        (error) => {
          console.error('Payment failed:', error);
          toast({
            title: "Payment Failed",
            description: error.message || "There was an error processing your payment. Please try again.",
            variant: "destructive",
          });
          setLoading(false);
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
        {!isNewRegistration && isAuthenticated && user && (
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

        {/* Guest User Info - For users not logged in */}
        {!isNewRegistration && !isAuthenticated && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                Guest User
              </CardTitle>
              <CardDescription>
                You're viewing subscription plans as a guest. Please log in to purchase a plan or complete registration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  To purchase a subscription plan, you need to either:
                </p>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    <span className="text-sm">Complete the registration process</span>
                  </div>
                  <div className="flex items-center">
                    <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                    <span className="text-sm">Log in to your existing account</span>
                  </div>
                </div>
                <div className="flex space-x-2 mt-4">
                  <Button 
                    onClick={() => setLocation('/signup')} 
                    variant="outline"
                    size="sm"
                  >
                    Register
                  </Button>
                  <Button 
                    onClick={() => setLocation('/login')} 
                    size="sm"
                  >
                    Log In
                  </Button>
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
                    <span className="text-lg font-normal text-gray-500 ml-1">+GST</span>
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
                </div>

                {/* Selection Indicator */}
                {selectedPlan?.id === plan.id && (
                  <div className="flex items-center justify-center text-blue-600 font-medium">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Selected
                  </div>
                )}

                {/* Coupon Section - Only show for selected plan */}
                {/* {selectedPlan?.id === plan.id && (
                  <div className="border-t pt-4 mt-4">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700">Have a coupon code?</div>
                      
                      {!showCouponInput ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowCouponInput(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Apply Coupon Code
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              placeholder="Enter coupon code"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyCoupon();
                              }}
                              size="sm"
                              disabled={couponLoading}
                              className="px-4"
                            >
                              {couponLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                'Apply'
                              )}
                            </Button>
                          </div>
                          
                          {couponDiscount?.applied && (
                            <div className="bg-green-50 border border-green-200 rounded-md p-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-green-700 font-medium">
                                  Coupon Applied: {couponDiscount.code}
                                </span>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveCoupon();
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-green-600">
                                  {couponDiscount.percentage}% discount
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs line-through text-gray-500">
                                    ₹{couponDiscount.originalPrice}
                                  </span>
                                  <span className="text-sm font-bold text-green-700">
                                    ₹{Math.round(couponDiscount.finalPrice)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowCouponInput(false);
                              setCouponCode('');
                              setCouponDiscount(null);
                            }}
                            variant="ghost"
                            size="sm"
                            className="w-full text-gray-500"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )} */}

                {/* Referral Code Section - Only show for selected plan and new registrations */}
                {selectedPlan?.id === plan.id && isNewRegistration && (
                  <div className="border-t pt-4 mt-4">
                    <div className="space-y-3">
                      <div className="text-sm font-medium text-gray-700">Have a referral code?</div>
                      
                      {!showReferralInput ? (
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowReferralInput(true);
                          }}
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Star className="h-4 w-4 mr-2" />
                          Apply Referral Code
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <div className="flex space-x-2">
                            <input
                              type="text"
                              value={referralCode}
                              onChange={(e) => setReferralCode(e.target.value)}
                              placeholder="Enter referral code"
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <Button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlanSelection(selectedPlan);
                              }}
                              size="sm"
                              className="px-4"
                            >
                              Apply
                            </Button>
                          </div>
                          
                          {referralDiscount?.applied && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-yellow-700 font-medium">
                                  Referral Applied: {referralCode}
                                </span>
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowReferralInput(false);
                                    setReferralCode('');
                                    setReferralDiscount(null);
                                  }}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-red-600 hover:text-red-700"
                                >
                                  Remove
                                </Button>
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-yellow-600">
                                  {referralDiscount.percentage}% discount
                                </span>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs line-through text-gray-500">
                                    ₹{referralDiscount.originalPrice}
                                  </span>
                                  <span className="text-sm font-bold text-yellow-700">
                                    ₹{Math.round(referralDiscount.finalPrice)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowReferralInput(false);
                              setReferralCode('');
                              setReferralDiscount(null);
                            }}
                            variant="ghost"
                            size="sm"
                            className="w-full text-gray-500"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>



        {/* Coupon Discount Indicator */}
        {couponDiscount?.applied && selectedPlan && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-4">
                <div className="flex items-center text-blue-700">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Coupon Discount Applied!</span>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-lg line-through text-gray-500">₹{couponDiscount.originalPrice}</span>
                    <span className="text-2xl font-bold text-blue-700">₹{Math.round(couponDiscount.finalPrice)}</span>
                  </div>
                  <div className="text-sm text-blue-600">
                    {couponDiscount.percentage}% discount - Code: {couponDiscount.code}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Summary - Show when plan is selected */}
        {selectedPlan && (isNewRegistration || isAuthenticated) && (
          <Card className="mb-6 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg">Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Subtotal */}
                <div className="flex justify-between text-gray-700">
                  <span>Plan Price:</span>
                  <span className="font-medium">₹{selectedPlan.price}</span>
                </div>
                
                {/* Discounts */}
                {couponDiscount?.applied && (
                  <div className="flex justify-between text-green-700">
                    <span>Coupon Discount ({couponDiscount.percentage}%):</span>
                    <span className="font-medium">-₹{selectedPlan.price - couponDiscount.finalPrice}</span>
                  </div>
                )}
                
                {referralDiscount?.applied && !couponDiscount?.applied && (
                  <div className="flex justify-between text-yellow-700">
                    <span>Referral Discount ({referralDiscount.percentage}%):</span>
                    <span className="font-medium">-₹{selectedPlan.price - referralDiscount.finalPrice}</span>
                  </div>
                )}
                
                {/* Subtotal after discount */}
                {(couponDiscount?.applied || referralDiscount?.applied) && (
                  <div className="flex justify-between text-gray-700 border-t pt-2">
                    <span>Subtotal:</span>
                    <span className="font-medium">
                      ₹{couponDiscount?.applied 
                        ? Math.round(couponDiscount.finalPrice) 
                        : referralDiscount?.applied 
                          ? Math.round(referralDiscount.finalPrice)
                          : selectedPlan.price}
                    </span>
                  </div>
                )}
                
                {/* GST */}
                <div className="flex justify-between text-gray-700">
                  <span>GST ({GST_RATE}%):</span>
                  <span className="font-medium">
                    ₹{(() => {
                      const subtotal = couponDiscount?.applied 
                        ? couponDiscount.finalPrice 
                        : referralDiscount?.applied 
                          ? referralDiscount.finalPrice
                          : selectedPlan.price;
                      return calculateGst(subtotal, GST_RATE);
                    })()}
                  </span>
                </div>
                
                {/* Total */}
                <div className="flex justify-between text-lg font-bold text-blue-700 border-t pt-3">
                  <span>Total Amount:</span>
                  <span>
                    ₹{(() => {
                      const subtotal = couponDiscount?.applied 
                        ? couponDiscount.finalPrice 
                        : referralDiscount?.applied 
                          ? referralDiscount.finalPrice
                          : selectedPlan.price;
                      return calculateTotalWithGst(subtotal, GST_RATE);
                    })()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Button */}
        <div className="text-center">
          {!isNewRegistration && !isAuthenticated ? (
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You need to be logged in to purchase a subscription plan. Please log in or complete registration first.
                </AlertDescription>
              </Alert>
              <div className="flex justify-center space-x-4">
                <Button 
                  onClick={() => setLocation('/signup')} 
                  variant="outline"
                  size="lg"
                >
                  Register First
                </Button>
                <Button 
                  onClick={() => setLocation('/login')} 
                  size="lg"
                >
                  Log In
                </Button>
              </div>
            </div>
          ) : (
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
                (() => {
                  const subtotal = couponDiscount?.applied 
                    ? couponDiscount.finalPrice 
                    : referralDiscount?.applied 
                      ? referralDiscount.finalPrice
                      : selectedPlan.price;
                  const totalWithGst = calculateTotalWithGst(subtotal, GST_RATE);
                  
                  return `Pay ₹${totalWithGst} (incl. GST) for ${selectedPlan.name}`;
                })()
              ) : (
                'Select a Plan to Continue'
              )}
            </Button>
          )}
          
          {selectedPlan && isNewRegistration && (
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
      
      {/* Login Modal - Shows after successful purchase for new registrations */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <LogIn className="h-5 w-5 mr-2 text-green-600" />
              Welcome! Please Log In
            </DialogTitle>
            <DialogDescription>
              Your account has been created successfully and your subscription is active. 
              Please log in to access your seller dashboard.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Registration & Payment Successful!
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Your {selectedPlan?.name} subscription is now active.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={() => setLocation('/login')} 
                className="w-full"
                size="lg"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Go to Login Page
              </Button>
              
              <Button 
                onClick={() => setShowLoginModal(false)} 
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}