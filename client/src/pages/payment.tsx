import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { initializePayment, completeSellerRegistration, PaymentData } from '@/lib/razorpay';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function PaymentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get pending seller data from localStorage
    const data = localStorage.getItem('pendingSellerData');
    if (!data) {
      setError('No pending registration found. Please start the registration process again.');
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      setPendingData(parsedData);
    } catch (err) {
      setError('Invalid registration data. Please start the registration process again.');
    }
  }, []);

  const handlePayment = async () => {
    if (!pendingData) {
      toast({
        title: "Error",
        description: "No registration data found. Please start over.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setError('');

    try {
      const paymentData: PaymentData = {
        amount: 1625, // Fixed registration fee
        currency: 'INR',
        name: 'LocalSoch',
        description: 'Seller Registration Fee',
        customerName: `${pendingData.formData.firstName} ${pendingData.formData.lastName}`,
        customerEmail: pendingData.formData.email,
        customerPhone: pendingData.formData.phone,
        address: pendingData.formData.address,
      };

      await initializePayment(
        paymentData,
        // Success handler
        async (response) => {
          console.log('Payment successful:', response);
          
          // Complete seller registration
          const success = await completeSellerRegistration(response);
          
          if (success) {
            toast({
              title: "Payment Successful!",
              description: "Payment completed. Your vendor profile will be created shortly.",
            });
            
            // Redirect to seller dashboard
            setTimeout(() => {
              setLocation('/seller');
            }, 2000);
          } else {
            setError('Payment successful but registration failed. Please contact support.');
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

  const handleBackToSignup = () => {
    localStorage.removeItem('pendingSellerData');
    setLocation('/signup');
  };

  if (error && !pendingData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                Registration Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button onClick={handleBackToSignup} className="mt-4">
                Back to Registration
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!pendingData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Complete Your Registration
            </CardTitle>
            <CardDescription>
              Pay the registration fee to activate your seller account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Registration Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Registration Summary</h3>
              <div className="space-y-1 text-sm text-blue-800">
                <div><strong>Name:</strong> {pendingData.formData.firstName} {pendingData.formData.lastName}</div>
                <div><strong>Email:</strong> {pendingData.formData.email}</div>
                <div><strong>Shop:</strong> {pendingData.formData.shopName}</div>
                <div><strong>Phone:</strong> {pendingData.formData.phone}</div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Payment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Registration Fee</span>
                  <span>₹1,500.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Processing Fee</span>
                  <span>₹75.00</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span>₹50.00</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total Amount</span>
                  <span>₹1,625.00</span>
                </div>
              </div>
            </div>

            {/* Payment Methods Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Payment Methods Available</h4>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                <div>• Credit/Debit Cards</div>
                <div>• UPI</div>
                <div>• Net Banking</div>
                <div>• Wallets</div>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full"
                size="lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Processing Payment...
                  </>
                ) : (
                  `Pay ₹1,625.00`
                )}
              </Button>

              <Button
                onClick={handleBackToSignup}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                Back to Registration
              </Button>
            </div>

            {/* Security Notice */}
            <div className="text-xs text-gray-500 text-center space-y-2">
              <p>
                🔒 Your payment is secured by Razorpay, a trusted payment gateway
              </p>
              <p>
                By proceeding, you agree to our{" "}
                <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 