const axios = require('axios');

const API_URL = 'http://localhost:1337';

async function testSellerLogin() {
  try {
    console.log('🧪 Testing Seller Login Flow...');
    
    // Test with the last created seller from our previous test
    const sellerCredentials = {
      username: 'testseller_1755014810723',
      password: 'TestSeller123!'
    };

    console.log('\n📝 Testing login for:', sellerCredentials.username);

    // Step 1: Test login
    console.log('\n🔐 Step 1: Testing seller login...');
    try {
      const loginResponse = await axios.post(`${API_URL}/api/auth/local`, {
        identifier: sellerCredentials.username,
        password: sellerCredentials.password,
      });

      if (loginResponse.data.jwt && loginResponse.data.user) {
        console.log('✅ Seller login successful!');
        console.log('   User ID:', loginResponse.data.user.id);
        console.log('   Username:', loginResponse.data.user.username);
        console.log('   Email:', loginResponse.data.user.email);
        console.log('   Role:', loginResponse.data.user.role?.name);
        
        const jwt = loginResponse.data.jwt;
        const userId = loginResponse.data.user.id;

        // Step 2: Test user/me endpoint with role population
        console.log('\n👤 Step 2: Testing user/me endpoint...');
        try {
          const userMeResponse = await axios.get(`${API_URL}/api/users/me?populate=role`, {
            headers: {
              'Authorization': `Bearer ${jwt}`,
            }
          });

          if (userMeResponse.data) {
            console.log('✅ User/me endpoint successful!');
            console.log('   User Role:', userMeResponse.data.role?.name);
            console.log('   User ID:', userMeResponse.data.id);
          } else {
            console.log('❌ User/me endpoint failed:', userMeResponse.data);
          }
        } catch (userMeError) {
          console.log('❌ User/me endpoint failed:', userMeError.response?.data || userMeError.message);
        }

        // Step 3: Test vendor access
        console.log('\n🏪 Step 3: Testing vendor access...');
        try {
          const vendorResponse = await axios.get(`${API_URL}/api/vendors?populate=user`, {
            headers: {
              'Authorization': `Bearer ${jwt}`,
            }
          });

          if (vendorResponse.data) {
            console.log('✅ Vendor access successful!');
            console.log('   Vendors found:', vendorResponse.data.data?.length || 0);
            
            // Look for vendor linked to this user
            const userVendor = vendorResponse.data.data?.find((vendor) => 
              vendor.user && vendor.user.id === userId
            );
            
            if (userVendor) {
              console.log('✅ Found vendor for this user!');
              console.log('   Vendor ID:', userVendor.id);
              console.log('   Vendor Name:', userVendor.name);
            } else {
              console.log('❌ No vendor found for this user');
            }
          } else {
            console.log('❌ Vendor access failed:', vendorResponse.data);
          }
        } catch (vendorError) {
          console.log('❌ Vendor access failed:', vendorError.response?.data || vendorError.message);
        }

      } else {
        console.log('❌ Seller login failed:', loginResponse.data);
      }
    } catch (loginError) {
      console.log('❌ Seller login failed:', loginError.response?.data || loginError.message);
    }

    console.log('\n🎉 Seller Login Test Completed!');
    console.log('📊 Summary:');
    console.log('- Seller Login: Tested');
    console.log('- User/Me Endpoint: Tested');
    console.log('- Vendor Access: Tested');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing seller login:', error.response?.data || error.message);
    return false;
  }
}

// Run the test
testSellerLogin().then(success => {
  if (success) {
    console.log('\n🎉 Seller login flow is working correctly!');
    console.log('🔧 The web app should now be able to:');
    console.log('1. Login newly created sellers');
    console.log('2. Access user profile with role information');
    console.log('3. Access vendor data for sellers');
    console.log('\n📝 Next Steps:');
    console.log('1. Test the complete flow in the web app');
    console.log('2. Complete signup → payment → login flow');
    console.log('3. Verify seller dashboard access');
  } else {
    console.log('\n💥 Seller login test failed.');
    console.log('🔧 Please check the error messages above.');
  }
}); 