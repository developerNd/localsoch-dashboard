const API_URL = 'http://localhost:1337';

async function checkVendorDeletePermissions() {
  console.log('🔍 Checking vendor delete permissions...');

  try {
    // First, login as admin
    const loginResponse = await fetch(`${API_URL}/api/auth/local`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'admin@localsoch.com',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (!loginData.jwt) {
      console.error('❌ Admin login failed');
      return;
    }

    console.log('✅ Admin login successful');
    const adminToken = loginData.jwt;

    // Test vendor delete endpoint
    console.log('🔍 Testing vendor delete endpoint...');
    
    // First, get a list of vendors
    const vendorsResponse = await fetch(`${API_URL}/api/vendors/admin/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });

    const vendorsData = await vendorsResponse.json();
    
    if (!vendorsData.success || !vendorsData.data || vendorsData.data.length === 0) {
      console.log('❌ No vendors found to test deletion');
      return;
    }

    // Find a vendor without products for safe deletion
    const vendorToDelete = vendorsData.data.find(vendor => 
      !vendor.products || vendor.products.length === 0
    );

    if (!vendorToDelete) {
      console.log('⚠️ No vendors without products found. Cannot safely test deletion.');
      return;
    }

    console.log(`🔍 Testing deletion of vendor: ${vendorToDelete.name} (ID: ${vendorToDelete.id})`);

    // Test the delete endpoint
    const deleteResponse = await fetch(`${API_URL}/api/vendors/${vendorToDelete.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });

    const deleteData = await deleteResponse.json();

    console.log('📊 Delete Response Status:', deleteResponse.status);
    console.log('📊 Delete Response Data:', deleteData);

    if (deleteResponse.ok && deleteData.success) {
      console.log('✅ Vendor delete endpoint working correctly!');
    } else {
      console.log('❌ Vendor delete endpoint failed');
      console.log('Error details:', deleteData);
    }

  } catch (error) {
    console.error('❌ Error checking vendor delete permissions:', error);
  }
}

// Run the check
checkVendorDeletePermissions(); 