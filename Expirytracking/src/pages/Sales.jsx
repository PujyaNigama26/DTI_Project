import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Plus } from 'lucide-react';
import { api } from '../api';

export default function Sales() {
  const [salesRecords, setSalesRecords] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [quantity, setQuantity] = useState('');
  const [customerName, setCustomerName] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, productsData] = await Promise.all([
        api.get('/sales'),
        api.get('/inventory')
      ]);
      setSalesRecords(salesData);
      setProducts(productsData.filter(p => p.quantity > 0)); // Only show products in stock
    } catch (err) {
      console.error('Failed to load data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !quantity) return;

    try {
      await api.post('/sales', { 
        productName: selectedProduct, 
        quantity: Number(quantity),
        customerName: customerName.trim() || 'In-Store Walk-in'
      });
      alert(`Recorded sale: ${selectedProduct} x${quantity}`);
      setSelectedProduct('');
      setQuantity('');
      setCustomerName('');
      loadData(); // Reload to get updated sales and inventory
    } catch (err) {
      alert(err.message || 'Error recording sale');
    }
  };

  // Compute Today's Revenue
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  
  const todaySales = salesRecords.filter(s => new Date(s.createdAt) >= todayStart);
  const todayTotal = todaySales.reduce((sum, s) => sum + s.amount, 0);

  // Compute Sales Trend (Last 7 Days)
  const salesTrend = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const dStr = d.toLocaleDateString('en-US', { weekday: 'short' });
    
    // Sum sales for this specific day
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);
    
    const daySales = salesRecords.filter(s => {
      const sDate = new Date(s.createdAt);
      return sDate >= d && sDate <= dayEnd;
    });
    
    salesTrend.push({
      day: dStr,
      sales: daySales.reduce((sum, s) => sum + s.amount, 0)
    });
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">🛒 Sales</h1>
        <p className="text-sm text-slate-500">Track current sales and record new transactions</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Today's Revenue</p>
          <p className="text-2xl font-semibold text-blue-600">₹{todayTotal.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Total Transactions (All Time)</p>
          <p className="text-2xl font-semibold text-slate-800">{salesRecords.length}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <p className="text-xs text-slate-500 mb-1">Avg Transaction</p>
          <p className="text-2xl font-semibold text-slate-800">
            ₹{salesRecords.length ? Math.round(salesRecords.reduce((sum, s) => sum + s.amount, 0) / salesRecords.length).toLocaleString() : 0}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Sales Trend (Last 7 Days)</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={salesTrend}>
              <XAxis dataKey="day" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v) => [`₹${v.toLocaleString()}`, 'Sales']} />
              <Line type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-700 mb-4">Record New Sale</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Product</label>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 bg-white"
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.name}>{p.name} (Stock: {p.quantity}) — ₹{p.price}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
                placeholder="Enter quantity"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Customer Name (Optional)</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading || products.length === 0}
              className="flex items-center gap-2 w-full justify-center bg-blue-600 text-white text-sm py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Plus size={15} />
              Submit Sale
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
          Recent Transactions
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase">
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Time</th>
            </tr>
          </thead>
          <tbody>
            {salesRecords.slice(0, 10).map((s) => (
              <tr key={s.id || s._id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${s.customerName === 'In-Store Walk-in' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'}`}>
                    {s.customerName || 'App Customer'}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium text-slate-700">{s.productName}</td>
                <td className="px-4 py-3 text-slate-600">{s.quantity}</td>
                <td className="px-4 py-3 text-blue-600 font-medium">₹{s.amount.toLocaleString()}</td>
                <td className="px-4 py-3 text-slate-500">{new Date(s.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {salesRecords.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500 border-dashed border-2">📊 No sales data yet. Start adding sales to track performance.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
