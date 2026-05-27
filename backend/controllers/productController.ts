import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product from '../models/Product';
import Category from '../models/Category';
import Brand from '../models/Brand';
import Variant from '../models/Variant';
import mongoose from 'mongoose';

// Format Product for frontend compatibility
const formatProduct = (p: any) => ({
  id: p._id.toString(),
  name: p.name,
  categoryId: p.categoryId ? p.categoryId._id.toString() : null,
  categoryName: p.categoryId ? p.categoryId.name : null,
  brand: p.brand,
  costPrice: p.costPrice,
  sellingPrice: p.sellingPrice,
  gstPercent: p.gstPercent,
  stock: p.stock,
  minimumStock: p.minimumStock,
  reorderQuantity: p.reorderQuantity,
  imageUrl: p.imageUrl,
  description: p.description
});

// GET all products
export const getProducts = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const products = await Product.find({ storeId: req.user.store_id })
      .populate('categoryId')
      .lean();
    res.json(products.map(formatProduct));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST create product
export const createProduct = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  let { name, categoryId, brand, costPrice, sellingPrice, gstPercent, stock, minimumStock, reorderQuantity, description, imageUrl } = req.body;

  try {
    const sanitizedCost = parseFloat(costPrice) || 0;
    const sanitizedSell = parseFloat(sellingPrice) || 0;
    const sanitizedGst = parseFloat(gstPercent) || 0;
    const sanitizedStock = parseInt(stock) || 0;
    const sanitizedMinStock = parseInt(minimumStock) || 5;
    const sanitizedReorder = parseInt(reorderQuantity) || 10;

    if (sanitizedCost < 0 || sanitizedSell < 0) {
      return res.status(400).json({ error: "Price must be a positive number" });
    }

    // Category Lookup if categoryId is a name (string) instead of a valid ObjectId
    let finalCategoryId = categoryId;
    if (categoryId && !mongoose.Types.ObjectId.isValid(categoryId)) {
      const catLookup = await Category.findOne({ name: categoryId, storeId: req.user.store_id });
      if (catLookup) {
        finalCategoryId = catLookup._id;
      } else {
        // Create the category automatically
        const newCat = new Category({ name: categoryId, storeId: req.user.store_id });
        await newCat.save();
        finalCategoryId = newCat._id;
      }
    }

    // Unique combination check (name + brand + storeId)
    const existing = await Product.findOne({ name, brand, storeId: req.user.store_id });
    if (existing) {
      return res.status(400).json({ error: 'A product with this name AND brand already exists. Use a different brand/variant.' });
    }

    const product = new Product({
      name,
      categoryId: finalCategoryId || undefined,
      brand,
      costPrice: sanitizedCost,
      sellingPrice: sanitizedSell,
      gstPercent: sanitizedGst,
      stock: sanitizedStock,
      minimumStock: sanitizedMinStock,
      reorderQuantity: sanitizedReorder,
      description,
      imageUrl,
      storeId: req.user.store_id
    });
    await product.save();

    res.json({ id: product._id.toString() });
  } catch (err: any) {
    console.error('Product Creation Error:', err);
    res.status(500).json({ error: err.message || 'Failed to create product' });
  }
};

