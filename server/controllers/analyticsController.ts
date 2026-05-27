import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import Product from '../models/Product';
import Variant from '../models/Variant';
import Brand from '../models/Brand';
import Customer from '../models/Customer';
import Sale from '../models/Sale';
import SaleItem from '../models/SaleItem';
import Category from '../models/Category';
import StoreSettings from '../models/StoreSettings';
import mongoose from 'mongoose';

// Helper to get 12-month revenue trend for the current year
const getYearlyRevenueTrend = async (storeId: string) => {
  const currentYear = new Date().getFullYear();
  const startOfYear = new Date(currentYear, 0, 1);
  const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59);

  const sales = await Sale.find({
    storeId,
    date: { $gte: startOfYear, $lte: endOfYear }
  }).select('grandTotal date');

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const trend = monthNames.map(name => ({ month: name, revenue: 0 }));

  sales.forEach(sale => {
    const monthIndex = new Date(sale.date).getMonth();
    trend[monthIndex].revenue += sale.grandTotal;
  });

  return trend;
};

// GET Dashboard Stats
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  const storeId = req.user.store_id;

  try {
    const [productsCount, salesCount, customersCount, settings] = await Promise.all([
      Product.countDocuments({ storeId }),
      Sale.countDocuments({ storeId }),
      Customer.countDocuments({ storeId }),
      StoreSettings.findOne({ storeId })
    ]);

    const threshold = settings ? settings.lowStockThreshold : 5;

    // Fetch low stock items (variants + base products)
    const [lowStockProducts, lowStockVariants] = await Promise.all([
      Product.find({ storeId, stock: { $lt: threshold } }).limit(10).lean(),
      Variant.find({ storeId, stock: { $lt: threshold } }).populate({
        path: 'brandId',
        select: 'name'
      }).limit(10).lean()
    ]);

    const lowStock = [
      ...lowStockProducts.map((p: any) => ({
        id: p._id.toString(),
        name: p.name,
        brand: p.brand || '',
        stock: p.stock,
        threshold,
        type: 'product'
      })),
      ...lowStockVariants.map((v: any) => ({
        id: v._id.toString(),
        name: v.variantName,
        brand: v.brandId ? v.brandId.name : '',
        stock: v.stock,
        threshold,
        type: 'variant'
      }))
    ].slice(0, 10);

    // Fetch recent sales (limit 5)
    const recentSalesRaw = await Sale.find({ storeId })
      .populate('customerId')
      .sort({ date: -1 })
      .limit(5)
      .lean();

    const recentSales = recentSalesRaw.map((s: any) => ({
      id: s._id.toString(),
      invoiceId: s.invoiceId,
      customerId: s.customerId ? s.customerId._id.toString() : null,
      customerName: s.customerId ? s.customerId.name : 'Walking Customer',
      subtotal: s.subtotal,
      gstTotal: s.gstTotal,
      grandTotal: s.grandTotal,
      date: s.date,
      createdBy: s.createdBy.toString()
    }));

    // Calculate total profit & monthly revenue
    const yearlyTrend = await getYearlyRevenueTrend(storeId);
    const currentMonthIndex = new Date().getMonth();
    const monthlyRevenue = yearlyTrend[currentMonthIndex].revenue;

    // Calculate Profit: Sum of (quantity * (unitprice - costprice)) from sale items
    const sales = await Sale.find({ storeId }).select('_id');
    const saleIds = sales.map(s => s._id);

    const saleItems = await SaleItem.find({ saleId: { $in: saleIds } })
      .populate('productId')
      .populate('variantId')
      .lean();

    let totalProfit = 0;
    saleItems.forEach((si: any) => {
      const sellPrice = si.unitPrice;
      const costPrice = si.variantId ? si.variantId.costPrice : (si.productId ? si.productId.costPrice : 0);
      totalProfit += si.quantity * (sellPrice - costPrice);
    });

    res.json({
      totalProducts: productsCount,
      totalSales: salesCount,
      totalCustomers: customersCount,
      monthlyRevenue,
      lowStock,
      recentSales,
      revenueHistory: yearlyTrend,
      totalProfit
    });
  } catch (err: any) {
    console.error('Dashboard Stats Error:', err);
    res.status(500).json({ error: err.message });
  }
};

