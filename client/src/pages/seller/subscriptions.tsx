import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import SubscriptionInvoice from '@/components/invoice/SubscriptionInvoice';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Download, CreditCard, CheckCircle, FileText, Eye } from 'lucide-react';
import { API_CONFIG } from '@/lib/config';
import { generateSubscriptionInvoicePDF } from '@/lib/pdf-generator';

interface Subscription {
  id: number;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  paymentId: string;
  orderId?: string;
  paymentMethod?: string;
  autoRenew?: boolean;
  createdAt: string;
  // Plan data might be stored directly on subscription
  planName?: string;
  planDescription?: string;
  planDuration?: number;
  planDurationType?: string;
  features?: string[] | any;
  // Or as a relation
  plan?: {
    name: string;
    description: string;
    features: string[] | any;
    duration?: number;
    durationType?: string;
    price?: number;
    currency?: string;
  };
  subscriptionPlan?: {
    name: string;
    description: string;
    features: string[] | any;
    duration?: number;
    durationType?: string;
    price?: number;
    currency?: string;
  };
  vendor?: {
    name: string;
    email?: string;
    contact?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
  };
}

interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  subscriptionId: number;
  subscriptionDate: string;
  vendorName: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorAddress: string;
  vendorCity: string;
  vendorState: string;
  vendorPincode: string;
  planName: string;
  planDescription: string;
  planDuration: number;
  planDurationType: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  paymentId: string;
  orderId: string;
  paymentMethod: string;
  status: string;
  features: string[];
  autoRenew: boolean;
}

