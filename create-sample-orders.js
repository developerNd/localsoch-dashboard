const STRAPI_URL = 'http://localhost:1337';
// You can get this token from your browser's localStorage when logged in as admin
// Or use the token from your existing admin session
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzM1NzQ5NzI5LCJleHAiOjE3MzYzNTQ1Mjl9.your-token-here'; // Replace with your actual admin token

const sampleOrders = [
  {
    orderNumber: 'ORD-2024-001',
    customerName: 'John Doe',
    customerEmail: 'john.doe@example.com',
    customerPhone: '+91 98765 43210',
    totalAmount: 45.99,
    status: 'delivered',
    orderItems: [
      { productId: 1, quantity: 2, totalAmount: 30.00, productName: 'Whole Wheat Bread' },
      { productId: 2, quantity: 1, totalAmount: 15.99, productName: 'Croissant' }
    ],
    shippingAddress: {
      street: '123 Main Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001'
    },
    paymentMethod: 'COD',
    paymentStatus: 'paid',
    notes: 'Please deliver in the morning'
  },
  {
    orderNumber: 'ORD-2024-002',
    customerName: 'Jane Smith',
    customerEmail: 'jane.smith@example.com',
    customerPhone: '+91 98765 43211',
    totalAmount: 32.50,
    status: 'confirmed',
    orderItems: [
      { productId: 3, quantity: 1, totalAmount: 32.50, productName: 'Chocolate Cake' }
    ],
    shippingAddress: {
      street: '456 Oak Avenue',
      city: 'Delhi',
      state: 'Delhi',
      pincode: '110001'
    },
    paymentMethod: 'Online',
    paymentStatus: 'paid',
    notes: 'Birthday cake - please add candles'
  },
  {
    orderNumber: 'ORD-2024-003',
    customerName: 'Mike Johnson',
    customerEmail: 'mike.johnson@example.com',
    customerPhone: '+91 98765 43212',
    totalAmount: 67.25,
    status: 'shipped',
    orderItems: [
      { productId: 1, quantity: 1, totalAmount: 15.00, productName: 'Whole Wheat Bread' },
      { productId: 4, quantity: 2, totalAmount: 52.25, productName: 'Sourdough Bread' }
    ],
    shippingAddress: {
      street: '789 Pine Road',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560001'
    },
    paymentMethod: 'COD',
    paymentStatus: 'pending',
    notes: 'Fresh bread only'
  }
];

async function createSampleOrders() {
  console.log('🚀 Creating sample orders...');
  
  // First, let's check if we can connect to Strapi
  try {
    const healthCheck = await fetch(`${STRAPI_URL}/api/orders`);
    console.log('✅ Strapi connection successful');
  } catch (error) {
    console.error('❌ Cannot connect to Strapi:', error);
    return;
  }
  
  for (const order of sampleOrders) {
    try {
      console.log(`📝 Creating order: ${order.orderNumber}...`);
      
      const response = await fetch(`${STRAPI_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          data: {
            ...order,
            vendor: 26, // CityBakery vendor ID
            user: 4, // citybakery user ID
          }
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Created order: ${order.orderNumber} (ID: ${result.data.id})`);
      } else {
        const error = await response.json();
        console.error(`❌ Failed to create order ${order.orderNumber}:`, error);
        
        // If it's an auth error, provide helpful message
        if (response.status === 401) {
          console.error('🔑 Authentication failed. Please check your ADMIN_TOKEN.');
          console.error('💡 To get your token:');
          console.error('   1. Log into Strapi admin panel');
          console.error('   2. Open browser dev tools (F12)');
          console.error('   3. Go to Application > Local Storage > http://localhost:1337');
          console.error('   4. Copy the value of "jwt" key');
          break;
        }
      }
    } catch (error) {
      console.error(`❌ Error creating order ${order.orderNumber}:`, error);
    }
  }
  
  console.log('🎉 Sample orders creation completed!');
}

// Run the script
createSampleOrders(); 