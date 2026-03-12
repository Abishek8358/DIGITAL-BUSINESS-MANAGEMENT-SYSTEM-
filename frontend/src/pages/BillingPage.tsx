import React, { useState, useEffect } from 'react';
import { Search, Plus, Filter, Edit2, Trash2, Package, ShoppingCart, X, ChevronRight, ChevronLeft, Minus } from 'lucide-react';
import api from '../services/api';
import { jsPDF } from 'jspdf';

export default function BillingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [customer, setCustomer] = useState({ name: '', mobile: '' });
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.get('/api/products'),
        api.get('/api/categories')
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (error) {
      console.error('Failed to fetch data', error);
    } finally {
      setLoading(false);
    }
  };

  const addToCart = (product: any) => {
    if (product.stock <= 0) return alert('Out of stock!');
    
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      if (existing.quantity >= product.stock) return alert('Cannot add more than available stock');
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.sellingPrice } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1, total: product.sellingPrice }]);
    }
  };

  const updateQuantity = (id: number, delta: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty > item.stock) {
          alert('Not enough stock');
          return item;
        }
        return { ...item, quantity: newQty, total: newQty * item.sellingPrice };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id: number) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.quantity), 0);
  const gstTotal = cart.reduce((sum, item) => sum + (item.sellingPrice * item.gstPercent / 100 * item.quantity), 0);
  const grandTotal = subtotal + gstTotal;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    try {
      // 1. Create/Get Customer
      let customerId = null;
      if (customer.mobile) {
        const custRes = await api.post('/api/customers', customer);
        customerId = custRes.data.id;
      }

      // 2. Create Sale
      const saleRes = await api.post('/api/sales', {
        customerId,
        items: cart,
        subtotal,
        gstTotal,
        grandTotal
      });

      alert(`Sale completed! Invoice: ${saleRes.data.invoiceId}`);
      generateInvoicePDF(saleRes.data.id);
      setCart([]);
      setCustomer({ name: '', mobile: '' });
      fetchData();
    } catch (error) {
      console.error('Checkout failed', error);
      alert('Checkout failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInvoicePDF = async (saleId: number) => {
    try {
      const res = await api.get(`/api/sales/${saleId}`);
      const sale = res.data;
      const doc = new jsPDF();
      
      doc.setFontSize(20);
      doc.text('CoreBiz Invoice', 105, 20, { align: 'center' });
      
      doc.setFontSize(10);
      doc.text(`Invoice ID: ${sale.invoiceId}`, 20, 40);
      doc.text(`Date: ${new Date(sale.date).toLocaleString()}`, 20, 45);
      doc.text(`Customer: ${sale.customerName || 'Walk-in'}`, 20, 50);
      doc.text(`Mobile: ${sale.customerMobile || 'N/A'}`, 20, 55);
      
      let y = 70;
      doc.line(20, y, 190, y);
      y += 10;
      doc.text('Product', 20, y);
      doc.text('Qty', 100, y);
      doc.text('Price', 130, y);
      doc.text('Total', 170, y);
      y += 5;
      doc.line(20, y, 190, y);
      y += 10;

      sale.items.forEach((item: any) => {
        doc.text(item.productName, 20, y);
        doc.text(item.quantity.toString(), 100, y);
        doc.text(item.unitPrice.toFixed(2), 130, y);
        doc.text(item.total.toFixed(2), 170, y);
        y += 10;
      });

      doc.line(20, y, 190, y);
      y += 10;
      doc.text(`Subtotal: ${sale.subtotal.toFixed(2)}`, 140, y);
      y += 5;
      doc.text(`GST Total: ${sale.gstTotal.toFixed(2)}`, 140, y);
      y += 10;
      doc.setFontSize(12);
      doc.text(`Grand Total: ${sale.grandTotal.toFixed(2)}`, 140, y);

      doc.save(`Invoice_${sale.invoiceId}.pdf`);
    } catch (e) {
      console.error('PDF generation failed', e);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.brand?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || p.categoryName === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-12rem)]">
      {/* Product Selection */}
      <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search products by name or brand..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 dark:text-white"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                selectedCategory === 'All' 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.name)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  selectedCategory === cat.name
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <button 
              key={product.id}
              onClick={() => addToCart(product)}
              className={`
                group text-left p-4 rounded-2xl border transition-all
                ${product.stock > 0 
                  ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-md' 
                  : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-60 cursor-not-allowed'}
              `}
            >
              <div className="aspect-square rounded-xl bg-slate-100 dark:bg-slate-700 mb-3 flex items-center justify-center overflow-hidden">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="w-8 h-8 text-slate-400" />
                )}
              </div>
              <h4 className="font-bold text-sm dark:text-white truncate">{product.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{product.brand}</p>
              <div className="flex items-center justify-between">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold">₹{product.sellingPrice}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${product.stock > 5 ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                  {product.stock} left
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Cart & Billing */}
      <div className="w-full lg:w-96 flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-bold dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" /> Current Cart
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.map(item => (
            <div key={item.id} className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">₹{item.sellingPrice} × {item.quantity}</p>
              </div>
              <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button onClick={() => updateQuantity(item.id, -1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded"><Minus className="w-3 h-3" /></button>
                <span className="text-xs font-bold w-4 text-center dark:text-white">{item.quantity}</span>
                <button onClick={() => updateQuantity(item.id, 1)} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded"><Plus className="w-3 h-3" /></button>
              </div>
              <p className="text-sm font-bold dark:text-white w-16 text-right">₹{item.total}</p>
              <button onClick={() => removeFromCart(item.id)} className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
            </div>
          ))}
          {cart.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-slate-200 dark:text-slate-800 mx-auto mb-3" />
              <p className="text-slate-500 dark:text-slate-400 text-sm">Cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
          <div className="space-y-2">
            <input 
              type="text" 
              placeholder="Customer Name"
              className="w-full p-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={customer.name}
              onChange={e => setCustomer({...customer, name: e.target.value})}
            />
            <input 
              type="text" 
              placeholder="Mobile Number"
              className="w-full p-2 text-sm border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white"
              value={customer.mobile}
              onChange={e => setCustomer({...customer, mobile: e.target.value})}
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
              <span>GST Total</span>
              <span>₹{gstTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold dark:text-white">
              <span>Grand Total</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={cart.length === 0 || isProcessing}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isProcessing ? 'Processing...' : 'Generate Bill & Print'}
          </button>
        </div>
      </div>
    </div>
  );
}
