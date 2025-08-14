// Script to update vendor-user relationship
// Run this with: node update-vendor-user.js

const fetch = require('node-fetch');

async function updateVendorUser() {
  try {
    // Update CityBakery vendor (ID 26) to link with user citybakery (ID 4)
    const response = await fetch('http://localhost:1337/api/vendors/26', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ADMIN_TOKEN' // Replace with admin token
      },
      body: JSON.stringify({
        data: {
          user: 4 // Link to user ID 4 (citybakery)
        }
      })
    });

    if (response.ok) {
      console.log('✅ Successfully updated CityBakery vendor to link with user citybakery');
    } else {
      const error = await response.text();
      console.log('❌ Error updating vendor:', error);
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

updateVendorUser(); 