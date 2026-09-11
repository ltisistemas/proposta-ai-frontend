const axios = require('axios');
const fs = require('fs');
const dotenv = require('dotenv');

// Carrega .env.local
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
} else if (fs.existsSync('.env.production')) {
  dotenv.config({ path: '.env.production' });
}

let key = process.env.ASAAS_API_KEY || process.env.ASAAS_API_KEY_SANDBOX || '';
key = key.replace(/^["']|["']$/g, '').trim();

console.log('Using Asaas key prefix:', key.substring(0, 15), 'Length:', key.length);
console.log('Using Base URL: https://api-sandbox.asaas.com/v3');

async function test() {
  try {
    const client = axios.create({
      baseURL: 'https://api-sandbox.asaas.com/v3',
      headers: {
        access_token: key,
        'Content-Type': 'application/json',
        'User-Agent': 'vira-propo-ai/1.0.0',
        accept: 'application/json',
      },
      timeout: 15000,
    });

    console.log('1. Testing GET /customers...');
    const custRes = await client.get('/customers');
    console.log('GET /customers OK, totalCount:', custRes.data.totalCount);

    console.log('2. Testing POST /customers...');
    const newCust = await client.post('/customers', {
      name: 'Teste Luiz Proposta AI',
      email: 'teste.luiz@virapropoai.com',
      cpfCnpj: '24971563792',
      notificationDisabled: true,
      externalReference: 'test-user-123',
    });
    console.log('POST /customers OK, ID:', newCust.data.id);
    const customerId = newCust.data.id;

    console.log('3. Testing POST /subscriptions...');
    const hoje = new Date().toISOString().split('T')[0];
    const subRes = await client.post('/subscriptions', {
      billingType: 'PIX',
      cycle: 'MONTHLY',
      value: 45.9,
      customer: customerId,
      nextDueDate: hoje,
      description: 'Plano PRO do ViraPropo-AI',
      externalReference: 'test-user-123',
      maxPayments: 24,
    });
    console.log('POST /subscriptions OK, ID:', subRes.data.id);
    const subscriptionId = subRes.data.id;

    console.log('4. Testing GET /subscriptions/' + subscriptionId + '/payments...');
    const payRes = await client.get(`/subscriptions/${subscriptionId}/payments`);
    console.log('GET /subscriptions/.../payments OK, data:', payRes.data);

    if (payRes.data.data && payRes.data.data.length > 0) {
      const paymentId = payRes.data.data[0].id;
      console.log('5. Testing GET /payments/' + paymentId + '/pixQrCode...');
      const pixRes = await client.get(`/payments/${paymentId}/pixQrCode`);
      console.log('GET /payments/.../pixQrCode OK:', {
        hasEncodedImage: !!pixRes.data.encodedImage,
        payloadPrefix: pixRes.data.payload?.substring(0, 30),
        expirationDate: pixRes.data.expirationDate,
      });
    }
  } catch (err) {
    console.error('ERROR RESPONSE:', err.response ? { status: err.response.status, data: err.response.data } : err.message);
  }
}

test();
