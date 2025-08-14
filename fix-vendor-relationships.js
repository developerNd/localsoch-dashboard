// Script to fix vendor-user relationships
// This script will link existing vendors to users and create missing vendor records

// Using built-in fetch (available in Node.js 18+)

async function fixVendorRelationships() {
  try {
    console.log('🔧 Fixing vendor-user relationships...');
    
    // First, let's check what users and vendors exist
    console.log('\n1. Checking existing users...');
    const usersRes = await fetch('http://localhost:1337/api/users?populate=role', {
      headers: {
        'Authorization': 'Bearer e84e26b9a4c2d8f27bde949afc61d52117e19563be11d5d9ebc8598313d72d1b49d230e28458cfcee1bccd7702ca542a929706c35cde1a62b8f0ab6f185ae74c9ce64c0d8782c15bf4186c29f4fc5c7fdd4cfdd00938a59a636a32cb243b9ca7c94242438ff5fcd2fadbf40a093ea593e96808af49ad97cbeaed977e319614b5'
      }
    });
    console.log('Users API status:', usersRes.status);
    if (usersRes.ok) {
      const usersData = await usersRes.json();
      console.log('Users found:', usersData.length || 0);
      usersData.forEach(user => {
        console.log(`- User ID: ${user.id}, Username: ${user.username}, Role: ${user.role?.name || 'No role'}`);
      });
    } else {
      const error = await usersRes.text();
      console.log('Error fetching users:', error);
    }

    console.log('\n2. Checking existing vendors...');
    const vendorsRes = await fetch('http://localhost:1337/api/vendors?populate=user', {
      headers: {
        'Authorization': 'Bearer e84e26b9a4c2d8f27bde949afc61d52117e19563be11d5d9ebc8598313d72d1b49d230e28458cfcee1bccd7702ca542a929706c35cde1a62b8f0ab6f185ae74c9ce64c0d8782c15bf4186c29f4fc5c7fdd4cfdd00938a59a636a32cb243b9ca7c94242438ff5fcd2fadbf40a093ea593e96808af49ad97cbeaed977e319614b5'
      }
    });
    console.log('Vendors API status:', vendorsRes.status);
    if (vendorsRes.ok) {
      const vendorsData = await vendorsRes.json();
      console.log('Vendors found:', vendorsData.data?.length || 0);
      vendorsData.data?.forEach(vendor => {
        console.log(`- Vendor ID: ${vendor.id}, Name: ${vendor.name}, User: ${vendor.user ? vendor.user.id : 'None'}`);
      });
    } else {
      const error = await vendorsRes.text();
      console.log('Error fetching vendors:', error);
    }

    // Now let's link vendors to users
    console.log('\n3. Linking vendors to users...');
    
    // Link CityBakery vendor (ID 26) to citybakery user (ID 4)
    console.log('Linking CityBakery vendor to citybakery user...');
    const cityBakeryRes = await fetch('http://localhost:1337/api/vendors/26', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer e84e26b9a4c2d8f27bde949afc61d52117e19563be11d5d9ebc8598313d72d1b49d230e28458cfcee1bccd7702ca542a929706c35cde1a62b8f0ab6f185ae74c9ce64c0d8782c15bf4186c29f4fc5c7fdd4cfdd00938a59a636a32cb243b9ca7c94242438ff5fcd2fadbf40a093ea593e96808af49ad97cbeaed977e319614b5'
      },
      body: JSON.stringify({
        data: {
          user: 4 // Link to user ID 4 (citybakery)
        }
      })
    });

    if (cityBakeryRes.ok) {
      console.log('✅ Successfully linked CityBakery vendor to citybakery user');
    } else {
      const error = await cityBakeryRes.text();
      console.log('❌ Error linking CityBakery:', error);
    }

    // Link FreshMart vendor (ID 25) to freshmart user (ID 3)
    console.log('Linking FreshMart vendor to freshmart user...');
    const freshMartRes = await fetch('http://localhost:1337/api/vendors/25', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer e84e26b9a4c2d8f27bde949afc61d52117e19563be11d5d9ebc8598313d72d1b49d230e28458cfcee1bccd7702ca542a929706c35cde1a62b8f0ab6f185ae74c9ce64c0d8782c15bf4186c29f4fc5c7fdd4cfdd00938a59a636a32cb243b9ca7c94242438ff5fcd2fadbf40a093ea593e96808af49ad97cbeaed977e319614b5'
      },
      body: JSON.stringify({
        data: {
          user: 3 // Link to user ID 3 (freshmart)
        }
      })
    });

    if (freshMartRes.ok) {
      console.log('✅ Successfully linked FreshMart vendor to user');
    } else {
      const error = await freshMartRes.text();
      console.log('❌ Error linking FreshMart:', error);
    }

    // Verify the relationships
    console.log('\n4. Verifying relationships...');
    const verifyRes = await fetch('http://localhost:1337/api/vendors?populate=user');
    if (verifyRes.ok) {
      const verifyData = await verifyRes.json();
      console.log('Updated vendors:');
      verifyData.data?.forEach(vendor => {
        console.log(`- ${vendor.name} (ID: ${vendor.id}) - User: ${vendor.user ? vendor.user.id : 'None'}`);
      });
    }

    console.log('\n✅ Vendor-user relationship fix complete!');
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

fixVendorRelationships(); 