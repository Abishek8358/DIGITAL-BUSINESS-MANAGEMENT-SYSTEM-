const axios = require('axios');

async function testAnalytics() {
  try {
    // 1. Login to get token for valan@gmail.com
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'valan@gmail.com',
      password: 'admin', // assuming this is the password or I'll check users table
      role: 'admin'
    });
    
    const token = loginRes.data.token;
    console.log('Logged in, token received');

    // 2. Call analytics dashboard
    const analyticsRes = await axios.get('http://localhost:5000/api/analytics/dashboard?filter=all', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log('Analytics Response:', JSON.stringify(analyticsRes.data, null, 2));

  } catch (err) {
    console.error('Error:', err.response?.data || err.message);
  }
}

testAnalytics();