// PUT update product
export const updateProduct = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  const { name, categoryId, brand, costPrice, sellingPrice, gstPercent, stock, minimumStock, reorderQuantity, description, imageUrl } = req.body;
  try {
    // Lookup product
    const product = await Product.findOne({ _id: req.params.id, storeId: req.user.store_id });
    if (!product) return res.status(404).json({ message: 'Product not found or access denied' });

    product.name = name ?? product.name;
    product.categoryId = categoryId ?? product.categoryId;
    product.brand = brand ?? product.brand;
    product.costPrice = parseFloat(costPrice) ?? product.costPrice;
    product.sellingPrice = parseFloat(sellingPrice) ?? product.sellingPrice;
    product.gstPercent = parseFloat(gstPercent) ?? product.gstPercent;
    product.stock = parseInt(stock) ?? product.stock;
    product.minimumStock = parseInt(minimumStock) ?? product.minimumStock;
    product.reorderQuantity = parseInt(reorderQuantity) ?? product.reorderQuantity;
    product.description = description ?? product.description;
    product.imageUrl = imageUrl ?? product.imageUrl;

    await product.save();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE product
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  try {
    const result = await Product.findOneAndDelete({ _id: req.params.id, storeId: req.user.store_id });
    if (!result) return res.status(404).json({ message: 'Product not found or access denied' });
    
    // Cascade delete associated brands and variants
    const brands = await Brand.find({ productId: req.params.id });
    const brandIds = brands.map(b => b._id);
    await Variant.deleteMany({ brandId: { $in: brandIds } });
    await Brand.deleteMany({ productId: req.params.id });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── HIERARCHY: Brands ───────────────────────────────────────────────────────

// GET all brands for a product
export const getProductBrands = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const brands = await Brand.find({ productId: req.params.productId, storeId: req.user.store_id })
      .sort({ name: 1 })
      .lean();

    res.json(brands.map((b: any) => ({
      id: b._id.toString(),
      productId: b.productId.toString(),
      name: b.name
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST create brand under a product
export const createBrand = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  const { productId, name } = req.body;
  if (!productId || !name) {
    return res.status(400).json({ error: 'productId and name required' });
  }

  try {
    const trimmedName = name.trim();
    const existing = await Brand.findOne({ productId, name: trimmedName, storeId: req.user.store_id });
    if (existing) {
      return res.status(409).json({ error: 'Brand already exists for this product' });
    }

    const brand = new Brand({
      productId,
      storeId: req.user.store_id,
      name: trimmedName
    });
    await brand.save();

    res.json({ id: brand._id.toString(), productId, name: trimmedName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE brand (cascades variants)
export const deleteBrand = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  try {
    const result = await Brand.findOneAndDelete({ _id: req.params.id, storeId: req.user.store_id });
    if (!result) return res.status(404).json({ message: 'Brand not found' });
    
    // Cascade delete variants
    await Variant.deleteMany({ brandId: req.params.id });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── HIERARCHY: Variants ─────────────────────────────────────────────────────

// GET variants for a brand
export const getBrandVariants = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const variants = await Variant.find({ brandId: req.params.brandId, storeId: req.user.store_id })
      .sort({ variantName: 1 })
      .lean();

    res.json(variants.map((v: any) => ({
      id: v._id.toString(),
      brandId: v.brandId.toString(),
      variantName: v.variantName,
      sellingPrice: v.sellingPrice,
      costPrice: v.costPrice,
      gstPercent: v.gstPercent,
      stock: v.stock,
      minimumStock: v.minimumStock,
      imageUrl: v.imageUrl
    })));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST create variant under a brand
export const createVariant = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  const { brandId, variantName, sellingPrice, costPrice, gstPercent, stock, minimumStock, imageUrl } = req.body;
  if (!brandId || !variantName) {
    return res.status(400).json({ error: 'brandId and variantName required' });
  }

  try {
    const trimmedName = variantName.trim();
    const existing = await Variant.findOne({ brandId, variantName: trimmedName });
    if (existing) {
      return res.status(409).json({ error: 'Variant name already exists for this brand' });
    }

    const variant = new Variant({
      brandId,
      storeId: req.user.store_id,
      variantName: trimmedName,
      sellingPrice: parseFloat(sellingPrice) || 0,
      costPrice: parseFloat(costPrice) || 0,
      gstPercent: parseFloat(gstPercent) || 0,
      stock: parseInt(stock) || 0,
      minimumStock: parseInt(minimumStock) || 5,
      imageUrl: imageUrl || null
    });
    await variant.save();

    res.json({ id: variant._id.toString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PUT update variant
export const updateVariant = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  const { variantName, sellingPrice, costPrice, gstPercent, stock, minimumStock, imageUrl } = req.body;
  try {
    const variant = await Variant.findOne({ _id: req.params.id, storeId: req.user.store_id });
    if (!variant) return res.status(404).json({ message: 'Variant not found' });

    variant.variantName = variantName ?? variant.variantName;
    variant.sellingPrice = sellingPrice !== undefined ? parseFloat(sellingPrice) : variant.sellingPrice;
    variant.costPrice = costPrice !== undefined ? parseFloat(costPrice) : variant.costPrice;
    variant.gstPercent = gstPercent !== undefined ? parseFloat(gstPercent) : variant.gstPercent;
    variant.stock = stock !== undefined ? parseInt(stock) : variant.stock;
    variant.minimumStock = minimumStock !== undefined ? parseInt(minimumStock) : variant.minimumStock;
    variant.imageUrl = imageUrl ?? variant.imageUrl;

    await variant.save();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE variant
export const deleteVariant = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  try {
    const result = await Variant.findOneAndDelete({ _id: req.params.id, storeId: req.user.store_id });
    if (!result) return res.status(404).json({ message: 'Variant not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── FLAT VARIANTS — for Billing POS ────────────────────────────────────────
export const getFlatVariants = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    // In Mongoose, we need to join products, brands, and categories.
    // We can do this with aggregate or find + populate. Let's do aggregate as it is extremely fast and structured.
    const result = await Variant.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(req.user.store_id) } },
      {
        $lookup: {
          from: 'brands',
          localField: 'brandId',
          foreignField: '_id',
          as: 'brand'
        }
      },
      { $unwind: '$brand' },
      {
        $lookup: {
          from: 'products',
          localField: 'brand.productId',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $lookup: {
          from: 'categories',
          localField: 'product.categoryId',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          variantId: '$_id',
          variantName: 1,
          sellingPrice: 1,
          costPrice: 1,
          gstPercent: 1,
          stock: 1,
          minimumStock: 1,
          imageUrl: { $ifNull: ['$imageUrl', '$product.imageUrl'] },
          brandId: '$brand._id',
          brandName: '$brand.name',
          productId: '$product._id',
          productName: '$product.name',
          categoryId: '$category._id',
          categoryName: '$category.name'
        }
      },
      {
        $sort: {
          categoryName: 1,
          productName: 1,
          brandName: 1,
          variantName: 1
        }
      }
    ]);

    // Map ObjectIds to string for frontend
    const formatted = result.map((item: any) => ({
      ...item,
      variantId: item.variantId.toString(),
      brandId: item.brandId.toString(),
      productId: item.productId.toString(),
      categoryId: item.categoryId ? item.categoryId.toString() : null
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET full hierarchy for product management ────────────────────────────────
export const getProductsHierarchy = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    // 1. Fetch products
    const products = await Product.find({ storeId: req.user.store_id })
      .populate('categoryId')
      .sort({ name: 1 })
      .lean();

    // 2. Fetch brands
    const brands = await Brand.find({ storeId: req.user.store_id })
      .sort({ name: 1 })
      .lean();

    // 3. Fetch variants
    const variants = await Variant.find({ storeId: req.user.store_id })
      .sort({ variantName: 1 })
      .lean();

    // Assemble hierarchy locally
    const brandsByProduct = new Map<string, any[]>();
    const variantsByBrand = new Map<string, any[]>();

    for (const v of variants) {
      const bId = v.brandId.toString();
      if (!variantsByBrand.has(bId)) variantsByBrand.set(bId, []);
      
      variantsByBrand.get(bId)!.push({
        id: v._id.toString(),
        brandId: bId,
        variantName: v.variantName,
        sellingPrice: v.sellingPrice,
        costPrice: v.costPrice,
        gstPercent: v.gstPercent,
        stock: v.stock,
        minimumStock: v.minimumStock,
        imageUrl: v.imageUrl
      });
    }

    for (const b of brands) {
      const pId = b.productId.toString();
      if (!brandsByProduct.has(pId)) brandsByProduct.set(pId, []);
      
      brandsByProduct.get(pId)!.push({
        id: b._id.toString(),
        productId: pId,
        name: b.name,
        variants: variantsByBrand.get(b._id.toString()) || []
      });
    }

    const hierarchy = products.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      categoryId: p.categoryId ? p.categoryId._id.toString() : null,
      categoryName: p.categoryId ? p.categoryId.name : null,
      imageUrl: p.imageUrl,
      description: p.description,
      brands: brandsByProduct.get(p._id.toString()) || []
    }));

    res.json(hierarchy);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
