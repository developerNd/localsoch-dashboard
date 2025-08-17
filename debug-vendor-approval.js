const axios = require('axios');

const API_URL = 'http://192.168.1.102:1337';

async function debugVendorApproval() {
  try {
    console.log('🔍 Debugging vendor approval issue...');
    
    // First, try to login as admin
    console.log('\n🔐 Step 1: Trying to login as admin...');
    let adminToken = null;
    
    try {
      const loginResponse = await axios.post(`${API_URL}/api/auth/local`, {
        identifier: 'admin@gmail.com',
        password: 'admin@123'
      });
      adminToken = loginResponse.data.jwt;
      console.log('✅ Admin login successful');
    } catch (loginError) {
      console.log('❌ Admin login failed:', loginError.response?.data || loginError.message);
      
      // Try alternative admin credentials
      try {
        const altLoginResponse = await axios.post(`${API_URL}/api/auth/local`, {
          identifier: 'admin@cityshopping.com',
          password: 'Admin123!'
        });
        adminToken = altLoginResponse.data.jwt;
        console.log('✅ Alternative admin login successful');
      } catch (altLoginError) {
        console.log('❌ Alternative admin login also failed:', altLoginError.response?.data || altLoginError.message);
        return;
      }
    }

    if (!adminToken) {
      console.log('❌ No admin token available');
      return;
    }

    const headers = {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    };

    // Get current user info
    console.log('\n👤 Step 2: Checking current user info...');
    try {
      const userResponse = await axios.get(`${API_URL}/api/users/me`, { headers });
      console.log('✅ Current user:', userResponse.data);
      console.log('   - ID:', userResponse.data.id);
      console.log('   - Username:', userResponse.data.username);
      console.log('   - Email:', userResponse.data.email);
      console.log('   - Role:', userResponse.data.role?.name);
      console.log('   - Role ID:', userResponse.data.role?.id);
    } catch (userError) {
      console.log('❌ Failed to get user info:', userError.response?.data || userError.message);
    }

    // Get all vendors
    console.log('\n📋 Step 3: Getting all vendors...');
    let vendorsResponse;
    try {
      vendorsResponse = await axios.get(`${API_URL}/api/vendors?populate=user`, { headers });
      console.log('✅ Vendors retrieved successfully');
      console.log('📊 Total vendors:', vendorsResponse.data.data.length);
      
      vendorsResponse.data.data.forEach((vendor, index) => {
        console.log(`\n${index + 1}. Vendor Details:`);
        console.log('   - ID:', vendor.id);
        console.log('   - Name:', vendor.name);
        console.log('   - isApproved:', vendor.isApproved);
        console.log('   - status:', vendor.status);
        console.log('   - User ID:', vendor.user?.id);
        console.log('   - User Role:', vendor.user?.role?.name);
      });
    } catch (vendorsError) {
      console.log('❌ Failed to get vendors:', vendorsError.response?.data || vendorsError.message);
      return;
    }

    // Try a simple vendor update to see the exact error
    console.log('\n🔧 Step 5: Testing vendor update...');
    try {
      const testVendor = vendorsResponse.data.data[0];
      if (testVendor) {
        console.log(`Testing update on vendor ID: ${testVendor.id}`);
        
        const updateResponse = await axios.put(`${API_URL}/api/vendors/${testVendor.id}`, {
          isApproved: true
        }, { headers });
        
        console.log('✅ Simple update successful:', updateResponse.data);
      }
    } catch (updateError) {
      console.log('❌ Update failed:', updateError.response?.data || updateError.message);
      console.log('❌ Error status:', updateError.response?.status);
      console.log('❌ Error details:', JSON.stringify(updateError.response?.data, null, 2));
    }

  } catch (error) {
    console.error('❌ General error:', error.message);
  }
}

// Run the debug script
debugVendorApproval(); 