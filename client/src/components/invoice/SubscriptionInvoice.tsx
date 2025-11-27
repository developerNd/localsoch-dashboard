import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, CreditCard, User, MapPin, Phone, Mail } from 'lucide-react';

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
  vendorGstNumber?: string;
  planName: string;
  planDescription: string;
  planDuration: number;
  planDurationType: string;
  startDate: string;
  endDate: string;
  amount: number;
  currency: string;
  subtotal?: number;
  gstRate?: number;
  gstAmount?: number;
  paymentId: string;
  orderId: string;
  paymentMethod: string;
  status: string;
  features: string[];
  autoRenew: boolean;
}

interface SubscriptionInvoiceProps {
  invoiceData: InvoiceData;
  onDownloadPDF?: () => void;
  onPreview?: () => void;
  showActions?: boolean;
}

export default function SubscriptionInvoice({ 
  invoiceData, 
  onDownloadPDF, 
  onPreview, 
  showActions = true 
}: SubscriptionInvoiceProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number, currency: string = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardContent className="p-0">
        {/* Invoice Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">LOCALSOCH</h1>
              <p className="text-blue-100 text-lg">Subscription Invoice</p>
            </div>
            <div className="text-right">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-blue-100">Invoice #</p>
                <p className="text-xl font-bold">{invoiceData.invoiceNumber}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoice Details */}
        <div className="p-8">
          {/* Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium">Invoice Date</span>
              </div>
              <p className="text-gray-900 font-semibold">{formatDate(invoiceData.invoiceDate)}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm font-medium">Subscription ID</span>
              </div>
              <p className="text-gray-900 font-semibold">#{invoiceData.subscriptionId}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-gray-600">
                <Badge variant={invoiceData.status === 'active' ? 'default' : 'secondary'}>
                  {invoiceData.status.charAt(0).toUpperCase() + invoiceData.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Vendor Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2 text-blue-600" />
                Vendor Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">{invoiceData.vendorName}</p>
                </div>
                
                {invoiceData.vendorEmail && (
                  <div className="flex items-center space-x-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{invoiceData.vendorEmail}</span>
                  </div>
                )}
                
                {invoiceData.vendorPhone && (
                  <div className="flex items-center space-x-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-600">{invoiceData.vendorPhone}</span>
                  </div>
                )}
                
                {invoiceData.vendorAddress && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <div className="text-sm text-gray-600">
                      <p>{invoiceData.vendorAddress}</p>
                      {invoiceData.vendorCity && (
                        <p>{invoiceData.vendorCity}, {invoiceData.vendorState} {invoiceData.vendorPincode}</p>
                      )}
                    </div>
                  </div>
                )}
                
                {invoiceData.vendorGstNumber && (
                  <div>
                    <p className="text-sm text-gray-600">GST Number</p>
                    <p className="font-semibold text-gray-900">{invoiceData.vendorGstNumber}</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-600" />
                Subscription Details
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Plan Name</p>
                  <p className="font-semibold text-gray-900">{invoiceData.planName}</p>
                </div>
                
                {invoiceData.planDescription && (
                  <div>
                    <p className="text-sm text-gray-600">Description</p>
                    <p className="text-sm text-gray-700">{invoiceData.planDescription}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {invoiceData.planDuration} {invoiceData.planDurationType}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(invoiceData.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-semibold text-gray-900">{formatDate(invoiceData.endDate)}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Auto Renew</p>
                  <Badge variant={invoiceData.autoRenew ? 'default' : 'secondary'}>
                    {invoiceData.autoRenew ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Plan Features */}
          {invoiceData.features && invoiceData.features.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Plan Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {invoiceData.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Information */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900 capitalize">{invoiceData.paymentMethod}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600">Payment ID</p>
                  <p className="font-semibold text-gray-900">{invoiceData.paymentId}</p>
                </div>
                
                {invoiceData.orderId && (
                  <div>
                    <p className="text-sm text-gray-600">Order ID</p>
                    <p className="font-semibold text-gray-900">{invoiceData.orderId}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Amount Breakdown */}
          <div className="border-t pt-6 mb-6">
            <div className="space-y-3">
              {invoiceData.subtotal !== undefined && (
                <div className="flex justify-between text-gray-700">
                  <span className="text-sm">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoiceData.subtotal, invoiceData.currency)}</span>
                </div>
              )}
              
              {invoiceData.gstAmount !== undefined && invoiceData.gstRate !== undefined && (
                <div className="flex justify-between text-gray-700">
                  <span className="text-sm">GST ({invoiceData.gstRate}%)</span>
                  <span className="font-medium">{formatCurrency(invoiceData.gstAmount, invoiceData.currency)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Total Amount */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(invoiceData.amount, invoiceData.currency)}
                </p>
              </div>
              
              {showActions && (
                <div className="flex space-x-3">
                  {onPreview && (
                    <Button
                      onClick={onPreview}
                      variant="outline"
                      className="flex items-center space-x-2"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Preview</span>
                    </Button>
                  )}
                  
                  {onDownloadPDF && (
                    <Button
                      onClick={onDownloadPDF}
                      className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PDF</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm">
            <p>Thank you for subscribing to LocalSoch!</p>
            <p>For support, contact: support@localsoch.com</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
