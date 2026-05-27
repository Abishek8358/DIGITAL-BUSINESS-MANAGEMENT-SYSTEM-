const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/sales',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // We need a valid token. If we don't have one, we might get 401. Let's see if we get 401 first.
  }
}, (res: any) => {
  let data = '';
  res.on('data', (c: any) => { data += c; });
  res.on('end', () => { 
    console.log(`Status: ${res.statusCode}`);
    console.log(`Response: ${data}`);
  });
});

req.on('error', (e: any) => {
  console.error('Request Error:', e.message);
});

req.write(JSON.stringify({
  customerName: "Walking Customer",
  customerPhone: "9384352716",
  items: [
    {
       variantId: 1,
       productId: 1,
       quantity: 1,
       sellingPrice: 100,
       gstPercent: 18,
       total: 100
    }
  ],
  subtotal: 100,
  gstTotal: 18,
  grandTotal: 118,
  pointsToRedeem: 0
}));
req.end();
