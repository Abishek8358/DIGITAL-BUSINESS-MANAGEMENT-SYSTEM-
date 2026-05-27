import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Category from '../models/Category';

// GET all categories sorted by name ASC
export const getCategories = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const categories = await Category.find({ storeId: req.user.store_id })
      .sort({ name: 1 })
      .lean();
    
    // Map _id to id to maintain frontend compatibility
    const formattedCategories = categories.map((cat: any) => ({
      id: cat._id.toString(),
      name: cat.name,
      store_id: cat.storeId.toString()
    }));
    
    res.json(formattedCategories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST create category
export const createCategory = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  const { name } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const trimmedName = name.trim();
    
    // Check if category already exists in store
    const existing = await Category.findOne({ name: trimmedName, storeId: req.user.store_id });
    if (existing) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const category = new Category({
      name: trimmedName,
      storeId: req.user.store_id
    });
    await category.save();

    res.json({ id: category._id.toString(), name: trimmedName });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE category by ID
export const deleteCategory = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  try {
    const result = await Category.findOneAndDelete({ _id: req.params.id, storeId: req.user.store_id });
    if (!result) return res.status(404).json({ message: 'Category not found' });
    
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
