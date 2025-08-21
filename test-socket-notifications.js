import axios from 'axios';
import io from 'socket.io-client';

// Use hardcoded API URL for testing
const API_URL = 'http://localhost:1337';

async function testSocketNotifications() {
  console.log('🧪 Testing Socket Notifications...\n');

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

    // Step 2: Connect to WebSocket
    console.log('\n2️⃣ Connecting to WebSocket...');
    const socket = io(API_URL, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket connected');
      
      // Authenticate as the test user
      socket.emit('authenticate', {
        userId: testUser.id,
        userType: 'user'
      });
    });

    socket.on('authenticated', (data) => {
      console.log('✅ WebSocket authenticated:', data);
    });

    socket.on('new_notification', (notification) => {
      console.log('🔔 WebSocket received notification:', notification);
    });

    socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected');
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket error:', error);
    });

    // Wait for connection
    await new Promise(resolve => {
      socket.on('connect', resolve);
      setTimeout(resolve, 5000); // Timeout after 5 seconds
    });

    // Step 3: Create a test notification via API
    console.log('\n3️⃣ Creating test notification via API...');
    const testNotification = {
      title: 'Socket Test Notification',
      message: 'This is a test notification to verify socket functionality',
      type: 'test',
      user: testUser.id,
      isRead: false
    };

    const createResponse = await axios.post(`${API_URL}/api/notifications`, {
      data: testNotification
    });

    const createdNotification = createResponse.data.data;
    console.log(`✅ Created test notification (ID: ${createdNotification.id})`);

    // Step 4: Wait for socket notification
    console.log('\n4️⃣ Waiting for socket notification...');
    await new Promise(resolve => {
      const timeout = setTimeout(() => {
        console.log('❌ Timeout waiting for socket notification');
        resolve();
      }, 10000); // 10 second timeout

      socket.on('new_notification', (notification) => {
        console.log('✅ Socket notification received!');
        clearTimeout(timeout);
        resolve();
      });
    });

    // Step 5: Test bulk notifications with socket
    console.log('\n5️⃣ Testing bulk notifications with socket...');
    const bulkNotifications = [
      {
        title: 'Bulk Test 1',
        message: 'First bulk test notification',
        type: 'test',
        user: testUser.id,
        isRead: false
      },
      {
        title: 'Bulk Test 2',
        message: 'Second bulk test notification',
        type: 'test',
        user: testUser.id,
        isRead: false
      }
    ];

    const bulkResponse = await axios.post(`${API_URL}/api/notifications/bulk`, {
      notifications: bulkNotifications,
      targetAudience: 'specific_users'
    });

    console.log('✅ Bulk notifications created:', bulkResponse.data);

    // Step 6: Wait for bulk socket notifications
    console.log('\n6️⃣ Waiting for bulk socket notifications...');
    let notificationCount = 0;
    await new Promise(resolve => {
      const timeout = setTimeout(() => {
        console.log(`❌ Timeout waiting for bulk socket notifications. Received: ${notificationCount}`);
        resolve();
      }, 10000); // 10 second timeout

      socket.on('new_notification', (notification) => {
        notificationCount++;
        console.log(`✅ Bulk socket notification ${notificationCount} received:`, notification.title);
        
        if (notificationCount >= 2) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    // Step 7: Clean up
    console.log('\n7️⃣ Cleaning up test notifications...');
    try {
      await axios.delete(`${API_URL}/api/notifications/${createdNotification.id}/delete`);
      console.log('✅ Cleaned up test notification');
    } catch (error) {
      console.log('⚠️ Could not clean up test notification:', error.message);
    }

    // Disconnect socket
    socket.disconnect();
    console.log('✅ WebSocket disconnected');

    console.log('\n🎉 Socket notification tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testSocketNotifications(); 