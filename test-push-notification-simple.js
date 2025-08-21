import axios from 'axios';

// Use hardcoded API URL for testing
const API_URL = 'http://localhost:1337';

async function testPushNotification() {
  console.log('🧪 Testing Push Notification...\n');

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

    // Step 2: Test push notification to user
    console.log('\n2️⃣ Testing push notification to user...');
    try {
      const pushResponse = await axios.post(`${API_URL}/api/notifications/push/users`, {
        userIds: [testUser.id],
        notification: {
          title: 'Test Push Notification',
          message: 'This is a test push notification from the backend',
          type: 'test'
        },
        data: {
          type: 'test',
          isImportant: 'true',
          isAdminCreated: 'true'
        }
      });
      console.log('✅ Push notification sent successfully:', pushResponse.data);
    } catch (error) {
      console.error('❌ Push notification failed:', error.response?.data || error.message);
    }

    // Step 3: Test push notification statistics
    console.log('\n3️⃣ Testing push notification statistics...');
    try {
      const statsResponse = await axios.get(`${API_URL}/api/notifications/push/stats`);
      console.log('✅ Push notification statistics:', statsResponse.data);
    } catch (error) {
      console.error('❌ Statistics failed:', error.response?.data || error.message);
    }

    console.log('\n🎉 Push notification tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testPushNotification(); 