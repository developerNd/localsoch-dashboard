import { API_CONFIG } from './config';

// Razorpay integration for web app
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes: {
    address?: string;
  };
  theme: {
    color: string;
  };
  handler: (response: any) => void;
  modal: {
    ondismiss: () => void;
  };
}

export interface PaymentData {
  amount: number;
  currency: string;
  name: string;
  description: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  address?: string;
}

// Load Razorpay script
export const loadRazorpayScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay script'));
    document.head.appendChild(script);
  });
};

// Create payment order on backend
export const createPaymentOrder = async (paymentData: PaymentData): Promise<{ orderId: string; amount: number }> => {
  try {
    const response = await fetch(`${API_CONFIG.API_URL}/api/payment/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: paymentData.amount,
        currency: paymentData.currency,
        receipt: `receipt_${Date.now()}`,
        notes: {
          customerName: paymentData.customerName,
          customerEmail: paymentData.customerEmail,
          customerPhone: paymentData.customerPhone,
          address: paymentData.address,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: Failed to create payment order`);
    }

    const data = await response.json();
    return { orderId: data.order.id, amount: data.order.amount };
  } catch (error) {
    console.error('Error creating payment order:', error);
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error('Unable to connect to payment server. Please check your internet connection.');
    }
    throw error;
  }
};

// Initialize Razorpay payment
export const initializePayment = async (
  paymentData: PaymentData,
  onSuccess: (response: any) => void,
  onFailure: (error: any) => void,
  onDismiss: () => void
): Promise<void> => {
  try {
    // Load Razorpay script
    await loadRazorpayScript();

    // Create payment order
    const { orderId, amount } = await createPaymentOrder(paymentData);


    const RAZORPAY_KEY_ID = 'rzp_live_RAfmnvsVClwAIE';
    const RAZORPAY_KEY_SECRET = 'Mx1fmKCemdAlDMGPaDLkOEFu';
    // Configure Razorpay options
    const options: RazorpayOptions = {
      key: RAZORPAY_KEY_ID, // Your test key - replace with production key
      amount: amount, // Don't multiply here - backend already converts to paise
      currency: paymentData.currency,
      name: paymentData.name,
      description: paymentData.description,
      order_id: orderId,
      prefill: {
        name: paymentData.customerName,
        email: paymentData.customerEmail,
        contact: paymentData.customerPhone,
      },
      notes: {
        address: paymentData.address,
      },
      theme: {
        color: '#3B82F6', // Blue color
      },
      handler: (response) => {
        console.log('Payment successful:', response);
        onSuccess(response);
      },
      modal: {
        ondismiss: () => {
          console.log('Payment modal dismissed');
          onDismiss();
        },
      },
    };

    // Open Razorpay checkout
    const razorpay = new window.Razorpay(options);
    razorpay.open();
  } catch (error) {
    console.error('Error initializing payment:', error);
    onFailure(error);
  }
};

// Verify payment on backend
export const verifyPayment = async (
  paymentId: string,
  orderId: string,
  signature: string
): Promise<boolean> => {
  try {
    const response = await fetch(`${API_CONFIG.API_URL}/api/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId,
        orderId,
        signature,
      }),
    });

    if (!response.ok) {
      throw new Error('Payment verification failed');
    }

    const data = await response.json();
    return data.verified;
  } catch (error) {
    console.error('Error verifying payment:', error);
    return false;
  }
};

// Complete seller registration after payment
export const completeSellerRegistration = async (paymentResponse: any, referralCode?: string, planId?: number): Promise<boolean> => {
  try {
    const pendingData = localStorage.getItem('pendingSellerData');
    if (!pendingData) {
      throw new Error('No pending seller data found');
    }

    const sellerData = JSON.parse(pendingData);
    
    console.log('🔄 Completing seller registration...');
    console.log('User data:', sellerData.user);
    console.log('Vendor data:', {
      name: sellerData.formData.shopName,
      description: sellerData.formData.shopDescription,
      address: sellerData.formData.address,
      city: sellerData.formData.city,
      state: sellerData.formData.state,
      pincode: sellerData.formData.pincode,
      businessType: sellerData.formData.businessType,
      phone: sellerData.formData.phone,
      email: sellerData.formData.email,
    });

    // Call the new backend endpoint to complete seller registration
    const response = await fetch(`${API_CONFIG.API_URL}/api/payment/complete-seller-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id,
        signature: paymentResponse.razorpay_signature,
        userId: sellerData.user.id,
        planId: planId,
        vendorData: {
          name: sellerData.formData.shopName,
          description: sellerData.formData.shopDescription,
          address: sellerData.formData.address,
          city: sellerData.formData.city,
          state: sellerData.formData.state,
          pincode: sellerData.formData.pincode,
          businessType: sellerData.formData.businessType,
          phone: sellerData.formData.phone,
          email: sellerData.formData.email,
          contact: sellerData.formData.phone,
          whatsapp: sellerData.formData.phone,
          businessCategoryId: sellerData.formData.businessCategoryId,
          referralCode: referralCode || sellerData.formData.referralCode || '',
          // Include GST and bank information if available
          gstNumber: sellerData.formData.gstNumber || null,
          bankAccountNumber: sellerData.formData.bankAccountNumber || null,
          ifscCode: sellerData.formData.ifscCode || null,
          bankAccountName: sellerData.formData.bankAccountName || null,
          bankAccountType: sellerData.formData.bankAccountType || 'savings',
          // Include GPS location data
          latitude: sellerData.formData.latitude || null,
          longitude: sellerData.formData.longitude || null,
          locationAccuracy: sellerData.formData.locationAccuracy || null,
          gpsAddress: sellerData.formData.gpsAddress || null,
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to complete seller registration');
    }

    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Seller registration completed successfully!');
      console.log('   User ID:', result.data.user.id);
      console.log('   Vendor ID:', result.data.vendor.id);
      console.log('   Payment ID:', result.data.payment.paymentId);
      
      // Clear pending data
      localStorage.removeItem('pendingSellerData');
      
      return true;
    } else {
      throw new Error(result.message || 'Failed to complete seller registration');
    }
  } catch (error) {
    console.error('❌ Error completing seller registration:', error);
    return false;
  }
};

// Create subscription for existing users
export const createSubscription = async (paymentResponse: any, planId: number, vendorId: number): Promise<boolean> => {
  try {
    // Validate vendor ID
    if (!vendorId || vendorId === 0) {
      throw new Error('Invalid vendor ID. Please ensure you are logged in as a seller.');
    }

    // Get authentication token
    const token = localStorage.getItem('authToken');
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authentication header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Call the subscription creation endpoint
    const response = await fetch(`${API_CONFIG.API_URL}/api/subscriptions/create-with-payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        vendorId: vendorId,
        planId: planId,
        paymentData: {
          paymentId: paymentResponse.razorpay_payment_id,
          orderId: paymentResponse.razorpay_order_id,
          signature: paymentResponse.razorpay_signature,
          paymentMethod: 'razorpay'
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 403) {
        throw new Error('Access denied. Please ensure you are logged in and have permission to create subscriptions.');
      }
      
      throw new Error(errorData.message || 'Failed to create subscription');
    }

    const result = await response.json();
    
    if (result.success) {
      return true;
    } else {
      throw new Error(result.message || 'Failed to create subscription');
    }
  } catch (error) {
    console.error('Error creating subscription:', error);
    return false;
  }
}; 