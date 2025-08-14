import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

export default function PaymentPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully.",
      });
    } catch (error) {
      toast({
        title: "Payment Failed",
        description: "There was an error processing your payment.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>
              Complete your purchase securely
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Payment Method Selection */}
            <div className="space-y-2">
              <Label htmlFor="payment-method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit/Debit Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Card Details */}
            {paymentMethod === 'card' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="card-number">Card Number</Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      placeholder="MM/YY"
                      maxLength={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      placeholder="123"
                      maxLength={4}
                      type="password"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="card-name">Cardholder Name</Label>
                  <Input
                    id="card-name"
                    placeholder="John Doe"
                  />
                </div>
              </div>
            )}

            {/* UPI Details */}
            {paymentMethod === 'upi' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="upi-id">UPI ID</Label>
                  <Input
                    id="upi-id"
                    placeholder="username@upi"
                  />
                </div>
              </div>
            )}

            {/* Net Banking Details */}
            {paymentMethod === 'netbanking' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank">Select Bank</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose your bank" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sbi">State Bank of India</SelectItem>
                      <SelectItem value="hdfc">HDFC Bank</SelectItem>
                      <SelectItem value="icici">ICICI Bank</SelectItem>
                      <SelectItem value="axis">Axis Bank</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="border-t pt-6">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>₹1,500.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>₹50.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>₹75.00</span>
                </div>
                <div className="flex justify-between font-semibold text-base border-t pt-2">
                  <span>Total</span>
                  <span>₹1,625.00</span>
                </div>
              </div>
            </div>

            {/* Pay Button */}
            <Button
              onClick={handlePayment}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                `Pay ₹1,625.00`
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              By clicking "Pay", you agree to our terms of service and privacy policy.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 