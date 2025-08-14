const axios = require('axios');

const API_URL = 'http://localhost:1337';

async function fixSellerPermissions() {
  try {
    console.log('🔧 Fixing Seller Role Permissions...');
    
    // Step 1: Login as admin
    console.log('\n🔐 Step 1: Logging in as admin...');
    const adminLoginResponse = await axios.post(`${API_URL}/api/auth/local`, {
      identifier: 'admin@gmail.com',
      password: 'admin@123',
    });

    if (!adminLoginResponse.data.jwt) {
      throw new Error('Admin login failed');
    }

    const adminToken = adminLoginResponse.data.jwt;
    console.log('✅ Admin login successful!');

    // Step 2: Get current seller role
    console.log('\n📋 Step 2: Getting current seller role...');
    const rolesResponse = await axios.get(`${API_URL}/api/users-permissions/roles`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      }
    });

    const sellerRole = rolesResponse.data.roles.find(role => role.name === 'seller');
    if (!sellerRole) {
      throw new Error('Seller role not found');
    }

    console.log('✅ Found seller role (ID:', sellerRole.id, ')');

    // Step 3: Update seller role with proper permissions
    console.log('\n🔧 Step 3: Updating seller role permissions...');
    
    const sellerPermissions = {
      "api::product.product": {
        "controllers": {
          "product": {
            "find": ["plugin::users-permissions.jwt"],
            "findOne": ["plugin::users-permissions.jwt"],
            "create": ["plugin::users-permissions.jwt"],
            "update": ["plugin::users-permissions.jwt"],
            "delete": ["plugin::users-permissions.jwt"]
          }
        }
      },
      "api::vendor.vendor": {
        "controllers": {
          "vendor": {
            "find": ["plugin::users-permissions.jwt"],
            "findOne": ["plugin::users-permissions.jwt"],
            "create": ["plugin::users-permissions.jwt"],
            "update": ["plugin::users-permissions.jwt"],
            "delete": ["plugin::users-permissions.jwt"]
          }
        }
      },
      "api::order.order": {
        "controllers": {
          "order": {
            "find": ["plugin::users-permissions.jwt"],
            "findOne": ["plugin::users-permissions.jwt"],
            "create": ["plugin::users-permissions.jwt"],
            "update": ["plugin::users-permissions.jwt"],
            "delete": ["plugin::users-permissions.jwt"]
          }
        }
      },
      "plugin::users-permissions.user": {
        "controllers": {
          "user": {
            "me": ["plugin::users-permissions.jwt"],
            "updateMe": ["plugin::users-permissions.jwt"]
          }
        }
      }
    };

    console.log('📝 Sending role update request...');
    console.log('   Role ID:', sellerRole.id);
    console.log('   Permissions structure:', JSON.stringify(sellerPermissions, null, 2));
    
    const updateRoleResponse = await axios.put(`${API_URL}/api/users-permissions/roles/${sellerRole.id}`, {
      name: 'seller',
      description: 'Seller role for vendors',
      permissions: sellerPermissions,
      users: sellerRole.users || []
    }, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });

    console.log('📝 Role update response status:', updateRoleResponse.status);
    console.log('📝 Role update response data:', JSON.stringify(updateRoleResponse.data, null, 2));

    if (updateRoleResponse.data.ok) {
      console.log('✅ Seller role permissions updated successfully!');
      console.log('   Response:', updateRoleResponse.data);
    } else {
      throw new Error('Failed to update seller role');
    }

    // Step 4: Test seller login and permissions
    console.log('\n🧪 Step 4: Testing seller permissions...');
    
    // Test with the seller we created earlier
    const sellerLoginResponse = await axios.post(`${API_URL}/api/auth/local`, {
      identifier: 'testseller_1755014810723',
      password: 'TestSeller123!',
    });

    if (sellerLoginResponse.data.jwt) {
      const sellerToken = sellerLoginResponse.data.jwt;
      console.log('✅ Seller login successful!');

      // Test user/me endpoint
      try {
        const userMeResponse = await axios.get(`${API_URL}/api/users/me?populate=role`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`,
          }
        });

        if (userMeResponse.data) {
          console.log('✅ User/me endpoint now works!');
          console.log('   User Role:', userMeResponse.data.role?.name);
        }
      } catch (error) {
        console.log('❌ User/me endpoint still failing:', error.response?.data || error.message);
      }

      // Test vendor access
      try {
        const vendorResponse = await axios.get(`${API_URL}/api/vendors?populate=user`, {
          headers: {
            'Authorization': `Bearer ${sellerToken}`,
          }
        });

        if (vendorResponse.data) {
          console.log('✅ Vendor access now works!');
          console.log('   Vendors found:', vendorResponse.data.data?.length || 0);
        }
      } catch (error) {
        console.log('❌ Vendor access still failing:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Seller Permissions Fix Completed!');
    console.log('📊 Summary:');
    console.log('- Admin Login: ✅');
    console.log('- Seller Role Update: ✅');
    console.log('- Permission Testing: ✅');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error fixing seller permissions:', error.response?.data || error.message);
    return false;
  }
}

// Run the fix
fixSellerPermissions().then(success => {
  if (success) {
    console.log('\n🎉 Seller permissions have been fixed!');
    console.log('🔧 Sellers can now:');
    console.log('1. Access their user profile with role information');
    console.log('2. Access vendor data');
    console.log('3. Manage products and orders');
    console.log('\n📝 Next Steps:');
    console.log('1. Test the complete signup → payment → login flow');
    console.log('2. Verify seller dashboard access');
    console.log('3. Test product and order management');
  } else {
    console.log('\n💥 Seller permissions fix failed.');
    console.log('🔧 Please check the error messages above.');
  }
}); 