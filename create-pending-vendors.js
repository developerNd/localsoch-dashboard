// Script to create vendor profiles for users who completed payment
// Run this script to create vendor profiles for pending registrations

const API_URL = 'https://api.localsoch.com';
const ADMIN_TOKEN = 'e84e26b9a4c2d8f27bde949afc61d52117e19563be11d5d9ebc8598313d72d1b49d230e28458cfcee1bccd7702ca542a929706c35cde1a62b8f0ab6f185ae74c9ce64c0d8782c15bf4186c29f4fc5c7fdd4cfdd00938a59a636a32cb243b9ca7c94242438ff5fcd2fadbf40a093ea593e96808af49ad97cbeaed977e319614b5';

async function createPendingVendors() {
  console.log('🔍 Checking for pending vendor data...');
  
  // This would normally read from a database or file
  // For now, we'll create a sample vendor creation
  const sampleVendorData = {
    userId: 4, // Replace with actual user ID
    vendorData: {
      name: "CityBakery",
      description: "Fresh baked goods and pastries",
      address: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      businessType: "bakery",
      phone: "9876543210",
      email: "citybakery@example.com"
    }
  };

  try {
    console.log('📝 Creating vendor profile for user:', sampleVendorData.userId);
    
    // First, update user role to seller
    const roleResponse = await fetch(`${API_URL}/api/users/${sampleVendorData.userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        role: 2 // Seller role
      }),
    });

    if (!roleResponse.ok) {
      throw new Error(`Failed to update user role: ${roleResponse.status}`);
    }

    console.log('✅ User role updated to seller');

    // Create vendor profile
    const vendorResponse = await fetch(`${API_URL}/api/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
      body: JSON.stringify({
        data: {
          ...sampleVendorData.vendorData,
          user: sampleVendorData.userId,
          isActive: true,
          isApproved: true
        }
      }),
    });

    if (!vendorResponse.ok) {
      const errorData = await vendorResponse.json().catch(() => ({}));
      throw new Error(`Failed to create vendor: ${errorData.message || vendorResponse.status}`);
    }

    const vendorData = await vendorResponse.json();
    console.log('✅ Vendor profile created successfully:', vendorData.data);

    return vendorData.data;
  } catch (error) {
    console.error('❌ Error creating vendor:', error);
    throw error;
  }
}

// Function to get all users who might need vendor profiles
async function getUsersWithoutVendors() {
  try {
    const response = await fetch(`${API_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch users: ${response.status}`);
    }

    const users = await response.json();
    console.log('📋 Found users:', users.data.length);
    
    // Filter users who might need vendor profiles
    const usersNeedingVendors = users.data.filter(user => 
      user.role && user.role.name === 'seller'
    );

    console.log('🎯 Users with seller role:', usersNeedingVendors.length);
    return usersNeedingVendors;
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    console.log('🚀 Starting vendor creation process...');
    
    // Get users who might need vendor profiles
    const users = await getUsersWithoutVendors();
    
    if (users.length === 0) {
      console.log('✅ No users found needing vendor profiles');
      return;
    }

    // Create vendor for each user (you can modify this logic)
    for (const user of users) {
      console.log(`\n👤 Processing user: ${user.username} (ID: ${user.id})`);
      
      // Check if user already has a vendor
      const vendorResponse = await fetch(`${API_URL}/api/vendors?filters[user]=${user.id}`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
      });

      if (vendorResponse.ok) {
        const vendors = await vendorResponse.json();
        if (vendors.data && vendors.data.length > 0) {
          console.log(`✅ User ${user.username} already has vendor profile`);
          continue;
        }
      }

      // Create vendor profile for this user
      // You would need to get the vendor data from localStorage or database
      console.log(`📝 Creating vendor profile for ${user.username}...`);
      
      // For now, create a basic vendor profile
      const vendorData = {
        name: `${user.username}'s Shop`,
        description: "Shop created after payment completion",
        address: "Address to be updated",
        city: "City to be updated",
        state: "State to be updated",
        pincode: "000000",
        businessType: "other",
        phone: user.phone || "0000000000",
        email: user.email,
        user: user.id,
        isActive: true,
        isApproved: true
      };

      const createResponse = await fetch(`${API_URL}/api/vendors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ADMIN_TOKEN}`,
        },
        body: JSON.stringify({
          data: vendorData
        }),
      });

      if (createResponse.ok) {
        const newVendor = await createResponse.json();
        console.log(`✅ Vendor created for ${user.username}:`, newVendor.data.id);
      } else {
        console.error(`❌ Failed to create vendor for ${user.username}`);
      }
    }

    console.log('\n🎉 Vendor creation process completed!');
  } catch (error) {
    console.error('💥 Error in main process:', error);
  }
}

// Run the script
if (typeof window === 'undefined') {
  // Node.js environment
  main().catch(console.error);
} else {
  // Browser environment
  console.log('🌐 Running in browser - use the functions manually');
  window.createPendingVendors = createPendingVendors;
  window.getUsersWithoutVendors = getUsersWithoutVendors;
  window.main = main;
} 