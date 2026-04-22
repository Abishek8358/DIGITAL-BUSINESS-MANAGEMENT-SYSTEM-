import pool from './db/connection';
import fs from 'fs';

async function testSale() {
  let out = '';
  
  // Get a real variant to test with
  const v = await pool.query(`
    SELECT v.id as "variantId", v.variant_name, v.selling_price as "sellingPrice",
           v.gst_percent as "gstPercent", v.stock,
           b.id as "brandId", b.name as "brandName", b.product_id as "productId",
           p.name as "productName", p.categoryid as "categoryId"
    FROM variants v
    JOIN brands b ON v.brand_id = b.id
    JOIN products p ON b.product_id = p.id
    WHERE v.store_id = 1
    LIMIT 1
  `);
  out += 'Sample variant: ' + JSON.stringify(v.rows[0]) + '\n\n';

  // Try the exact sale_items insert
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    const invoiceId = 'TEST-' + Date.now();
    const date = new Date().toISOString();
    
    // Get a walking customer
    const cust = await client.query(
      "SELECT id FROM customers WHERE store_id = 1 LIMIT 1"
    );
    const customerId = cust.rows[0]?.id || null;
    
    const saleResult = await client.query(`
      INSERT INTO sales (invoiceid, customerid, subtotal, gsttotal, grandtotal, date, createdby, store_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [invoiceId, customerId, 100, 18, 118, date, 1, 1]);
    
    const saleId = saleResult.rows[0].id;
    out += `Sale inserted: id=${saleId}\n`;
    
    const item = v.rows[0];
    const gstAmt = (item.sellingPrice * (item.gstPercent || 0) / 100) * 1;
    
    await client.query(`
      INSERT INTO sale_items (saleid, productid, variant_id, quantity, unitprice, gstamount, total)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [saleId, item.productId, item.variantId, 1, item.sellingPrice, gstAmt, item.sellingPrice]);
    
    out += `Sale item inserted OK\n`;
    
    await client.query('ROLLBACK'); // Don't actually commit
    out += 'Rolled back (test only)\n';
  } catch (e: any) {
    out += 'ERROR: ' + e.message + '\n';
    await client.query('ROLLBACK');
  } finally {
    client.release();
  }
  
  fs.writeFileSync('test-sale-output.txt', out);
  console.log('Done - check test-sale-output.txt');
  process.exit(0);
}

testSale().catch(e => { 
  require('fs').writeFileSync('test-sale-output.txt', 'FATAL: ' + e.message); 
  process.exit(1); 
});
