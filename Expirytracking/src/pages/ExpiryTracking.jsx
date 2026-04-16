import { useState, useEffect } from 'react';
import { api } from '../api';

const filters = ['All', 'Expired', '3 days', '7 days', '15 days', '30 days'];

function getRowColor(daysLeft) {
  if (daysLeft <= 0) return 'bg-red-50/50';
  if (daysLeft <= 3) return 'bg-yellow-50/50';
  if (daysLeft <= 7) return 'bg-orange-50/50';
  return 'hover:bg-slate-50';
}

function getBadge(daysLeft) {
  if (daysLeft <= 0) return <span className="px-2 py-0.5 text-xs bg-red-100 text-red-800 rounded border border-red-200 font-semibold">Expired</span>;
  if (daysLeft <= 3) return <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded border border-yellow-300 font-semibold">Urgent</span>;
  if (daysLeft <= 7) return <span className="px-2 py-0.5 text-xs bg-orange-100 text-orange-800 rounded border border-orange-200 font-semibold">Near Expiry</span>;
  return <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded border border-green-200 font-semibold">Safe</span>;
}

export default function ExpiryTracking() {
  const [filter, setFilter] = useState('All');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const data = await api.get('/inventory');
        
        // Calculate days left
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const mapped = data.map(p => {
          const expDate = new Date(p.expiryDate);
          const diffTime = expDate - today;
          const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return {
            id: p.id,
            product: p.name,
            quantity: p.quantity,
            expiryDate: p.expiryDate,
            daysLeft: daysLeft
          };
        });

        // Sort by expiry date (ascending)
        mapped.sort((a, b) => a.daysLeft - b.daysLeft);
        setProducts(mapped);
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  const filtered = products.filter((item) => {
    if (filter === 'All') return true;
    if (filter === 'Expired') return item.daysLeft <= 0;
    if (filter === '3 days') return item.daysLeft > 0 && item.daysLeft <= 3;
    if (filter === '7 days') return item.daysLeft > 0 && item.daysLeft <= 7;
    if (filter === '15 days') return item.daysLeft > 0 && item.daysLeft <= 15;
    if (filter === '30 days') return item.daysLeft > 0 && item.daysLeft <= 30;
    return true;
  });

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">⏳ Expiry Tracking</h1>
        <p className="text-sm text-slate-500 mt-1">Monitor products approaching their expiry dates</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-left text-xs text-slate-500 uppercase">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Quantity</th>
              <th className="px-4 py-3">Expiry Date</th>
              <th className="px-4 py-3">Days Left</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Loading tracking data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-slate-500 border-dashed border-2">📦 No items in this range.</td></tr>
            ) : filtered.map((item) => (
              <tr key={item.id} className={`border-b border-slate-50 ${getRowColor(item.daysLeft)}`}>
                <td className="px-4 py-3 font-medium text-slate-800">{item.product}</td>
                <td className="px-4 py-3 text-slate-700">{item.quantity}</td>
                <td className="px-4 py-3 text-slate-600">{item.expiryDate}</td>
                <td className={`px-4 py-3 font-semibold ${item.daysLeft <= 0 ? 'text-red-600' : item.daysLeft <= 3 ? 'text-yellow-600' : 'text-slate-700'}`}>
                  {item.daysLeft <= 0 ? '❌ Fully Expired' : item.daysLeft <= 3 ? `⚠ ${item.daysLeft} Days Left` : `⏳ ${item.daysLeft} Days Left`}
                </td>
                <td className="px-4 py-3">{getBadge(item.daysLeft)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-200 mt-4 shadow-sm w-fit">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 border border-green-200"></span>Safe (&gt;7 days)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-orange-100 border border-orange-200"></span>Near Expiry (4–7 days)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></span>Urgent (1–3 days)</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-200"></span>Grace Period</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 border border-red-200"></span>Expired</span>
      </div>
    </div>
  );
}