// GET Employee Dashboard Stats
export const getEmployeeDashboardStats = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  const storeId = req.user.store_id;
  const userId = req.user.id;

  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const [salesCount, todaySales, recentSalesRaw] = await Promise.all([
      Sale.countDocuments({ createdBy: userId, storeId, date: { $gte: startOfToday, $lte: endOfToday } }),
      Sale.find({ createdBy: userId, storeId, date: { $gte: startOfToday, $lte: endOfToday } }).select('grandTotal'),
      Sale.find({ createdBy: userId, storeId })
        .populate('customerId')
        .sort({ date: -1 })
        .limit(5)
        .lean()
    ]);

    const todayRevenue = todaySales.reduce((sum, s) => sum + s.grandTotal, 0);
    const recentSales = recentSalesRaw.map((s: any) => ({
      id: s._id.toString(),
      invoiceId: s.invoiceId,
      grandTotal: s.grandTotal,
      date: s.date,
      customerName: s.customerId ? s.customerId.name : 'Walking Customer'
    }));

    res.json({
      todaySalesCount: salesCount,
      todayRevenue,
      recentSales
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET Low Stock Alerts
export const getLowStockAlerts = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  const storeId = req.user.store_id;

  try {
    const settings = await StoreSettings.findOne({ storeId });
    const threshold = settings ? settings.lowStockThreshold : 5;

    const [variantsRaw, productsRaw] = await Promise.all([
      Variant.find({ storeId, stock: { $lte: threshold } })
        .populate({
          path: 'brandId',
          populate: { path: 'productId' }
        })
        .lean(),
      Product.find({ storeId, stock: { $lte: threshold } }).lean()
    ]);

    const variants = variantsRaw.map((v: any) => ({
      id: v._id.toString(),
      name: v.variantName,
      stock: v.stock,
      minStock: v.minimumStock,
      productName: (v.brandId && v.brandId.productId) ? v.brandId.productId.name : 'Unknown Product',
      brandName: v.brandId ? v.brandId.name : 'Unknown Brand'
    }));

    const products = productsRaw.map((p: any) => ({
      id: p._id.toString(),
      name: p.name,
      stock: p.stock,
      minStock: p.minimumStock,
      brand: p.brand || ''
    }));

    res.json({ variants, products });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// PUT add stock to variant
export const addStockToVariant = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  if (!['admin', 'owner'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Admin only' });
  }

  const { quantity } = req.body;
  const qty = parseInt(quantity);
  if (!qty || qty <= 0) {
    return res.status(400).json({ error: 'Quantity must be a positive number' });
  }

  try {
    const variant = await Variant.findOneAndUpdate(
      { _id: req.params.id, storeId: req.user.store_id },
      { $inc: { stock: qty } },
      { new: true }
    );
    
    if (!variant) return res.status(404).json({ error: 'Variant not found' });
    
    res.json({ success: true, newStock: variant.stock });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET reports summary
export const getReportsSummary = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  const storeId = req.user.store_id;

  try {
    const sales = await Sale.find({ storeId }).lean();
    
    const total_revenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const total_orders = sales.length;
    const average_order_value = total_orders > 0 ? (total_revenue / total_orders) : 0;
    const gst_collected = sales.reduce((sum, s) => sum + s.gstTotal, 0);

    // Calculate profit
    const saleIds = sales.map(s => s._id);
    const saleItems = await SaleItem.find({ saleId: { $in: saleIds } })
      .populate('productId')
      .populate('variantId')
      .lean();

    let total_profit = 0;
    saleItems.forEach((si: any) => {
      const sellPrice = si.unitPrice;
      const costPrice = si.variantId ? si.variantId.costPrice : (si.productId ? si.productId.costPrice : 0);
      total_profit += si.quantity * (sellPrice - costPrice);
    });

    res.json({
      total_revenue,
      total_orders,
      average_order_value,
      gst_collected,
      total_profit
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET reports yearly revenue
export const getReportsYearlyRevenue = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  try {
    const trend = await getYearlyRevenueTrend(req.user.store_id);
    res.json(trend);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET category distribution for reports
export const getCategoryDistribution = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  const storeId = req.user.store_id;

  try {
    const sales = await Sale.find({ storeId }).select('_id');
    const saleIds = sales.map(s => s._id);

    const saleItems = await SaleItem.find({ saleId: { $in: saleIds } })
      .populate({
        path: 'productId',
        populate: { path: 'categoryId' }
      })
      .lean();

    const distributionMap = new Map<string, number>();
    saleItems.forEach((si: any) => {
      const prod = si.productId;
      if (prod && prod.categoryId) {
        const catName = prod.categoryId.name || 'Uncategorized';
        const currentRev = distributionMap.get(catName) || 0;
        distributionMap.set(catName, currentRev + si.total);
      }
    });

    const distribution = Array.from(distributionMap.entries()).map(([name, revenue]) => ({
      name,
      revenue
    })).sort((a, b) => b.revenue - a.revenue);

    res.json(distribution);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET top selling products
export const getTopProducts = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  const storeId = req.user.store_id;

  try {
    const sales = await Sale.find({ storeId }).select('_id');
    const saleIds = sales.map(s => s._id);

    const saleItems = await SaleItem.find({ saleId: { $in: saleIds } })
      .populate('productId')
      .lean();

    const productSalesMap = new Map<string, number>();
    saleItems.forEach((si: any) => {
      if (si.productId) {
        const pName = si.productId.name;
        const currentQty = productSalesMap.get(pName) || 0;
        productSalesMap.set(pName, currentQty + si.quantity);
      }
    });

    const topProducts = Array.from(productSalesMap.entries()).map(([name, total_sold]) => ({
      name,
      total_sold
    })).sort((a, b) => b.total_sold - a.total_sold).slice(0, 5);

    res.json(topProducts);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

// GET detailed analytics dashboard with time filters
export const getDetailedAnalytics = async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.sendStatus(401);
  const storeId = req.user.store_id;
  const { filter = 'all' } = req.query;

  let startOfPeriod = new Date(2000, 0, 1);
  const now = new Date();

  if (filter === 'today') {
    startOfPeriod = new Date();
    startOfPeriod.setHours(0, 0, 0, 0);
  } else if (filter === 'week') {
    startOfPeriod = new Date();
    startOfPeriod.setDate(now.getDate() - 7);
  } else if (filter === 'month') {
    startOfPeriod = new Date();
    startOfPeriod.setDate(now.getDate() - 30);
  }

  try {
    // 1. Basic Summary
    const sales = await Sale.find({
      storeId,
      date: { $gte: startOfPeriod }
    }).populate('customerId').lean();

    const total_revenue = sales.reduce((sum, s) => sum + s.grandTotal, 0);
    const total_sales = sales.length;
    const avg_order_value = total_sales > 0 ? (total_revenue / total_sales) : 0;

    const summary = { total_revenue, total_sales, avg_order_value };

    // 2. Profit Analysis
    const saleIds = sales.map(s => s._id);
    const saleItems = await SaleItem.find({ saleId: { $in: saleIds } })
      .populate('productId')
      .populate('variantId')
      .lean();

    let total_profit = 0;
    const topProductsMap = new Map<string, number>();
    const leastProductsMap = new Map<string, number>();
    const profitableProductsMap = new Map<string, number>();

    saleItems.forEach((si: any) => {
      const sellPrice = si.unitPrice;
      const costPrice = si.variantId ? si.variantId.costPrice : (si.productId ? si.productId.costPrice : 0);
      const profit = si.quantity * (sellPrice - costPrice);
      total_profit += profit;

      if (si.productId) {
        const pName = si.productId.name;
        
        topProductsMap.set(pName, (topProductsMap.get(pName) || 0) + si.quantity);
        leastProductsMap.set(pName, (leastProductsMap.get(pName) || 0) + si.quantity);
        profitableProductsMap.set(pName, (profitableProductsMap.get(pName) || 0) + profit);
      }
    });

    // 3. Stock Summary
    const [productsCount, settings] = await Promise.all([
      Product.countDocuments({ storeId }),
      StoreSettings.findOne({ storeId })
    ]);
    const threshold = settings ? settings.lowStockThreshold : 5;

    const lowStockProductsCount = await Product.countDocuments({ storeId, stock: { $lt: threshold } });
    const lowStockVariantsCount = await Variant.countDocuments({ storeId, stock: { $lt: threshold } });
    const outOfStockProductsCount = await Product.countDocuments({ storeId, stock: { $lte: 0 } });
    const outOfStockVariantsCount = await Variant.countDocuments({ storeId, stock: { $lte: 0 } });

    const totalProductsStock = await Product.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      { $group: { _id: null, total: { $sum: '$stock' } } }
    ]);
    const totalVariantsStock = await Variant.aggregate([
      { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
      { $group: { _id: null, total: { $sum: '$stock' } } }
    ]);

    const stock = {
      total_products: productsCount,
      low_stock_count: lowStockProductsCount + lowStockVariantsCount,
      out_of_stock_count: outOfStockProductsCount + outOfStockVariantsCount,
      total_stock: (totalProductsStock[0]?.total || 0) + (totalVariantsStock[0]?.total || 0)
    };

    // 4. Sort top selling, least selling, and profitable
    const topSelling = Array.from(topProductsMap.entries()).map(([name, total_sold]) => ({
      name,
      total_sold
    })).sort((a, b) => b.total_sold - a.total_sold).slice(0, 5);

    const leastSelling = Array.from(leastProductsMap.entries()).map(([name, total_sold]) => ({
      name,
      total_sold
    })).sort((a, b) => a.total_sold - b.total_sold).slice(0, 5);

    const mostProfitable = Array.from(profitableProductsMap.entries()).map(([name, total_profit]) => ({
      name,
      total_profit
    })).sort((a, b) => b.total_profit - a.total_profit).slice(0, 5);

    // 5. Customer Insights
    const totalCustomers = await Customer.countDocuments({ storeId });
    const customerPurchasesMap = new Map<string, number>();
    sales.forEach((s: any) => {
      const cName = s.customerId ? s.customerId.name : 'Walking Customer';
      customerPurchasesMap.set(cName, (customerPurchasesMap.get(cName) || 0) + 1);
    });

    const frequentCustomers = Array.from(customerPurchasesMap.entries()).map(([name, purchase_count]) => ({
      name,
      purchase_count
    })).sort((a, b) => b.purchase_count - a.purchase_count).slice(0, 5);

    // 6. Daily trend (Last 7 Days)
    const dailyTrend = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);

      const dEnd = new Date(d);
      dEnd.setHours(23, 59, 59, 999);

      const daySales = await Sale.find({
        storeId,
        date: { $gte: d, $lte: dEnd }
      }).select('grandTotal');

      const dayRevenue = daySales.reduce((sum, s) => sum + s.grandTotal, 0);
      dailyTrend.push({
        day: dayNames[d.getDay()],
        revenue: dayRevenue
      });
    }

    res.json({
      summary,
      profit: total_profit,
      stock,
      topSelling,
      leastSelling,
      mostProfitable,
      customers: {
        total: totalCustomers,
        frequent: frequentCustomers
      },
      dailyTrend
    });
  } catch (err: any) {
    console.error('Detailed Analytics Error:', err);
    res.status(500).json({ error: err.message });
  }
};
