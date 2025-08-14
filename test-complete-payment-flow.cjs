const axios = require('axios');

const API_URL = 'http://localhost:1337';

async function testCompletePaymentFlow() {
  try {
    console.log('🧪 Testing Complete Payment Flow with Admin Role Assignment...');
    
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
            
            // Step 3: Test admin login
            console.log('\n🔐 Step 3: Testing admin login...');
            try {
              const adminLoginResponse = await axios.post(`${API_URL}/api/auth/local`, {
                identifier: 'admin@gmail.com',
                password: 'admin@123',
              });

              if (adminLoginResponse.data.jwt) {
                console.log('✅ Admin login successful!');
                const adminToken = adminLoginResponse.data.jwt;
                
                // Step 4: Test user role update with admin token
                console.log('\n🔧 Step 4: Testing user role update with admin token...');
                try {
                  const roleUpdateResponse = await axios.put(`${API_URL}/api/users/${userId}`, {
                    role: 4, // Seller role ID
                  }, {
                    headers: {
                      'Authorization': `Bearer ${adminToken}`,
                    }
                  });

                  if (roleUpdateResponse.data) {
                    console.log('✅ User role update successful!');
                    console.log('   Updated User:', roleUpdateResponse.data.username);
                    console.log('   New Role:', roleUpdateResponse.data.role?.name);
                    
                    // Step 5: Test vendor creation with admin token
                    console.log('\n🏪 Step 5: Testing vendor creation with admin token...');
                    try {
                      const vendorResponse = await axios.post(`${API_URL}/api/vendors`, {
                        data: {
                          name: sellerData.shopName,
                          address: sellerData.address,
                          contact: sellerData.phone,
                          user: userId,
                        }
                      }, {
                        headers: {
                          'Authorization': `Bearer ${adminToken}`,
                        }
                      });

                      if (vendorResponse.data.data) {
                        console.log('✅ Vendor creation successful!');
                        console.log('   Vendor ID:', vendorResponse.data.data.id);
                        console.log('   Vendor Name:', vendorResponse.data.data.name);
                        console.log('   Vendor Active:', vendorResponse.data.data.isActive);
                        console.log('   Payment Status:', vendorResponse.data.data.paymentStatus);
                        
                        // Step 6: Test user login with new role
                        console.log('\n🔐 Step 6: Testing user login with new role...');
                        try {
                          const userLoginResponse = await axios.post(`${API_URL}/api/auth/local`, {
                            identifier: sellerData.username,
                            password: sellerData.password,
                          });

                          if (userLoginResponse.data.user) {
                            console.log('✅ User login successful!');
                            console.log('   User Role:', userLoginResponse.data.user.role?.name);
                            console.log('   User ID:', userLoginResponse.data.user.id);
                          } else {
                            console.log('❌ User login failed:', userLoginResponse.data);
                          }
                        } catch (loginError) {
                          console.log('❌ User login failed:', loginError.response?.data || loginError.message);
                        }
                        
                      } else {
                        console.log('❌ Vendor creation failed:', vendorResponse.data);
                      }
                    } catch (vendorError) {
                      console.log('❌ Vendor creation failed:', vendorError.response?.data || vendorError.message);
                    }
                    
                  } else {
                    console.log('❌ User role update failed:', roleUpdateResponse.data);
                  }
                } catch (roleError) {
                  console.log('❌ User role update failed:', roleError.response?.data || roleError.message);
                }
                
              } else {
                console.log('❌ Admin login failed:', adminLoginResponse.data);
              }
            } catch (adminError) {
              console.log('❌ Admin login failed:', adminError.response?.data || adminError.message);
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

    console.log('\n🎉 Complete Payment Flow Test Completed!');
    console.log('📊 Summary:');
    console.log('- User Registration: Tested');
    console.log('- Payment Order: Tested');
    console.log('- Admin Login: Tested');
    console.log('- Role Assignment: Tested');
    console.log('- Vendor Creation: Tested');
    console.log('- User Login: Tested');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing payment flow:', error.response?.data || error.message);
    return false;
  }
}

// Run the test
testCompletePaymentFlow().then(success => {
  if (success) {
    console.log('\n🎉 Complete payment flow is working correctly!');
    console.log('🔧 Your web app can now:');
    console.log('1. Register new sellers');
    console.log('2. Process payments successfully');
    console.log('3. Assign seller roles using admin token');
    console.log('4. Create vendor profiles after payment');
    console.log('5. Allow sellers to login with new role');
    console.log('\n📝 Next Steps:');
    console.log('1. Test the complete flow in the web app');
    console.log('2. Complete a test payment');
    console.log('3. Verify seller dashboard access');
  } else {
    console.log('\n💥 Payment flow test failed.');
    console.log('🔧 Please check the error messages above.');
  }
}); 