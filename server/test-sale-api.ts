import http from 'http';

async function testAuthAndSale() {
  const loginData = JSON.stringify({ email: 'admin@corebiz.com', password: 'admin123', role: 'admin' });
  const loginReq = http.request({
    hostname: 'localhost', port: 5000, path: '/api/auth/login', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(loginData) }
  }, (res: any) => {
    let raw = '';
    res.on('data', (c: any) => { raw += c; });
    res.on('end', () => {
      try {
        const body = JSON.parse(raw);
        if (!body.token) throw new Error("No token returned " + raw);
        runSale(body.token);
      } catch (e: any) { console.error('Login failed:', raw); }
    });
  });
  loginReq.write(loginData);
  loginReq.end();
}

function runSale(token: string) {
  const saleData = JSON.stringify({
    customerName: "Walking Customer",
    customerPhone: "9384352716",
    items: [{ variantId: 1, productId: 1, quantity: 1, sellingPrice: 100, gstPercent: 18, total: 100 }],
    subtotal: 100, gstTotal: 18, grandTotal: 118, pointsToRedeem: 0
  });

  const req = http.request({
    hostname: 'localhost', port: 5000, path: '/api/sales', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
  }, (res: any) => {
    let data = '';
    res.on('data', (c: any) => { data += c; });
    res.on('end', () => {
      console.log(`Status: ${res.statusCode}`);
      console.log(`Response: ${data}`);
    });
  });
  req.on('error', (e: any) => console.error('Sale Request Error:', e.message));
  req.write(saleData);
  req.end();
}

testAuthAndSale();
