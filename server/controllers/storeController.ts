import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Store from '../models/Store';
import Category from '../models/Category';

// Helper to format Store for frontend compatibility
const formatStore = (store: any) => {
  if (!store) return {};
  return {
    storeName: store.storeName,
    ownerName: store.ownerName,
    phone: store.phone,
    email: store.email,
    address: store.address,
    gstNumber: store.gstNumber,
    logoUrl: store.logoUrl,
    isSetupComplete: store.isSetupComplete,
    createdAt: store.createdAt
  };
};

export const getStoreProfile = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const store = await Store.findById(req.user.store_id);
    res.json(formatStore(store));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const setupStore = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);
  
  const { address, gstNumber, categories, storeName, ownerName, phone } = req.body;
  try {
    const store = await Store.findById(req.user.store_id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    store.storeName = storeName || store.storeName;
    store.ownerName = ownerName || store.ownerName;
    store.phone = phone || store.phone;
    store.address = address;
    store.gstNumber = gstNumber;
    store.isSetupComplete = 1;
    await store.save();

    if (categories && Array.isArray(categories)) {
      for (const cat of categories) {
        if (cat && cat.trim()) {
          // ON CONFLICT DO NOTHING equivalent
          await Category.findOneAndUpdate(
            { name: cat.trim(), storeId: req.user.store_id as any } as any,
            { name: cat.trim(), storeId: req.user.store_id as any } as any,
            { upsert: true, new: true }
          );
        }
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error('Setup Error:', err);
    res.status(500).json({ error: err.message || 'Setup failed' });
  }
};

export const updateStore = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) return res.sendStatus(403);

  const { storeName, ownerName, phone, email, address, gstNumber, logoUrl: providedLogoUrl } = req.body;
  
  let finalLogoUrl = providedLogoUrl;
  if (req.file) {
    // Construct local URL for the uploaded logo file
    finalLogoUrl = `${req.protocol}://${req.get('host')}/uploads/logos/${req.file.filename}`;
  }

  try {
    const store = await Store.findById(req.user.store_id);
    if (!store) return res.status(404).json({ error: 'Store not found' });

    store.storeName = storeName ?? store.storeName;
    store.ownerName = ownerName ?? store.ownerName;
    store.phone = phone ?? store.phone;
    store.email = email ?? store.email;
    store.address = address ?? store.address;
    store.gstNumber = gstNumber ?? store.gstNumber;
    store.logoUrl = finalLogoUrl ?? store.logoUrl;
    await store.save();

    res.json({ success: true, logoUrl: finalLogoUrl });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
