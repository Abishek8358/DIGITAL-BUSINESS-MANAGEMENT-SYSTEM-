import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Sale from '../models/Sale';
import SaleItem from '../models/SaleItem';
import Customer from '../models/Customer';
import Product from '../models/Product';
import Variant from '../models/Variant';
import fs from 'fs';

// Create a new sales checkout
export const createSale = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);

  const { customerId: providedId, customerName, customerPhone, items, subtotal, gstTotal, grandTotal } = req.body;
  const invoiceId = 'INV-' + Date.now();
  const date = new Date();

  try {
    let finalCustomerId = providedId;

    if (customerPhone) {
      // Upsert customer by phone number within the store
      let customer = await Customer.findOne({ phone: customerPhone, storeId: req.user.store_id as any });
      
      if (customer) {
        finalCustomerId = customer._id;
        customer.totalSpent += parseFloat(grandTotal) || 0;
        customer.lastVisit = date;
        customer.name = customerName || customer.name || 'Walking Customer';
        await customer.save();
      } else {
        const newCust = new Customer({
          name: customerName || 'Walking Customer',
          phone: customerPhone,
          totalSpent: parseFloat(grandTotal) || 0,
          lastVisit: date,
          storeId: req.user.store_id
        });
        await newCust.save();
        finalCustomerId = newCust._id;
      }
    } else if (!providedId) {
      // If no phone and no ID, use the generic "Walking Customer" for this store
      let walking = await Customer.findOne({ name: 'Walking Customer', phone: { $exists: false }, storeId: req.user.store_id as any });
      if (walking) {
        finalCustomerId = walking._id;
        walking.totalSpent += parseFloat(grandTotal) || 0;
        walking.lastVisit = date;
        await walking.save();
      } else {
        const newWalking = new Customer({
          name: 'Walking Customer',
          totalSpent: parseFloat(grandTotal) || 0,
          lastVisit: date,
          storeId: req.user.store_id
        });
        await newWalking.save();
        finalCustomerId = newWalking._id;
      }
    }

    // Initialize loyalty points variables
    let pointsEarned = 0;
    let pointsRedeemed = 0;
    let newPointsBalance = 0;

    if (finalCustomerId) {
      // Award points: ₹100 = 1 point
      pointsEarned = Math.floor(Number(grandTotal) / 100);

      // Redeem points
      const reqPointsToRedeem = parseInt(req.body.pointsToRedeem) || 0;
      if (reqPointsToRedeem > 0) {
        const customer = await Customer.findById(finalCustomerId);
        if (customer) {
          const currentPoints = customer.loyaltyPoints || 0;
          // Points cannot exceed balance or grand total
          pointsRedeemed = Math.min(reqPointsToRedeem, currentPoints, Math.floor(Number(grandTotal)));
        }
      }

      // Update customer loyalty points balance
      const pointsDelta = pointsEarned - pointsRedeemed;
      const customer = await Customer.findById(finalCustomerId);
      if (customer) {
        customer.loyaltyPoints = Math.max((customer.loyaltyPoints || 0) + pointsDelta, 0);
        await customer.save();
        newPointsBalance = customer.loyaltyPoints;
      }
    }

    // Save Sale record
    const sale = new Sale({
      invoiceId,
      customerId: finalCustomerId,
      subtotal: parseFloat(subtotal) || 0,
      gstTotal: parseFloat(gstTotal) || 0,
      grandTotal: parseFloat(grandTotal) || 0,
      date,
      createdBy: req.user.id,
      storeId: req.user.store_id as any,
      pointsEarned,
      pointsRedeemed
    });
    await sale.save();

    // Process each sale item and deduct inventory stock
    for (const item of items) {
      const variantId = item.variantId || null;
      const productId = item.productId || item.id || null;
      const unitPrice = parseFloat(item.sellingPrice) || 0;
      const gstPercent = parseFloat(item.gstPercent) || 0;
      const quantity = parseInt(item.quantity) || 0;
      const total = parseFloat(item.total) || 0;

      // GST-INCLUSIVE extraction formula
      const gstAmt = ((unitPrice * gstPercent) / (100 + gstPercent)) * quantity;

      const saleItem = new SaleItem({
        saleId: sale._id,
        productId: productId as any,
        variantId: variantId ? (variantId as any) : undefined,
        quantity,
        unitPrice,
        gstAmount: gstAmt,
        total
      });
      await saleItem.save();

      // Inventory Stock Deduction
      if (variantId) {
        await Variant.findOneAndUpdate(
          { _id: variantId, storeId: req.user.store_id as any },
          { $inc: { stock: -quantity } }
        );
      } else if (productId) {
        await Product.findOneAndUpdate(
          { _id: productId, storeId: req.user.store_id as any },
          { $inc: { stock: -quantity } }
        );
      }
    }

    res.json({ id: sale._id.toString(), invoiceId, pointsEarned, pointsRedeemed, newPointsBalance });
  } catch (err: any) {
    console.error('[Sales Error]', err.stack || err.message);
    fs.appendFileSync('backend_error.log', new Date().toISOString() + ' ' + (err.stack || err.message) + '\n');
    res.status(500).json({ error: err.message });
  }
};

// GET a single sale details
export const getSaleDetails = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const sale = await Sale.findOne({ _id: req.params.id, storeId: req.user.store_id as any })
      .populate('customerId')
      .lean();

    if (!sale) return res.sendStatus(404);

    const items = await SaleItem.find({ saleId: req.params.id as any })
      .populate('productId')
      .lean();

    const formattedItems = items.map((si: any) => ({
      id: si._id.toString(),
      saleId: si.saleId.toString(),
      productId: si.productId ? si.productId._id.toString() : null,
      productName: si.productId ? si.productId.name : 'Unknown Product',
      quantity: si.quantity,
      unitPrice: si.unitPrice,
      gstAmount: si.gstAmount,
      total: si.total
    }));

    const formattedSale = {
      id: sale._id.toString(),
      invoiceId: sale.invoiceId,
      customerId: sale.customerId ? (sale.customerId as any)._id.toString() : null,
      customerName: sale.customerId ? (sale.customerId as any).name : 'Walking Customer',
      customerMobile: (sale.customerId && (sale.customerId as any).phone) ? (sale.customerId as any).phone : '',
      subtotal: sale.subtotal,
      gstTotal: sale.gstTotal,
      grandTotal: sale.grandTotal,
      date: sale.date,
      createdBy: sale.createdBy.toString(),
      items: formattedItems
    };

    res.json(formattedSale);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
