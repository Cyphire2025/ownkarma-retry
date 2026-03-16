import axios from 'axios';

const MEDUSA_Backend_URL = process.env.MEDUSA_BACKEND_URL || 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.MEDUSA_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
    throw new Error('Missing MEDUSA_PUBLISHABLE_KEY env var');
}

async function testApi() {
    try {
        console.log('Testing Medusa API...');
        console.log(`URL: ${MEDUSA_Backend_URL}`);
        console.log(`Key: ${PUBLISHABLE_KEY.substring(0, 10)}...`);

        // 1. Test GET Collections (Should work if key is valid)
        console.log('\nEvaluating GET /store/collections...');
        const collections = await axios.get(`${MEDUSA_Backend_URL}/store/collections`, {
            headers: {
                'x-publishable-api-key': PUBLISHABLE_KEY
            }
        });
        console.log('✅ GET Collections Success:', collections.status);

        // 2. Test POST Customer (V2 Flow)
        console.log('\nEvaluating POST /store/customers (V2 Flow)...');
        const email = `test.user.${Date.now()}@example.com`;
        const password = `StrongPwd!${Date.now()}`;

        // Step 1: Register Auth Identity
        console.log('  Step 1: Registering Auth Identity...');
        const authResponse = await axios.post(`${MEDUSA_Backend_URL}/auth/customer/emailpass/register`, {
            email,
            password
        }, {
            headers: {
                'x-publishable-api-key': PUBLISHABLE_KEY,
                'Content-Type': 'application/json'
            }
        });

        const token = authResponse.data.token;
        console.log('  ✅ Auth Identity Created. Token:', token ? 'Received' : 'Missing');

        if (!token) throw new Error('No token received from auth registration');

        // Step 2: Create Customer Profile
        console.log('  Step 2: Creating Customer Profile...');
        const customer = await axios.post(`${MEDUSA_Backend_URL}/store/customers`, {
            email: email,
            first_name: 'Test',
            last_name: 'User'
        }, {
            headers: {
                'x-publishable-api-key': PUBLISHABLE_KEY,
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('✅ POST Customer Success:', customer.status);
        console.log('Customer ID:', customer.data.customer.id);

    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

testApi();
