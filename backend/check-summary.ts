import pool from './db/connection';

async function checkData() {
  const storeId = 2;
  const filter = 'all';
  let dateFilter = 'TRUE';

  try {
    const summary = await pool.query(`
        SELECT 
          COALESCE(SUM(s.grandtotal), 0) as total_revenue,
          COUNT(*) as total_sales,
          COALESCE(AVG(s.grandtotal), 0) as avg_order_value
        FROM sales s
        WHERE s.store_id = $1 AND ${dateFilter}
    `, [storeId]);
    
    console.log('SUMMARY_RESULT:', JSON.stringify(summary.rows[0]));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
