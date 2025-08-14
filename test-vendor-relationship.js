// Test script to check vendor-user relationship

async function testVendorRelationship() {
  try {
    console.log('🔍 Testing vendor-user relationship...');
    
    // First, let's test the basic vendor API without authentication
    console.log('\n1. Testing vendor API without auth:');
    const noAuthRes = await fetch('http://localhost:1337/api/vendors');
    console.log('Status:', noAuthRes.status);
    if (noAuthRes.ok) {
      const data = await noAuthRes.json();
      console.log('Vendors:', data.data?.length || 0);
      if (data.data) {
        data.data.forEach(vendor => {
          console.log(`- ${vendor.name} (ID: ${vendor.id})`);
        });
      }
    } else {
      const error = await noAuthRes.text();
      console.log('Error:', error);
    }
    
    // Test with populate
    console.log('\n2. Testing vendor API with populate:');
    const populateRes = await fetch('http://localhost:1337/api/vendors?populate=user');
    console.log('Status:', populateRes.status);
    if (populateRes.ok) {
      const data = await populateRes.json();
      console.log('Vendors with user relation:', data.data?.length || 0);
      if (data.data) {
        data.data.forEach(vendor => {
          console.log(`- ${vendor.name} (ID: ${vendor.id}) - User: ${vendor.user ? vendor.user.id : 'None'}`);
        });
      }
    } else {
      const error = await populateRes.text();
      console.log('Error:', error);
    }
    
    // Test filtered API
    console.log('\n3. Testing filtered vendor API:');
    const filteredRes = await fetch('http://localhost:1337/api/vendors?filters[user][id][$eq]=4&populate=user');
    console.log('Status:', filteredRes.status);
    if (filteredRes.ok) {
      const data = await filteredRes.json();
      console.log('Filtered vendors:', data.data?.length || 0);
      if (data.data) {
        data.data.forEach(vendor => {
          console.log(`- ${vendor.name} (ID: ${vendor.id}) - User: ${vendor.user ? vendor.user.id : 'None'}`);
        });
      }
    } else {
      const error = await filteredRes.text();
      console.log('Error:', error);
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testVendorRelationship(); 