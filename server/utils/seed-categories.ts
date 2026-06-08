import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Store from '../models/Store';
import Category from '../models/Category';

dotenv.config();

const seedCategories = async () => {
  try {
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/corebiz';
    console.log('Connecting to MongoDB...');
    await mongoose.connect(connStr);
    console.log('✅ Connected.');

    // Find the store
    const store = await Store.findOne({});
    if (!store) {
      console.error('❌ No store found. Please run the server first to seed default data.');
      process.exit(1);
    }

    const categories = [
      'Mobiles',
      'Laptops',
      'Clothing',
      'Electronics',
      'Accessories',
      'Footwear'
    ];

    let added = 0;
    let skipped = 0;

    for (const name of categories) {
      const exists = await Category.findOne({ name, storeId: store._id });
      if (exists) {
        console.log(`⏭️  "${name}" already exists. Skipping.`);
        skipped++;
        continue;
      }
      await new Category({ name, storeId: store._id }).save();
      console.log(`✅ Added category: "${name}"`);
      added++;
    }

    console.log(`\n✨ Done! Added: ${added}, Skipped: ${skipped}`);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedCategories();
