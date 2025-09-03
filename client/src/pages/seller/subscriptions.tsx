import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Header from '@/components/layout/header';
import Sidebar from '@/components/layout/sidebar';
import MobileNav from '@/components/layout/mobile-nav';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Download, CreditCard, CheckCircle } from 'lucide-react';
import { API_CONFIG } from '@/lib/config';

interface Subscription {
  id: number;
  status: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  paymentId: string;
  plan: {
    name: string;
    description: string;
    features: string[];
  };
}

export default function SellerSubscriptions() {
  const { user } = useAuth();
  const { toast } = useToast();
  const vendorId = user?.vendorId;

  const { data: currentSubscription } = useQuery({
    queryKey: ['current-subscription', vendorId],
    queryFn: async ({ queryKey }: { queryKey: any[] }): Promise<any> => {
      if (!vendorId) return null;
      try {
        const response = await apiRequest('GET', `/api/subscriptions/vendor/${vendorId}/current`);
        const data = await response.json();
        return data.data;
      } catch (error) {
        return null;
      }
    },
    enabled: !!vendorId,
  });

  const handlePreviewInvoice = async (subscriptionId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ title: "Error", description: "Please log in to preview invoices", variant: "destructive" });
        return;
      }

      const apiUrl = `${API_CONFIG.API_URL}/api/subscriptions/${subscriptionId}/invoice`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to preview invoice'}`);
      }

      const invoiceContent = await response.text();

      if (!invoiceContent || invoiceContent.trim().length === 0) {
        throw new Error('Invoice content is empty');
      }

      // Show invoice content in a new window/tab
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Subscription Invoice Preview</title>
              <style>
                body { 
                  font-family: monospace; 
                  white-space: pre-wrap; 
                  padding: 20px; 
                  background: #f5f5f5;
                  line-height: 1.6;
                }
                .invoice-content {
                  background: white;
                  padding: 20px;
                  border-radius: 8px;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                  max-width: 800px;
                  margin: 0 auto;
                }
                .header {
                  text-align: center;
                  margin-bottom: 20px;
                  color: #333;
                }
                .actions {
                  text-align: center;
                  margin: 20px 0;
                }
                button {
                  background: #007bff;
                  color: white;
                  border: none;
                  padding: 10px 20px;
                  border-radius: 5px;
                  cursor: pointer;
                  margin: 0 10px;
                }
                button:hover {
                  background: #0056b3;
                }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Subscription Invoice Preview</h1>
                <p>This is a preview of your subscription invoice</p>
              </div>
              <div class="invoice-content">
                ${invoiceContent}
              </div>
              <div class="actions">
                <button onclick="window.print()">Print Invoice</button>
                <button onclick="window.close()">Close Preview</button>
              </div>
            </body>
          </html>
        `);
        newWindow.document.close();
      } else {
        // Fallback: show in alert if popup is blocked
        alert('Invoice Preview:\n\n' + invoiceContent.substring(0, 1000) + '...');
      }

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

  const handleDownloadInvoice = async (subscriptionId: number) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({ title: "Error", description: "Please log in to download invoices", variant: "destructive" });
        return;
      }

      const apiUrl = `${API_CONFIG.API_URL}/api/subscriptions/${subscriptionId}/invoice`;

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to download invoice'}`);
      }

      const invoiceContent = await response.text();

      if (!invoiceContent || invoiceContent.trim().length === 0) {
        throw new Error('Invoice content is empty');
      }

      const blob = new Blob([invoiceContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `subscription-invoice-${subscriptionId}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({ title: "Success", description: "Invoice downloaded successfully" });
    } catch (error) {
      console.error('Invoice download error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to download invoice';
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
                        onClick={() => handlePreviewInvoice(currentSubscription.id)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Preview Invoice
                      </Button>
                      
                      {/* Download button commented out for now
                      <Button
                        onClick={() => handleDownloadInvoice(currentSubscription.id)}
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Invoice
                      </Button>
                      */}
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
    </div>
  );
} 