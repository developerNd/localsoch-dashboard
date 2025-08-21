const axios = require('axios');

// Import API URL from config
const { API_URL } = require('./client/src/lib/config');

async function testNotificationFixes() {
  console.log('🧪 Testing Notification Fixes...\n');

  try {
    // Step 1: Get users to test with
    console.log('1️⃣ Getting users for testing...');
    const usersResponse = await axios.get(`${API_URL}/api/users?populate=*`);
    const users = usersResponse.data;
    console.log(`✅ Found ${users.length} users`);

    if (users.length === 0) {
      console.log('❌ No users found for testing');
      return;
    }

    const testUser = users[0];
    console.log(`✅ Using test user: ${testUser.username} (ID: ${testUser.id})`);

    // Step 2: Create a test notification
    console.log('\n2️⃣ Creating test notification...');
    const testNotification = {
      title: 'Test Notification',
      message: 'This is a test notification for fixing mark as read and delete functionality',
      type: 'test',
      user: testUser.id,
      isRead: false
    };

    const createResponse = await axios.post(`${API_URL}/api/notifications`, {
      data: testNotification
    });

    const createdNotification = createResponse.data.data;
    console.log(`✅ Created test notification (ID: ${createdNotification.id})`);

    // Step 3: Test mark as read functionality
    console.log('\n3️⃣ Testing mark as read functionality...');
    try {
      const markReadResponse = await axios.put(`${API_URL}/api/notifications/${createdNotification.id}/read`);
      console.log('✅ Mark as read successful:', markReadResponse.data);
    } catch (error) {
      console.error('❌ Mark as read failed:', error.response?.data || error.message);
    }

    // Step 4: Verify notification is marked as read
    console.log('\n4️⃣ Verifying notification is marked as read...');
    try {
      const verifyResponse = await axios.get(`${API_URL}/api/notifications/${createdNotification.id}`);
      const notification = verifyResponse.data.data;
      console.log(`✅ Notification isRead status: ${notification.isRead}`);
    } catch (error) {
      console.error('❌ Verification failed:', error.response?.data || error.message);
    }

    // Step 5: Test delete functionality
    console.log('\n5️⃣ Testing delete functionality...');
    try {
      const deleteResponse = await axios.delete(`${API_URL}/api/notifications/${createdNotification.id}/delete`);
      console.log('✅ Delete successful:', deleteResponse.data);
    } catch (error) {
      console.error('❌ Delete failed:', error.response?.data || error.message);
    }

    // Step 6: Verify notification is deleted
    console.log('\n6️⃣ Verifying notification is deleted...');
    try {
      await axios.get(`${API_URL}/api/notifications/${createdNotification.id}`);
      console.log('❌ Notification still exists (should be deleted)');
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('✅ Notification successfully deleted (404 Not Found)');
      } else {
        console.error('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Step 7: Test mark all as read functionality
    console.log('\n7️⃣ Testing mark all as read functionality...');
    try {
      // Create another test notification
      const secondNotification = {
        title: 'Second Test Notification',
        message: 'This is another test notification',
        type: 'test',
        user: testUser.id,
        isRead: false
      };

      const createSecondResponse = await axios.post(`${API_URL}/api/notifications`, {
        data: secondNotification
      });

      const secondCreatedNotification = createSecondResponse.data.data;
      console.log(`✅ Created second test notification (ID: ${secondCreatedNotification.id})`);

      // Mark all as read
      const markAllReadResponse = await axios.put(`${API_URL}/api/notifications/user/${testUser.id}/read-all`);
      console.log('✅ Mark all as read successful:', markAllReadResponse.data);

      // Verify
      const verifySecondResponse = await axios.get(`${API_URL}/api/notifications/${secondCreatedNotification.id}`);
      const secondNotification = verifySecondResponse.data.data;
      console.log(`✅ Second notification isRead status: ${secondNotification.isRead}`);

      // Clean up
      await axios.delete(`${API_URL}/api/notifications/${secondCreatedNotification.id}/delete`);
      console.log('✅ Cleaned up second test notification');

    } catch (error) {
      console.error('❌ Mark all as read test failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 All notification tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testNotificationFixes(); 