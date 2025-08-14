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
export const createPaymentOrder = async (paymentData: PaymentData): Promise<{ orderId: string }> => {
  try {
    const response = await fetch('https://api.localsoch.com/api/payment/create-order', {
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
    return { orderId: data.order.id };
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
    const { orderId } = await createPaymentOrder(paymentData);

    // Configure Razorpay options
    const options: RazorpayOptions = {
      key: 'rzp_test_lFR1xyqT46S2QF', // Your test key - replace with production key
      amount: paymentData.amount * 100, // Razorpay expects amount in paise
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
    const response = await fetch('https://api.localsoch.com/api/payment/verify', {
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
export const completeSellerRegistration = async (paymentResponse: any): Promise<boolean> => {
  try {
    const pendingData = localStorage.getItem('pendingSellerData');
    if (!pendingData) {
      throw new Error('No pending seller data found');
    }

    const sellerData = JSON.parse(pendingData);
    
    // Verify payment first
    const isVerified = await verifyPayment(
      paymentResponse.razorpay_payment_id,
      paymentResponse.razorpay_order_id,
      paymentResponse.razorpay_signature
    );

    if (!isVerified) {
      throw new Error('Payment verification failed');
    }

    // For now, skip vendor creation and just redirect to dashboard
    // The vendor can be created later through the admin panel or when the backend is updated
    console.log('Payment successful, but vendor creation requires backend update');
    console.log('User data:', sellerData.user);
    console.log('Vendor data would be:', {
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

    // Store the vendor data in localStorage for manual creation later
    localStorage.setItem('pendingVendorData', JSON.stringify({
      userId: sellerData.user.id,
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
      }
    }));

    // Create a mock vendor data for now
    const vendorData = {
      id: 'temp_' + Date.now(),
      name: sellerData.formData.shopName,
      user: sellerData.user.id
    };

    // Payment info is already verified, no need to store separately
    console.log('Payment completed successfully:', {
      paymentId: paymentResponse.razorpay_payment_id,
      orderId: paymentResponse.razorpay_order_id,
      amount: 1625,
      vendorId: vendorData.id,
    });

    // Clear pending data
    localStorage.removeItem('pendingSellerData');

    return true;
  } catch (error) {
    console.error('Error completing seller registration:', error);
    return false;
  }
}; 