import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Customer from '../models/Customer';
import Sale from '../models/Sale';
import SaleItem from '../models/SaleItem';
import Product from '../models/Product';
import Category from '../models/Category';
import mongoose from 'mongoose';

// GET all unique customers in store
export const getCustomers = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const customers = await Customer.find({ storeId: req.user.store_id })
      .sort({ lastVisit: -1 })
      .lean();

    // Fetch and aggregate purchased categories for each customer
    const formatted = await Promise.all(customers.map(async (c: any) => {
      // Find all sales for this customer
      const sales = await Sale.find({ customerId: c._id }).select('_id');
      const saleIds = sales.map(s => s._id);

      // Find all items in these sales
      const saleItems = await SaleItem.find({ saleId: { $in: saleIds } })
        .populate({
          path: 'productId',
          populate: { path: 'categoryId' }
        })
        .lean();

      // Collect unique category names
      const categoriesSet = new Set<string>();
      saleItems.forEach((si: any) => {
        const prod = si.productId;
        if (prod && prod.categoryId && prod.categoryId.name) {
          categoriesSet.add(prod.categoryId.name);
        }
      });
      const categoryNames = Array.from(categoriesSet).join(', ');

      return {
        id: c._id.toString(),
        name: c.name,
        mobile: c.phone || '',
        totalPurchases: c.totalSpent,
        lastPurchaseDate: c.lastVisit,
        loyaltyPoints: c.loyaltyPoints,
        stores: categoryNames || 'None'
      };
    }));

    res.json(formatted);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// POST create customer
export const createCustomer = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  const { name, phone } = req.body;
  
  try {
    let customer;
    if (phone) {
      // Upsert by phone inside the store
      customer = await Customer.findOneAndUpdate(
        { phone, storeId: req.user.store_id },
        { name, phone, storeId: req.user.store_id },
        { upsert: true, new: true }
      );
    } else {
      customer = new Customer({
        name,
        storeId: req.user.store_id
      });
      await customer.save();
    }
    
    res.json({ id: customer._id.toString() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET lookup customer by phone
export const lookupCustomerByPhone = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const customer = await Customer.findOne({ phone: req.params.phone, storeId: req.user.store_id });
    if (!customer) {
      return res.json({ found: false, loyaltyPoints: 0 });
    }
    res.json({ 
      found: true, 
      id: customer._id.toString(), 
      name: customer.name, 
      phone: customer.phone, 
      loyaltyPoints: customer.loyaltyPoints 
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET customer purchase history
export const getCustomerHistory = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const sales = await Sale.find({ customerId: req.params.id, storeId: req.user.store_id })
      .sort({ date: -1 })
      .lean();

    const formattedHistory = await Promise.all(sales.map(async (s: any) => {
      const items = await SaleItem.find({ saleId: s._id })
        .populate({
          path: 'productId',
          populate: { path: 'categoryId' }
        })
        .lean();

      const formattedItems = items.map((si: any) => ({
        productName: si.productId ? si.productId.name : 'Unknown Product',
        categoryName: (si.productId && si.productId.categoryId) ? si.productId.categoryId.name : 'Uncategorized',
        quantity: si.quantity,
        total: si.total
      }));

      return {
        id: s._id.toString(),
        invoiceId: s.invoiceId,
        total: s.grandTotal,
        date: s.date,
        items: formattedItems
      };
    }));

    res.json(formattedHistory);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
