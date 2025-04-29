// Save this as debug-api.js in your backend folder

const fetch = require('node-fetch');

// Configuration
const API_URL = 'http://localhost:5000/api';
const DEBUG_ENDPOINTS = [
  {
    name: 'Get All Crops',
    method: 'GET',
    url: `${API_URL}/crops`,
    expectedStatus: 200
  },
  {
    name: 'Get Crop by ID (will fail if ID does not exist)',
    method: 'GET',
    url: `${API_URL}/crops/sample-id`,
    expectedStatus: 404
  }
];

// Test function
async function testEndpoint(endpoint) {
  try {
    console.log(`\nTesting: ${endpoint.name} (${endpoint.method} ${endpoint.url})`);
    
    const response = await fetch(endpoint.url, {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    console.log(`Status: ${response.status} (Expected: ${endpoint.expectedStatus})`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Check if status matches expected
    if (response.status === endpoint.expectedStatus) {
      console.log('✅ Test passed!');
    } else {
      console.log('❌ Test failed: Unexpected status code');
    }
    
    return {
      success: response.status === endpoint.expectedStatus,
      status: response.status,
      data
    };
  } catch (error) {
    console.error('❌ Test error:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run all tests
async function runTests() {
  console.log('=== API Endpoint Testing ===');
  console.log(`Base URL: ${API_URL}`);
  console.log('Starting tests...\n');
  
  const results = [];
  
  for (const endpoint of DEBUG_ENDPOINTS) {
    const result = await testEndpoint(endpoint);
    results.push({
      endpoint: endpoint.name,
      ...result
    });
  }
  
  // Summary
  console.log('\n=== Test Summary ===');
  const passed = results.filter(r => r.success).length;
  console.log(`✅ Passed: ${passed}/${results.length}`);
  console.log(`❌ Failed: ${results.length - passed}/${results.length}`);
  
  if (passed === results.length) {
    console.log('\n🎉 All tests passed! Your API is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the issues and fix them.');
  }
}

// Run the tests
runTests().catch(console.error);