export default function SellerSubscriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const vendorId = user?.vendorId;
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);

  // Generate invoice data from subscription
  const generateInvoiceData = (subscription: Subscription): InvoiceData => {
    const invoiceNumber = `INV-${subscription.id + 1000}-${Date.now().toString().slice(-4)}`;
    const invoiceDate = new Date().toISOString().split('T')[0];
    
    // Handle plan data properly - check multiple possible locations
    let plan = subscription.plan || subscription.subscriptionPlan;
    
    // If plan is just an ID, we need to fetch the full plan data
    if (plan && typeof plan === 'number') {
      // For now, we'll use the subscription's own data
      plan = undefined;
    }
    
    // If no plan found, try to get data from subscription itself
    if (!plan) {
      plan = {
        name: subscription.planName || 'Subscription Plan',
        description: subscription.planDescription || '',
        duration: subscription.planDuration || 30,
        durationType: subscription.planDurationType || 'days',
        price: subscription.amount || 0,
        currency: subscription.currency || 'INR',
        features: subscription.features || []
      };
    }
    
    const planFeatures = plan?.features || [];
    
    // Convert features to array if it's a string or object
    let featuresArray: string[] = [];
    if (Array.isArray(planFeatures)) {
      featuresArray = planFeatures;
    } else if (typeof planFeatures === 'string') {
      try {
        featuresArray = JSON.parse(planFeatures);
      } catch {
        featuresArray = [planFeatures];
      }
    } else if (planFeatures && typeof planFeatures === 'object') {
      featuresArray = Object.values(planFeatures) as string[];
    }
    
    // If no features found, add some default ones
    if (featuresArray.length === 0) {
      featuresArray = [
        'Product listing and management',
        'Order management system',
        'Basic analytics and reporting',
        'Customer support'
      ];
    }
    
    return {
      invoiceNumber,
      invoiceDate,
      subscriptionId: subscription.id + 1000,
      subscriptionDate: new Date(subscription.createdAt).toISOString().split('T')[0],
      vendorName: subscription.vendor?.name || user?.firstName + ' ' + user?.lastName || 'Vendor',
      vendorEmail: subscription.vendor?.email || user?.email || '',
      vendorPhone: subscription.vendor?.contact || '',
      vendorAddress: subscription.vendor?.address || '',
      vendorCity: subscription.vendor?.city || '',
      vendorState: subscription.vendor?.state || '',
      vendorPincode: subscription.vendor?.pincode || '',
      planName: plan?.name || 'Subscription Plan',
      planDescription: plan?.description || '',
      planDuration: plan?.duration || 30, // Default to 30 days
      planDurationType: plan?.durationType || 'days',
      startDate: new Date(subscription.startDate).toISOString().split('T')[0],
      endDate: new Date(subscription.endDate).toISOString().split('T')[0],
      amount: subscription.amount || plan?.price || 0,
      currency: subscription.currency || plan?.currency || 'INR',
      paymentId: subscription.paymentId || '',
      orderId: subscription.orderId || '',
      paymentMethod: subscription.paymentMethod || 'razorpay',
      status: subscription.status,
      features: featuresArray,
      autoRenew: subscription.autoRenew || false,
    };
  };

  const { data: currentSubscription } = useQuery({
    queryKey: ['current-subscription', vendorId],
    queryFn: async ({ queryKey }: { queryKey: any[] }): Promise<any> => {
      if (!vendorId) return null;
      try {
        const response = await apiRequest('GET', `/api/subscriptions/vendor/${vendorId}/current?populate=*`);
        const data = await response.json();
        return data.data;
      } catch (error) {
        console.error('Error fetching subscription:', error);
        return null;
      }
    },
    enabled: !!vendorId,
  });

  const handlePreviewInvoice = (subscription: Subscription) => {
    try {
      const invoiceData = generateInvoiceData(subscription);
      setInvoiceData(invoiceData);
      setShowInvoice(true);
      toast({ title: "Success", description: "Invoice preview opened successfully" });
    } catch (error) {
      console.error('Invoice preview error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to preview invoice';
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  const handleDownloadPDF = (subscription: Subscription) => {
    try {
      const invoiceData = generateInvoiceData(subscription);
      const filename = `subscription-invoice-${subscription.id}-${new Date().toISOString().split('T')[0]}.pdf`;
      generateSubscriptionInvoicePDF(invoiceData, filename);
      toast({ title: "Success", description: "Invoice PDF downloaded successfully" });
    } catch (error) {
      console.error('PDF download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download PDF';
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    }
  };

  if (!vendorId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Vendor Profile Required</h2>
          <p className="text-gray-600">Please complete your vendor profile to access subscription management.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Sidebar />
      <MobileNav />
      
      <main className="flex-1 lg:ml-64 pt-20 p-4 lg:p-8 pb-20 lg:pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Subscription Management</h2>
            <p className="text-gray-600">Manage your subscription plans and download invoices</p>
          </div>

          {currentSubscription ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5" />
                  <span>Current Subscription</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Plan</h4>
                    <p className="text-lg font-semibold text-blue-600">{currentSubscription.plan?.name}</p>
                    <p className="text-sm text-gray-600">{currentSubscription.plan?.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                    <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                      {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Amount</h4>
                    <p className="text-lg font-semibold text-green-600">
                      ₹{currentSubscription.amount}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Actions</h4>
                    <div className="space-y-2">
                      <Button
                        onClick={() => handlePreviewInvoice(currentSubscription)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Invoice
                      </Button>
                      
                      <Button
                        onClick={() => handleDownloadPDF(currentSubscription)}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        size="sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download PDF
                      </Button>
                    </div>
                  </div>
                </div>

                {currentSubscription.plan?.features && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Plan Features</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {currentSubscription.plan.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
                <p className="text-gray-600 mb-4">
                  You don't have an active subscription plan. Subscribe to a plan to access premium features.
                </p>
                <Button onClick={() => window.location.href = '/subscription-selection'}>
                  View Available Plans
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      {/* Invoice Modal */}
      {showInvoice && invoiceData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-semibold">Subscription Invoice</h2>
              <div className="flex space-x-2">
                <Button
                  onClick={() => generateSubscriptionInvoicePDF(invoiceData)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button
                  onClick={() => setShowInvoice(false)}
                  variant="outline"
                >
                  Close
                </Button>
              </div>
            </div>
            <div className="p-4">
              <SubscriptionInvoice 
                invoiceData={invoiceData} 
                showActions={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 