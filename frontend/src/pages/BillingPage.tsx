import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Minus, ShoppingCart, X, Package, ChevronRight, Tags, Layers, CheckCircle, Loader2, Receipt, Download, Zap, Globe, Activity, CheckCircle2, Info, Star, Gift } from 'lucide-react';
import api from '../services/api';
import { jsPDF } from 'jspdf';

const DEFAULT_PRODUCT_IMAGE = 'https://images.unsplash.com/photo-1581091215367-9b6c00b3035a?w=400&q=80';

export default function BillingPage() {
  const [variants, setVariants] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [receipt, setReceipt] = useState<any>(null);
  const [stockToast, setStockToast] = useState<string | null>(null);

  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'all'>('all');
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);

  const [customer, setCustomer] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [storeInfo, setStoreInfo] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);

  // Loyalty Points state
  const [customerPoints, setCustomerPoints] = useState(0);
  const [pointsToRedeem, setPointsToRedeem] = useState(0);
  const [pointsLookupDone, setPointsLookupDone] = useState(false);
  const [lookingUpPoints, setLookingUpPoints] = useState(false);

  const showStockToast = (msg: string) => {
    setStockToast(msg);
    setTimeout(() => setStockToast(null), 2000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, cRes, sRes, setRes] = await Promise.all([
        api.get('/api/variants/flat'),
        api.get('/api/categories'),
        api.get('/api/store'),
        api.get('/api/settings/all')
      ]);
      const normalized = (vRes.data as any[]).map(v => ({
        ...v,
        sellingPrice: parseFloat(v.sellingPrice) || 0,
        costPrice: parseFloat(v.costPrice) || 0,
        gstPercent: parseFloat(v.gstPercent) || 0,
        stock: parseInt(v.stock) || 0,
        minimumStock: parseInt(v.minimumStock) || 0,
      }));
      setVariants(normalized);
      setCategories(cRes.data);
      setStoreInfo(sRes.data);
      setSettings(setRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const products = useMemo(() => {
    const list: any[] = [];
    const seen = new Set();
    variants.forEach(v => {
      if ((selectedCategoryId === 'all' || v.categoryId === selectedCategoryId) && !seen.has(v.productId)) {
        list.push({ id: v.productId, name: v.productName, categoryId: v.categoryId, imageUrl: v.imageUrl || '' });
        seen.add(v.productId);
      }
    });
    return list;
  }, [variants, selectedCategoryId]);

  const brands = useMemo(() => {
    if (!selectedProductId) return [];
    const list: any[] = [];
    const seen = new Set();
    variants.forEach(v => {
      if (v.productId === selectedProductId && !seen.has(v.brandId)) {
        list.push({ id: v.brandId, name: v.brandName });
        seen.add(v.brandId);
      }
    });
    return list;
  }, [variants, selectedProductId]);

  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      const matchesSearch = v.productName.toLowerCase().includes(search.toLowerCase()) ||
        v.brandName.toLowerCase().includes(search.toLowerCase()) ||
        v.variantName.toLowerCase().includes(search.toLowerCase());

      if (search) return matchesSearch;

      const matchesCat = selectedCategoryId === 'all' || v.categoryId === selectedCategoryId;
      const matchesProd = !selectedProductId || v.productId === selectedProductId;
      const matchesBrand = !selectedBrandId || v.brandId === selectedBrandId;

      return matchesCat && matchesProd && matchesBrand;
    });
  }, [variants, selectedCategoryId, selectedProductId, selectedBrandId, search]);

  const showProductGrid = search || selectedBrandId || selectedProductId;

  // GST-INCLUSIVE: sellingPrice already contains GST.
  // Extract GST using reverse formula: GST = (price × rate) / (100 + rate)
  const extractGst = (price: number, gstPercent: number) =>
    (price * gstPercent) / (100 + gstPercent);

  const addToCart = (variant: any) => {
    if (variant.stock <= 0) {
      showStockToast('Out of stock');
      return;
    }
    const existing = cart.find(item => item.variantId === variant.variantId);
    if (existing) {
      if (existing.quantity >= variant.stock) {
        showStockToast('Not enough stock');
        return;
      }
      setCart(cart.map(item => {
        if (item.variantId === variant.variantId) {
          const newQty = item.quantity + 1;
          // Total = qty × GST-inclusive price (no addition)
          return { ...item, quantity: newQty, total: newQty * item.sellingPrice };
        }
        return item;
      }));
    } else {
      setCart([...cart, {
        ...variant,
        id: variant.variantId,
        quantity: 1,
        total: variant.sellingPrice // GST-inclusive price IS the total for 1 unit
      }]);
    }
  };

  const updateQuantity = (variantId: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.variantId === variantId) {
        const sourceVariant = variants.find(v => v.variantId === variantId);
        const maxStock = sourceVariant?.stock || item.stock || Infinity;
        let newQty = Math.max(0, item.quantity + delta);
        if (newQty > maxStock) {
          showStockToast('Not enough stock');
          newQty = maxStock;
        }
        // GST-INCLUSIVE: total = qty × sellingPrice (price already has GST)
        return { ...item, quantity: newQty, total: newQty * item.sellingPrice };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // GST-INCLUSIVE totals: sellingPrice is the final price — sum it directly
  const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
  // Extract GST from the inclusive total using reverse formula
  const cartGstTotal = cart.reduce((sum, item) =>
    sum + extractGst(item.total, item.gstPercent), 0);
  // Base price (pre-GST) = total − extracted GST
  const cartSubtotal = cartTotal - cartGstTotal;
  const cartPayable = cartTotal - pointsToRedeem;

  // Auto-lookup customer loyalty points when phone changes
  useEffect(() => {
    const phone = customer.phone.replace(/\D/g, '');
    if (phone.length >= 10) {
      setLookingUpPoints(true);
      api.get(`/api/customers/lookup/${phone}`)
        .then(res => {
          setCustomerPoints(res.data.loyaltyPoints || 0);
          setPointsLookupDone(true);
          if (res.data.found && res.data.name && !customer.name) {
            setCustomer(prev => ({ ...prev, name: res.data.name }));
          }
        })
        .catch(() => {
          setCustomerPoints(0);
          setPointsLookupDone(true);
        })
        .finally(() => setLookingUpPoints(false));
    } else {
      setCustomerPoints(0);
      setPointsToRedeem(0);
      setPointsLookupDone(false);
    }
  }, [customer.phone]);

  const generatePDF = (receiptData: any) => {
    const doc = new jsPDF({ unit: 'mm', format: 'a5' });
    const pageW = doc.internal.pageSize.getWidth();
    let y = 12;
    const cgst = Number(receiptData.gstTotal) / 2;
    const sgst = Number(receiptData.gstTotal) / 2;

    // Header Blue
    doc.setFillColor(79, 70, 229);
    doc.rect(0, 0, pageW, 35, 'F');
    doc.setTextColor(255, 255, 255);

    // Store Name
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(receiptData.storeName || 'Store Name', pageW / 2, 15, { align: 'center' });

    // Store Address & Contact
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    let headerY = 21;
    if (receiptData.storeAddress) {
      const addrLines = doc.splitTextToSize(receiptData.storeAddress, 80);
      doc.text(addrLines, pageW / 2, headerY, { align: 'center' });
      headerY += (addrLines.length * 4);
    }
    if (receiptData.storePhone || receiptData.storeGst) {
      let contactStr = receiptData.storePhone ? `Ph: ${receiptData.storePhone}` : '';
      if (receiptData.storeGst) contactStr += (contactStr ? ' | ' : '') + `GSTIN: ${receiptData.storeGst}`;
      doc.text(contactStr, pageW / 2, headerY, { align: 'center' });
    }

    y = 45;
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', 10, y);
    doc.setFont('helvetica', 'normal');
    doc.text(`#${receiptData.invoiceId}`, 30, y);
    doc.text(`${new Date(receiptData.date).toLocaleString()}`, pageW - 10, y, { align: 'right' });

    y += 6;
    if (receiptData.customerName && receiptData.customerName !== 'Walking Customer') {
      doc.setFont('helvetica', 'bold');
      doc.text('Bill To:', 10, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`${receiptData.customerName} (${receiptData.customerPhone || 'N/A'})`, 25, y);
      y += 6;
    } else if (receiptData.customerPhone) {
      doc.text(`Customer Mobile: ${receiptData.customerPhone}`, 10, y);
      y += 6;
    }

    y += 2;
    // Table Header
    doc.setFillColor(245, 245, 250);
    doc.rect(10, y, pageW - 20, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Item Description', 13, y + 5.5);
    doc.text('Qty', pageW - 45, y + 5.5, { align: 'right' });
    doc.text('Rate', pageW - 28, y + 5.5, { align: 'right' });
    doc.text('Total', pageW - 10, y + 5.5, { align: 'right' });
    y += 12;

    // Items
    doc.setFont('helvetica', 'normal');
    receiptData.items.forEach((item: any) => {
      const name = `${item.productName} - ${item.variantName}`;
      const nameLines = doc.splitTextToSize(name, 75);
      doc.text(nameLines, 13, y);
      doc.text(String(item.quantity), pageW - 45, y, { align: 'right' });
      doc.text(`${receiptData.currency}${Number(item.sellingPrice).toFixed(2)}`, pageW - 28, y, { align: 'right' });
      doc.text(`${receiptData.currency}${Number(item.total).toFixed(2)}`, pageW - 10, y, { align: 'right' });
      y += (nameLines.length * 4) + 2;

      if (y > 180) { // Page break check
        doc.addPage();
        y = 20;
      }
    });

    y += 4;
    doc.setDrawColor(230, 230, 240);
    doc.line(10, y, pageW - 10, y);
    y += 6;

    // Totals with CGST/SGST split (GST-INCLUSIVE: prices already include GST)
    doc.setFontSize(9);
    doc.text('Base Amount:', pageW - 45, y, { align: 'right' });
    doc.text(`${receiptData.currency}${Number(receiptData.subtotal).toFixed(2)}`, pageW - 10, y, { align: 'right' });
    y += 5;
    doc.text('CGST (incl.):', pageW - 45, y, { align: 'right' });
    doc.text(`${receiptData.currency}${cgst.toFixed(2)}`, pageW - 10, y, { align: 'right' });
    y += 5;
    doc.text('SGST (incl.):', pageW - 45, y, { align: 'right' });
    doc.text(`${receiptData.currency}${sgst.toFixed(2)}`, pageW - 10, y, { align: 'right' });
    y += 8;

    doc.setFillColor(79, 70, 229);
    doc.rect(pageW - 60, y - 5, 50, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('TOTAL', pageW - 55, y + 1.5);
    doc.text(`${receiptData.currency}${Number(receiptData.grandTotal).toFixed(2)}`, pageW - 13, y + 1.5, { align: 'right' });

    y += 15;
    doc.setTextColor(150, 150, 150);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.text('Thank you for shopping!', pageW / 2, y, { align: 'center' });

    y += 6;
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by CoreBiz SaaS', pageW / 2, y, { align: 'center' });

    doc.save(`Invoice-${receiptData.invoiceId}.pdf`);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const saleData = {
        customerName: customer.name || 'Walking Customer',
        customerPhone: customer.phone,
        items: cart,
        subtotal: cartSubtotal,
        gstTotal: cartGstTotal,
        grandTotal: cartTotal,
        pointsToRedeem: pointsToRedeem
      };
      const res = await api.post('/api/sales', saleData);
      const receiptInfo = {
        invoiceId: res.data.invoiceId,
        date: new Date().toISOString(),
        customerName: customer.name || 'Walking Customer',
        customerPhone: customer.phone,
        items: cart,
        subtotal: cartSubtotal,
        gstTotal: cartGstTotal,
        grandTotal: cartTotal,
        pointsEarned: res.data.pointsEarned || 0,
        pointsRedeemed: res.data.pointsRedeemed || 0,
        newPointsBalance: res.data.newPointsBalance || 0,
        storeName: storeInfo?.storeName || 'CoreBiz',
        storeAddress: storeInfo?.address || '',
        storePhone: storeInfo?.phone || '',
        storeGst: storeInfo?.gstNumber || '',
        invoiceFooter: settings?.invoice_footer || 'Thank you for shopping!',
        currency: settings?.currency || '₹'
      };
      setReceipt(receiptInfo);
      setCart([]);
      setCustomer({ name: '', phone: '' });
      setPointsToRedeem(0);
      setCustomerPoints(0);
      setPointsLookupDone(false);
      setIsCheckoutModalOpen(false);
      fetchData();
    } catch (error) {
      alert('Checkout failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetSelection = () => {
    setSelectedCategoryId('all');
    setSelectedProductId(null);
    setSelectedBrandId(null);
    setSearch('');
  };

  const selectCategory = (catId: number) => {
    setSelectedCategoryId(catId);
    setSelectedProductId(null);
    setSelectedBrandId(null);
  };

  const selectProduct = (prodId: number) => {
    setSelectedProductId(prodId);
    setSelectedBrandId(null);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading products...</p>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-160px)] gap-8 antialiased">

      {/* 1. Product Grid Section (Left) */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">

        {/* Search & Breadcrumbs */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input
              type="text"
              placeholder="Search for products or brands..."
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 text-slate-900 dark:text-white font-bold text-sm outline-none transition-all shadow-inner"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {!search && (
            <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={resetSelection}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 flex-shrink-0 border ${selectedCategoryId === 'all'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20'
                    : 'bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
              >
                <Globe className="w-4 h-4" /> Categories
              </button>
              {selectedCategoryId !== 'all' && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                  <button
                    onClick={() => selectCategory(selectedCategoryId as number)}
                    className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all flex items-center gap-2"
                  >
                    {categories.find(c => c.id === selectedCategoryId)?.name}
                  </button>
                </>
              )}
              {selectedProductId && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                  <button
                    onClick={() => { setSelectedProductId(selectedProductId); setSelectedBrandId(null); }}
                    className="px-5 py-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:shadow-md transition-all flex items-center gap-2"
                  >
                    {variants.find(v => v.productId === selectedProductId)?.productName}
                  </button>
                </>
              )}
              {selectedBrandId && (
                <>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                  <span className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    {variants.find(v => v.brandId === selectedBrandId)?.brandName}
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Selection Area */}
        {!search && (
          <div className="space-y-4">
            {selectedCategoryId === 'all' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => selectCategory(cat.id)}
                    className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all text-center group"
                  >
                    <div className="w-12 h-12 mx-auto mb-3 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20 group-hover:scale-110 group-hover:rotate-3 transition-transform">
                      <Tags className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-widest truncate">{cat.name}</p>
                  </button>
                ))}
              </div>
            )}

            {selectedCategoryId !== 'all' && !selectedProductId && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-2">
                {products.map(p => (
                  <button
                    key={p.id}
                    onClick={() => selectProduct(p.id)}
                    className="bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-purple-100 dark:hover:border-purple-900/40 transition-all text-center group"
                  >
                    <div className="aspect-square rounded-[2rem] bg-slate-50 dark:bg-slate-950 mb-3 overflow-hidden shadow-inner">
                      <img
                        src={p.imageUrl || DEFAULT_PRODUCT_IMAGE}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e: any) => { e.target.src = DEFAULT_PRODUCT_IMAGE; }}
                      />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest truncate">{p.name}</p>
                  </button>
                ))}
                <button onClick={resetSelection} className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] text-slate-400 hover:text-red-500 hover:border-red-200 transition-all gap-2">
                  <X className="w-6 h-6" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Reset</span>
                </button>
              </div>
            )}

            {selectedProductId && !selectedBrandId && (
              <div className="flex flex-wrap gap-3 animate-in fade-in slide-in-from-bottom-2">
                {brands.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBrandId(b.id)}
                    className="px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] shadow-sm hover:shadow-md hover:border-emerald-100 dark:hover:border-emerald-900/40 transition-all text-xs font-bold text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-3 group"
                  >
                    <Layers className="w-5 h-5 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" /> {b.name}
                  </button>
                ))}
                <button onClick={() => selectCategory(selectedCategoryId as number)} className="px-8 py-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[1.5rem] text-slate-400 text-xs font-bold uppercase hover:text-indigo-600 hover:border-indigo-200 transition-all">Back</button>
              </div>
            )}
          </div>
        )}

        {/* Variants Result Grid */}
        <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
          {showProductGrid && (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
              {filteredVariants.length === 0 ? (
                <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                  <Package className="w-16 h-16 mb-4 opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-sm">No products found.</p>
                </div>
              ) : (
                filteredVariants.map(variant => (
                  <div
                    key={variant.variantId}
                    onClick={() => addToCart(variant)}
                    className={`
                      bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border transition-all relative
                      ${variant.stock <= 0
                        ? 'border-red-200 dark:border-red-900/40 shadow-sm opacity-60 cursor-not-allowed'
                        : variant.stock <= (variant.minimumStock || 0)
                          ? 'border-red-200 dark:border-red-900/40 shadow-sm cursor-pointer group hover:shadow-2xl hover:-translate-y-1'
                          : 'border-slate-100 dark:border-slate-800 shadow-md hover:border-indigo-100 dark:hover:border-indigo-900/40 cursor-pointer group hover:shadow-2xl hover:-translate-y-1'}
                    `}
                  >
                    <div className="aspect-square rounded-[2rem] bg-slate-50 dark:bg-slate-950 mb-4 overflow-hidden relative shadow-inner">
                      <img
                        src={variant.imageUrl || DEFAULT_PRODUCT_IMAGE}
                        alt={variant.variantName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        onError={(e: any) => { e.target.src = DEFAULT_PRODUCT_IMAGE; }}
                      />
                      {variant.stock <= 0 ? (
                        <div className="absolute top-3 right-3 bg-slate-800 text-white text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest shadow-lg">Out of Stock</div>
                      ) : variant.stock <= (variant.minimumStock || 0) ? (
                        <div className="absolute top-3 right-3 bg-red-600 text-white text-[9px] px-3 py-1 rounded-full font-bold uppercase tracking-widest shadow-lg shadow-red-600/30">Low Stock</div>
                      ) : null}
                    </div>
                    <div className="px-1 text-center">
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-tight truncate">{variant.productName}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5 truncate">{variant.brandName} &bull; {variant.variantName}</p>

                      <div className="flex items-center justify-between mt-4">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">₹{Number(variant.sellingPrice).toLocaleString()}</span>
                        {variant.stock > 0 && (
                          <div className="w-10 h-10 rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 shadow-xl">
                            <Plus className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {!search && selectedCategoryId === 'all' && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center animate-in fade-in duration-1000">
              <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-[2.5rem] flex items-center justify-center border border-slate-100 dark:border-slate-800 shadow-2xl mb-8 group overflow-hidden relative">
                <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 group-hover:scale-110 transition-transform" />
                <ShoppingCart className="w-10 h-10 text-indigo-600 dark:text-indigo-400 relative z-10" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight mb-3">Product Selection</h3>
              <p className="max-w-xs mx-auto text-sm font-medium text-slate-500 leading-relaxed">Choose a category or search for products to start billing.</p>
            </div>
          )}
        </div>
      </div>

      {/* 2. Cart Section (Right) */}
      <div className="w-[420px] flex flex-col bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex-shrink-0 animate-in slide-in-from-right-4 duration-500">
        <div className="p-8 pb-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center border border-indigo-100 dark:border-indigo-500/20">
              <Receipt className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Cart</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cart.length} Items Selected</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 rounded-full border border-emerald-100 dark:border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Active</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] flex items-center justify-center mb-4 border border-slate-100 dark:border-slate-800 opacity-50">
                <ShoppingCart className="w-7 h-7 text-slate-300" />
              </div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em]">Select products to add to cart</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.variantId} className="flex gap-4 p-5 bg-slate-50 dark:bg-slate-950 rounded-[2rem] border border-slate-100 dark:border-slate-800 group hover:border-indigo-200 dark:hover:border-indigo-900/40 transition-all shadow-sm">
                <div className="w-16 h-16 rounded-[1.25rem] overflow-hidden bg-white dark:bg-slate-900 flex-shrink-0 border border-slate-100 dark:border-slate-800 shadow-sm">
                  <img
                    src={item.imageUrl || DEFAULT_PRODUCT_IMAGE}
                    className="w-full h-full object-cover"
                    onError={(e: any) => { e.target.src = DEFAULT_PRODUCT_IMAGE; }}
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="font-bold text-[13px] text-slate-900 dark:text-white uppercase tracking-tight truncate">{item.productName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{item.brandName} &bull; {item.variantName}</p>
                  <div className="flex items-center justify-between mt-3">
                    <p className="font-bold text-indigo-600 dark:text-indigo-400 text-sm">₹{Number(item.total).toFixed(2)}</p>
                    <div className="flex items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                      <button onClick={() => updateQuantity(item.variantId, -1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Minus className="w-3.5 h-3.5 text-slate-400" /></button>
                      <span className="px-3 text-xs font-bold text-slate-900 dark:text-white min-w-[24px] text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.variantId, 1)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"><Plus className="w-3.5 h-3.5 text-indigo-600" /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Summary */}
        <div className="p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Base Amount</span>
              <span className="text-slate-600 dark:text-slate-300">₹{cartSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>GST (Incl.)</span>
              <span className="text-slate-600 dark:text-slate-300">₹{cartGstTotal.toFixed(2)}</span>
            </div>
            <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-4" />
            <div className="flex justify-between items-end">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Payable Amount</span>
                <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">₹{cartTotal.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            disabled={cart.length === 0}
            onClick={() => setIsCheckoutModalOpen(true)}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-[1.5rem] font-bold uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-30 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
          >
            Go to Checkout <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-2xl relative">
            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Checkout</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Order Summary: ₹{cartTotal.toLocaleString()}</p>
              </div>
              <button onClick={() => setIsCheckoutModalOpen(false)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Mobile Number</label>
                  <input
                    type="tel"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 text-slate-900 dark:text-white text-2xl font-bold outline-none shadow-inner"
                    placeholder="9876543210"
                    value={customer.phone}
                    onChange={e => setCustomer({ ...customer, phone: e.target.value })}
                  />
                  {lookingUpPoints && (
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1 animate-pulse">Looking up loyalty points...</p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Customer Name</label>
                  <input
                    type="text"
                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/5 text-slate-900 dark:text-white font-bold text-lg outline-none shadow-inner"
                    placeholder="Optional"
                    value={customer.name}
                    onChange={e => setCustomer({ ...customer, name: e.target.value })}
                  />
                </div>
              </div>

              {/* Loyalty Points Section */}
              {pointsLookupDone && customerPoints > 0 && (
                <div className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center">
                      <Star className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">Loyalty Points Available</p>
                      <p className="text-2xl font-bold text-amber-700 dark:text-amber-300">{customerPoints} <span className="text-xs font-bold text-amber-500">pts</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={Math.min(customerPoints, Math.floor(cartTotal))}
                      className="flex-1 px-4 py-3 bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-300 font-bold text-lg outline-none focus:ring-2 focus:ring-amber-400/30"
                      placeholder="Points to redeem"
                      value={pointsToRedeem || ''}
                      onChange={e => {
                        const val = parseInt(e.target.value) || 0;
                        const maxRedeem = Math.min(customerPoints, Math.floor(cartTotal));
                        setPointsToRedeem(Math.max(0, Math.min(val, maxRedeem)));
                      }}
                    />
                    <button
                      onClick={() => setPointsToRedeem(Math.min(customerPoints, Math.floor(cartTotal)))}
                      className="px-4 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all active:scale-95 shadow-md shadow-amber-600/20"
                    >
                      Use All
                    </button>
                  </div>
                  {pointsToRedeem > 0 && (
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <Gift className="w-4 h-4" />
                      <span>₹{pointsToRedeem} discount applied! (1 point = ₹1)</span>
                    </div>
                  )}
                </div>
              )}

              {pointsLookupDone && customerPoints === 0 && customer.phone.replace(/\D/g, '').length >= 10 && (
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                  <Star className="w-4 h-4 text-slate-400" />
                  <p className="text-xs font-medium text-slate-500">No loyalty points yet. Points will be earned on this purchase!</p>
                </div>
              )}

              <div className="p-5 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/10 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                  Entering a mobile number will allow the customer to receive invoice notifications via SMS.
                </p>
              </div>

              {/* Payable Amount with discount */}
              {pointsToRedeem > 0 && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Payable After Discount</span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">₹{cartPayable.toFixed(2)}</span>
                </div>
              )}

              <button
                onClick={handleCheckout}
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-bold uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
              >
                {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Zap className="w-5 h-5" /> Generate Bill</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt / Success Modal — Invoice Style */}
      {receipt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm animate-in zoom-in-95 duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-600" />

            {/* Store Header */}
            <div className="bg-indigo-600 text-white text-center py-8 px-6">
              <h2 className="text-2xl font-bold tracking-tight">{receipt.storeName || 'CoreBiz'}</h2>
              {receipt.storeAddress && <p className="text-xs text-indigo-100 mt-1">{receipt.storeAddress}</p>}
              <div className="flex items-center justify-center gap-4 mt-2 text-[10px] font-bold text-indigo-200 uppercase tracking-widest">
                {receipt.storePhone && <span>Ph: {receipt.storePhone}</span>}
                {receipt.storeGst && <span>GSTIN: {receipt.storeGst}</span>}
              </div>
            </div>

            {/* Invoice Info + Customer */}
            <div className="px-8 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Invoice</p>
                  <p className="text-sm font-bold text-indigo-600">#{receipt.invoiceId}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date & Time</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{new Date(receipt.date).toLocaleString()}</p>
                </div>
              </div>
              {(receipt.customerName || receipt.customerPhone) && (
                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Customer</p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{receipt.customerName || 'Walking Customer'}</p>
                  {receipt.customerPhone && <p className="text-xs text-slate-500 font-medium">Mobile: {receipt.customerPhone}</p>}
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="px-8 py-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="py-3">Item</th>
                    <th className="py-3 text-center">Qty</th>
                    <th className="py-3 text-right">Rate</th>
                    <th className="py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {receipt.items.map((item: any, idx: number) => (
                    <tr key={idx} className="text-sm">
                      <td className="py-3">
                        <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-tight">{item.productName}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{item.brandName} &bull; {item.variantName}</p>
                      </td>
                      <td className="py-3 text-center font-bold text-slate-700 dark:text-slate-300">{item.quantity}</td>
                      <td className="py-3 text-right font-medium text-slate-600 dark:text-slate-400">₹{Number(item.sellingPrice).toFixed(2)}</td>
                      {/* GST-INCLUSIVE: item total = qty × sellingPrice (no extra GST) */}
                      <td className="py-3 text-right font-bold text-slate-900 dark:text-white">₹{Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* GST Breakdown */}
            <div className="px-8 py-4 bg-slate-50 dark:bg-slate-950 border-y border-slate-100 dark:border-slate-800 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>Base Amount</span>
                <span className="text-slate-600 dark:text-slate-300">₹{Number(receipt.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>CGST (Incl.)</span>
                <span className="text-slate-600 dark:text-slate-300">₹{(Number(receipt.gstTotal) / 2).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest">
                <span>SGST (Incl.)</span>
                <span className="text-slate-600 dark:text-slate-300">₹{(Number(receipt.gstTotal) / 2).toFixed(2)}</span>
              </div>
              <div className="h-px w-full bg-slate-200 dark:bg-slate-800 my-2" />
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Grand Total</span>
                <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">₹{Number(receipt.grandTotal).toFixed(2)}</span>
              </div>
            </div>

            {/* Loyalty Points Earned */}
            {(receipt.pointsEarned > 0 || receipt.pointsRedeemed > 0) && (
              <div className="px-8 py-4 bg-amber-50 dark:bg-amber-950/20 border-y border-amber-100 dark:border-amber-900/30 space-y-3">
                {receipt.pointsRedeemed > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Points Redeemed</span>
                    </div>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">-{receipt.pointsRedeemed} pts (₹{receipt.pointsRedeemed})</span>
                  </div>
                )}
                {receipt.pointsEarned > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-600 uppercase tracking-widest">Points Earned</span>
                    </div>
                    <span className="text-sm font-bold text-amber-700 dark:text-amber-300">+{receipt.pointsEarned} pts</span>
                  </div>
                )}
                <div className="h-px w-full bg-amber-200 dark:bg-amber-800" />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Points Balance</span>
                  <span className="text-lg font-bold text-amber-700 dark:text-amber-300">{receipt.newPointsBalance} pts</span>
                </div>
              </div>
            )}

            {/* Thank You + SMS notice */}
            <div className="px-8 py-6 text-center space-y-4">
              {receipt.pointsEarned > 0 ? (
                <div className="bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-amber-950/20 dark:to-emerald-950/20 border border-amber-200 dark:border-amber-800 py-4 px-5 rounded-2xl">
                  <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
                    🎉 Thanks for shopping! You earned <span className="text-emerald-600 dark:text-emerald-400">{receipt.pointsEarned} points</span>!
                  </p>
                </div>
              ) : (
                <p className="text-sm font-bold text-slate-500 italic">Thank you for shopping!</p>
              )}

              {receipt.customerPhone && (
                <div className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 py-3 px-5 rounded-2xl">
                  <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    SMS receipt sent to {receipt.customerPhone}
                  </p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => generatePDF(receipt)}
                  className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-4.5 rounded-[1.25rem] font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                >
                  <Download className="w-4 h-4" /> Download Invoice
                </button>
                <button
                  onClick={() => setReceipt(null)}
                  className="w-full py-4 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Stock Toast */}
      {stockToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] bg-red-600 text-white px-8 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-2xl shadow-red-600/30 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {stockToast}
        </div>
      )}
    </div>
  );
}
