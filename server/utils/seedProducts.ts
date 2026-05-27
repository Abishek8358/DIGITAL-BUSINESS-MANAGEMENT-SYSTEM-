import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Models
import Store from '../models/Store';
import Category from '../models/Category';
import Product from '../models/Product';
import Brand from '../models/Brand';
import Variant from '../models/Variant';

dotenv.config({ override: true });

const seedProducts = async () => {
  try {
    console.log("🚀 Connecting to database for product seeding...");
    const connStr = process.env.MONGO_URI || 'mongodb://localhost:27017/corebiz';
    await mongoose.connect(connStr);
    console.log("✅ Connected. Finding default demo store...");

    // Find the default store
    const store = await Store.findOne({ storeName: 'CoreBiz Demo Store' });
    if (!store) {
      console.error("❌ Default store 'CoreBiz Demo Store' not found. Please run resetDatabase first.");
      process.exit(1);
    }
    const storeId = store._id;

    console.log("🚀 Seeding catalog categories...");
    // 1. Create Categories
    const categoriesData = [
      { name: 'Electronics', storeId },
      { name: 'Apparel', storeId },
      { name: 'Footwear', storeId },
      { name: 'Beverages', storeId }
    ];
    
    // Clear existing catalog data first
    await Promise.all([
      Category.deleteMany({ storeId }),
      Product.deleteMany({ storeId }),
      Brand.deleteMany({ storeId }),
      Variant.deleteMany({ storeId })
    ]);

    const categories = await Category.insertMany(categoriesData);
    const catElectronics = categories.find(c => c.name === 'Electronics')!._id;
    const catApparel = categories.find(c => c.name === 'Apparel')!._id;
    const catFootwear = categories.find(c => c.name === 'Footwear')!._id;
    const catBeverages = categories.find(c => c.name === 'Beverages')!._id;

    console.log("🚀 Seeding products, brands, and variants...");

    // Helper to create product, its brand, and variants
    const addCatalogItem = async (
      prodName: string,
      catId: mongoose.Types.ObjectId,
      brandName: string,
      variantsList: Array<{
        name: string;
        cost: number;
        sell: number;
        gst: number;
        stock: number;
        img: string;
      }>
    ) => {
      // Create Base Product
      const product = new Product({
        name: prodName,
        categoryId: catId,
        brand: brandName,
        costPrice: variantsList[0].cost,
        sellingPrice: variantsList[0].sell,
        gstPercent: variantsList[0].gst,
        stock: variantsList.reduce((sum, v) => sum + v.stock, 0),
        minimumStock: 5,
        reorderQuantity: 15,
        imageUrl: variantsList[0].img,
        description: `Premium quality ${prodName} by ${brandName}`,
        storeId
      });
      await product.save();

      // Create Brand
      const brand = new Brand({
        productId: product._id,
        storeId,
        name: brandName
      });
      await brand.save();

      // Create Variants
      for (const v of variantsList) {
        const variant = new Variant({
          brandId: brand._id,
          storeId,
          variantName: v.name,
          sellingPrice: v.sell,
          costPrice: v.cost,
          gstPercent: v.gst,
          stock: v.stock,
          minimumStock: 3,
          imageUrl: v.img
        });
        await variant.save();
      }
    };

    // --- Product 1: Smartphones (Electronics) ---
    await addCatalogItem(
      'iPhone 15 Pro',
      catElectronics as any,
      'Apple',
      [
        { name: '128GB Titanium', cost: 110000, sell: 129900, gst: 18, stock: 12, img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80' },
        { name: '256GB Titanium', cost: 120000, sell: 139900, gst: 18, stock: 8, img: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80' }
      ]
    );

    // --- Product 2: Headphones (Electronics) ---
    await addCatalogItem(
      'WH-1000XM5',
      catElectronics as any,
      'Sony',
      [
        { name: 'Midnight Black', cost: 22000, sell: 29990, gst: 18, stock: 15, img: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&q=80' },
        { name: 'Platinum Silver', cost: 22000, sell: 29990, gst: 18, stock: 6, img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&q=80' }
      ]
    );

    // --- Product 3: T-Shirts (Apparel) ---
    await addCatalogItem(
      'Classic Cotton Tee',
      catApparel as any,
      'Nike',
      [
        { name: 'M / Black', cost: 800, sell: 1499, gst: 5, stock: 35, img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80' },
        { name: 'L / Black', cost: 800, sell: 1499, gst: 5, stock: 40, img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400&q=80' },
        { name: 'M / White', cost: 800, sell: 1499, gst: 5, stock: 20, img: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&q=80' }
      ]
    );

    // --- Product 4: Running Shoes (Footwear) ---
    await addCatalogItem(
      'Ultraboost Light',
      catFootwear as any,
      'Adidas',
      [
        { name: 'UK 8 / Core Black', cost: 11000, sell: 17999, gst: 12, stock: 10, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' },
        { name: 'UK 9 / Core Black', cost: 11000, sell: 17999, gst: 12, stock: 14, img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80' }
      ]
    );

    // --- Product 5: Energy Drink (Beverages) ---
    await addCatalogItem(
      'Energy Soda',
      catBeverages as any,
      'Monster Energy',
      [
        { name: '350ml Can', cost: 85, sell: 110, gst: 18, stock: 120, img: 'https://images.unsplash.com/photo-1622543953490-0b70039a4ac5?w=400&q=80' }
      ]
    );

    console.log("\n✨ CATALOG PRODUCTS SEEDED SUCCESSFULLY!");
    console.log("--------------------------------------------------");
    console.log("Added 4 Categories: Electronics, Apparel, Footwear, Beverages");
    console.log("Added 5 Products, 5 Brands, and 10 Variants with stock.");
    console.log("--------------------------------------------------");

  } catch (error) {
    console.error("❌ Catalog seeding failed:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seedProducts();
