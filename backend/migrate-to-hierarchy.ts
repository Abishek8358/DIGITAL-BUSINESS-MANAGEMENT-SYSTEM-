import pool from './db/connection';

async function migrateToHierarchy() {
  const client = await pool.connect();
  try {
    console.log('Starting hierarchy migration...');
    await client.query('BEGIN');

    // 1. Create brands table
    await client.query(`
      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        product_id INT NOT NULL,
        store_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        UNIQUE(product_id, name),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ brands table created');

    // 2. Create variants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS variants (
        id SERIAL PRIMARY KEY,
        brand_id INT NOT NULL,
        store_id INT NOT NULL,
        variant_name VARCHAR(255) NOT NULL DEFAULT 'Standard',
        selling_price DECIMAL(12,2) DEFAULT 0,
        cost_price DECIMAL(12,2) DEFAULT 0,
        gst_percent DECIMAL(5,2) DEFAULT 0,
        stock INT DEFAULT 0,
        minimum_stock INT DEFAULT 5,
        image_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(brand_id, variant_name),
        FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
        FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ variants table created');

    // 3. Add variant_id to sale_items (nullable for backward compat)
    await client.query(`ALTER TABLE sale_items ADD COLUMN IF NOT EXISTS variant_id INT REFERENCES variants(id) ON DELETE SET NULL`);
    console.log('✓ sale_items.variant_id column added');

    // 4. Migrate existing products → brands + variants
    const allProducts = await client.query(`SELECT * FROM products ORDER BY store_id, name, id ASC`);
    console.log(`Migrating ${allProducts.rows.length} existing products...`);

    // Group by (normalized_name, store_id, categoryid) to merge same-name products
    const productGroupMap = new Map<string, number>(); // key → base product id

    for (const p of allProducts.rows) {
      const key = `${p.name.toLowerCase().trim()}__${p.store_id}__${p.categoryid}`;

      let baseProductId: number;
      if (!productGroupMap.has(key)) {
        baseProductId = p.id;
        productGroupMap.set(key, p.id);
      } else {
        baseProductId = productGroupMap.get(key)!;
      }

      // Create brand
      const brandName = (p.brand || '').trim() || 'Standard';
      const brandResult = await client.query(`
        INSERT INTO brands (product_id, store_id, name)
        VALUES ($1, $2, $3)
        ON CONFLICT (product_id, name) DO UPDATE SET name = EXCLUDED.name
        RETURNING id
      `, [baseProductId, p.store_id, brandName]);
      const brandId = brandResult.rows[0].id;

      // Create variant (use description as variant name, or 'Standard')
      const variantName = (p.description || '').trim() || 'Standard';
      await client.query(`
        INSERT INTO variants (brand_id, store_id, variant_name, selling_price, cost_price, gst_percent, stock, minimum_stock, image_url)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (brand_id, variant_name) DO UPDATE SET
          selling_price = EXCLUDED.selling_price,
          cost_price = EXCLUDED.cost_price,
          stock = variants.stock + EXCLUDED.stock
      `, [brandId, p.store_id, variantName, p.sellingprice || 0, p.costprice || 0, p.gstpercent || 0, p.stock || 0, p.minimumstock || 5, p.imageurl]);

      console.log(`  Migrated: ${p.name} → Brand: ${brandName} → Variant: ${variantName}`);
    }

    await client.query('COMMIT');
    console.log('\n✅ Migration complete!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', e);
    throw e;
  } finally {
    client.release();
    process.exit(0);
  }
}

migrateToHierarchy();
