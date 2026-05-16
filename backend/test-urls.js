const { Pool } = require('pg');

async function testUrl(url) {
  console.log(`Testing: ${url}`);
  const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    const client = await pool.connect();
    console.log(`SUCCESS: ${url}`);
    client.release();
  } catch (err) {
    console.log(`FAILED: ${err.message}`);
  }
  await pool.end();
}

async function main() {
  const p = "Abishek%402006";
  const ref = "ecwmehtivgylpegqcibr";
  const urls = [
    `postgresql://postgres.${ref}:${p}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${ref}:${p}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres:${p}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${p}@aws-0-ap-south-1.pooler.supabase.com:5432/postgres`,
    `postgresql://postgres.${ref}:${p}@aws-1-ap-south-1.pooler.supabase.com:5432/postgres`
  ];
  for (const u of urls) await testUrl(u);
}
main();
