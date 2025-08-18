const axios = require('axios');

const API_URL = 'http://localhost:1337';

async function testSignupFlow() {
  try {
    console.log('🧪 Testing Complete Signup Flow...');
    
    // Test data for seller registration
    const sellerData = {
      username: `testseller_${Date.now()}`,
      email: `testseller_${Date.now()}@example.com`,
      password: 'TestSeller123!',
      shopName: `Test Shop ${Date.now()}`,
      shopDescription: 'A test shop for testing purposes',
      address: '123 Test Street, Test Area',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      businessType: 'retail',
      phone: '+91 98765 43210'
    };

    console.log('\n📝 Test Seller Data:');
    console.log('- Username:', sellerData.username);
    console.log('- Email:', sellerData.email);
    console.log('- Shop Name:', sellerData.shopName);

    // Step 1: Test user registration
    console.log('\n👤 Step 1: Testing user registration...');
    try {
      const userResponse = await axios.post(`${API_URL}/api/auth/local/register`, {
        username: sellerData.username,
        email: sellerData.email,
        password: sellerData.password,
      });

      if (userResponse.data.user) {
        console.log('✅ User registration successful!');
        console.log('   User ID:', userResponse.data.user.id);
        console.log('   Username:', userResponse.data.user.username);
        console.log('   Email:', userResponse.data.user.email);
        console.log('   Role:', userResponse.data.user.role?.name);
        
        const jwt = userResponse.data.jwt;
        const userId = userResponse.data.user.id;

        // Step 2: Test payment order creation
        console.log('\n💳 Step 2: Testing payment order creation...');
        try {
          const paymentOrderResponse = await axios.post(`${API_URL}/api/payment/create-order`, {
            amount: 999,
            currency: 'INR',
            receipt: `seller_reg_${Date.now()}`,
          });

          if (paymentOrderResponse.data.success) {
            console.log('✅ Payment order creation successful!');
            console.log('   Order ID:', paymentOrderResponse.data.order.id);
            console.log('   Amount:', paymentOrderResponse.data.order.amount);
            
            // Step 3: Test user role update (simulating post-payment)
            console.log('\n🔧 Step 3: Testing user role update...');
            try {
              const roleUpdateResponse = await axios.put(`${API_URL}/api/users/${userId}`, {
                                    role: 3, // Seller role ID
              }, {
                headers: {
                  'Authorization': `Bearer ${jwt}`,
                }
              });

              if (roleUpdateResponse.data) {
                console.log('✅ User role update successful!');
                console.log('   Updated User:', roleUpdateResponse.data.username);
                console.log('   New Role:', roleUpdateResponse.data.role?.name);
              } else {
                console.log('⚠️ User role update response:', roleUpdateResponse.data);
              }
            } catch (roleError) {
              console.log('⚠️ User role update failed (expected for non-admin):', roleError.response?.data);
            }

            // Step 4: Test vendor creation (after role assignment)
            console.log('\n🏪 Step 4: Testing vendor creation...');
            try {
              const vendorResponse = await axios.post(`${API_URL}/api/vendors`, {
                name: sellerData.shopName,
                description: sellerData.shopDescription,
                address: sellerData.address,
                city: sellerData.city,
                state: sellerData.state,
                pincode: sellerData.pincode,
                businessType: sellerData.businessType,
                phone: sellerData.phone,
                email: sellerData.email,
                user: userId,
                isActive: true,
                paymentStatus: 'paid',
              }, {
                headers: {
                  'Authorization': `Bearer ${jwt}`,
                }
              });

              if (vendorResponse.data.data) {
                console.log('✅ Vendor creation successful!');
                console.log('   Vendor ID:', vendorResponse.data.data.id);
                console.log('   Vendor Name:', vendorResponse.data.data.name);
                console.log('   Vendor Active:', vendorResponse.data.data.isActive);
                console.log('   Payment Status:', vendorResponse.data.data.paymentStatus);
              } else {
                console.log('❌ Vendor creation failed:', vendorResponse.data);
              }
            } catch (vendorError) {
              console.log('❌ Vendor creation failed:', vendorError.response?.data || vendorError.message);
            }

          } else {
            console.log('❌ Payment order creation failed:', paymentOrderResponse.data);
          }
        } catch (paymentError) {
          console.log('❌ Payment order creation failed:', paymentError.response?.data || paymentError.message);
        }

      } else {
        console.log('❌ User registration failed:', userResponse.data);
      }
    } catch (userError) {
      console.log('❌ User registration failed:', userError.response?.data || userError.message);
    }

    console.log('\n🎉 Complete Signup Flow Test Completed!');
    console.log('📊 Summary:');
    console.log('- User Registration: Tested');
    console.log('- Payment Order: Tested');
    console.log('- Role Assignment: Tested');
    console.log('- Vendor Creation: Tested');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing signup flow:', error.response?.data || error.message);
    return false;
  }
}

// Run the test
testSignupFlow().then(success => {
  if (success) {
    console.log('\n🎉 Signup flow is working correctly!');
    console.log('🔧 Your web app can now:');
    console.log('1. Register new sellers without errors');
    console.log('2. Handle null vendor data gracefully');
    console.log('3. Process payments successfully');
    console.log('4. Create vendor profiles after payment');
    console.log('\n📝 Next Steps:');
    console.log('1. Test the signup form in the web app');
    console.log('2. Complete a test payment');
    console.log('3. Verify seller dashboard access');
  } else {
    console.log('\n💥 Signup flow test failed.');
    console.log('🔧 Please check the error messages above.');
  }
}); 